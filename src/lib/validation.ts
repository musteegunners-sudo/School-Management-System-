import { z } from 'zod';

// ============================================================================
// AUTH & USER VALIDATION
// ============================================================================

export const RoleSchema = z.enum(['super_admin', 'secretary', 'teacher', 'student', 'accountant']);

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  role: RoleSchema,
  name: z.string().min(1),
  arabicName: z.string().optional(),
  title: z.string(),
  email: z.string().email().optional(),
  staffId: z.string().optional(),
  studentId: z.string().optional(),
  regNo: z.string().optional(),
  assignedClassId: z.string().optional(),
  assignedSubjectIds: z.array(z.string()).optional(),
  campus: z.string().optional(),
});

export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, 'Username, email, or phone required'),
  password: z.string().min(1, 'Password required'),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: AuthUserSchema,
  token: z.string(),
  message: z.string().optional(),
});

// ============================================================================
// SCHOOL & ACADEMIC ENTITIES
// ============================================================================

export const SchoolProfileSchema = z.object({
  name: z.string().min(1),
  arabicName: z.string(),
  motto: z.string(),
  arabicMotto: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  nextTermBegins: z.string(),
  mudirName: z.string(),
});

export const SchoolClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(['Nursery', 'Primary', 'Tahfiz', "I'dadi (Junior)", 'Thanawi (Senior)']),
  section: z.string(),
  classTeacher: z.string().optional(),
  assignedTeacherId: z.string().optional(),
});

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  arabicName: z.string().optional(),
  code: z.string().min(1),
  category: z.enum([
    'Islamic Studies',
    'Arabic & Language',
    'General Sciences',
    'Early Childhood',
    'Vocational & Arts',
  ]),
});

export const AcademicSessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  isCurrent: z.boolean(),
});

export const TermSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  isCurrent: z.boolean(),
});

// ============================================================================
// STUDENT VALIDATION
// ============================================================================

export const StudentSchema = z.object({
  id: z.string(),
  regNo: z.string().min(1),
  fullName: z.string().min(1),
  arabicName: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  classId: z.string().min(1),
  academicYear: z.string().optional(),
  guardianName: z.string().min(1),
  guardianPhone: z.string().min(1),
  address: z.string(),
  pin: z.string().optional(),
  password: z.string().optional(),
  hasSetPassword: z.boolean().optional(),
  passwordUpdatedAt: z.string().optional(),
  photoUrl: z.string().optional(),
  createdAt: z.string(),
});

export const CreateStudentSchema = StudentSchema.pick({
  regNo: true,
  fullName: true,
  arabicName: true,
  gender: true,
  dob: true,
  classId: true,
  academicYear: true,
  guardianName: true,
  guardianPhone: true,
  address: true,
}).merge(z.object({
  pin: z.string().optional(),
  password: z.string().optional(),
  photoUrl: z.string().optional(),
}));

export const UpdateStudentSchema = CreateStudentSchema.partial();

// ============================================================================
// TEACHER VALIDATION
// ============================================================================

export const TeacherSchema = z.object({
  id: z.string(),
  staffId: z.string().min(1),
  fullName: z.string().min(1),
  arabicName: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  qualification: z.string().min(1),
  designation: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  pin: z.string().optional(),
  password: z.string().optional(),
  hasSetPassword: z.boolean().optional(),
  passwordUpdatedAt: z.string().optional(),
  assignedClassId: z.string().optional(),
  assignedSubjectIds: z.array(z.string()).optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
  createdAt: z.string(),
});

export const CreateTeacherSchema = TeacherSchema.pick({
  staffId: true,
  fullName: true,
  arabicName: true,
  gender: true,
  qualification: true,
  designation: true,
  phone: true,
  email: true,
  status: true,
}).merge(z.object({
  pin: z.string().optional(),
  password: z.string().optional(),
  assignedClassId: z.string().optional(),
  assignedSubjectIds: z.array(z.string()).optional(),
}));

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

// ============================================================================
// GRADING & ATTENDANCE VALIDATION
// ============================================================================

export const GradeSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);

export const ScoreRecordSchema = z.object({
  id: z.string(),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  weeklyAssignments: z.array(z.number().min(0).max(4)).optional(),
  unitAssignmentTotal: z.number().min(0).max(48).optional(),
  ca1: z.number().min(0).max(20),
  ca2: z.number().min(0).max(20),
  exam: z.number().min(0).max(60),
  total: z.number().min(0).max(100),
  grade: GradeSchema,
  remark: z.string(),
});

