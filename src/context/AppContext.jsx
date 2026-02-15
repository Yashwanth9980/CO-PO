import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

const DEFAULT_COS = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

function createStudent(id, name) {
  return { id, name: name || `Student ${id}`, coMarks: {} };
}

function createIATest(id, label, numCOs) {
  return {
    id,
    label: label || `IA Test ${id}`,
    maxMarks: 30,
    coMaxMarks: Object.fromEntries(Array.from({ length: numCOs }, (_, i) => [i, 30])),
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
  // Course configuration
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

  // IA Tests (supports multiple)
  const [iaTests, setIATests] = useState([createIATest(1, 'IA Test 1', 5)]);

  // Assignments
  const [assignments, setAssignments] = useState([createAssignment(1, 'Assignment 1', 5)]);

  // SEE
  const [see, setSEE] = useState({
    maxMarks: 100,
    coMaxMarks: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i, 100])),
    students: [],
  });

  // Indirect Survey
  const [survey, setSurvey] = useState(
    Array.from({ length: 5 }, (_, coIdx) => ({
      coLabel: `CO${coIdx + 1}`,
      questions: Array.from({ length: 5 }, createSurveyQuestion),
      totalRespondents: 44,
    }))
  );

  // Helpers
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

  // Student management for a test
  const generateStudents = (testType, testId, count) => {
    const students = Array.from({ length: count }, (_, i) =>
      createStudent(i + 1, `Student ${i + 1}`)
    );
    if (testType === 'ia') {
      setIATests(prev => prev.map(t => (t.id === testId ? { ...t, students } : t)));
    } else if (testType === 'assignment') {
      setAssignments(prev => prev.map(t => (t.id === testId ? { ...t, students } : t)));
    } else if (testType === 'see') {
      setSEE(prev => ({ ...prev, students }));
    }
  };

  const updateStudentMark = (testType, testId, studentId, coIdx, marks) => {
    if (testType === 'ia') {
      setIATests(prev =>
        prev.map(t =>
          t.id === testId
            ? {
                ...t,
                students: t.students.map(s =>
                  s.id === studentId
                    ? { ...s, coMarks: { ...s.coMarks, [coIdx]: marks } }
                    : s
                ),
              }
            : t
        )
      );
    } else if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t =>
          t.id === testId
            ? {
                ...t,
                students: t.students.map(s =>
                  s.id === studentId
                    ? { ...s, coMarks: { ...s.coMarks, [coIdx]: marks } }
                    : s
                ),
              }
            : t
        )
      );
    } else if (testType === 'see') {
      setSEE(prev => ({
        ...prev,
        students: prev.students.map(s =>
          s.id === studentId
            ? { ...s, coMarks: { ...s.coMarks, [coIdx]: marks } }
            : s
        ),
      }));
    }
  };

  const updateTestMaxMarks = (testType, testId, coIdx, val) => {
    if (testType === 'ia') {
      setIATests(prev =>
        prev.map(t =>
          t.id === testId
            ? { ...t, coMaxMarks: { ...t.coMaxMarks, [coIdx]: parseFloat(val) || 0 } }
            : t
        )
      );
    } else if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t =>
          t.id === testId
            ? { ...t, coMaxMarks: { ...t.coMaxMarks, [coIdx]: parseFloat(val) || 0 } }
            : t
        )
      );
    } else if (testType === 'see') {
      setSEE(prev => ({ ...prev, coMaxMarks: { ...prev.coMaxMarks, [coIdx]: parseFloat(val) || 0 } }));
    }
  };

  const updateTestMaxTotal = (testType, testId, val) => {
    if (testType === 'ia') {
      setIATests(prev =>
        prev.map(t => (t.id === testId ? { ...t, maxMarks: parseFloat(val) || 0 } : t))
      );
    } else if (testType === 'assignment') {
      setAssignments(prev =>
        prev.map(t => (t.id === testId ? { ...t, maxMarks: parseFloat(val) || 0 } : t))
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
        ci !== coIdx
          ? co
          : {
              ...co,
              questions: co.questions.map((q, qi) =>
                qi !== qIdx ? q : { ...q, [field]: value }
              ),
            }
      )
    );
  };

  const updateSurveyRating = (coIdx, qIdx, scaleIdx, count) => {
    setSurvey(prev =>
      prev.map((co, ci) =>
        ci !== coIdx
          ? co
          : {
              ...co,
              questions: co.questions.map((q, qi) =>
                qi !== qIdx
                  ? q
                  : {
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
        config,
        updateConfig,
        cos,
        updateCOLabel,
        iaTests,
        setIATests,
        addIATest,
        removeIATest,
        assignments,
        addAssignment,
        removeAssignment,
        see,
        survey,
        generateStudents,
        updateStudentMark,
        updateTestMaxMarks,
        updateTestMaxTotal,
        updateSurveyQuestion,
        updateSurveyRating,
        addSurveyQuestion,
        removeSurveyQuestion,
        updateSurveyRespondents,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
