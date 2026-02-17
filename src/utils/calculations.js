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
  return qGroups
    .filter(g => g.coIdx === coIdx)
    .reduce((sum, g) => {
      const a = parseFloat(student.qMarks?.[`${g.number}a`]) || 0;
      const b = parseFloat(student.qMarks?.[`${g.number}b`]) || 0;
      return sum + a + b;
    }, 0);
}

/**
 * Get the max marks for a CO from question groups.
 * = sum of maxMarks for all question groups mapped to coIdx.
 */
export function getCOMaxFromQGroups(qGroups, coIdx) {
  return qGroups
    .filter(g => g.coIdx === coIdx)
    .reduce((sum, g) => sum + g.maxMarks, 0);
}

/**
 * For multiple IA tests: average the attainment across tests that include each CO
 */
export function calcAverageIAAttainment(iaTests, coIdx) {
  const valid = iaTests.filter(t => {
    if (!t.students || t.students.length === 0) return false;
    if (t.qGroups) return t.qGroups.some(g => g.coIdx === coIdx);
    const selectedCOs = t.selectedCOs ?? [];
    return selectedCOs.includes(coIdx);
  });
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, test) => {
    if (test.qGroups) {
      const coMax = getCOMaxFromQGroups(test.qGroups, coIdx);
      if (coMax === 0) return acc;
      const coStudents = test.students.map(s => ({
        marks: getCOMarksForStudent(s, test.qGroups, coIdx),
      }));
      return acc + calcAttainmentPct(coStudents, coMax);
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