export const CreateScoreSchema = ScoreRecordSchema.pick({
  studentId: true,
  subjectId: true,
  classId: true,
  sessionId: true,
  termId: true,
  ca1: true,
  ca2: true,
  exam: true,
}).merge(z.object({
  weeklyAssignments: z.array(z.number()).optional(),
  unitAssignmentTotal: z.number().optional(),
}));

export const UpdateScoreSchema = CreateScoreSchema.partial();

export const AttendanceRecordSchema = z.object({
  id: z.string(),
  studentId: z.string().min(1),
  classId: z.string().min(1),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  timesOpened: z.number().min(0),
  timesPresent: z.number().min(0),
  timesAbsent: z.number().min(0),
  weeklyAttendance: z.array(z.number()).optional(),
  unitAttendanceTotal: z.number().optional(),
  dailyDetails: z.array(z.array(z.boolean())).optional(),
});

export const CreateAttendanceSchema = AttendanceRecordSchema.pick({
  studentId: true,
  classId: true,
  sessionId: true,
  termId: true,
  timesOpened: true,
  timesPresent: true,
  timesAbsent: true,
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();

// ============================================================================
// FEE & FINANCE VALIDATION
// ============================================================================

export const FeeItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  arabicName: z.string().optional(),
  amount: z.number().min(0),
  targetClassIds: z.array(z.string()),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  category: z.string(),
  isMandatory: z.boolean(),
  description: z.string().optional(),
  createdAt: z.string(),
});

export const CreateFeeItemSchema = FeeItemSchema.pick({
  name: true,
  arabicName: true,
  amount: true,
  targetClassIds: true,
  sessionId: true,
  termId: true,
  category: true,
  isMandatory: true,
  description: true,
});

export const UpdateFeeItemSchema = CreateFeeItemSchema.partial();

export const FeePaymentSchema = z.object({
  id: z.string(),
  receiptNumber: z.string().min(1),
  studentId: z.string().min(1),
  studentRegNo: z.string().optional(),
  studentName: z.string().optional(),
  classId: z.string().optional(),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  amountPaid: z.number().min(0),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'POS', 'Bank Deposit / Teller', 'Cheque']),
  bankName: z.string().optional(),
  transactionRef: z.string().optional(),
  payerName: z.string().min(1),
  payerPhone: z.string().optional(),
  allocatedFeeItems: z.array(z.object({
    feeItemId: z.string(),
    feeName: z.string(),
    amount: z.number(),
  })).optional(),
  receivedBy: z.string(),
  receivedByStaffId: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  remarks: z.string().optional(),
  createdAt: z.string(),
});

export const CreateFeePaymentSchema = FeePaymentSchema.pick({
  receiptNumber: true,
  studentId: true,
  sessionId: true,
  termId: true,
  amountPaid: true,
  paymentMethod: true,
  bankName: true,
  transactionRef: true,
  payerName: true,
  payerPhone: true,
  receivedBy: true,
  date: true,
  remarks: true,
}).merge(z.object({
  allocatedFeeItems: z.array(z.object({
    feeItemId: z.string(),
    feeName: z.string(),
    amount: z.number(),
  })).optional(),
}));

export const UpdateFeePaymentSchema = CreateFeePaymentSchema.partial();

// ============================================================================
// EXAM & CBT VALIDATION
// ============================================================================

export const ExamQuestionOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
  arabicText: z.string().optional(),
  hausaText: z.string().optional(),
  localText: z.string().optional(),
});

export const ExamQuestionSchema = z.object({
  id: z.string(),
  questionNumber: z.number().min(1),
  text: z.string().min(1),
  arabicText: z.string().optional(),
  hausaText: z.string().optional(),
  localText: z.string().optional(),
  options: z.array(ExamQuestionOptionSchema).length(4),
  correctOptionId: z.enum(['A', 'B', 'C', 'D']),
  marks: z.number().min(1),
  explanation: z.string().optional(),
  hausaExplanation: z.string().optional(),
});

