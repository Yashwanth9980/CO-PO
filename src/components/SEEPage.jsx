import { useApp } from '../context/AppContext';
import MarksTable from './MarksTable';

export default function SEEPage() {
  const { see, updateTestMaxTotal } = useApp();

  // Build a test object compatible with MarksTable
  const seeTest = { ...see, id: 'see', label: 'SEE' };

  return (
    <div>
      <div className="section-title">Semester End Exam (SEE)</div>

      <div className="info-box">
        <strong>Note:</strong> SEE is conducted by the University (VTU). Since CO-wise breakup may not
        be available, apply the same level criteria to overall marks obtained.<br />
        <strong>Procedure:</strong> Enter marks for each student per CO. The attainment is calculated
        as % of students scoring Level 3 (≥60% marks).<br />
        SEE Attainment contributes <strong>50%</strong> to Direct CO Attainment.
      </div>

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
        </div>
      </div>

      <div className="card">
        <div className="card-title">SEE Marks Entry</div>
        <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ whiteSpace: 'nowrap' }}>Total Max Marks:</label>
            <input
              type="number"
              value={see.maxMarks}
              onChange={e => updateTestMaxTotal('see', 'see', e.target.value)}
              style={{ width: '80px' }}
              min="0"
            />
          </div>
        </div>

        <MarksTable testType="see" test={seeTest} />
      </div>
    </div>
  );
}
