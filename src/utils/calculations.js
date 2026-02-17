/**
 * CO Attainment Calculation Utilities
 * Based on the standard procedure for CO Attainment calculation
 */

/**
 * Determine level for a student based on percentage marks scored
 * Level 3: >= 60%
 * Level 2: >= 30% and < 60%
 * Level 1: >= 10% and < 30%
 * Level 0: < 10%
 */
export function getLevel(marksObtained, maxMarks) {
  if (maxMarks === 0) return 0;
  const pct = (marksObtained / maxMarks) * 100;
  if (pct >= 60) return 3;
  if (pct >= 30) return 2;
  if (pct >= 10) return 1;
  return 0;
}

/**
 * Returns Y/N based on level (Y = level 3, attainment target met)
 */
export function getYN(level) {
  return level === 3 ? 'Y' : 'N';
}

/**
 * Calculate attainment percentage for a CO from an assessment
 * = (number of students with Y / total students) * 100
 */
export function calcAttainmentPct(students, maxMarks) {
  if (!students || students.length === 0) return 0;
  const validStudents = students.filter(s => s.marks !== '' && s.marks !== null && s.marks !== undefined);
  if (validStudents.length === 0) return 0;
  const yCount = validStudents.filter(s => getLevel(parseFloat(s.marks), maxMarks) === 3).length;
  return (yCount / validStudents.length) * 100;
}

/**
 * Calculate CIE attainment for a CO
 * CIE = 80% IA + 20% Assignment
 */
export function calcCIEAttainment(iaAttainment, assignmentAttainment) {
  return 0.8 * iaAttainment + 0.2 * assignmentAttainment;
}

/**
 * Calculate Direct CO Attainment
 * Direct = 50% CIE + 50% SEE
 */
export function calcDirectAttainment(cieAttainment, seeAttainment) {
  return 0.5 * cieAttainment + 0.5 * seeAttainment;
}

/**
 * Calculate Total CO Attainment
 * Total = 90% Direct + 10% Indirect
 */
export function calcTotalAttainment(directAttainment, indirectAttainmentPct) {
  return 0.9 * directAttainment + 0.1 * indirectAttainmentPct;
}

/**
 * Calculate Indirect Attainment from survey data
 * For each CO: average of question averages / max scale (5)
 * Grand average across all COs
 */
export function calcIndirectAttainment(surveyData) {
  // surveyData: array of COs, each with questions, each question with ratings count per scale
  if (!surveyData || surveyData.length === 0) return { coAverages: [], grandAverage: 0, attainmentPct: 0 };

  const coAverages = surveyData.map(co => {
    if (!co.questions || co.questions.length === 0) return 0;
    const questionAvgs = co.questions.map(q => {
      const totalResponses = q.ratings.reduce((sum, r) => sum + r.count, 0);
      if (totalResponses === 0) return 0;
      const weightedSum = q.ratings.reduce((sum, r, idx) => sum + r.count * (idx + 1), 0);
      return weightedSum / totalResponses;
    });
    return questionAvgs.reduce((a, b) => a + b, 0) / questionAvgs.length;
  });

  const grandAverage = coAverages.reduce((a, b) => a + b, 0) / coAverages.length;
  const attainmentPct = (grandAverage / 5) * 100;

  return { coAverages, grandAverage, attainmentPct };
}

/**
 * Get a student's total marks for a given CO from question-based IA test.
 * Sums all question part marks (a + b) for question groups mapped to coIdx.
 * In either/or exams, only one part will be non-zero.
 */
export function getCOMarksForStudent(student, qGroups, coIdx) {
  return qGroups.reduce((sum, g) => {
    if (g.coIdxA === coIdx) sum += parseFloat(student.qMarks?.[`${g.number}a`]) || 0;
    if (g.coIdxB === coIdx) sum += parseFloat(student.qMarks?.[`${g.number}b`]) || 0;
    return sum;
  }, 0);
}

/**
 * Get the max marks for a CO from question groups.
 * When both parts (a/b) of a question map to the same CO, count only once
 * because it is an either/or exam — students answer only one part.
 */
export function getCOMaxFromQGroups(qGroups, coIdx) {
  return qGroups.reduce((sum, g) => {
    if (g.coIdxA === coIdx && g.coIdxB === coIdx) {
      sum += g.maxMarks; // both parts same CO → count once
    } else {
      if (g.coIdxA === coIdx) sum += g.maxMarks;
      if (g.coIdxB === coIdx) sum += g.maxMarks;
    }
    return sum;
  }, 0);
}

/**
 * Get a student's marks AND their effective max marks for a given CO.
 * The effective max is based only on the questions the student actually attempted
 * (i.e. questions where at least one part has a non-zero mark). This is needed
 * for exams where students choose a subset of questions and different parts of the
 * same question can map to different COs — using a global max would inflate the
 * denominator and make CO2/CO3 attainment appear as 0%.
 */
export function getCOMarksAndMaxForStudent(student, qGroups, coIdx) {
  let marks = 0;
  let max = 0;
  for (const g of qGroups) {
    const qa = parseFloat(student.qMarks?.[`${g.number}a`]) || 0;
    const qb = parseFloat(student.qMarks?.[`${g.number}b`]) || 0;
    if (qa === 0 && qb === 0) continue; // student did not attempt this question
    if (g.coIdxA === coIdx) {
      marks += qa;
      max += g.maxMarks;
    }
    if (g.coIdxB === coIdx) {
      marks += qb;
      max += g.maxMarks;
    }
  }
  return { marks, max };
}

/**
 * Calculate attainment percentage using per-student effective max marks.
 * studentData: array of { marks, max } objects (one per student).
 * Only students who attempted at least one question mapped to the CO (max > 0)
 * are included in the denominator — students who chose questions not covering
 * this CO are excluded rather than counted as non-attaining.
 */
export function calcIAAttainmentPct(studentData) {
  const valid = studentData.filter(s => s.max > 0);
  if (valid.length === 0) return 0;
  const yCount = valid.filter(s => getLevel(s.marks, s.max) === 3).length;
  return (yCount / valid.length) * 100;
}

/**
 * For multiple IA tests: average the attainment across tests that include each CO
 */
export function calcAverageIAAttainment(iaTests, coIdx) {
  const valid = iaTests.filter(t => {
    if (!t.students || t.students.length === 0) return false;
    if (t.qGroups) return t.qGroups.some(g => g.coIdxA === coIdx || g.coIdxB === coIdx);
    const selectedCOs = t.selectedCOs ?? [];
    return selectedCOs.includes(coIdx);
  });
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, test) => {
    if (test.qGroups) {
      const studentData = test.students.map(s => getCOMarksAndMaxForStudent(s, test.qGroups, coIdx));
      return acc + calcIAAttainmentPct(studentData);
    }
    // Legacy format
    const coStudents = test.students.map(s => ({ marks: s.coMarks?.[coIdx] ?? '' }));
    return acc + calcAttainmentPct(coStudents, test.coMaxMarks?.[coIdx] ?? test.maxMarks);
  }, 0);
  return sum / valid.length;
}

export function formatPct(val) {
  return isNaN(val) ? '0.00' : val.toFixed(2);
}

export function getProgressColor(pct) {
  if (pct >= 60) return 'fill-green';
  if (pct >= 40) return 'fill-yellow';
  return 'fill-red';
}
