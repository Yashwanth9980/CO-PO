import { useApp } from '../context/AppContext';
import { getLevel, getYN, calcAttainmentPct, formatPct } from '../utils/calculations';

/**
 * Reusable marks entry table for IA / Assignment / SEE
 */
export default function MarksTable({ testType, test }) {
  const { config, cos, generateStudents, updateStudentMark, updateTestMaxMarks, updateTestMaxTotal } = useApp();
  const numCOs = parseInt(config.numCOs);

  // For IA tests, only show the COs selected for this test; fallback to all COs
  const activeCOs = test.selectedCOs ?? Array.from({ length: numCOs }, (_, i) => i);

  const students = test.students || [];
  const coMaxMarks = test.coMaxMarks || {};

  const attainments = activeCOs.map(ci => {
    const coStudents = students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
    return calcAttainmentPct(coStudents, coMaxMarks[ci] ?? test.maxMarks);
  });

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

      {/* Student count / generate */}
      {students.length === 0 ? (
        <div className="alert alert-warning">
          No students loaded. Click "Load Students" to initialize the marks table.
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={() => generateStudents(testType, test.id, config.numStudents)}
            >
              Load {config.numStudents} Students
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted">
              {students.length} students loaded
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => generateStudents(testType, test.id, config.numStudents)}
            >
              Reset Students
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Sl. No.</th>
                  <th style={{ textAlign: 'left' }}>Student Name</th>
                  {activeCOs.map(ci => (
                    <th key={ci}>{cos[ci] || `CO${ci + 1}`}<br /><span style={{ fontWeight: 400, fontSize: '0.72rem' }}>/{coMaxMarks[ci] ?? test.maxMarks}</span></th>
                  ))}
                  {activeCOs.map(ci => (
                    <th key={`l${ci}`}>L<br />{cos[ci] || `CO${ci + 1}`}</th>
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
                      const max = coMaxMarks[ci] ?? test.maxMarks;
                      const lvl = marks !== '' && marks !== undefined ? getLevel(parseFloat(marks), max) : null;
                      return (
                        <td key={`l${ci}`}>
                          {lvl !== null ? (
                            <span className={`level-badge level-${lvl}`}>{lvl}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      );
                    })}
                    {activeCOs.map(ci => {
                      const marks = s.coMarks[ci];
                      const max = coMaxMarks[ci] ?? test.maxMarks;
                      const lvl = marks !== '' && marks !== undefined ? getLevel(parseFloat(marks), max) : null;
                      const yn = lvl !== null ? getYN(lvl) : null;
                      return (
                        <td key={`yn${ci}`}>
                          {yn !== null ? (
                            <span className={`yn-badge yn-${yn.toLowerCase()}`}>{yn}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Attainment row */}
                <tr className="totals-row">
                  <td colSpan={2}>CO Attainment (%)</td>
                  {activeCOs.map(ci => <td key={ci}></td>)}
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

          {/* Attainment Summary */}
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
