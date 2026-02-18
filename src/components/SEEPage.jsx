import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { getLevel, getYN, calcAttainmentPct, formatPct } from '../utils/calculations';

export default function SEEPage() {
  const {
    config, cos, iaTests,
    see, updateSEEStudentMark, setSEEStudents, updateSEEMaxMarks, generateStudents,
  } = useApp();

  const fileInputRef = useRef(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  const numCOs   = parseInt(config.numCOs);
  const students = see.students || [];
  const maxMarks = see.maxMarks;
  const hasUSN   = students.some(s => s.usn);

  // First IA test that has students — used as the import source
  const iaSource = iaTests?.find(t => t.students && t.students.length > 0);

  // Attainment: same for all COs since SEE is based on total marks only
  const seePct = calcAttainmentPct(
    students.map(s => ({ marks: s.totalMarks ?? '' })),
    maxMarks,
  );

  // ---- Import students from IA ----
  function handleImportFromIA() {
    if (!iaSource) return;
    const imported = iaSource.students.map((s, i) => ({
      id: i + 1,
      name: s.name,
      usn: s.usn || '',
      totalMarks: '',
    }));
    setSEEStudents(imported);
    setUploadMsg({ type: 'success', text: `Imported ${imported.length} students from "${iaSource.label}". Enter SEE marks below.` });
  }

  // ---- Download sample Excel ----
  function downloadSample() {
    const header = ['Sl.No.', 'Student Name', 'USN', 'Marks Obtained'];
    const sampleRows = [1, 2, 3].map(num => [num, `Student ${num}`, `1DS21XX${String(num).padStart(3, '0')}`, Math.round(maxMarks * 0.75)]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...sampleRows]);
    ws['!cols'] = [{ wch: 7 }, { wch: 22 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SEE Marks');
    XLSX.writeFile(wb, 'sample_SEE.xlsx');
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
      const nameIdx  = headers.findIndex(h => h.includes('student') || h === 'name' || h.includes('name'));
      const usnIdx   = headers.findIndex(h => h === 'usn' || h.includes('usn'));
      const marksIdx = headers.findIndex(h => h.includes('marks') || h.includes('obtained') || h.includes('score'));

      if (marksIdx === -1) {
        setUploadMsg({ type: 'error', text: 'No "Marks Obtained" column found. Use the sample template.' });
        e.target.value = '';
        return;
      }

      const uploaded = rows
        .slice(1)
        .filter(row => row.some(cell => cell !== '' && cell !== null))
        .map((row, i) => ({
          id:          i + 1,
          name:        String(row[nameIdx !== -1 ? nameIdx : 1] || `Student ${i + 1}`).trim(),
          usn:         usnIdx !== -1 ? String(row[usnIdx] || '').trim() : '',
          totalMarks:  row[marksIdx] !== '' && row[marksIdx] !== null ? String(row[marksIdx]) : '',
        }))
        .filter(s => s.name.trim() !== '');

      if (uploaded.length === 0) {
        setUploadMsg({ type: 'error', text: 'No student rows found in the file.' });
        e.target.value = '';
        return;
      }

      setSEEStudents(uploaded);
      setUploadMsg({ type: 'success', text: `Loaded ${uploaded.length} students from file.` });
    } catch {
      setUploadMsg({ type: 'error', text: 'Failed to parse the file. Please use the sample template.' });
    }

    e.target.value = '';
  }

  return (
    <div>
      <div className="section-title">Semester End Exam (SEE)</div>

      <div className="info-box">
        <strong>Note:</strong> SEE is conducted by the University (VTU). Since CO-wise breakup may not
        be available, the same level criteria is applied to overall marks obtained by each student.
        The same attainment percentage applies to all COs.<br />
        SEE Attainment contributes <strong>50%</strong> to Direct CO Attainment.
      </div>

      {/* Rules card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">SEE Level Criteria &amp; Attainment Rules</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#ebf4ff' }}>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>% Marks Scored</th>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>Level</th>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>Y / N</th>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>≥ 60%</td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="level-badge level-3">3</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="yn-badge yn-y">Y</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8' }}>CO Attainment target met</td>
            </tr>
            <tr style={{ background: '#f7fafc' }}>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>≥ 30% and &lt; 60%</td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="level-badge level-2">2</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="yn-badge yn-n">N</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8' }}>CO Attainment target not met</td>
            </tr>
            <tr>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>≥ 10% and &lt; 30%</td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="level-badge level-1">1</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="yn-badge yn-n">N</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8' }}>CO Attainment target not met</td>
            </tr>
            <tr style={{ background: '#f7fafc' }}>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}>&lt; 10%</td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="level-badge level-0">0</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8', textAlign: 'center' }}><span className="yn-badge yn-n">N</span></td>
              <td style={{ padding: '0.4rem 1rem', border: '1px solid #bee3f8' }}>CO Attainment target not met</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#ebf8ff', borderRadius: '6px', fontSize: '0.88rem' }}>
          <strong>CO Attainment (SEE)</strong> = (No. of students scoring Level 3) / (Total students who appeared) × 100%
          &nbsp;— same value applied to all COs.
        </div>
      </div>

      {/* Marks entry card */}
      <div className="card">
        <div className="card-title">SEE Marks Entry</div>

        {/* Max marks */}
        <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ whiteSpace: 'nowrap' }}>Total Max Marks:</label>
            <input
              type="number"
              value={maxMarks}
              onChange={e => updateSEEMaxMarks(e.target.value)}
              style={{ width: '80px' }}
              min="0"
            />
          </div>
        </div>

        {/* Action toolbar */}
        <div className="ia-upload-bar">
          {students.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={() => generateStudents('see', 'see', config.numStudents)}
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
                onClick={() => generateStudents('see', 'see', config.numStudents)}
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
                    <th>
                      Marks Obtained
                      <br />
                      <span style={{ fontWeight: 400, fontSize: '0.72rem' }}>/{maxMarks}</span>
                    </th>
                    <th>% Marks</th>
                    <th>Level</th>
                    <th>Y / N</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, si) => {
                    const marks = s.totalMarks;
                    const hasMarks = marks !== '' && marks !== undefined;
                    const pct  = hasMarks && maxMarks > 0
                      ? ((parseFloat(marks) / maxMarks) * 100).toFixed(1) : null;
                    const lvl  = hasMarks ? getLevel(parseFloat(marks), maxMarks) : null;
                    const yn   = lvl !== null ? getYN(lvl) : null;
                    return (
                      <tr key={s.id}>
                        <td>{si + 1}</td>
                        <td style={{ textAlign: 'left' }}>{s.name}</td>
                        {hasUSN && (
                          <td style={{ fontSize: '0.8rem', color: '#4a5568' }}>{s.usn || ''}</td>
                        )}
                        <td>
                          <input
                            type="number"
                            value={marks ?? ''}
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            onChange={e => updateSEEStudentMark(s.id, e.target.value)}
                          />
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#4a5568' }}>
                          {pct !== null ? `${pct}%` : <span className="text-muted">-</span>}
                        </td>
                        <td>
                          {lvl !== null
                            ? <span className={`level-badge level-${lvl}`}>{lvl}</span>
                            : <span className="text-muted">-</span>}
                        </td>
                        <td>
                          {yn !== null
                            ? <span className={`yn-badge yn-${yn.toLowerCase()}`}>{yn}</span>
                            : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Attainment row — same % applies to all COs */}
                  <tr className="totals-row">
                    <td colSpan={3 + (hasUSN ? 1 : 0)}>CO Attainment (%) — all COs</td>
                    <td></td>
                    <td></td>
                    <td style={{ color: '#1a365d', fontWeight: 700 }}>{formatPct(seePct)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attainment summary cards */}
            <div className="attainment-grid" style={{ marginTop: '1rem' }}>
              {Array.from({ length: numCOs }, (_, ci) => (
                <div className="attainment-box co-box" key={ci}>
                  <div className="co-label">{cos[ci] || `CO${ci + 1}`} Attainment</div>
                  <div className="co-value">{formatPct(seePct)}</div>
                  <div className="co-unit">%</div>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill ${seePct >= 60 ? 'fill-green' : seePct >= 40 ? 'fill-yellow' : 'fill-red'}`}
                      style={{ width: `${Math.min(seePct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
