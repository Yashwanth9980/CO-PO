import { useState } from 'react';
import { useApp } from '../context/AppContext';
import MarksTable from './MarksTable';

export default function IAPage() {
  const { config, cos, iaTests, addIATest, removeIATest, updateTestMaxTotal, toggleIATestCO } = useApp();
  const [activeTest, setActiveTest] = useState(0);

  return (
    <div>
      <div className="section-title">Internal Assessment (IA)</div>

      <div className="info-box">
        <strong>Procedure:</strong> Enter marks scored by each student for each CO.
        The system will automatically assign Level 1/2/3 and Y/N based on the percentage:
        <br />Level 3 (Y): ≥60% | Level 2 (N): 30–59% | Level 1 (N): 10–29% | Level 0 (N): &lt;10%
        <br />CO Attainment = % of students scoring Level 3 (Y) in the class.
      </div>

      {/* Test tabs */}
      <div className="card">
        <div className="card-title">
          IA Tests
          <span className="badge">{iaTests.length} test(s)</span>
        </div>

        <div className="flex flex-wrap gap-1" style={{ marginBottom: '1rem' }}>
          {iaTests.map((test, idx) => (
            <button
              key={test.id}
              className={`btn ${activeTest === idx ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTest(idx)}
            >
              {test.label}
            </button>
          ))}
          <button className="btn btn-success btn-sm" onClick={() => { addIATest(); setActiveTest(iaTests.length); }}>
            + Add Test
          </button>
        </div>

        {iaTests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ whiteSpace: 'nowrap' }}>Total Max Marks:</label>
                  <input
                    type="number"
                    value={iaTests[activeTest]?.maxMarks || 30}
                    onChange={e => updateTestMaxTotal('ia', iaTests[activeTest]?.id, e.target.value)}
                    style={{ width: '80px' }}
                    min="0"
                  />
                </div>
              </div>
              {iaTests.length > 1 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    removeIATest(iaTests[activeTest]?.id);
                    setActiveTest(Math.max(0, activeTest - 1));
                  }}
                >
                  Remove Test
                </button>
              )}
            </div>

            {iaTests[activeTest] && (() => {
              const test = iaTests[activeTest];
              const selectedCOs = test.selectedCOs ?? Array.from({ length: config.numCOs }, (_, i) => i);
              return (
                <>
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-title">
                      COs Covered in this Test
                      <span className="badge">{selectedCOs.length} selected</span>
                    </div>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#555' }}>
                      Select which Course Outcomes are assessed in {test.label}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: config.numCOs }, (_, ci) => {
                        const isSelected = selectedCOs.includes(ci);
                        return (
                          <button
                            key={ci}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => toggleIATestCO(test.id, ci)}
                            title={isSelected ? `Remove ${cos[ci] || `CO${ci + 1}`} from this test` : `Add ${cos[ci] || `CO${ci + 1}`} to this test`}
                          >
                            {cos[ci] || `CO${ci + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <MarksTable testType="ia" test={test} />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
