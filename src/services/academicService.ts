import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  StudentReportProfile,
  GradeScaleItem,
  AffectiveDomain,
} from '../types';

export function normalizeWeeklyAssignments(weekly?: (number | string | null | undefined)[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < 12; i++) {
    const val = weekly && weekly[i] !== undefined && weekly[i] !== null ? Number(weekly[i]) : 0;
    const clamped = isNaN(val) ? 0 : Math.min(4, Math.max(0, val));
    result.push(clamped);
  }
  return result;
}

export function normalizeWeeklyAttendance(weekly?: (number | string | null | undefined)[], maxDaysPerWeek: number = 5): number[] {
  const result: number[] = [];
  for (let i = 0; i < 12; i++) {
    const val = weekly && weekly[i] !== undefined && weekly[i] !== null ? Number(weekly[i]) : 0;
    const clamped = isNaN(val) ? 0 : Math.min(maxDaysPerWeek, Math.max(0, val));
    result.push(clamped);
  }
  return result;
}

export function calculateWeeklyAttendanceTotal(weekly?: number[]): number {
  if (!weekly || !Array.isArray(weekly)) return 0;
  return weekly.reduce((acc, curr) => {
    const val = Number(curr) || 0;
    return acc + Math.max(0, val);
  }, 0);
}

export function calculateWeeklyTotal(weekly?: number[]): number {
  if (!weekly || !Array.isArray(weekly)) return 0;
  return weekly.reduce((acc, curr) => {
    const val = Number(curr) || 0;
    return acc + Math.min(4, Math.max(0, val));
  }, 0);
}

export function scaleWeeklyToCa(weeklyTotal: number, maxCa: number = 20): number {
  const clamped = Math.min(48, Math.max(0, weeklyTotal));
  return Math.round((clamped / 48) * maxCa);
}

export function calculateTotalScore(ca1: number, ca2: number, exam: number): number {
  return Math.min(100, Math.max(0, (Number(ca1) || 0) + (Number(ca2) || 0) + (Number(exam) || 0)));
}

export function evaluateGradeAndRemark(
  score: number,
  gradeScale: GradeScaleItem[]
): { grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; remark: string; arabicRemark: string; points: number } {
  for (const item of gradeScale) {
    if (score >= item.min && score <= item.max) {
      return {
        grade: item.grade,
        remark: item.remark,
        arabicRemark: item.arabicRemark,
        points: item.points,
      };
    }
  }
  return {
    grade: 'F',
    remark: 'Fail',
    arabicRemark: 'راسب',
    points: 0,
  };
}

export interface StudentRankingResult {
  student: Student;
  totalScore: number;
  averageScore: number;
  subjectCount: number;
  rank: number;
  rankSuffix: string;
  overallGrade: string;
  overallRemark: string;
  passStatus: 'Promoted' | 'Promoted on Trial' | 'Repeat' | 'Pass';
}

export function getRankSuffix(rank: number): string {
  if (rank <= 0) return '—';
  const j = rank % 10;
  const k = rank % 100;
  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}

export function computeClassRankings(
  studentsInClass: Student[],
  scores: ScoreRecord[],
  gradeScale: GradeScaleItem[],
  termId?: string,
  sessionId?: string
): StudentRankingResult[] {
  // Filter scores for the targeted term and session if provided
  const relevantScores = scores.filter((s) => {
    if (termId && s.termId !== termId) return false;
    if (sessionId && s.sessionId !== sessionId) return false;
    return true;
  });

  const results: StudentRankingResult[] = studentsInClass.map((student) => {
    const studentScores = relevantScores.filter((s) => s.studentId === student.id);
    const totalScore = studentScores.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const subjectCount = studentScores.length;
    const averageScore = subjectCount > 0 ? parseFloat((totalScore / subjectCount).toFixed(2)) : 0;
    
    if (subjectCount === 0) {
      return {
        student,
        totalScore: 0,
        averageScore: 0,
        subjectCount: 0,
        rank: 0,
        rankSuffix: '—',
        overallGrade: '—',
        overallRemark: 'Ungraded',
        passStatus: 'Pass',
      };
    }

    const evalRes = evaluateGradeAndRemark(averageScore, gradeScale);

    let passStatus: 'Promoted' | 'Promoted on Trial' | 'Repeat' | 'Pass' = 'Pass';
    if (averageScore >= 50) {
      passStatus = 'Promoted';
    } else if (averageScore >= 40) {
      passStatus = 'Promoted on Trial';
    } else {
      passStatus = 'Repeat';
    }

    return {
      student,
      totalScore,
      averageScore,
      subjectCount,
      rank: 0,
      rankSuffix: '',
      overallGrade: evalRes.grade,
      overallRemark: evalRes.remark,
      passStatus,
    };
  });

  // Separate graded students from ungraded students
  const gradedResults = results.filter((r) => r.subjectCount > 0);
  const ungradedResults = results.filter((r) => r.subjectCount === 0);

  // Sort graded descending by averageScore (and totalScore)
  gradedResults.sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);

  // Assign ranks with tie handling
  let currentRank = 1;
  for (let i = 0; i < gradedResults.length; i++) {
    if (i > 0 && gradedResults[i].averageScore === gradedResults[i - 1].averageScore) {
      gradedResults[i].rank = gradedResults[i - 1].rank;
    } else {
      gradedResults[i].rank = currentRank;
    }
    gradedResults[i].rankSuffix = getRankSuffix(gradedResults[i].rank);
    currentRank++;
  }

  // Combine graded first, then ungraded
  return [...gradedResults, ...ungradedResults];
}

