import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import {
  calcAttainmentPct,
  calcAverageIAAttainment,
  calcCIEAttainment,
  calcDirectAttainment,
  calcTotalAttainment,
  formatPct,
  getProgressColor,
} from '../utils/calculations';

function calcQuestionAvg(question) {
  const total = question.ratings.reduce((s, r) => s + r.count, 0);
  if (total === 0) return 0;
  const weighted = question.ratings.reduce((s, r, i) => s + r.count * (i + 1), 0);
  return weighted / total;
}

function calcCOSurveyAvg(co) {
  if (!co.questions.length) return 0;
  const avgs = co.questions.map(calcQuestionAvg);
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}

// ── SVG: Total CO Attainment bar chart ──────────────────────────────────────
function TotalAttainmentChart({ rows }) {
  const W = 560, H = 220;
  const ml = 46, mr = 16, mt = 24, mb = 48;
  const cw = W - ml - mr, ch = H - mt - mb;
  const n = rows.length;
  const gap = cw / n;
  const bw = Math.min(gap * 0.55, 56);

  const y = (v) => ch - (Math.min(v, 100) / 100) * ch;
  const color = (v) => v >= 60 ? '#38a169' : v >= 40 ? '#d69e2e' : '#e53e3e';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minHeight: '180px', display: 'block' }} aria-label="Total CO Attainment">
      <g transform={`translate(${ml},${mt})`}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={0} y1={y(v)} x2={cw} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={-6} y={y(v) + 4} textAnchor="end" fontSize={9} fill="#718096">{v}</text>
          </g>
        ))}
        {/* 60 % target dashed line */}
        <line x1={0} y1={y(60)} x2={cw} y2={y(60)} stroke="#fc8181" strokeWidth={1.5} strokeDasharray="5,3" />
        <text x={cw + 3} y={y(60) + 4} fontSize={8} fill="#e53e3e">60%</text>

        {rows.map((r, i) => {
          const bh = Math.max((Math.min(r.total, 100) / 100) * ch, 2);
          const x = i * gap + (gap - bw) / 2;
          const c = color(r.total);
          return (
            <g key={i}>
              <rect x={x} y={y(r.total)} width={bw} height={bh} fill={c} rx={4} opacity={0.88} />
              <text x={x + bw / 2} y={y(r.total) - 5} textAnchor="middle" fontSize={10} fill={c} fontWeight="700">
                {formatPct(r.total)}%
              </text>
              <text x={x + bw / 2} y={ch + 16} textAnchor="middle" fontSize={11} fill="#1a365d" fontWeight="700">
                {r.co}
              </text>
            </g>
          );
        })}

        <line x1={0} y1={0} x2={0} y2={ch} stroke="#cbd5e0" strokeWidth={1.5} />
        <line x1={0} y1={ch} x2={cw} y2={ch} stroke="#cbd5e0" strokeWidth={1.5} />
        <text x={-34} y={ch / 2} transform={`rotate(-90,-34,${ch / 2})`} textAnchor="middle" fontSize={9} fill="#718096">
          Attainment %
        </text>
      </g>
    </svg>
  );
}

// ── SVG: Grouped breakdown chart (IA / CIE / Direct / Total per CO) ─────────
const METRICS = [
  { key: 'ia',     label: 'IA',     color: '#3182ce' },
  { key: 'assign', label: 'Assign', color: '#38a169' },
  { key: 'cie',    label: 'CIE',    color: '#805ad5' },
  { key: 'direct', label: 'Direct', color: '#d69e2e' },
  { key: 'total',  label: 'Total',  color: '#e53e3e' },
];

