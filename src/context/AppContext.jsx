import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

const DEFAULT_COS = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

// IA student has USN and per-question marks
function createIAStudent(id, name, usn) {
  return {
    id,
    name: name || `Student ${id}`,
    usn: usn || `USN${String(id).padStart(3, '0')}`,
    qMarks: {},
  };
}

// Assignment/SEE student uses coMarks
function createStudent(id, name) {
  return { id, name: name || `Student ${id}`, coMarks: {} };
}

// Each qGroup = one question number (Q1, Q2, ...) with parts a and b
// coIdxA/coIdxB are independent CO indices for part a and part b
function createIATest(id, label, numCOs) {
  const numGroups = 6;
  const qGroups = Array.from({ length: numGroups }, (_, i) => {
    const co = Math.min(Math.floor(i * numCOs / numGroups), numCOs - 1);
    return { number: i + 1, maxMarks: 10, coIdxA: co, coIdxB: co };
  });
  return {
    id,
    label: label || `IA Test ${id}`,
    maxMarks: numGroups * 10, // 60
    qGroups,
    students: [],
  };
}

function createAssignment(id, label, numCOs) {
  return {
    id,
    label: label || `Assignment ${id}`,
    maxMarks: 20,
    coMaxMarks: Object.fromEntries(Array.from({ length: numCOs }, (_, i) => [i, 20])),
    students: [],
  };
}

function createSurveyQuestion() {
  return {
    text: '',
    ratings: [
      { scale: 1, count: 0 },
      { scale: 2, count: 0 },
      { scale: 3, count: 0 },
      { scale: 4, count: 0 },
      { scale: 5, count: 0 },
    ],
  };
}

