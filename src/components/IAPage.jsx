import { useState } from 'react';
import { useApp } from '../context/AppContext';
import IAMarksTable from './IAMarksTable';

export default function IAPage() {
  const {
    config, cos,
    iaTests, addIATest, removeIATest,
    updateQGroupCO, updateQGroupMaxMarks, addQGroup, removeQGroup,
  } = useApp();
  const [activeTest, setActiveTest] = useState(0);

  const test = iaTests[activeTest];

  return (
    <div>
      <div className="section-title">Internal Assessment (IA)</div>

      <div className="info-box">
        <strong>Format:</strong> Each IA has questions Q1–Q6 with parts a and b (either/or).
        Assign each question to a CO below — the table header will group questions under their CO.
        <br />
        <strong>Attainment:</strong> Level 3 (Y): ≥60% | Level 2: 30–59% | Level 1: 10–29% | Level 0: &lt;10%
        &nbsp;&nbsp;CO Attainment = % of students reaching Level 3.
      </div>

      <div className="card">
        <div className="card-title">
          IA Tests
          <span className="badge">{iaTests.length} test(s)</span>
        </div>

        {/* Test tabs */}
        <div className="flex flex-wrap gap-1" style={{ marginBottom: '1rem' }}>
          {iaTests.map((t, idx) => (
            <button
              key={t.id}
              className={`btn ${activeTest === idx ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTest(idx)}
            >
              {t.label}
            </button>
          ))}
          <button
            className="btn btn-success btn-sm"
            onClick={() => { addIATest(); setActiveTest(iaTests.length); }}
          >
            + Add Test
          </button>
          {iaTests.length > 1 && test && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                removeIATest(test.id);
                setActiveTest(Math.max(0, activeTest - 1));
              }}
            >
              Remove {test.label}
            </button>
          )}
        </div>

        {test && (
          <>
            {/* Question–CO Mapping Configuration */}
            <div className="card" style={{ marginBottom: '1rem', background: '#f7fafc' }}>
              <div className="card-title" style={{ fontSize: '0.95rem' }}>
                Question → CO Mapping
                <span className="badge" style={{ background: '#bee3f8', color: '#2b6cb0' }}>
                  Max {test.maxMarks} marks
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.75rem' }}>
                Each question (Q1–Q{test.qGroups.length}) has parts <strong>a</strong> and <strong>b</strong> (10 marks each, students answer one).
                Assign each question to its CO. Questions covering the same CO will be grouped together in the table header.
              </p>

              <div className="qgroup-grid">
                {test.qGroups.map(g => (
                  <div key={g.number} className="qgroup-card">
                    <div className="qgroup-label">
                      Q{g.number}
                      <span style={{ fontSize: '0.7rem', color: '#718096' }}>({g.number}a / {g.number}b)</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>Max Marks (per part)</label>
                      <input
                        type="number"
                        value={g.maxMarks}
                        min="1"
                        onChange={e => updateQGroupMaxMarks(test.id, g.number, e.target.value)}
                        style={{ width: '70px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.7rem' }}>Assign to CO</label>
                      <select
                        value={g.coIdx}
                        onChange={e => updateQGroupCO(test.id, g.number, e.target.value)}
                        style={{ fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                      >
                        {Array.from({ length: config.numCOs }, (_, ci) => (
                          <option key={ci} value={ci}>
                            {cos[ci] || `CO${ci + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {test.qGroups.length > 1 && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginTop: '0.3rem', width: '100%', fontSize: '0.7rem' }}
                        onClick={() => removeQGroup(test.id, g.number)}
                      >
                        Remove Q{g.number}
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Question button */}
                <div
                  className="qgroup-card qgroup-add"
                  onClick={() => addQGroup(test.id)}
                  title="Add a new question group"
                >
                  <span style={{ fontSize: '1.5rem', color: '#3182ce' }}>+</span>
                  <span style={{ fontSize: '0.78rem', color: '#3182ce', fontWeight: 600 }}>Add Question</span>
                </div>
              </div>

              {/* CO Summary */}
              <div className="flex flex-wrap gap-1" style={{ marginTop: '0.75rem' }}>
                {Array.from({ length: config.numCOs }, (_, ci) => {
                  const count = test.qGroups.filter(g => g.coIdx === ci).length;
                  if (count === 0) return null;
                  const maxPerCO = test.qGroups.filter(g => g.coIdx === ci).reduce((s, g) => s + g.maxMarks, 0);
                  return (
                    <span
                      key={ci}
                      style={{
                        background: '#ebf8ff',
                        color: '#2b6cb0',
                        border: '1px solid #90cdf4',
                        borderRadius: '6px',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {cos[ci] || `CO${ci + 1}`}: Q{test.qGroups.filter(g => g.coIdx === ci).map(g => g.number).join(', Q')} — {maxPerCO} marks
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Marks Entry Table */}
            <IAMarksTable test={test} />
          </>
        )}
      </div>
    </div>
  );
}
