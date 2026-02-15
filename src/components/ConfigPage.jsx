import { useApp } from '../context/AppContext';

export default function ConfigPage() {
  const { config, updateConfig, cos, updateCOLabel } = useApp();

  return (
    <div>
      <div className="section-title">Course Configuration</div>

      <div className="info-box">
        Set up your course details and Course Outcomes (COs). These settings apply to all assessments.
        The target is: <strong>More than {config.targetPct}% of students must achieve Level {config.targetLevel} (≥60% marks)</strong>.
      </div>

      <div className="card">
        <div className="card-title">Course Information</div>
        <div className="config-grid">
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              value={config.courseName}
              onChange={e => updateConfig('courseName', e.target.value)}
              placeholder="e.g., Electronics Engineering"
            />
          </div>
          <div className="form-group">
            <label>Course Code</label>
            <input
              type="text"
              value={config.courseCode}
              onChange={e => updateConfig('courseCode', e.target.value)}
              placeholder="e.g., EC301"
            />
          </div>
          <div className="form-group">
            <label>Semester</label>
            <input
              type="text"
              value={config.semester}
              onChange={e => updateConfig('semester', e.target.value)}
              placeholder="e.g., Semester 3"
            />
          </div>
          <div className="form-group">
            <label>Academic Year</label>
            <input
              type="text"
              value={config.academicYear}
              onChange={e => updateConfig('academicYear', e.target.value)}
              placeholder="e.g., 2024-25"
            />
          </div>
          <div className="form-group">
            <label>Number of COs</label>
            <select
              value={config.numCOs}
              onChange={e => updateConfig('numCOs', parseInt(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Total Students</label>
            <input
              type="number"
              value={config.numStudents}
              onChange={e => updateConfig('numStudents', parseInt(e.target.value) || 1)}
              min="1"
              max="500"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Attainment Target Setting</div>
        <div className="info-box">
          Based on last 3 years result / University average. The target level is the benchmark
          for attainment calculation.
        </div>
        <div className="config-grid">
          <div className="form-group">
            <label>Target Level</label>
            <select
              value={config.targetLevel}
              onChange={e => updateConfig('targetLevel', parseInt(e.target.value))}
            >
              <option value={3}>Level 3 (≥ 60%)</option>
              <option value={2}>Level 2 (≥ 30%)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target % of Students</label>
            <input
              type="number"
              value={config.targetPct}
              onChange={e => updateConfig('targetPct', parseFloat(e.target.value) || 50)}
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="formula-box" style={{ marginTop: '1rem' }}>
          <span className="hl">Level 3:</span> <span className="val">Marks ≥ 60%</span> → Target Attained (Y)<br />
          <span className="hl">Level 2:</span> <span className="val">30% ≤ Marks &lt; 60%</span> → Not Attained (N)<br />
          <span className="hl">Level 1:</span> <span className="val">10% ≤ Marks &lt; 30%</span> → Not Attained (N)<br />
          <span className="hl">Level 0:</span> <span className="val">Marks &lt; 10%</span> → Not Attained (N)
        </div>
      </div>

      <div className="card">
        <div className="card-title">Course Outcomes (CO) Labels</div>
        <div className="config-grid">
          {cos.map((co, idx) => (
            <div className="form-group" key={idx}>
              <label>CO{idx + 1} Label</label>
              <input
                type="text"
                value={co}
                onChange={e => updateCOLabel(idx, e.target.value)}
                placeholder={`CO${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">CO Attainment Formula</div>
        <div className="formula-box">
          <span className="hl">CIE Attainment</span> = <span className="val">80%</span> × IA Attainment + <span className="val">20%</span> × Assignment Attainment<br />
          <span className="hl">Direct Attainment</span> = <span className="val">50%</span> × CIE Attainment + <span className="val">50%</span> × SEE Attainment<br />
          <span className="hl">Indirect Attainment</span> = Grand Average of Survey / 5 × 100%<br />
          <span className="hl">Total CO Attainment</span> = <span className="val">90%</span> × Direct Attainment + <span className="val">10%</span> × Indirect Attainment
        </div>
      </div>
    </div>
  );
}
