import type { ScoreRecord } from '../types';

export const evaluateScoreGrade = (total: number): { grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; remark: string } => {
  if (total >= 70) return { grade: 'A', remark: 'Distinction (Mumtaz)' };
  if (total >= 60) return { grade: 'B', remark: 'Very Good (Jayyid Jiddan)' };
  if (total >= 50) return { grade: 'C', remark: 'Good (Jayyid)' };
  if (total >= 45) return { grade: 'D', remark: 'Pass (Maqbool)' };
  if (total >= 40) return { grade: 'E', remark: 'Fair (Da\'eef)' };
  return { grade: 'F', remark: 'Fail (Rasib)' };
};

export const buildScoreRecord = (
  input: Partial<ScoreRecord> & {
    studentId: string;
    subjectId: string;
    classId: string;
    sessionId: string;
    termId: string;
    ca1?: number;
    ca2?: number;
    exam?: number;
  }
): ScoreRecord => {
  const total = input.total ?? (input.ca1 ?? 0) + (input.ca2 ?? 0) + (input.exam ?? 0);
  const result = evaluateScoreGrade(total);

  return {
    id: input.id || `scr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    subjectId: input.subjectId,
    classId: input.classId,
    sessionId: input.sessionId,
    termId: input.termId,
    weeklyAssignments: input.weeklyAssignments ?? [],
    unitAssignmentTotal: input.unitAssignmentTotal ?? 0,
    ca1: input.ca1 ?? 0,
    ca2: input.ca2 ?? 0,
    exam: input.exam ?? 0,
    total,
    grade: result.grade,
    remark: result.remark,
  };
};

export const mergeScoreRecords = (existing: ScoreRecord[], incoming: ScoreRecord[]) => {
  const mergedMap = new Map(existing.map((score) => [score.id, score]));

  incoming.forEach((score) => {
    const match = existing.find(
      (current) =>
        current.id === score.id ||
        (current.studentId === score.studentId &&
          current.subjectId === score.subjectId &&
          current.termId === score.termId)
    );

    if (match) {
      mergedMap.set(match.id, score);
      return;
    }

    mergedMap.set(score.id, score);
  });

  return Array.from(mergedMap.values());
};

export const saveScores = (existing: ScoreRecord[], incoming: ScoreRecord[]) => {
  return mergeScoreRecords(existing, incoming);
};

export const upsertScore = (existing: ScoreRecord[], target: ScoreRecord) => {
  const match = existing.find(
    (score) =>
      score.id === target.id ||
      (score.studentId === target.studentId &&
        score.subjectId === target.subjectId &&
        score.termId === target.termId)
  );

  if (!match) {
    return [...existing, target];
  }

  return existing.map((score) =>
    score.id === match.id ||
    (score.studentId === target.studentId &&
      score.subjectId === target.subjectId &&
      score.termId === target.termId)
      ? target
      : score
  );
};