export function AppProvider({ children }) {
  const [config, setConfig] = useState({
    courseName: 'Electronics Engineering',
    courseCode: 'EC301',
    semester: 'Semester 3',
    academicYear: '2024-25',
    numCOs: 5,
    numStudents: 44,
    targetLevel: 3,
    targetPct: 50,
  });

  const [cos, setCOs] = useState([...DEFAULT_COS]);
  const [iaTests, setIATests] = useState([createIATest(1, 'IA Test 1', 5)]);
  const [assignments, setAssignments] = useState([createAssignment(1, 'Assignment 1', 5)]);

  const [see, setSEE] = useState({
    maxMarks: 100,
    coMaxMarks: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i, 100])),
    students: [],
  });

  const [survey, setSurvey] = useState(
    Array.from({ length: 5 }, (_, coIdx) => ({
      coLabel: `CO${coIdx + 1}`,
      questions: Array.from({ length: 5 }, createSurveyQuestion),
      totalRespondents: 44,
    }))
  );

  const updateConfig = (field, value) => {
    setConfig(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'numCOs') {
        const n = parseInt(value) || 1;
        setCOs(Array.from({ length: n }, (_, i) => prev.cos?.[i] || `CO${i + 1}`));
        setSurvey(Array.from({ length: n }, (_, i) => ({
          coLabel: `CO${i + 1}`,
          questions: Array.from({ length: 5 }, createSurveyQuestion),
          totalRespondents: parseInt(next.numStudents) || 44,
        })));
      }
      return next;
    });
  };

  const updateCOLabel = (idx, label) => {
    setCOs(prev => prev.map((c, i) => (i === idx ? label : c)));
    setSurvey(prev => prev.map((s, i) => (i === idx ? { ...s, coLabel: label } : s)));
  };

  // Generate students for a test
  const generateStudents = (testType, testId, count) => {
    if (testType === 'ia') {
      const students = Array.from({ length: count }, (_, i) => createIAStudent(i + 1));
      setIATests(prev => prev.map(t => (t.id === testId ? { ...t, students } : t)));
    } else {
      const students = Array.from({ length: count }, (_, i) => createStudent(i + 1, `Student ${i + 1}`));
      if (testType === 'assignment') {
        setAssignments(prev => prev.map(t => (t.id === testId ? { ...t, students } : t)));
      } else if (testType === 'see') {
        setSEE(prev => ({ ...prev, students }));
      }
    }
  };

  // Update a single question mark for an IA student
  const updateStudentQMark = (testId, studentId, qKey, marks) => {
    setIATests(prev =>
      prev.map(t =>
        t.id !== testId ? t : {
          ...t,
          students: t.students.map(s =>
            s.id !== studentId ? s : { ...s, qMarks: { ...s.qMarks, [qKey]: marks } }
          ),
        }
      )
    );
  };

  // Change the CO assignment for a question group part ('a' or 'b')
  const updateQGroupCOPart = (testId, groupNumber, part, coIdx) => {
    const field = part === 'a' ? 'coIdxA' : 'coIdxB';
    setIATests(prev =>
      prev.map(t =>
        t.id !== testId ? t : {
          ...t,
          qGroups: t.qGroups.map(g =>
            g.number === groupNumber ? { ...g, [field]: parseInt(coIdx) } : g
          ),
        }
      )
    );
  };

  // Change max marks for a question group
  const updateQGroupMaxMarks = (testId, groupNumber, maxMarks) => {
    setIATests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        const qGroups = t.qGroups.map(g =>
          g.number === groupNumber ? { ...g, maxMarks: parseFloat(maxMarks) || 0 } : g
        );
        const totalMax = qGroups.reduce((sum, g) => sum + g.maxMarks, 0);
        return { ...t, qGroups, maxMarks: totalMax };
      })
    );
  };

  // Add a new question group to an IA test
  const addQGroup = (testId) => {
    setIATests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        const nextNum = t.qGroups.length > 0 ? Math.max(...t.qGroups.map(g => g.number)) + 1 : 1;
        const newGroup = { number: nextNum, maxMarks: 10, coIdxA: 0, coIdxB: 0 };
        const qGroups = [...t.qGroups, newGroup];
        return { ...t, qGroups, maxMarks: t.maxMarks + 10 };
      })
    );
  };

  // Remove a question group from an IA test
  const removeQGroup = (testId, groupNumber) => {
    setIATests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        const removed = t.qGroups.find(g => g.number === groupNumber);
        const qGroups = t.qGroups.filter(g => g.number !== groupNumber);
        return { ...t, qGroups, maxMarks: t.maxMarks - (removed?.maxMarks || 0) };
      })
    );
  };

  // Bulk-set students for an IA test (used for CSV/Excel upload)
  const setIAStudents = (testId, students) => {
    setIATests(prev =>
      prev.map(t => (t.id === testId ? { ...t, students } : t))
    );
  };

  // Batch-update CO assignments for all question parts at once (used when uploading Excel with CO mapping row)
  // coMappings: { [qNumber]: { a: coIdx, b: coIdx } }
  const setQGroupCOs = (testId, coMappings) => {
    setIATests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        return {
          ...t,
          qGroups: t.qGroups.map(g => {
            const m = coMappings[g.number];
            if (!m) return g;
            return {
              ...g,
              ...(m.a !== undefined ? { coIdxA: m.a } : {}),
              ...(m.b !== undefined ? { coIdxB: m.b } : {}),
            };
          }),
        };
      })
    );
  };

  // Assignment/SEE mark update (unchanged)
  const updateStudentMark = (testType, testId, studentId, coIdx, marks) => {
    if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t =>
          t.id !== testId ? t : {
            ...t,
            students: t.students.map(s =>
              s.id !== studentId ? s : { ...s, coMarks: { ...s.coMarks, [coIdx]: marks } }
            ),
          }
        )
      );
    } else if (testType === 'see') {
      setSEE(prev => ({
        ...prev,
        students: prev.students.map(s =>
          s.id !== studentId ? s : { ...s, coMarks: { ...s.coMarks, [coIdx]: marks } }
        ),
      }));
    }
  };

  const updateTestMaxMarks = (testType, testId, coIdx, val) => {
    if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t =>
          t.id !== testId ? t : { ...t, coMaxMarks: { ...t.coMaxMarks, [coIdx]: parseFloat(val) || 0 } }
        )
      );
    } else if (testType === 'see') {
      setSEE(prev => ({ ...prev, coMaxMarks: { ...prev.coMaxMarks, [coIdx]: parseFloat(val) || 0 } }));
    }
  };

  const updateTestMaxTotal = (testType, testId, val) => {
    if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t => (t.id !== testId ? t : { ...t, maxMarks: parseFloat(val) || 0 }))
      );
    } else if (testType === 'see') {
      setSEE(prev => ({ ...prev, maxMarks: parseFloat(val) || 0 }));
    }
  };

  const addIATest = () => {
    const id = iaTests.length > 0 ? Math.max(...iaTests.map(t => t.id)) + 1 : 1;
    setIATests(prev => [...prev, createIATest(id, `IA Test ${id}`, config.numCOs)]);
  };

  const removeIATest = (id) => {
    setIATests(prev => prev.filter(t => t.id !== id));
  };

  const addAssignment = () => {
    const id = assignments.length > 0 ? Math.max(...assignments.map(t => t.id)) + 1 : 1;
    setAssignments(prev => [...prev, createAssignment(id, `Assignment ${id}`, config.numCOs)]);
  };

  const removeAssignment = (id) => {
    setAssignments(prev => prev.filter(t => t.id !== id));
  };

  const updateSurveyQuestion = (coIdx, qIdx, field, value) => {
    setSurvey(prev =>
      prev.map((co, ci) =>
        ci !== coIdx ? co : {
          ...co,
          questions: co.questions.map((q, qi) => qi !== qIdx ? q : { ...q, [field]: value }),
        }
      )
    );
  };

  const updateSurveyRating = (coIdx, qIdx, scaleIdx, count) => {
    setSurvey(prev =>
      prev.map((co, ci) =>
        ci !== coIdx ? co : {
          ...co,
          questions: co.questions.map((q, qi) =>
            qi !== qIdx ? q : {
              ...q,
              ratings: q.ratings.map((r, ri) =>
                ri === scaleIdx ? { ...r, count: parseInt(count) || 0 } : r
              ),
            }
          ),
        }
      )
    );
  };

  const addSurveyQuestion = (coIdx) => {
    setSurvey(prev =>
      prev.map((co, ci) =>
        ci !== coIdx ? co : { ...co, questions: [...co.questions, createSurveyQuestion()] }
      )
    );
  };

  const removeSurveyQuestion = (coIdx, qIdx) => {
    setSurvey(prev =>
      prev.map((co, ci) =>
        ci !== coIdx ? co : { ...co, questions: co.questions.filter((_, qi) => qi !== qIdx) }
      )
    );
  };

  const updateSurveyRespondents = (coIdx, count) => {
    setSurvey(prev =>
      prev.map((co, ci) => (ci !== coIdx ? co : { ...co, totalRespondents: parseInt(count) || 0 }))
    );
  };

  return (
    <AppContext.Provider
      value={{
        config, updateConfig,
        cos, updateCOLabel,
        iaTests, setIATests, addIATest, removeIATest,
        updateStudentQMark, updateQGroupCOPart, updateQGroupMaxMarks,
        addQGroup, removeQGroup, setIAStudents, setQGroupCOs, generateStudents,
        assignments, addAssignment, removeAssignment,
        see, survey,
        updateStudentMark, updateTestMaxMarks, updateTestMaxTotal,
        updateSurveyQuestion, updateSurveyRating,
        addSurveyQuestion, removeSurveyQuestion, updateSurveyRespondents,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
