# CO-PO Attainment Calculator — Faculty User Manual

---

## Table of Contents

1. [Overview](#1-overview)
2. [Application Structure](#2-application-structure)
3. [Step 1 — Configuration](#3-step-1--configuration)
4. [Step 2 — IA Tests (Internal Assessment)](#4-step-2--ia-tests-internal-assessment)
5. [Step 3 — Assignments](#5-step-3--assignments)
6. [Step 4 — SEE (Semester End Exam)](#6-step-4--see-semester-end-exam)
7. [Step 5 — Indirect Assessment (Student Survey)](#7-step-5--indirect-assessment-student-survey)
8. [Step 6 — CO Attainment Summary](#8-step-6--co-attainment-summary)
9. [Calculation Reference (All Formulas)](#9-calculation-reference-all-formulas)
10. [File Upload Formats](#10-file-upload-formats)
11. [Quick-Start Checklist](#11-quick-start-checklist)
12. [Frequently Asked Questions](#12-frequently-asked-questions)

---

## 1. Overview

This application calculates **Course Outcome (CO) Attainment** for a course by combining:

| Component | What it measures | Weight in Direct |
|-----------|-----------------|-----------------|
| IA Tests (Internal Assessment) | Question-wise marks per student | 80% of CIE |
| Assignments | CO-wise marks per student | 20% of CIE |
| SEE (Semester End Exam) | Total marks per student | 50% of Direct |
| Student Survey | Student self-assessment on 1–5 scale | 10% of Total (Indirect) |

**Final formula at a glance:**

```
CIE Attainment     = 80% × IA Attainment  +  20% × Assignment Attainment
Direct Attainment  = 50% × CIE Attainment +  50% × SEE Attainment
Total CO Attainment = 90% × Direct Attainment + 10% × Indirect Attainment
```

**Attainment Target:**
A CO is considered **Attained** when the percentage of students scoring ≥ 60% marks (Level 3) exceeds the target set in Configuration (default: > 50% of students).

---

## 2. Application Structure

The application has **6 tabs** to be filled in order:

```
[Configuration] → [IA Tests] → [Assignments] → [SEE] → [Indirect Assessment] → [CO Attainment Summary]
```

Always start from **Configuration** before entering any marks data.

---

## 3. Step 1 — Configuration

**Purpose:** Set up the course details, number of COs, student count, and attainment targets before entering any marks.

### 3.1 What to Fill

| Field | Description | Example |
|-------|-------------|---------|
| Course Name | Full name of the course | Electronics Engineering |
| Course Code | University course code | EC301 |
| Semester | Semester number/name | Semester 3 |
| Academic Year | e.g., 2024-25 | 2024-25 |
| Number of COs | How many Course Outcomes (2–8) | 5 |
| Total Students | Number of students in the class | 44 |
| Target Level | Minimum level a student must reach (usually Level 3) | Level 3 (≥ 60%) |
| Target % of Students | Minimum % of class that must reach the target level | 50 |
| CO Labels | Custom names for each CO | CO1, CO2, … or rename as needed |

### 3.2 What Happens Automatically

- When you change **Number of COs**, all sections (IA, Assignment, SEE, Survey, Summary) automatically resize to match.
- CO labels entered here appear in every table and report throughout the application.

### 3.3 Level Classification (Reference)

Every assessment uses the same rule to assign a Level to each student:

| % Marks Scored | Level | Y / N | Meaning |
|---------------|-------|-------|---------|
| ≥ 60% | **3** | **Y** | CO Attainment Target Met |
| ≥ 30% and < 60% | **2** | N | Not attained |
| ≥ 10% and < 30% | **1** | N | Not attained |
| < 10% | **0** | N | Not attained |

Only **Level 3 (Y)** counts toward CO attainment.

---

## 4. Step 2 — IA Tests (Internal Assessment)

**Purpose:** Enter marks for Internal Assessment tests. Each IA test uses a question-and-part format where each question has Part a and Part b, and each part can be mapped to a different CO.

> Students answer **either** Part a **or** Part b for each question (either/or format).

### 4.1 Managing IA Tests

- Click **+ Add Test** to create additional IA tests (IA Test 1, IA Test 2, etc.).
- Click **Remove [Test Name]** to delete a test.

### 4.2 Configuring Question–CO Mapping

For each IA test, you will see a set of question groups (Q1, Q2, … Q6 by default).

**For each question:**
1. Set **Max Marks** (marks for one part, e.g., 10)
2. Select which **CO Part a is mapped to** (e.g., CO1)
3. Select which **CO Part b is mapped to** (e.g., CO2)

> **Tip:** If both Part a and Part b map to the same CO, students who answer either part contribute marks to that CO.

Click **+ Add Question** to add more question groups. Click **✕** next to a question to remove it.

### 4.3 Entering Student Marks

**Option A — Manual Entry:**
1. Click **Load [N] Students (Manual Entry)**.
2. The table fills with student rows. Type each student's name.
3. Enter marks for each question part (Q1a, Q1b, Q2a, Q2b, …) in the table.
4. Leave a part **blank or 0** if the student did not attempt it.

**Option B — Upload CSV/Excel:**
1. Click **Download Sample File** to get the template.
2. Fill in student names, USNs, and marks in the template.
3. Click **Upload CSV / Excel** and select your filled file.

**CSV/Excel format:**
```
Sl.No. | Student Name | USN | Q1a | Q1b | Q2a | Q2b | Q3a | Q3b | ...
       | CO Mapping → |     | CO1 | CO2 | CO1 | CO3 | CO2 | CO2 | ...   ← optional row
1      | Ravi Kumar   | 1DS | 8   | 0   | 7   | 0   | 0   | 9   | ...
2      | Priya M      | 1DS | 0   | 6   | 8   | 0   | 5   | 0   | ...
```

> The **CO Mapping row** (row 2) is optional. If included, it auto-sets the CO mapping for each question part.

### 4.4 How IA Attainment Is Calculated

**Step 1 — Per student, per CO: calculate marks and effective max**

For each student and each CO, the system:
- Adds up marks from all question parts mapped to that CO.
- Adds up max marks only for questions **the student actually attempted** (at least one part is non-zero).

> **Why effective max?** In either/or exams, students choose which part to answer. If a student picks Part a (mapped to CO1) and skips Part b (mapped to CO2), CO2 should not count against them. Only questions the student attempted are included in the denominator.

```
For Student X and CO1:
  marks = Q1a_marks (if Q1a→CO1) + Q2a_marks (if Q2a→CO1) + ...
  max   = max_marks of questions attempted that map to CO1
  pct   = (marks / max) × 100
```

**Step 2 — Determine Level and Y/N**

```
pct ≥ 60%  →  Level 3  →  Y
pct ≥ 30%  →  Level 2  →  N
pct ≥ 10%  →  Level 1  →  N
pct < 10%  →  Level 0  →  N
```

**Step 3 — CO Attainment %**

```
IA CO Attainment (%) = (Number of students with Y for this CO)
                       ─────────────────────────────────────── × 100
                       (Total students who attempted ≥ 1 question for this CO)
```

**Step 4 — Average across multiple IA tests**

If you have more than one IA test, the system averages their attainment values:

```
IA Attainment (CO1) = [IA Test 1 CO1 Attainment + IA Test 2 CO1 Attainment + ...] / Number of tests
```

### 4.5 What the Table Shows

| Column | Description |
|--------|-------------|
| Sl. No. | Student serial number |
| Student Name | Editable name field |
| USN | University Seat Number |
| Q1a, Q1b, … | Marks for each question part |
| Total | Sum of all marks entered for the student |
| CO-wise summary | Marks / max, Level badge, Y/N badge per CO |
| CO Attainment (%) row | % of students with Y for each CO |

---

## 5. Step 3 — Assignments

**Purpose:** Record assignment/activity marks per CO per student. Assignments contribute **20%** to CIE Attainment.

### 5.1 Managing Assignments

- Click **+ Add Assignment** to add more assignments.
- Click **Remove** to delete one.
- Click **Import Students to All Assignments** to copy the student roster from the first IA test into all assignments at once.

### 5.2 Configuring Max Marks

- Set **Total Max Marks** (default: 20) for the whole assignment.
- In the **Maximum Marks per CO** section, set the max marks for each CO individually.

### 5.3 Entering Student Marks

**Option A — Manual Entry:** Click **Load [N] Students (Manual)** and type marks per student per CO.

**Option B — Import from IA:** Click **Import from [IA Test Label]** to load the student list from the first IA test.

**Option C — Upload CSV/Excel:** Click **Download Sample** for the template, fill it, then **Upload CSV / Excel**.

**CSV/Excel format:**
```
Sl.No. | Student Name | USN | CO1 | CO2 | CO3 | CO4 | CO5
1      | Ravi Kumar   | 1DS | 15  | 18  | 14  | 16  | 17
2      | Priya M      | 1DS | 12  | 16  | 15  | 14  | 18
```

### 5.4 How Assignment Attainment Is Calculated

For each CO separately:

```
% marks for Student X in CO1 = (Marks in CO1 / Max Marks for CO1) × 100
Level = determined by % marks threshold (≥60% → L3 → Y)

CO1 Attainment (%) = (Students with Y in CO1 / Total students with marks in CO1) × 100
```

When there are multiple assignments, the system averages:
```
Assignment Attainment (CO1) = Average of CO1 attainment across all assignments
```

### 5.5 What the Table Shows

| Column | Description |
|--------|-------------|
| Marks columns | One input per CO per student |
| % Marks columns | Percentage calculated from marks/max |
| Level columns | Level 0–3 badge per CO |
| Y/N columns | Y if Level 3, N otherwise |
| CO Attainment row | % of students with Y per CO |

---

## 6. Step 4 — SEE (Semester End Exam)

**Purpose:** Record the university (VTU) Semester End Exam marks for each student. Since VTU SEE does not provide CO-wise breakup, **one total marks column is used** and the **same attainment percentage applies to all COs**. SEE contributes **50%** to Direct Attainment.

### 6.1 Configuring Max Marks

Set **Total Max Marks** (default: 100).

### 6.2 Entering Student Marks

**Option A — Manual Entry:** Click **Load [N] Students (Manual)** and type each student's total SEE marks.

**Option B — Import from IA:** Click **Import from [IA Test Label]** to load the student names.

**Option C — Upload CSV/Excel:** Click **Download Sample** for the template, fill it, then **Upload CSV / Excel**.

**CSV/Excel format:**
```
Sl.No. | Student Name | USN | Marks Obtained
1      | Ravi Kumar   | 1DS | 72
2      | Priya M      | 1DS | 45
3      | Arjun S      | 1DS | 58
```

### 6.3 How SEE Attainment Is Calculated

```
% marks for Student X = (Marks Obtained / Max Marks) × 100

Level:
  ≥ 60% → Level 3 → Y
  ≥ 30% → Level 2 → N
  ≥ 10% → Level 1 → N
  < 10%  → Level 0 → N

SEE CO Attainment (%) = (Students with Y / Total students with marks entered) × 100

This same % is applied to ALL COs (CO1, CO2, CO3, …)
```

### 6.4 What the Table Shows

| Column | Description |
|--------|-------------|
| Marks Obtained | Single input for total SEE marks |
| % Marks | Percentage of max marks |
| Level | Level 0–3 badge |
| Y / N | Y if Level 3 |
| CO Attainment (%) row | Single value applied to all COs |

---

## 7. Step 5 — Indirect Assessment (Student Survey)

**Purpose:** Capture student self-assessment via a survey. Students rate their confidence in achieving each CO on a **1–5 scale**. Indirect Attainment contributes **10%** to Total CO Attainment.

### 7.1 Survey Scale

| Scale | Meaning |
|-------|---------|
| 1 | Not Confident at all |
| 2 | Slightly Confident |
| 3 | Moderately Confident |
| 4 | Confident |
| 5 | Very Confident |

### 7.2 Entering Survey Data

**Option A — Manual Entry:**

For each CO card:
1. Set **Total Respondents** (number of students who responded).
2. For each survey question:
   - Type the **question text** (or leave blank).
   - Enter the **count of students** who responded at each scale (1, 2, 3, 4, 5).
   - The Total and Average are computed automatically.
3. Click **+ Add Question** to add more questions for a CO.
4. Click **✕** to remove a question (at least 1 question per CO is required).

**Option B — Upload CSV/Excel:**

Click **Download Sample** to get the template, fill it, then click **Upload CSV / Excel**.

**CSV/Excel format (one row = one question for one CO):**
```
CO  | Question                                  | Total Respondents | Scale 1 | Scale 2 | Scale 3 | Scale 4 | Scale 5
CO1 | I can apply concepts from CO1 in practice | 44                | 2       | 5       | 15      | 14      | 8
CO1 | I understand the objectives of CO1        | 44                | 1       | 4       | 12      | 18      | 9
CO2 | I can explain CO2 concepts clearly        | 44                | 3       | 6       | 18      | 10      | 7
```

> The upload merges data by CO label. COs not present in the file are left unchanged.

### 7.3 How Indirect Attainment Is Calculated

**Step 1 — Question average (weighted)**

```
Question Average = (1×count₁ + 2×count₂ + 3×count₃ + 4×count₄ + 5×count₅)
                  ──────────────────────────────────────────────────────────────
                  (count₁ + count₂ + count₃ + count₄ + count₅)
```

*Example:* 44 respondents: Scale 1=2, Scale 2=5, Scale 3=15, Scale 4=14, Scale 5=8
```
Weighted sum = 1×2 + 2×5 + 3×15 + 4×14 + 5×8 = 2+10+45+56+40 = 153
Total        = 2+5+15+14+8 = 44
Average      = 153 / 44 = 3.48
```

**Step 2 — CO average**

```
CO1 Average = (Q1 Average + Q2 Average + … + Qn Average) / n
```

**Step 3 — Grand average**

```
Grand Average = (CO1 Average + CO2 Average + … + COn Average) / Number of COs
```

**Step 4 — Indirect Attainment %**

```
Indirect Attainment (%) = (Grand Average / 5) × 100
```

*Example:* Grand Average = 3.60 → Indirect Attainment = (3.60/5) × 100 = **72%**

---

## 8. Step 6 — CO Attainment Summary

**Purpose:** View the complete CO Attainment report with all calculations, charts, and the final attainment decision (Y/N) for each CO. Export to Excel or print as PDF.

### 8.1 What the Summary Shows

**Summary Cards** (top row):
- One card per CO showing Total Attainment %
- Color coding: 🟢 Green ≥ 60% | 🟡 Yellow ≥ 40% | 🔴 Red < 40%
- Final card: Overall average across all COs

**Charts:**
- **Bar Chart 1 — Total CO Attainment:** Shows final attainment % per CO with a 60% target line.
- **Bar Chart 2 — CO Attainment Breakdown:** Grouped bars for IA, Assignment, CIE, SEE, Direct, and Total per CO.

**Detailed Table:**

| CO | IA (%) | Assignment (%) | CIE (%) | SEE (%) | Direct (%) | Indirect (%) | Total (%) | Attained? |
|----|--------|---------------|---------|---------|-----------|-------------|----------|-----------|
| CO1 | 68.18 | 75.00 | 69.55 | 72.73 | 71.14 | 72.00 | 71.43 | Y |
| … | … | … | … | … | … | … | … | … |
| Avg | … | … | … | … | … | … | … | — |

**Formula Summary** (at the bottom of the page):
Shows all formulas used, the indirect attainment calculation, and the attainment target.

### 8.2 Attainment Decision

```
A CO is "Attained" (Y) if: Total CO Attainment ≥ 60%
A CO is "Not Attained" (N) if: Total CO Attainment < 60%
```

> Note: The 60% threshold here is the standard minimum. Your institution's actual attainment target (set in Configuration) is shown in the formula summary section.

### 8.3 Downloading the Report

**Excel Export:**
Click **Download Excel (Course File)** to download a `.xlsx` file containing:
- Course header (name, code, semester, year, date)
- Full attainment table
- Average row
- Formula reference

**PDF/Print:**
Click **Print / Save as PDF** to open the browser print dialog.
- Select "Save as PDF" in the destination.
- The print view includes the course header and all tables/charts.

---

## 9. Calculation Reference (All Formulas)

### 9.1 Level Classification

```
% marks = (Marks Obtained / Max Marks) × 100

Level 3 (Y) : % marks ≥ 60%
Level 2 (N) : 30% ≤ % marks < 60%
Level 1 (N) : 10% ≤ % marks < 30%
Level 0 (N) : % marks < 10%
```

### 9.2 IA Attainment (per CO, per test)

```
Effective marks  = sum of marks from questions mapped to CO (student attempted)
Effective max    = sum of max marks from questions mapped to CO (student attempted)
Level            = getLevel(effective marks, effective max)

CO Attainment (%) = (Count of students at Level 3 for CO)
                    ──────────────────────────────────────── × 100
                    (Count of students who attempted ≥1 question for CO)

If multiple IA tests:
  IA Attainment (CO) = Average of attainments across all IA tests covering that CO
```

### 9.3 Assignment Attainment (per CO)

```
% marks (Student X, CO1) = (Marks in CO1 / Max Marks for CO1) × 100

CO Attainment (%) = (Students at Level 3 / Students with marks entered) × 100

If multiple assignments:
  Assignment Attainment (CO) = Average attainment across all assignments
```

### 9.4 CIE Attainment

```
CIE Attainment (CO) = 0.80 × IA Attainment (CO)  +  0.20 × Assignment Attainment (CO)
```

### 9.5 SEE Attainment

```
% marks (Student X) = (Total Marks / Max Marks) × 100

SEE Attainment (%) = (Students at Level 3 / Students with marks entered) × 100

The same SEE Attainment % is used for ALL COs.
```

### 9.6 Direct Attainment

```
Direct Attainment (CO) = 0.50 × CIE Attainment (CO)  +  0.50 × SEE Attainment
```

### 9.7 Indirect Attainment (from Survey)

```
Question Average = Σ(scale_value × response_count) / Σ(response_count)
CO Average       = Σ(Question Averages) / Number of Questions
Grand Average    = Σ(CO Averages) / Number of COs
Indirect (%)     = (Grand Average / 5) × 100

The same Indirect Attainment % is used for ALL COs.
```

### 9.8 Total CO Attainment

```
Total CO Attainment (CO) = 0.90 × Direct Attainment (CO)  +  0.10 × Indirect Attainment
```

### 9.9 Full Chain Example

Suppose for **CO1**:

| Source | Value |
|--------|-------|
| IA Test 1 CO1 Attainment | 65% |
| IA Test 2 CO1 Attainment | 70% |
| IA Attainment (average) | (65+70)/2 = **67.5%** |
| Assignment CO1 Attainment | **75%** |
| CIE Attainment | 0.8×67.5 + 0.2×75 = 54 + 15 = **69%** |
| SEE Attainment (all COs) | **72%** |
| Direct Attainment | 0.5×69 + 0.5×72 = 34.5+36 = **70.5%** |
| Indirect Attainment | **(Grand Survey Avg / 5) × 100 = 68%** |
| **Total CO1 Attainment** | 0.9×70.5 + 0.1×68 = 63.45 + 6.8 = **70.25%** |
| **Attained?** | **Yes (≥ 60%)** |

---

## 10. File Upload Formats

### 10.1 IA Test — CSV/Excel

| Column | Required | Description |
|--------|----------|-------------|
| Sl.No. | Optional | Row number |
| Student Name | ✅ | Student full name |
| USN | Recommended | University Seat Number |
| Q1a, Q1b, Q2a, Q2b, … | ✅ | Marks for each question part |

**Optional Row 2 (CO Mapping):**
Place the CO label (e.g., CO1, CO2) under each question column to auto-assign the CO mapping.

```
| Sl.No. | Student Name | USN    | Q1a | Q1b | Q2a | Q2b |
|        | CO Mapping → |        | CO1 | CO2 | CO1 | CO3 |  ← optional
| 1      | Ravi Kumar   | 1DS001 | 8   | 0   | 7   | 0   |
| 2      | Priya M      | 1DS002 | 0   | 6   | 8   | 0   |
```

### 10.2 Assignment — CSV/Excel

| Column | Required | Description |
|--------|----------|-------------|
| Sl.No. | Optional | Row number |
| Student Name | ✅ | Student full name |
| USN | Recommended | University Seat Number |
| CO1, CO2, … | ✅ | Marks per CO (column header must match CO label) |

```
| Sl.No. | Student Name | USN    | CO1 | CO2 | CO3 | CO4 | CO5 |
| 1      | Ravi Kumar   | 1DS001 | 15  | 18  | 14  | 16  | 17  |
| 2      | Priya M      | 1DS002 | 12  | 16  | 15  | 14  | 18  |
```

### 10.3 SEE — CSV/Excel

| Column | Required | Description |
|--------|----------|-------------|
| Sl.No. | Optional | Row number |
| Student Name | ✅ | Student full name |
| USN | Recommended | University Seat Number |
| Marks Obtained | ✅ | Total SEE marks (one column only) |

```
| Sl.No. | Student Name | USN    | Marks Obtained |
| 1      | Ravi Kumar   | 1DS001 | 72             |
| 2      | Priya M      | 1DS002 | 45             |
```

### 10.4 Indirect Assessment (Survey) — CSV/Excel

| Column | Required | Description |
|--------|----------|-------------|
| CO | ✅ | CO label exactly as configured (e.g., CO1) |
| Question | ✅ | Survey question text |
| Total Respondents | Optional | Number of students who responded |
| Scale 1 | ✅ | Count of students who rated 1 |
| Scale 2 | ✅ | Count of students who rated 2 |
| Scale 3 | ✅ | Count of students who rated 3 |
| Scale 4 | ✅ | Count of students who rated 4 |
| Scale 5 | ✅ | Count of students who rated 5 |

```
| CO  | Question                  | Total Respondents | Scale 1 | Scale 2 | Scale 3 | Scale 4 | Scale 5 |
| CO1 | I can apply CO1 concepts  | 44                | 2       | 5       | 15      | 14      | 8       |
| CO1 | I understand CO1 goals    | 44                | 1       | 4       | 12      | 18      | 9       |
| CO2 | I can explain CO2 clearly | 44                | 3       | 6       | 18      | 10      | 7       |
```

> **Tip:** Always use **Download Sample** first — it generates a correctly structured template based on your current configuration.

---

## 11. Quick-Start Checklist

Use this checklist each semester:

- [ ] **Configuration** — Enter course name, code, semester, academic year, number of COs, student count, CO labels.
- [ ] **IA Tests** — Configure question-CO mapping. Enter marks manually or upload CSV/Excel for each IA test.
- [ ] **Assignments** — Set max marks per CO. Enter marks manually or upload CSV/Excel for each assignment.
- [ ] **SEE** — Set total max marks. Enter total marks per student or upload CSV/Excel.
- [ ] **Indirect Assessment** — Enter survey response counts per question per CO, or upload CSV/Excel.
- [ ] **Summary** — Review the attainment report. Download Excel or Print as PDF.

---

## 12. Frequently Asked Questions

**Q: What does "either/or" format mean for IA tests?**
A: Each question has two parts (a and b) mapped to different COs. Students answer only one part. The system counts only questions the student actually attempted when calculating the CO's effective maximum marks. This ensures a student isn't penalised for a CO they weren't assessed on.

**Q: Why does SEE show the same attainment for all COs?**
A: VTU's Semester End Exam does not publish CO-wise marks. So the overall percentage a student scores is used to determine their Level, and the same attainment percentage (% of students at Level 3) is applied uniformly to all COs.

**Q: Can I have different max marks for different COs in an Assignment?**
A: Yes. In the "Maximum Marks per CO" section of the Assignment tab, each CO has its own max marks input. Change them individually before entering student marks.

**Q: The CO label in my upload file doesn't match — what happens?**
A: The upload matches CO labels exactly. If your file has "CO 1" but the app is configured as "CO1", the row will be skipped. Use **Download Sample** to get a template with the correct labels.

**Q: What if a student was absent for an IA test?**
A: Leave their marks blank (or enter 0). Students with blank marks are excluded from the attainment denominator for that CO. Students with 0 marks are included (and will be Level 0/N).

**Q: What if I have only one IA test?**
A: The average IA attainment equals that single test's attainment — no problem.

**Q: Can I change the 60% threshold for Level 3?**
A: The Level 3 threshold (≥ 60% marks) is fixed by the standard VTU/NBA methodology and cannot be changed. However, the **Target % of Students** (what percentage of the class must reach Level 3) is configurable in the Configuration tab.

**Q: What does the "Import from IA Test" button do in SEE and Assignment tabs?**
A: It copies the student names and USNs from the first IA test that has students loaded, so you don't have to re-enter names. Marks will still be blank and need to be filled in.

**Q: How do I reset a section's student data?**
A: Click the **Reset** button in the marks toolbar of that section. This clears all student marks and restores blank student rows.

**Q: In the Survey, what if some scale columns are 0?**
A: That's fine. A scale value of 0 means no students responded at that level. The weighted average will naturally reflect the actual distribution.

**Q: The Summary shows 0% for a CO — why?**
A: This usually means no marks have been entered for that section yet, or all students have blank marks. Check each tab to ensure marks are entered and saved.