function BreakdownChart({ rows }) {
  const W = 660, H = 260;
  const ml = 46, mr = 82, mt = 24, mb = 52;
  const cw = W - ml - mr, ch = H - mt - mb;
  const n = rows.length;
  const nm = METRICS.length;
  const groupW = cw / n;
  const bw = Math.min((groupW - 12) / nm, 28);

  const y = (v) => ch - (Math.min(v, 100) / 100) * ch;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minHeight: '200px', display: 'block' }} aria-label="CO Attainment Breakdown">
      <g transform={`translate(${ml},${mt})`}>
        {[0, 20, 40, 60, 80, 100].map(v => (
          <g key={v}>
            <line x1={0} y1={y(v)} x2={cw} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={-6} y={y(v) + 4} textAnchor="end" fontSize={9} fill="#718096">{v}%</text>
          </g>
        ))}
        <line x1={0} y1={y(60)} x2={cw} y2={y(60)} stroke="#fc8181" strokeWidth={1.5} strokeDasharray="5,3" />
        <text x={cw + 3} y={y(60) + 4} fontSize={8} fill="#e53e3e">60%</text>

        {rows.map((r, ci) => {
          const startX = ci * groupW + (groupW - nm * (bw + 2)) / 2;
          return METRICS.map((m, mi) => {
            const val = r[m.key] || 0;
            const bh = Math.max((Math.min(val, 100) / 100) * ch, 2);
            const x = startX + mi * (bw + 2);
            return (
              <g key={`${ci}-${mi}`}>
                <rect x={x} y={y(val)} width={bw} height={bh} fill={m.color} rx={3} opacity={0.85} />
                {val >= 8 && (
                  <text x={x + bw / 2} y={y(val) - 3} textAnchor="middle" fontSize={8} fill={m.color} fontWeight="700">
                    {Math.round(val)}
                  </text>
                )}
              </g>
            );
          });
        })}

        {rows.map((r, ci) => (
          <text key={ci} x={ci * groupW + groupW / 2} y={ch + 16} textAnchor="middle" fontSize={11} fontWeight="700" fill="#1a365d">
            {r.co}
          </text>
        ))}

        <line x1={0} y1={0} x2={0} y2={ch} stroke="#cbd5e0" strokeWidth={1.5} />
        <line x1={0} y1={ch} x2={cw} y2={ch} stroke="#cbd5e0" strokeWidth={1.5} />

        {/* Legend on the right */}
        {METRICS.map((m, i) => (
          <g key={i} transform={`translate(${cw + 8},${i * 22})`}>
            <rect width={13} height={11} fill={m.color} rx={2} />
            <text x={17} y={10} fontSize={10} fill="#4a5568">{m.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function SummaryPage() {
  const { config, cos, iaTests, assignments, see, survey } = useApp();
  const numCOs = parseInt(config.numCOs);

  const iaAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcAverageIAAttainment(iaTests, ci)
  );

  const assignAttainments = Array.from({ length: numCOs }, (_, ci) => {
    const valid = assignments.filter(t => t.students && t.students.length > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, t) => {
      const coStudents = t.students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
      return acc + calcAttainmentPct(coStudents, t.coMaxMarks[ci] ?? t.maxMarks);
    }, 0);
    return sum / valid.length;
  });

  const seeAttainments = Array.from({ length: numCOs }, (_, ci) => {
    if (!see.students || see.students.length === 0) return 0;
    const coStudents = see.students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
    return calcAttainmentPct(coStudents, see.coMaxMarks[ci] ?? see.maxMarks);
  });

  const cieAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcCIEAttainment(iaAttainments[ci], assignAttainments[ci])
  );

  const directAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcDirectAttainment(cieAttainments[ci], seeAttainments[ci])
  );

  const coSurveyAverages = survey.slice(0, numCOs).map(calcCOSurveyAvg);
  const grandAverage = coSurveyAverages.length
    ? coSurveyAverages.reduce((a, b) => a + b, 0) / coSurveyAverages.length
    : 0;
  const indirectPct = (grandAverage / 5) * 100;

  const totalAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcTotalAttainment(directAttainments[ci], indirectPct)
  );

  const overallAvg = totalAttainments.reduce((a, b) => a + b, 0) / numCOs;

  const rows = Array.from({ length: numCOs }, (_, ci) => ({
    co:       cos[ci] || `CO${ci + 1}`,
    ia:       iaAttainments[ci],
    assign:   assignAttainments[ci],
    cie:      cieAttainments[ci],
    see:      seeAttainments[ci],
    direct:   directAttainments[ci],
    indirect: indirectPct,
    total:    totalAttainments[ci],
  }));

  function attainmentColor(v) {
    return v >= 60 ? '#276749' : v >= 40 ? '#744210' : '#9b2c2c';
  }
  function attainmentBg(v) {
    return v >= 60 ? '#f0fff4' : v >= 40 ? '#fffbeb' : '#fff5f5';
  }

  // ── Excel Download ─────────────────────────────────────────────────────────
  function downloadExcel() {
    const wb = XLSX.utils.book_new();
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / numCOs;

    const wsData = [
      ['CO Attainment Report — Course File'],
      ['Course Name:', config.courseName, '', 'Course Code:', config.courseCode],
      ['Semester:', config.semester, '', 'Academic Year:', config.academicYear],
      ['Generated:', new Date().toLocaleDateString('en-IN')],
      [],
      ['CO', 'IA (%)', 'Assignment (%)', 'CIE (%)', 'SEE (%)', 'Direct (%)', 'Indirect (%)', 'Total (%)', 'Attained?'],
      ...rows.map(r => [
        r.co,
        +formatPct(r.ia),
        +formatPct(r.assign),
        +formatPct(r.cie),
        +formatPct(r.see),
        +formatPct(r.direct),
        +formatPct(r.indirect),
        +formatPct(r.total),
        r.total >= 60 ? 'Y' : 'N',
      ]),
      [
        'Average',
        +formatPct(avg(iaAttainments)),
        +formatPct(avg(assignAttainments)),
        +formatPct(avg(cieAttainments)),
        +formatPct(avg(seeAttainments)),
        +formatPct(avg(directAttainments)),
        +formatPct(indirectPct),
        +formatPct(overallAvg),
        overallAvg >= 60 ? 'Y' : 'N',
      ],
      [],
      ['Formulae'],
      ['CIE  = 0.8 × IA  +  0.2 × Assignment'],
      ['Direct  = 0.5 × CIE  +  0.5 × SEE'],
      ['Total  = 0.9 × Direct  +  0.1 × Indirect'],
      [`Target: > ${config.targetPct}% of students achieve Level 3 (≥ 60% marks)`],
      [`Indirect Attainment: Grand Survey Avg = ${formatPct(grandAverage)} / 5  →  ${formatPct(indirectPct)}%`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
      { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    ];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'CO Attainment');
    XLSX.writeFile(wb, `CO_Attainment_${config.courseCode}_${config.academicYear.replace(/\s/g, '_')}.xlsx`);
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  return (
    <div id="summary-print-area">
      <div className="section-title print-course-header">CO Attainment Summary</div>

      {/* Print-only course info */}
      <div className="print-only print-meta">
        <strong>{config.courseName}</strong> ({config.courseCode}) &mdash; {config.semester} &mdash; {config.academicYear}
      </div>

      <div className="info-box no-print">
        Final CO attainment computed from all entered data.
        <strong> CIE = 80% IA + 20% Assign &nbsp;|&nbsp; Direct = 50% CIE + 50% SEE &nbsp;|&nbsp; Total = 90% Direct + 10% Indirect</strong>
      </div>

      {/* Download / Print toolbar */}
      <div className="ia-upload-bar no-print" style={{ display: 'flex', marginBottom: '1.25rem' }}>
        <button className="btn btn-success" onClick={downloadExcel}>
          Download Excel (Course File)
        </button>
        <button className="btn btn-outline btn-sm" onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      {/* ── CO Total Attainment Cards ── */}
      <div className="attainment-grid" style={{ marginBottom: '1.5rem' }}>
        {rows.map((r, i) => (
          <div
            key={i}
            className="attainment-box"
            style={{ background: `linear-gradient(135deg, ${attainmentBg(r.total)}, white)`, border: `2px solid ${attainmentColor(r.total)}30` }}
          >
            <div className="co-label">{r.co}</div>
            <div className="co-value" style={{ color: attainmentColor(r.total) }}>
              {formatPct(r.total)}
            </div>
            <div className="co-unit">% Total</div>
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill ${getProgressColor(r.total)}`}
                style={{ width: `${Math.min(r.total, 100)}%` }}
              />
            </div>
          </div>
        ))}
        <div className="attainment-box final-box">
          <div className="co-label">Overall Average</div>
          <div className="co-value" style={{ color: '#805ad5' }}>{formatPct(overallAvg)}</div>
          <div className="co-unit">%</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill fill-purple" style={{ width: `${Math.min(overallAvg, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="chart-grid">
        <div className="card chart-card">
          <div className="card-title">Total CO Attainment</div>
          <div className="chart-note">Dashed line = 60% target threshold</div>
          <TotalAttainmentChart rows={rows} />
        </div>

        <div className="card chart-card">
          <div className="card-title">CO Attainment Breakdown</div>
          <div className="chart-note">IA, Assignment, CIE, Direct and Total attainment per CO</div>
          <BreakdownChart rows={rows} />
        </div>
      </div>

      {/* ── Detailed Table ── */}
      <div className="card">
        <div className="card-title">Detailed CO Attainment Breakdown</div>
        <div className="table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>CO</th>
                <th>IA (%)</th>
                <th>Assignment (%)</th>
                <th>CIE (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>80% IA + 20% Assign</span></th>
                <th>SEE (%)</th>
                <th>Direct (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>50% CIE + 50% SEE</span></th>
                <th>Indirect (%)</th>
                <th>Total (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>90% Direct + 10% Indirect</span></th>
                <th>Attained?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left', fontWeight: 700, color: '#1a365d' }}>{r.co}</td>
                  <td>{formatPct(r.ia)}</td>
                  <td>{formatPct(r.assign)}</td>
                  <td style={{ fontWeight: 600, color: '#2b6cb0' }}>{formatPct(r.cie)}</td>
                  <td>{formatPct(r.see)}</td>
                  <td style={{ fontWeight: 600, color: '#276749' }}>{formatPct(r.direct)}</td>
                  <td>{formatPct(r.indirect)}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: attainmentColor(r.total), background: attainmentBg(r.total), padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      {formatPct(r.total)}%
                    </span>
                  </td>
                  <td>
                    <span className={`yn-badge yn-${r.total >= 60 ? 'y' : 'n'}`}>
                      {r.total >= 60 ? 'Y' : 'N'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="totals-row">
                <td>Average</td>
                <td>{formatPct(iaAttainments.reduce((a, b) => a + b, 0) / numCOs)}</td>
                <td>{formatPct(assignAttainments.reduce((a, b) => a + b, 0) / numCOs)}</td>
                <td>{formatPct(cieAttainments.reduce((a, b) => a + b, 0) / numCOs)}</td>
                <td>{formatPct(seeAttainments.reduce((a, b) => a + b, 0) / numCOs)}</td>
                <td>{formatPct(directAttainments.reduce((a, b) => a + b, 0) / numCOs)}</td>
                <td>{formatPct(indirectPct)}</td>
                <td>
                  <span style={{ fontWeight: 800, color: attainmentColor(overallAvg), background: attainmentBg(overallAvg), padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {formatPct(overallAvg)}%
                  </span>
                </td>
                <td>
                  <span className={`yn-badge yn-${overallAvg >= 60 ? 'y' : 'n'}`}>
                    {overallAvg >= 60 ? 'Y' : 'N'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Formula Summary ── */}
      <div className="card">
        <div className="card-title">Calculation Summary</div>
        <div className="formula-box">
          <span className="hl">IA Attainment</span> = Avg across {iaTests.length} IA test(s) — % students scoring Level 3 per CO<br />
          <span className="hl">Assignment Attainment</span> = Avg across {assignments.length} assignment(s)<br />
          <span className="hl">CIE Attainment</span> = (0.8 × IA) + (0.2 × Assignment)<br />
          <span className="hl">SEE Attainment</span> = % students scoring Level 3 per CO in SEE<br />
          <span className="hl">Direct Attainment</span> = (0.5 × CIE) + (0.5 × SEE)<br />
          <span className="hl">Indirect Attainment</span> = (Grand Survey Avg / 5) × 100 = <span className="val">{formatPct(indirectPct)}%</span><br />
          <span className="hl">Total CO Attainment</span> = (0.9 × Direct) + (0.1 × Indirect)
        </div>
        <div className="info-box" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <strong>Target:</strong> More than {config.targetPct}% of students should achieve Level 3 (≥ 60% marks).<br />
          <strong>Indirect Survey Grand Average:</strong> {formatPct(grandAverage)} / 5 → {formatPct(indirectPct)}% attainment
        </div>
      </div>
    </div>
  );
}
