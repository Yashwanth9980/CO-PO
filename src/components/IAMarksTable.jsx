import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { getCOMarksForStudent, getCOMaxFromQGroups, calcAttainmentPct, getLevel, getYN, formatPct } from '../utils/calculations';

// CO header colors for visual grouping
const CO_COLORS = [
  { header: '#1a365d', sub: '#2b6cb0', band: '#ebf8ff' },
  { header: '#276749', sub: '#38a169', band: '#f0fff4' },
  { header: '#744210', sub: '#d69e2e', band: '#fffbeb' },
  { header: '#702459', sub: '#b83280', band: '#fff5f7' },
  { header: '#553c9a', sub: '#805ad5', band: '#faf5ff' },
  { header: '#234e52', sub: '#319795', band: '#e6fffa' },
];

function getColor(coIdx) {
  return CO_COLORS[coIdx % CO_COLORS.length];
}

export default function IAMarksTable({ test }) {
  const { cos, generateStudents, updateStudentQMark, setIAStudents, setQGroupCOs, config } = useApp();
  const fileInputRef = useRef(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  const { qGroups, students, id: testId } = test;

  // Build a flat list of all question columns in order (1a, 1b, 2a, 2b, ...)
  // Each part can map to a different CO independently
  const allCols = qGroups.flatMap(g => [
    { key: `${g.number}a`, label: `${g.number}a`, maxMarks: g.maxMarks, coIdx: g.coIdxA },
    { key: `${g.number}b`, label: `${g.number}b`, maxMarks: g.maxMarks, coIdx: g.coIdxB },
  ]);

  // Collect unique COs present (for attainment rows)
  const cosInTest = [...new Set(allCols.map(c => c.coIdx))].sort((a, b) => a - b);

  // Build consecutive CO runs for the merged header row
  const coRuns = [];
  allCols.forEach(col => {
    const last = coRuns[coRuns.length - 1];
    if (last && last.coIdx === col.coIdx) {
      last.colSpan++;
    } else {
      coRuns.push({ coIdx: col.coIdx, coLabel: cos[col.coIdx] || `CO${col.coIdx + 1}`, colSpan: 1, color: getColor(col.coIdx) });
    }
  });
  const coGroupings = coRuns;

  const totalMaxMarks = qGroups.reduce((sum, g) => sum + g.maxMarks, 0);

  // Per-student totals and CO-level attainment
  function getStudentTotal(s) {
    return allCols.reduce((sum, col) => sum + (parseFloat(s.qMarks?.[col.key]) || 0), 0);
  }

  // CO attainment percentages
  const coAttainments = cosInTest.map(ci => {
    const coMax = getCOMaxFromQGroups(qGroups, ci);
    if (coMax === 0) return 0;
    const coStudents = students.map(s => ({ marks: getCOMarksForStudent(s, qGroups, ci) }));
    return calcAttainmentPct(coStudents, coMax);
  });

  // ---- CSV / Excel Upload ----
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
        return;
      }

      const headers = rows[0].map(h => String(h).trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('student') || h === 'name');
      const usnIdx = headers.findIndex(h => h === 'usn' || h.includes('usn'));

      // Map question keys to column indices
      const qColMap = {};
      allCols.forEach(col => {
        const idx = headers.indexOf(col.key.toLowerCase());
        if (idx !== -1) qColMap[col.key] = idx;
      });

      // Detect CO mapping row — row[1] is the CO info row if its name cell contains "CO"
      const possibleCoRow = rows[1] ?? [];
      const coRowLabel = String(possibleCoRow[nameIdx !== -1 ? nameIdx : 1] || '').toLowerCase();
      const hasCoRow = coRowLabel.includes('co') || coRowLabel.includes('mapping');

      if (hasCoRow) {
        // Parse CO labels from the info row and build coMappings
        const coMappings = {};
        allCols.forEach(col => {
          if (qColMap[col.key] !== undefined) {
            const coStr = String(possibleCoRow[qColMap[col.key]] || '').trim();
            const ciFound = cos.findIndex(c => c.trim().toLowerCase() === coStr.toLowerCase());
            if (ciFound !== -1) {
              const qNum = parseInt(col.key);
              const part = col.key.slice(-1); // 'a' or 'b'
              if (!coMappings[qNum]) coMappings[qNum] = {};
              coMappings[qNum][part] = ciFound;
            }
          }
        });
        if (Object.keys(coMappings).length > 0) {
          setQGroupCOs(testId, coMappings);
        }
      }

      const uploadedStudents = rows
        .slice(1)
        .filter(row => row.some(cell => cell !== '' && cell !== null) && parseFloat(row[0]) > 0)
        .map((row, i) => {
          const qMarks = {};
          allCols.forEach(col => {
            if (qColMap[col.key] !== undefined) {
              const raw = row[qColMap[col.key]];
              qMarks[col.key] = raw !== '' ? String(raw) : '';
            }
          });
          return {
            id: i + 1,
            name: String(row[nameIdx !== -1 ? nameIdx : 1] || `Student ${i + 1}`),
            usn: String(row[usnIdx !== -1 ? usnIdx : 2] || `USN${String(i + 1).padStart(3, '0')}`),
            qMarks,
          };
        });

      if (uploadedStudents.length === 0) {
        setUploadMsg({ type: 'error', text: 'No student rows found in the file.' });
        return;
      }

      setIAStudents(testId, uploadedStudents);
      const coMsg = hasCoRow ? ' CO mapping applied from file.' : '';
      setUploadMsg({ type: 'success', text: `Loaded ${uploadedStudents.length} students successfully.${coMsg}` });
    } catch {
      setUploadMsg({ type: 'error', text: 'Failed to parse the file. Please use the sample template.' });
    }

    // Reset the input so the same file can be re-uploaded
    e.target.value = '';
  }

  // ---- Download Sample Excel ----
  function downloadSample() {
    const qKeys = allCols.map(c => c.key);
    const header = ['Sl.No.', 'Student Name', 'USN', ...qKeys];

    // CO info row — shows which CO each question part is mapped to
    const coInfoRow = ['', 'CO Mapping →', '', ...allCols.map(c => cos[c.coIdx] || `CO${c.coIdx + 1}`)];

    // 3 sample rows — alternate a/b for variety
    const sampleRows = [1, 2, 3].map((num, idx) => {
      const marks = qGroups.flatMap(g => {
        const mx = g.maxMarks;
        return idx % 2 === 0
          ? [Math.round(mx * 0.8), 0]   // answered 'a'
          : [0, Math.round(mx * 0.75)]; // answered 'b'
      });
      const usn = `1DS21XX${String(num).padStart(3, '0')}`;
      return [num, `Student ${num}`, usn, ...marks];
    });

    const wsData = [header, coInfoRow, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style the CO info row (row index 1, 0-based)
    const coInfoStyle = { font: { italic: true, color: { rgb: '2B6CB0' } }, fill: { fgColor: { rgb: 'EBF8FF' } } };
    qKeys.forEach((_, i) => {
      const cellAddr = XLSX.utils.encode_cell({ r: 1, c: i + 3 });
      if (ws[cellAddr]) ws[cellAddr].s = coInfoStyle;
    });

    // Column widths
    ws['!cols'] = [
      { wch: 7 }, { wch: 20 }, { wch: 15 },
      ...qKeys.map(() => ({ wch: 10 })),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IA Marks');
    XLSX.writeFile(wb, `sample_ia_marks_${test.label.replace(/\s+/g, '_')}.xlsx`);
  }

  if (students.length === 0) {
    return (
      <div>
        <div className="ia-upload-bar">
          <button className="btn btn-primary" onClick={() => generateStudents('ia', testId, config.numStudents)}>
            Load {config.numStudents} Students (Manual Entry)
          </button>
          <span style={{ color: '#718096', fontSize: '0.85rem' }}>or</span>
          <button className="btn btn-success" onClick={() => fileInputRef.current?.click()}>
            Upload CSV / Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={downloadSample}>
            Download Sample File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
        {uploadMsg && (
          <div className={`alert ${uploadMsg.type === 'success' ? 'alert-success' : 'alert-warning'}`}>
            {uploadMsg.text}
          </div>
        )}
        <div className="alert alert-warning" style={{ marginTop: '0.5rem' }}>
          No students loaded. Click "Load Students" to enter marks manually, or upload a CSV/Excel file.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="ia-upload-bar">
        <span className="text-sm text-muted">{students.length} students</span>
        <button className="btn btn-outline btn-sm" onClick={() => generateStudents('ia', testId, config.numStudents)}>
          Reset Students
        </button>
        <button className="btn btn-success btn-sm" onClick={() => fileInputRef.current?.click()}>
          Re-upload CSV / Excel
        </button>
        <button className="btn btn-outline btn-sm" onClick={downloadSample}>
          Download Sample File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>
      {uploadMsg && (
        <div className={`alert ${uploadMsg.type === 'success' ? 'alert-success' : 'alert-warning'}`} style={{ marginTop: '0.5rem' }}>
          {uploadMsg.text}
        </div>
      )}

      {/* IA Marks Table */}
      <div className="table-wrapper" style={{ marginTop: '1rem' }}>
        <table className="ia-table">
          <thead>
            {/* Row 1: CO group headers */}
            <tr>
              <th rowSpan={2} className="ia-th-fixed">#</th>
              <th rowSpan={2} className="ia-th-fixed" style={{ minWidth: '140px', textAlign: 'left' }}>Student Name</th>
              <th rowSpan={2} className="ia-th-fixed" style={{ minWidth: '110px' }}>USN</th>
              {coGroupings.map(cg => (
                <th
                  key={cg.coIdx}
                  colSpan={cg.colSpan}
                  style={{ background: cg.color.header, color: 'white', borderRight: '2px solid #fff' }}
                >
                  {cg.coLabel}
                </th>
              ))}
              <th rowSpan={2} style={{ background: '#2d3748', color: 'white', minWidth: '60px' }}>
                Total<br />
                <span style={{ fontWeight: 400, fontSize: '0.72rem' }}>/{totalMaxMarks}</span>
              </th>
            </tr>

            {/* Row 2: Question sub-headers */}
            <tr>
              {allCols.map((col) => {
                const color = getColor(col.coIdx);
                return (
                  <th
                    key={col.key}
                    style={{ background: color.sub, color: 'white', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                  >
                    {col.label}<br />
                    <span style={{ fontWeight: 400 }}>({col.maxMarks})</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {students.map((s, si) => {
              const total = getStudentTotal(s);
              return (
                <tr key={s.id} style={{ background: si % 2 === 0 ? '#fff' : '#f7fafc' }}>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{si + 1}</td>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#4a5568' }}>{s.usn}</td>
                  {allCols.map(col => {
                    const color = getColor(col.coIdx);
                    return (
                      <td key={col.key} style={{ background: `${color.band}80`, padding: '0.3rem 0.4rem' }}>
                        <input
                          type="number"
                          value={s.qMarks?.[col.key] ?? ''}
                          min="0"
                          max={col.maxMarks}
                          step="0.5"
                          onChange={e => updateStudentQMark(testId, s.id, col.key, e.target.value)}
                          style={{ width: '54px' }}
                        />
                      </td>
                    );
                  })}
                  <td style={{ fontWeight: 700, background: '#edf2f7', textAlign: 'center' }}>
                    {total > 0 ? total : '-'}
                  </td>
                </tr>
              );
            })}

            {/* CO Attainment row */}
            <tr className="totals-row">
              <td colSpan={3} style={{ textAlign: 'left', paddingLeft: '0.75rem' }}>
                CO Attainment (%)
              </td>
              {coGroupings.map((cg, idx) => {
                const color = cg.color;
                const pct = coAttainments[idx];
                const level = pct >= 60 ? 3 : pct >= 30 ? 2 : 1;
                const lvlColor = level === 3 ? '#276749' : level === 2 ? '#744210' : '#9b2c2c';
                return (
                  <td
                    key={cg.coIdx}
                    colSpan={cg.colSpan}
                    style={{
                      background: color.band,
                      color: lvlColor,
                      fontWeight: 800,
                      fontSize: '1rem',
                      borderRight: '2px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    {formatPct(pct)}%
                  </td>
                );
              })}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-student CO Analysis */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#2b6cb0', fontSize: '0.88rem', padding: '0.5rem 0' }}>
          Show CO-wise Level & Y/N per student
        </summary>
        <div className="table-wrapper" style={{ marginTop: '0.5rem' }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Sl.</th>
                <th style={{ textAlign: 'left' }}>Name</th>
                <th>USN</th>
                {cosInTest.map(ci => (
                  <th key={ci}>{cos[ci] || `CO${ci + 1}`}<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>Marks</span></th>
                ))}
                {cosInTest.map(ci => (
                  <th key={`l${ci}`}>Level<br />{cos[ci] || `CO${ci + 1}`}</th>
                ))}
                {cosInTest.map(ci => (
                  <th key={`yn${ci}`}>Y/N<br />{cos[ci] || `CO${ci + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, si) => (
                <tr key={s.id}>
                  <td>{si + 1}</td>
                  <td style={{ textAlign: 'left' }}>{s.name}</td>
                  <td>{s.usn}</td>
                  {cosInTest.map(ci => {
                    const marks = getCOMarksForStudent(s, qGroups, ci);
                    const coMax = getCOMaxFromQGroups(qGroups, ci);
                    return <td key={ci}>{marks}/{coMax}</td>;
                  })}
                  {cosInTest.map(ci => {
                    const marks = getCOMarksForStudent(s, qGroups, ci);
                    const coMax = getCOMaxFromQGroups(qGroups, ci);
                    const lvl = coMax > 0 ? getLevel(marks, coMax) : null;
                    return (
                      <td key={`l${ci}`}>
                        {lvl !== null ? <span className={`level-badge level-${lvl}`}>{lvl}</span> : '-'}
                      </td>
                    );
                  })}
                  {cosInTest.map(ci => {
                    const marks = getCOMarksForStudent(s, qGroups, ci);
                    const coMax = getCOMaxFromQGroups(qGroups, ci);
                    const lvl = coMax > 0 ? getLevel(marks, coMax) : null;
                    const yn = lvl !== null ? getYN(lvl) : null;
                    return (
                      <td key={`yn${ci}`}>
                        {yn ? <span className={`yn-badge yn-${yn.toLowerCase()}`}>{yn}</span> : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="totals-row">
                <td colSpan={3}>CO Attainment (%)</td>
                {cosInTest.map(ci => <td key={ci}></td>)}
                {cosInTest.map(ci => <td key={`l${ci}`}></td>)}
                {cosInTest.map((ci, idx) => (
                  <td key={`yn${ci}`} style={{ color: '#1a365d', fontWeight: 700 }}>
                    {formatPct(coAttainments[idx])}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* CO Attainment Summary Cards */}
      <div className="attainment-grid" style={{ marginTop: '1rem' }}>
        {coGroupings.map((cg, idx) => {
          const pct = coAttainments[idx];
          const color = pct >= 60 ? '#276749' : pct >= 40 ? '#744210' : '#9b2c2c';
          const bg = pct >= 60 ? '#f0fff4' : pct >= 40 ? '#fffbeb' : '#fff5f5';
          return (
            <div
              key={cg.coIdx}
              className="attainment-box co-box"
              style={{ background: `linear-gradient(135deg, ${bg}, white)`, borderColor: `${color}40` }}
            >
              <div className="co-label">{cg.coLabel} Attainment</div>
              <div className="co-value" style={{ color }}>{formatPct(pct)}</div>
              <div className="co-unit">%</div>
              <div className="progress-bar-wrap">
                <div
                  className={`progress-bar-fill ${pct >= 60 ? 'fill-green' : pct >= 40 ? 'fill-yellow' : 'fill-red'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