export const ExamSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  arabicTitle: z.string().optional(),
  hausaTitle: z.string().optional(),
  localTitle: z.string().optional(),
  subjectId: z.string().min(1),
  subjectName: z.string(),
  classId: z.string().min(1),
  className: z.string(),
  teacherId: z.string().min(1),
  teacherName: z.string(),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  durationMinutes: z.number().min(1),
  totalMarks: z.number().min(1),
  instructions: z.string().optional(),
  arabicInstructions: z.string().optional(),
  localInstructions: z.string().optional(),
  isPublished: z.boolean(),
  questions: z.array(ExamQuestionSchema).min(1),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CreateExamSchema = ExamSchema.pick({
  title: true,
  arabicTitle: true,
  hausaTitle: true,
  localTitle: true,
  subjectId: true,
  subjectName: true,
  classId: true,
  className: true,
  teacherId: true,
  teacherName: true,
  sessionId: true,
  termId: true,
  date: true,
  durationMinutes: true,
  totalMarks: true,
  instructions: true,
  arabicInstructions: true,
  localInstructions: true,
  isPublished: true,
  questions: true,
});

export const UpdateExamSchema = CreateExamSchema.partial();

export const ExamSubmissionSchema = z.object({
  id: z.string(),
  examId: z.string().min(1),
  examTitle: z.string(),
  studentId: z.string().min(1),
  studentRegNo: z.string(),
  studentName: z.string(),
  classId: z.string().min(1),
  className: z.string(),
  subjectId: z.string().min(1),
  subjectName: z.string(),
  termId: z.string().min(1),
  sessionId: z.string().min(1),
  answers: z.record(z.enum(['A', 'B', 'C', 'D'])),
  totalScore: z.number().min(0),
  maxScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
  grade: GradeSchema,
  startedAt: z.string(),
  submittedAt: z.string(),
  timeSpentSeconds: z.number().min(0),
  status: z.enum(['completed', 'timed_out', 'in_progress']),
});

export const CreateExamSubmissionSchema = ExamSubmissionSchema.pick({
  examId: true,
  examTitle: true,
  studentId: true,
  studentRegNo: true,
  studentName: true,
  classId: true,
  className: true,
  subjectId: true,
  subjectName: true,
  termId: true,
  sessionId: true,
  answers: true,
  totalScore: true,
  maxScore: true,
  percentage: true,
  grade: true,
  startedAt: true,
  submittedAt: true,
  timeSpentSeconds: true,
  status: true,
});

// ============================================================================
// ANNOUNCEMENTS & NOTES VALIDATION
// ============================================================================

export const SchoolAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  arabicTitle: z.string().optional(),
  category: z.enum(['General', 'Examination', 'Fees & Bursary', 'Holiday', 'Tahfiz & Islamic', 'Emergency']),
  priority: z.enum(['normal', 'important', 'urgent']),
  targetAudience: z.enum(['All', 'Students & Parents', 'Parents Only', 'Tahfiz Students']),
  content: z.string().min(1),
  arabicContent: z.string().optional(),
  authorName: z.string(),
  authorRole: z.string(),
  publishedDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  expiryDate: z.string().optional(),
  isPinned: z.boolean().optional(),
  createdAt: z.string(),
});

export const CreateAnnouncementSchema = SchoolAnnouncementSchema.pick({
  title: true,
  arabicTitle: true,
  category: true,
  priority: true,
  targetAudience: true,
  content: true,
  arabicContent: true,
  authorName: true,
  authorRole: true,
  publishedDate: true,
  expiryDate: true,
  isPinned: true,
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

export const BehavioralNoteSchema = z.object({
  id: z.string(),
  studentId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string(),
  authorRole: z.enum(['teacher', 'super_admin']),
  category: z.string(),
  type: z.enum(['positive', 'constructive']),
  title: z.string().min(1),
  content: z.string().min(1),
  actionTaken: z.string().optional(),
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  isPrivate: z.boolean(),
});

export const CreateBehavioralNoteSchema = BehavioralNoteSchema.pick({
  studentId: true,
  authorId: true,
  authorName: true,
  authorRole: true,
  category: true,
  type: true,
  title: true,
  content: true,
  actionTaken: true,
  sessionId: true,
  termId: true,
  isPrivate: true,
});

export const UpdateBehavioralNoteSchema = CreateBehavioralNoteSchema.partial();

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type ScoreRecord = z.infer<typeof ScoreRecordSchema>;
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
export type FeePayment = z.infer<typeof FeePaymentSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type ExamSubmission = z.infer<typeof ExamSubmissionSchema>;
export type SchoolAnnouncement = z.infer<typeof SchoolAnnouncementSchema>;
export type BehavioralNote = z.infer<typeof BehavioralNoteSchema>;
