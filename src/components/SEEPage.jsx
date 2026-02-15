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