export function computeSubjectStatistics(
  subjectId: string,
  classId: string,
  scores: ScoreRecord[],
  termId?: string,
  sessionId?: string
) {
  const filtered = scores.filter((s) => {
    if (s.subjectId !== subjectId || s.classId !== classId) return false;
    if (termId && s.termId !== termId) return false;
    if (sessionId && s.sessionId !== sessionId) return false;
    return true;
  });

  if (filtered.length === 0) {
    return { classHighest: 0, classLowest: 0, classAverage: 0 };
  }
  const totals = filtered.map((s) => s.total || 0);
  const classHighest = Math.max(...totals);
  const classLowest = Math.min(...totals);
  const sum = totals.reduce((a, b) => a + b, 0);
  const classAverage = parseFloat((sum / totals.length).toFixed(1));

  return { classHighest, classLowest, classAverage };
}

export function generateStudentReportProfile(
  student: Student,
  classInfo: SchoolClass,
  subjects: Subject[],
  allScores: ScoreRecord[],
  allStudentsInClass: Student[],
  gradeScale: GradeScaleItem[],
  attendance?: AttendanceRecord,
  termId?: string,
  sessionId?: string
): StudentReportProfile {
  // Filter all scores to current term & session first!
  const termScores = allScores.filter((s) => {
    if (termId && s.termId !== termId) return false;
    if (sessionId && s.sessionId !== sessionId) return false;
    return true;
  });

  // Rankings
  const rankings = computeClassRankings(allStudentsInClass, termScores, gradeScale, termId, sessionId);
  const studentRankObj = rankings.find((r) => r.student.id === student.id);
  const classPosition = studentRankObj && studentRankObj.rank > 0 ? studentRankObj.rank : 1;
  const averageScore = studentRankObj ? studentRankObj.averageScore : 0;
  const totalScore = studentRankObj ? studentRankObj.totalScore : 0;

  // Detailed subject scores with ranks
  const studentScores = termScores.filter((s) => s.studentId === student.id);
  const detailedScores = studentScores.map((score) => {
    const subj = subjects.find((s) => s.id === score.subjectId) || {
      id: score.subjectId,
      name: 'Unknown Subject',
      code: 'SUB',
      category: 'General Sciences' as const,
    };
    const stats = computeSubjectStatistics(score.subjectId, classInfo.id, termScores, termId, sessionId);

    // Subject position in this term
    const allSubjectScores = termScores
      .filter((s) => s.subjectId === score.subjectId && s.classId === classInfo.id)
      .sort((a, b) => b.total - a.total);
    const positionInSubject = allSubjectScores.findIndex((s) => s.studentId === student.id) + 1;

    return {
      subject: subj,
      score,
      classHighest: stats.classHighest,
      classLowest: stats.classLowest,
      classAverage: stats.classAverage,
      positionInSubject: positionInSubject > 0 ? positionInSubject : 1,
    };
  });

  const maxPossibleScore = detailedScores.length * 100;
  const overallEval = evaluateGradeAndRemark(averageScore, gradeScale);

  // Affective traits based on performance
  const affective: AffectiveDomain = {
    punctuality: averageScore >= 70 ? 5 : averageScore >= 50 ? 4 : 3,
    neatness: 5,
    politeness: 5,
    honesty: 5,
    quranRecitation: averageScore >= 70 ? 5 : 4,
    memorization: averageScore >= 60 ? 5 : 4,
    attentiveness: averageScore >= 60 ? 4 : 3,
  };

  // Remarks
  let teacherRemark = 'An exceptional performance! Highly committed and attentive in class.';
  let principalRemark = 'Outstanding result! Keep up the good work and strive for excellence in all spheres.';

  // Check if teacher has saved a custom or AI-generated personalized remark
  const customScore = studentScores.find(
    (s) =>
      s.remark &&
      s.remark.trim() !== '' &&
      !['Distinction', 'Very Good', 'Good', 'Pass', 'Fair', 'Fail'].some(
        (prefix) => s.remark.startsWith(prefix) && s.remark.length < 32
      )
  );

  if (customScore?.remark) {
    teacherRemark = customScore.remark;
  } else if (studentScores.length === 0) {
    teacherRemark = 'Awaiting completion of assessment scores for this term.';
    principalRemark = 'Term grades are pending entry.';
  } else if (averageScore >= 80) {
    teacherRemark = 'Remarkable brilliance! Mastered the curriculum and showed exemplary conduct.';
    principalRemark = 'Excellent academic standing. A role model to other students. Keep shining!';
  } else if (averageScore >= 70) {
    teacherRemark = 'Very good and dedicated student. Has strong grasp in both Arabic and English subjects.';
    principalRemark = 'Commendable result. With continued focus, greater heights await.';
  } else if (averageScore >= 55) {
    teacherRemark = 'Good effort shown throughout the term. Advised to revise thoroughly.';
    principalRemark = 'Satisfactory performance. Dedicated study encouraged during the holiday.';
  } else {
    teacherRemark = 'Needs serious improvement and dedication to studies. Must attend extra lessons.';
    principalRemark = 'Performance requires urgent attention. Parent consultation strongly advised.';
  }

  return {
    student,
    classInfo,
    scores: detailedScores,
    attendance,
    affective,
    totalScore,
    maxPossibleScore,
    averageScore,
    classPosition,
    totalStudentsInClass: allStudentsInClass.length,
    overallGrade: studentScores.length > 0 ? overallEval.grade : '—',
    overallRemark: studentScores.length > 0 ? overallEval.remark : 'Pending Evaluation',
    teacherRemark,
    principalRemark,
  };
}
