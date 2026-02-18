import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { getLevel, getYN, calcAttainmentPct, formatPct } from '../utils/calculations';

/**
 * Reusable marks entry table for Assignment / SEE.
 * Supports CSV/Excel upload and one-click student import from the first IA test.
 */
export default function MarksTable({ testType, test }) {
  const {
    config, cos, iaTests,
    generateStudents, updateStudentMark, updateTestMaxMarks,
    setAssignmentStudents,
  } = useApp();

  const fileInputRef = useRef(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  const numCOs = parseInt(config.numCOs);
  const activeCOs = test.selectedCOs ?? Array.from({ length: numCOs }, (_, i) => i);
  const students = test.students || [];
  const coMaxMarks = test.coMaxMarks || {};
  const hasUSN = students.some(s => s.usn);

  const attainments = activeCOs.map(ci => {
    const coStudents = students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
    return calcAttainmentPct(coStudents, coMaxMarks[ci] ?? test.maxMarks);
  });

  // First IA test that has students loaded — used as the source for import
  const iaSource = iaTests?.find(t => t.students && t.students.length > 0);

  // ---- Import students from IA test ----
  function handleImportFromIA() {
    if (!iaSource) return;
    const imported = iaSource.students.map((s, i) => ({
      id: i + 1,
      name: s.name,
      usn: s.usn || '',
      coMarks: {},
    }));
    setAssignmentStudents(test.id, imported);
    setUploadMsg({
      type: 'success',
      text: `Imported ${imported.length} students from "${iaSource.label}". Enter marks below.`,
    });
  }

  // ---- Download sample Excel ----
  function downloadSample() {
    const coHeaders = activeCOs.map(ci => cos[ci] || `CO${ci + 1}`);
    const header = ['Sl.No.', 'Student Name', 'USN', ...coHeaders];
    const sampleRows = [1, 2, 3].map(num => {
      const marks = activeCOs.map(ci => Math.round((coMaxMarks[ci] ?? test.maxMarks) * 0.75));
      return [num, `Student ${num}`, `1DS21XX${String(num).padStart(3, '0')}`, ...marks];
    });

    const wsData = [header, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 7 }, { wch: 22 }, { wch: 15 }, ...activeCOs.map(() => ({ wch: 10 }))];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    XLSX.writeFile(wb, `sample_${test.label.replace(/\s+/g, '_')}.xlsx`);
  }

  // ---- CSV / Excel upload ----
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rows.length < 2) {
        setUploadMsg({ type: 'error', text: 'File is empty or has no data rows.' });
        e.target.value = '';
        return;
      }

      const headers = rows[0].map(h => String(h).trim().toLowerCase());

      // Detect name / USN columns
      const nameIdx = headers.findIndex(h => h.includes('student') || h === 'name' || h.includes('name'));
      const usnIdx  = headers.findIndex(h => h === 'usn' || h.includes('usn'));

      // Map each active CO to its column index.
      // Accepts the CO's configured label (e.g. "CO1") OR the default "co1"/"co2" pattern.
      const coColMap = {};
      activeCOs.forEach(ci => {
        const coLabel    = (cos[ci] || `CO${ci + 1}`).trim().toLowerCase();
        const defaultLbl = `co${ci + 1}`;
        let idx = headers.findIndex(h => h === coLabel);
        if (idx === -1) idx = headers.findIndex(h => h === defaultLbl);
        if (idx !== -1) coColMap[ci] = idx;
      });

      if (Object.keys(coColMap).length === 0) {
        setUploadMsg({
          type: 'error',
          text: `No CO columns found. Expected headers: ${activeCOs.map(ci => cos[ci] || `CO${ci + 1}`).join(', ')}.`,
        });
        e.target.value = '';
        return;
      }

      // Build a lookup from IA students for USN / name matching so identifiers stay consistent
      const iaMap = {};
      if (iaSource) {
        iaSource.students.forEach(s => {
          if (s.usn)  iaMap[s.usn.trim().toLowerCase()]  = s;
          if (s.name) iaMap[s.name.trim().toLowerCase()] = s;
        });
      }

      const uploadedStudents = rows
        .slice(1)
        .filter(row => row.some(cell => cell !== '' && cell !== null))
        .map((row, i) => {
          const rawName = String(row[nameIdx !== -1 ? nameIdx : 1] || '').trim();
          const rawUsn  = usnIdx !== -1 ? String(row[usnIdx] || '').trim() : '';

          // Prefer IA-matched name/USN so data stays in sync
          const matched = iaMap[rawUsn.toLowerCase()] || iaMap[rawName.toLowerCase()];

          const coMarks = {};
          activeCOs.forEach(ci => {
            const colIdx = coColMap[ci];
            if (colIdx !== undefined) {
              const raw = row[colIdx];
              if (raw !== '' && raw !== null && raw !== undefined) {
                coMarks[ci] = String(raw);
              }
            }
          });

          return {
            id:      i + 1,
            name:    matched?.name || rawName || `Student ${i + 1}`,
            usn:     matched?.usn  || rawUsn  || '',
            coMarks,
          };
        })
        .filter(s => s.name.trim() !== '');

      if (uploadedStudents.length === 0) {
        setUploadMsg({ type: 'error', text: 'No student rows found in the file.' });
        e.target.value = '';
        return;
      }

      setAssignmentStudents(test.id, uploadedStudents);
      setUploadMsg({ type: 'success', text: `Loaded ${uploadedStudents.length} students from file.` });
    } catch {
      setUploadMsg({ type: 'error', text: 'Failed to parse the file. Please use the sample template.' });
    }

    e.target.value = '';
  }

  return (
    <div>
      {/* Max marks per CO */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">Maximum Marks per CO</div>
        <div className="flex flex-wrap gap-1" style={{ gap: '0.75rem' }}>
          {activeCOs.map(ci => (
            <div className="form-group" key={ci} style={{ width: '120px' }}>
              <label>{cos[ci] || `CO${ci + 1}`}</label>
              <input
                type="number"
                value={coMaxMarks[ci] ?? test.maxMarks}
                onChange={e => updateTestMaxMarks(testType, test.id, ci, e.target.value)}
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action toolbar */}
      <div className="ia-upload-bar">
        {students.length === 0 && (
          <button
            className="btn btn-primary"
            onClick={() => generateStudents(testType, test.id, config.numStudents)}
          >
            Load {config.numStudents} Students (Manual)
          </button>
        )}
        {iaSource && (
          <button className="btn btn-outline btn-sm" onClick={handleImportFromIA}>
            Import from {iaSource.label}
          </button>
        )}
        <button className="btn btn-success btn-sm" onClick={() => fileInputRef.current?.click()}>
          {students.length > 0 ? 'Re-upload CSV / Excel' : 'Upload CSV / Excel'}
        </button>
        <button className="btn btn-outline btn-sm" onClick={downloadSample}>
          Download Sample
        </button>
        {students.length > 0 && (
          <>
            <span className="text-sm text-muted">{students.length} students</span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => generateStudents(testType, test.id, config.numStudents)}
            >
              Reset
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      {uploadMsg && (
        <div
          className={`alert ${uploadMsg.type === 'success' ? 'alert-success' : 'alert-warning'}`}
          style={{ marginTop: '0.5rem' }}
        >
          {uploadMsg.text}
        </div>
      )}

      {students.length === 0 ? (
        <div className="alert alert-warning" style={{ marginTop: '0.5rem' }}>
          No students loaded. Use the buttons above to import, upload, or manually enter student data.
        </div>
      ) : (
        <>
          <div className="table-wrapper" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Sl. No.</th>
                  <th style={{ textAlign: 'left' }}>Student Name</th>
                  {hasUSN && <th>USN</th>}
                  {activeCOs.map(ci => (
                    <th key={ci}>
                      {cos[ci] || `CO${ci + 1}`}
                      <br />
                      <span style={{ fontWeight: 400, fontSize: '0.72rem' }}>
                        /{coMaxMarks[ci] ?? test.maxMarks}
                      </span>
                    </th>
                  ))}
                  {activeCOs.map(ci => (
                    <th key={`pct${ci}`}>% Marks<br />{cos[ci] || `CO${ci + 1}`}</th>
                  ))}
                  {activeCOs.map(ci => (
                    <th key={`l${ci}`}>Level<br />{cos[ci] || `CO${ci + 1}`}</th>
                  ))}
                  {activeCOs.map(ci => (
                    <th key={`yn${ci}`}>Y/N<br />{cos[ci] || `CO${ci + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, si) => (
                  <tr key={s.id}>
                    <td>{si + 1}</td>
                    <td style={{ textAlign: 'left' }}>{s.name}</td>
                    {hasUSN && (
                      <td style={{ fontSize: '0.8rem', color: '#4a5568' }}>{s.usn || ''}</td>
                    )}
                    {activeCOs.map(ci => (
                      <td key={ci}>
                        <input
                          type="number"
                          value={s.coMarks[ci] ?? ''}
                          min="0"
                          max={coMaxMarks[ci] ?? test.maxMarks}
                          step="0.5"
                          onChange={e => updateStudentMark(testType, test.id, s.id, ci, e.target.value)}
                        />
                      </td>
                    ))}
                    {activeCOs.map(ci => {
                      const marks = s.coMarks[ci];
                      const max   = coMaxMarks[ci] ?? test.maxMarks;
                      const pct   = marks !== '' && marks !== undefined && max > 0
                        ? ((parseFloat(marks) / max) * 100).toFixed(1) : null;
                      return (
                        <td key={`pct${ci}`} style={{ fontSize: '0.82rem', color: '#4a5568' }}>
                          {pct !== null ? `${pct}%` : <span className="text-muted">-</span>}
                        </td>
                      );
                    })}
                    {activeCOs.map(ci => {
                      const marks = s.coMarks[ci];
                      const max   = coMaxMarks[ci] ?? test.maxMarks;
                      const lvl   = marks !== '' && marks !== undefined
                        ? getLevel(parseFloat(marks), max) : null;
                      return (
                        <td key={`l${ci}`}>
                          {lvl !== null
                            ? <span className={`level-badge level-${lvl}`}>{lvl}</span>
                            : <span className="text-muted">-</span>}
                        </td>
                      );
                    })}
                    {activeCOs.map(ci => {
                      const marks = s.coMarks[ci];
                      const max   = coMaxMarks[ci] ?? test.maxMarks;
                      const lvl   = marks !== '' && marks !== undefined
                        ? getLevel(parseFloat(marks), max) : null;
                      const yn    = lvl !== null ? getYN(lvl) : null;
                      return (
                        <td key={`yn${ci}`}>
                          {yn !== null
                            ? <span className={`yn-badge yn-${yn.toLowerCase()}`}>{yn}</span>
                            : <span className="text-muted">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Attainment row */}
                <tr className="totals-row">
                  <td colSpan={2 + (hasUSN ? 1 : 0)}>CO Attainment (%)</td>
                  {activeCOs.map(ci => <td key={ci}></td>)}
                  {activeCOs.map(ci => <td key={`pct${ci}`}></td>)}
                  {activeCOs.map(ci => <td key={`l${ci}`}></td>)}
                  {activeCOs.map((ci, idx) => (
                    <td key={`att${ci}`} style={{ color: '#1a365d', fontWeight: 700 }}>
                      {formatPct(attainments[idx])}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attainment summary cards */}
          <div className="attainment-grid" style={{ marginTop: '1rem' }}>
            {activeCOs.map((ci, idx) => (
              <div className="attainment-box co-box" key={ci}>
                <div className="co-label">{cos[ci] || `CO${ci + 1}`} Attainment</div>
                <div className="co-value">{formatPct(attainments[idx])}</div>
                <div className="co-unit">%</div>
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-bar-fill ${attainments[idx] >= 60 ? 'fill-green' : attainments[idx] >= 40 ? 'fill-yellow' : 'fill-red'}`}
                    style={{ width: `${Math.min(attainments[idx], 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
