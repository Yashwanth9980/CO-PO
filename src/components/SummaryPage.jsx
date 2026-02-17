import { useApp } from '../context/AppContext';
import {
  calcAttainmentPct,
  calcCIEAttainment,
  calcDirectAttainment,
  calcTotalAttainment,
  calcIndirectAttainment,
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

export default function SummaryPage() {
  const { config, cos, iaTests, assignments, see, survey } = useApp();
  const numCOs = parseInt(config.numCOs);

  // ---- IA Attainment per CO (average across IA tests that include each CO) ----
  const iaAttainments = Array.from({ length: numCOs }, (_, ci) => {
    const validTests = iaTests.filter(t => {
      if (!t.students || t.students.length === 0) return false;
      const selectedCOs = t.selectedCOs ?? Array.from({ length: numCOs }, (_, i) => i);
      return selectedCOs.includes(ci);
    });
    if (validTests.length === 0) return 0;
    const sum = validTests.reduce((acc, t) => {
      const coStudents = t.students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
      return acc + calcAttainmentPct(coStudents, t.coMaxMarks[ci] ?? t.maxMarks);
    }, 0);
    return sum / validTests.length;
  });

  // ---- Assignment Attainment per CO (average across all assignments) ----
  const assignAttainments = Array.from({ length: numCOs }, (_, ci) => {
    const validAssigns = assignments.filter(t => t.students && t.students.length > 0);
    if (validAssigns.length === 0) return 0;
    const sum = validAssigns.reduce((acc, t) => {
      const coStudents = t.students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
      return acc + calcAttainmentPct(coStudents, t.coMaxMarks[ci] ?? t.maxMarks);
    }, 0);
    return sum / validAssigns.length;
  });

  // ---- SEE Attainment per CO ----
  const seeAttainments = Array.from({ length: numCOs }, (_, ci) => {
    if (!see.students || see.students.length === 0) return 0;
    const coStudents = see.students.map(s => ({ marks: s.coMarks[ci] ?? '' }));
    return calcAttainmentPct(coStudents, see.coMaxMarks[ci] ?? see.maxMarks);
  });

  // ---- CIE Attainment = 80% IA + 20% Assignment ----
  const cieAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcCIEAttainment(iaAttainments[ci], assignAttainments[ci])
  );

  // ---- Direct Attainment = 50% CIE + 50% SEE ----
  const directAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcDirectAttainment(cieAttainments[ci], seeAttainments[ci])
  );

  // ---- Indirect Attainment ----
  const coSurveyAverages = survey.slice(0, numCOs).map(calcCOSurveyAvg);
  const grandAverage = coSurveyAverages.length
    ? coSurveyAverages.reduce((a, b) => a + b, 0) / coSurveyAverages.length
    : 0;
  const indirectPct = (grandAverage / 5) * 100;

  // ---- Total CO Attainment = 90% Direct + 10% Indirect ----
  const totalAttainments = Array.from({ length: numCOs }, (_, ci) =>
    calcTotalAttainment(directAttainments[ci], indirectPct)
  );

  const overallAvg = totalAttainments.reduce((a, b) => a + b, 0) / numCOs;

  const rows = Array.from({ length: numCOs }, (_, ci) => ({
    co: cos[ci] || `CO${ci + 1}`,
    ia: iaAttainments[ci],
    assign: assignAttainments[ci],
    cie: cieAttainments[ci],
    see: seeAttainments[ci],
    direct: directAttainments[ci],
    indirect: indirectPct,
    total: totalAttainments[ci],
  }));

  function attainmentColor(val) {
    if (val >= 60) return '#276749';
    if (val >= 40) return '#744210';
    return '#9b2c2c';
  }

  function attainmentBg(val) {
    if (val >= 60) return '#f0fff4';
    if (val >= 40) return '#fffbeb';
    return '#fff5f5';
  }

  return (
    <div>
      <div className="section-title">CO Attainment Summary</div>

      <div className="info-box">
        This page shows the final computed CO attainment based on all entered data.
        Formulae: <strong>CIE = 80% IA + 20% Assignment | Direct = 50% CIE + 50% SEE | Total = 90% Direct + 10% Indirect</strong>
      </div>

      {/* Overall Cards */}
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

      {/* Detailed Summary Table */}
      <div className="card">
        <div className="card-title summary-table">Detailed CO Attainment Breakdown</div>
        <div className="table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>CO</th>
                <th>IA Attainment (%)</th>
                <th>Assignment Attainment (%)</th>
                <th>CIE Attainment (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>(80% IA + 20% Assign)</span></th>
                <th>SEE Attainment (%)</th>
                <th>Direct Attainment (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>(50% CIE + 50% SEE)</span></th>
                <th>Indirect Attainment (%)</th>
                <th>Total Attainment (%)<br /><span style={{ fontWeight: 400, fontSize: '0.7rem' }}>(90% Direct + 10% Indirect)</span></th>
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
                    <span
                      style={{
                        fontWeight: 800,
                        color: attainmentColor(r.total),
                        background: attainmentBg(r.total),
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                      }}
                    >
                      {formatPct(r.total)}%
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
                  <span
                    style={{
                      fontWeight: 800,
                      color: attainmentColor(overallAvg),
                      background: attainmentBg(overallAvg),
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                    }}
                  >
                    {formatPct(overallAvg)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Summary */}
      <div className="card">
        <div className="card-title">Calculation Summary</div>
        <div className="formula-box">
          <span className="hl">IA Attainment</span> = Avg across {iaTests.length} IA test(s) = % students scoring Level 3 per CO<br />
          <span className="hl">Assignment Attainment</span> = Avg across {assignments.length} assignment(s)<br />
          <span className="hl">CIE Attainment</span> = (0.8 × IA) + (0.2 × Assignment)<br />
          <span className="hl">SEE Attainment</span> = % students scoring Level 3 per CO in SEE<br />
          <span className="hl">Direct Attainment</span> = (0.5 × CIE) + (0.5 × SEE)<br />
          <span className="hl">Indirect Attainment</span> = (Grand Survey Avg / 5) × 100 = <span className="val">{formatPct(indirectPct)}%</span><br />
          <span className="hl">Total CO Attainment</span> = (0.9 × Direct) + (0.1 × Indirect)
        </div>

        <div className="info-box" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <strong>Target:</strong> More than {config.targetPct}% of students should achieve Level 3 (≥60% marks).
          <br />
          <strong>Indirect Survey Grand Average:</strong> {formatPct(grandAverage)} / 5 → {formatPct(indirectPct)}%
          attainment
        </div>
      </div>
    </div>
  );
}
