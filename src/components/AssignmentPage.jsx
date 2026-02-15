import { useState } from 'react';
import { useApp } from '../context/AppContext';
import MarksTable from './MarksTable';

export default function AssignmentPage() {
  const { assignments, addAssignment, removeAssignment, updateTestMaxTotal } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div>
      <div className="section-title">Assignments / Activities</div>

      <div className="info-box">
        <strong>Procedure:</strong> Same as IA — enter marks per CO per student.
        Assignment Attainment contributes <strong>20%</strong> to CIE Attainment.
        <br />Level 3 (Y): ≥60% | Level 2 (N): 30–59% | Level 1 (N): 10–29% | Level 0 (N): &lt;10%
      </div>

      <div className="card">
        <div className="card-title">
          Assignments
          <span className="badge">{assignments.length} assignment(s)</span>
        </div>

        <div className="flex flex-wrap gap-1" style={{ marginBottom: '1rem' }}>
          {assignments.map((test, idx) => (
            <button
              key={test.id}
              className={`btn ${activeIdx === idx ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveIdx(idx)}
            >
              {test.label}
            </button>
          ))}
          <button
            className="btn btn-success btn-sm"
            onClick={() => { addAssignment(); setActiveIdx(assignments.length); }}
          >
            + Add Assignment
          </button>
        </div>

        {assignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ whiteSpace: 'nowrap' }}>Total Max Marks:</label>
                  <input
                    type="number"
                    value={assignments[activeIdx]?.maxMarks || 20}
                    onChange={e => updateTestMaxTotal('assignment', assignments[activeIdx]?.id, e.target.value)}
                    style={{ width: '80px' }}
                    min="0"
                  />
                </div>
              </div>
              {assignments.length > 1 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    removeAssignment(assignments[activeIdx]?.id);
                    setActiveIdx(Math.max(0, activeIdx - 1));
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {assignments[activeIdx] && (
              <MarksTable testType="assignment" test={assignments[activeIdx]} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
