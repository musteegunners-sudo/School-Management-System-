export interface GenerateCommentInput {
  studentName: string;
  regNo?: string;
  gender?: 'Male' | 'Female';
  className?: string;
  subjectName?: string;
  termName?: string;
  sessionName?: string;
  unitAssignmentTotal?: number;
  weeklyAverage?: number;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total?: number;
  grade?: string;
  attendanceRate?: number;
  attendanceDaysPresent?: number;
  attendanceDaysOpened?: number;
  tone?: 'holistic' | 'encouraging' | 'high_achiever' | 'improvement' | 'islamic_values';
  teacherNotes?: string;
}

export interface GeneratedCommentResult {
  success: boolean;
  aiPowered?: boolean;
  source?: string;
  conciseRemark: string;
  detailedRemark: string;
  islamicCharacterRemark: string;
  summaryAssessment: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  attendanceAppraisal: string;
  warning?: string;
}

export async function generateTeacherComment(
  input: GenerateCommentInput
): Promise<GeneratedCommentResult> {
  try {
    const res = await fetch('/api/generate-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data: GeneratedCommentResult = await res.json();
    return data;
  } catch (err: any) {
    console.warn('Network call to /api/generate-comment failed, using client fallback:', err);
    // Instant client-side fallback matching our educational standard
    const firstName = input.studentName.split(' ')[0] || 'The student';
    const total = input.total ?? 0;
    const attRate = input.attendanceRate ?? 85;

    let concise = `${firstName} has completed the term with an overall mark of ${total}%. Attendance stood at ${attRate}%.`;
    let detailed = `${firstName} displayed consistent effort throughout the 12 weeks of learning. Continued revision will support further academic growth.`;
    let islamic = `May Allah bless ${firstName} with beneficial knowledge, good manners, and success in this world and the Hereafter.`;

    if (total >= 70) {
      concise = `Exceptional performance! ${firstName} showed outstanding academic discipline and high attendance (${attRate}%).`;
      detailed = `${firstName} achieved distinction with a total score of ${total}%. ${firstName} is a role model in class and demonstrates high aptitude in all subjects.`;
      islamic = `A student of praiseworthy conduct (Husn al-Khuluq) and academic diligence. May Allah continue to guide and elevate ${firstName}.`;
    }

    return {
      success: true,
      aiPowered: false,
      source: 'client_offline_fallback',
      conciseRemark: concise,
      detailedRemark: detailed,
      islamicCharacterRemark: islamic,
      summaryAssessment: total >= 70 ? 'Distinction' : total >= 50 ? 'Good Effort' : 'Needs Support',
      keyStrengths: ['Satisfactory coursework completion', `Attendance rate: ${attRate}%`],
      areasForImprovement: ['Continue regular home revision and recitation'],
      attendanceAppraisal: `Recorded attendance: ${attRate}%.`,
      warning: err?.message || 'Generated via local rules engine.',
    };
  }
}
