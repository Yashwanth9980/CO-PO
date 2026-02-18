import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
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
    bulkUpdateSurvey,
  } = useApp();

  const fileInputRef = useRef(null);
  const [uploadMsg, setUploadMsg] = useState(null);

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

  // ---- Download sample Excel ----
  function downloadSample() {
    const header = ['CO', 'Question', 'Total Respondents', 'Scale 1', 'Scale 2', 'Scale 3', 'Scale 4', 'Scale 5'];
    const rows = [];
    survey.forEach(co => {
      co.questions.forEach((q, qi) => {
        rows.push([
          co.coLabel,
          q.text || `Question ${qi + 1} for ${co.coLabel}`,
          co.totalRespondents,
          ...q.ratings.map(r => r.count),
        ]);
      });
    });
    // If no data yet, generate illustrative sample rows
    if (rows.every(r => r[3] === 0 && r[4] === 0 && r[5] === 0 && r[6] === 0 && r[7] === 0)) {
      rows.length = 0;
      survey.forEach(co => {
        co.questions.forEach((_, qi) => {
          rows.push([co.coLabel, `Question ${qi + 1} for ${co.coLabel}`, co.totalRespondents, 5, 10, 15, 10, 4]);
        });
      });
    }

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 18 }, ...Array(5).fill({ wch: 10 })];

    // Style header row
    header.forEach((_, c) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'EBF4FF' } } };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Survey');
    XLSX.writeFile(wb, 'sample_survey.xlsx');
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

      const coColIdx   = headers.findIndex(h => h === 'co' || h === 'co label' || h.startsWith('co'));
      const qColIdx    = headers.findIndex(h => h.includes('question') || h === 'q' || h === 'ques');
      const respColIdx = headers.findIndex(h => h.includes('respondent') || h.includes('total resp') || h === 'n');

      const scaleIdxes = [1, 2, 3, 4, 5].map(n =>
        headers.findIndex(h =>
          h === `scale ${n}` || h === `scale${n}` || h === `s${n}` || h === String(n) ||
          h === `rating ${n}` || h === `r${n}`
        )
      );

      if (coColIdx === -1) {
        setUploadMsg({ type: 'error', text: 'Missing "CO" column. Use the sample template.' });
        e.target.value = '';
        return;
      }
      if (qColIdx === -1) {
        setUploadMsg({ type: 'error', text: 'Missing "Question" column. Use the sample template.' });
        e.target.value = '';
        return;
      }
      if (scaleIdxes.some(i => i === -1)) {
        setUploadMsg({ type: 'error', text: 'Missing Scale columns (Scale 1 – Scale 5). Use the sample template.' });
        e.target.value = '';
        return;
      }

      // Group data rows by CO label
      const coMap = {}; // coLabel → { totalRespondents, questions[] }
      rows
        .slice(1)
        .filter(row => row.some(cell => cell !== '' && cell !== null))
        .forEach(row => {
          const coLabel = String(row[coColIdx] || '').trim();
          if (!coLabel) return;

          const qText      = String(row[qColIdx] || '').trim();
          const respondents = respColIdx !== -1 ? (parseInt(row[respColIdx]) || 0) : 0;
          const ratings    = scaleIdxes.map((si, ri) => ({
            scale: ri + 1,
            count: parseInt(row[si]) || 0,
          }));

          if (!coMap[coLabel]) {
            coMap[coLabel] = { totalRespondents: respondents, questions: [] };
          }
          // Use the largest respondent value seen for this CO
          if (respondents > coMap[coLabel].totalRespondents) {
            coMap[coLabel].totalRespondents = respondents;
          }
          coMap[coLabel].questions.push({ text: qText, ratings });
        });

      if (Object.keys(coMap).length === 0) {
        setUploadMsg({ type: 'error', text: 'No data rows found. Check that the CO column has valid values.' });
        e.target.value = '';
        return;
      }

      // Merge uploaded data into existing survey (preserve COs not in file)
      const newSurvey = survey.map(existingCO => {
        const data = coMap[existingCO.coLabel];
        if (!data || data.questions.length === 0) return existingCO;
        return {
          coLabel: existingCO.coLabel,
          totalRespondents: data.totalRespondents || existingCO.totalRespondents,
          questions: data.questions,
        };
      });

      bulkUpdateSurvey(newSurvey);

      const loadedCOs = Object.keys(coMap).length;
      const loadedQs  = Object.values(coMap).reduce((s, c) => s + c.questions.length, 0);
      setUploadMsg({
        type: 'success',
        text: `Loaded ${loadedQs} question${loadedQs !== 1 ? 's' : ''} across ${loadedCOs} CO${loadedCOs !== 1 ? 's' : ''} from file.`,
      });
    } catch {
      setUploadMsg({ type: 'error', text: 'Failed to parse the file. Please use the sample template.' });
    }

    e.target.value = '';
  }

  return (
    <div>
      <div className="section-title">Indirect Assessment — Student Survey</div>

      <div className="info-box">
        <strong>Procedure:</strong> Conduct a survey with questions related to each CO.
        Students rate each question on a scale of <strong>1 (Not Confident)</strong> to <strong>5 (Very Confident)</strong>.
        <br />Average rating per question → Average per CO → Grand average → Indirect Attainment = Grand Avg / 5 × 100%
      </div>

      {/* Upload toolbar */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">Upload Survey Data</div>
        <p style={{ fontSize: '0.88rem', color: '#4a5568', marginBottom: '0.75rem' }}>
          Upload a CSV or Excel file containing survey responses. Each row should represent one question for one CO.
          Required columns: <strong>CO</strong>, <strong>Question</strong>, <strong>Scale 1</strong> – <strong>Scale 5</strong>.
          Optional: <strong>Total Respondents</strong>.
        </p>
        <div className="ia-upload-bar">
          <button className="btn btn-success btn-sm" onClick={() => fileInputRef.current?.click()}>
            Upload CSV / Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={downloadSample}>
            Download Sample
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
          <div
            className={`alert ${uploadMsg.type === 'success' ? 'alert-success' : 'alert-warning'}`}
            style={{ marginTop: '0.5rem' }}
          >
            {uploadMsg.text}
          </div>
        )}
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
                className="progress-bar-fill fill-purple"
                style={{ width: `${Math.min(attainmentPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
