import { useApp } from '../context/AppContext';
import { formatPct } from '../utils/calculations';

export default function IndirectPage() {
  const {
    survey,
    updateSurveyQuestion,
    updateSurveyRating,
    addSurveyQuestion,
    removeSurveyQuestion,
    updateSurveyRespondents,
  } = useApp();

  function calcQuestionAvg(question) {
    const total = question.ratings.reduce((s, r) => s + r.count, 0);
    if (total === 0) return 0;
    const weighted = question.ratings.reduce((s, r, i) => s + r.count * (i + 1), 0);
    return weighted / total;
  }

  function calcCOAvg(co) {
    if (!co.questions.length) return 0;
    const avgs = co.questions.map(calcQuestionAvg);
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }

  const coAverages = survey.map(calcCOAvg);
  const grandAverage = coAverages.length ? coAverages.reduce((a, b) => a + b, 0) / coAverages.length : 0;
  const attainmentPct = (grandAverage / 5) * 100;

  return (
    <div>
      <div className="section-title">Indirect Assessment — Student Survey</div>

      <div className="info-box">
        <strong>Procedure:</strong> Conduct a survey with questions related to each CO.
        Students rate each question on a scale of <strong>1 (Not Confident)</strong> to <strong>5 (Very Confident)</strong>.
        <br />Average rating per question → Average per CO → Grand average → Indirect Attainment = Grand Avg / 5 × 100%
      </div>

      {survey.map((co, coIdx) => {
        const coAvg = calcCOAvg(co);
        return (
          <div className="card" key={coIdx}>
            <div className="card-title">
              {co.coLabel} — Survey Questions
              <span className="badge">Avg: {formatPct(coAvg)} / 5</span>
            </div>

            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ whiteSpace: 'nowrap' }}>Total Respondents:</label>
                <input
                  type="number"
                  value={co.totalRespondents}
                  min="1"
                  onChange={e => updateSurveyRespondents(coIdx, e.target.value)}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: '35%' }}>Question</th>
                    <th>Scale 1</th>
                    <th>Scale 2</th>
                    <th>Scale 3</th>
                    <th>Scale 4</th>
                    <th>Scale 5</th>
                    <th>Total</th>
                    <th>Avg</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {co.questions.map((q, qIdx) => {
                    const total = q.ratings.reduce((s, r) => s + r.count, 0);
                    const avg = calcQuestionAvg(q);
                    return (
                      <tr key={qIdx}>
                        <td style={{ textAlign: 'left' }}>
                          <input
                            type="text"
                            value={q.text}
                            onChange={e => updateSurveyQuestion(coIdx, qIdx, 'text', e.target.value)}
                            placeholder={`Question ${qIdx + 1} for ${co.coLabel}`}
                            style={{ width: '100%', padding: '0.3rem 0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '5px', fontSize: '0.82rem' }}
                          />
                        </td>
                        {q.ratings.map((r, ri) => (
                          <td key={ri}>
                            <input
                              type="number"
                              value={r.count}
                              min="0"
                              onChange={e => updateSurveyRating(coIdx, qIdx, ri, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>
                          <span style={{ fontWeight: 600, color: '#2b6cb0' }}>{total}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: avg >= 3.5 ? '#276749' : avg >= 2.5 ? '#744210' : '#9b2c2c',
                            }}
                          >
                            {formatPct(avg)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeSurveyQuestion(coIdx, qIdx)}
                            disabled={co.questions.length <= 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="btn-row">
              <button className="btn btn-outline btn-sm" onClick={() => addSurveyQuestion(coIdx)}>
                + Add Question
              </button>
              <span className="text-sm text-muted">
                CO Average = ({co.questions.map((_, qi) => `Q${qi + 1} avg`).join(' + ')}) / {co.questions.length} = <strong>{formatPct(coAvg)}</strong>
              </span>
            </div>
          </div>
        );
      })}

      {/* Grand Summary */}
      <div className="card">
        <div className="card-title">Indirect Attainment Summary</div>

        <div className="formula-box">
          Grand Average = ({coAverages.map((a, i) => `${survey[i]?.coLabel || `CO${i+1}`}(${formatPct(a)})`).join(' + ')}) / {survey.length} = <span className="val">{formatPct(grandAverage)}</span>
          <br />
          Indirect Attainment = {formatPct(grandAverage)} / 5 × 100 = <span className="val">{formatPct(attainmentPct)}%</span>
        </div>

        <div className="attainment-grid">
          {coAverages.map((avg, i) => (
            <div className="attainment-box co-box" key={i}>
              <div className="co-label">{survey[i]?.coLabel || `CO${i + 1}`}</div>
              <div className="co-value">{formatPct(avg)}</div>
              <div className="co-unit">/ 5</div>
              <div className="progress-bar-wrap">
                <div
                  className={`progress-bar-fill ${avg >= 3.5 ? 'fill-green' : avg >= 2.5 ? 'fill-yellow' : 'fill-red'}`}
                  style={{ width: `${(avg / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="attainment-box final-box">
            <div className="co-label">Indirect Attainment</div>
            <div className="co-value">{formatPct(attainmentPct)}</div>
            <div className="co-unit">%</div>
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill fill-purple`}
                style={{ width: `${Math.min(attainmentPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
