export interface Student {
  id: string;
  regNo: string;
  fullName: string;
  arabicName?: string;
  gender: 'Male' | 'Female';
  dob: string;
  classId: string;
  academicYear?: string; // e.g. "2026/2027" or "2026"
  guardianName: string;
  guardianPhone: string;
  address: string;
  pin?: string; // Optional custom student portal access PIN
  password?: string; // Student personalized password for portal access
  hasSetPassword?: boolean;
  passwordUpdatedAt?: string;
  photoUrl?: string; // Captured or uploaded student profile/passport photo (data URL)
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  category: 'Nursery' | 'Primary' | 'Tahfiz' | 'I\'dadi (Junior)' | 'Thanawi (Senior)';
  section: string;
  classTeacher?: string;
  assignedTeacherId?: string;
}

export interface Teacher {
  id: string;
  staffId: string; // e.g. TCH-2026-001
  fullName: string;
  arabicName?: string;
  gender: 'Male' | 'Female';
  qualification: string;
  designation?: string; // Principal's official faculty designation / title (e.g. "Senior Form Master", "HOD Islamic Studies", etc.)
  phone: string;
  email?: string;
  pin?: string; // Optional custom login PIN
  password?: string; // Teacher personal password set via phone verification
  hasSetPassword?: boolean; // Flag indicating if teacher has activated their password
  passwordUpdatedAt?: string;
  assignedClassId?: string; // e.g. 'cls_idadi_1'
  assignedSubjectIds?: string[]; // IDs of subjects taught
  status: 'Active' | 'On Leave' | 'Inactive';
  createdAt: string;
}

export interface AuthUser {
  id: string;
  role: 'super_admin' | 'teacher' | 'student' | 'accountant' | 'secretary';
  name: string;
  arabicName?: string;
  title: string;
  email?: string;
  staffId?: string;
  studentId?: string;
  regNo?: string;
  assignedClassId?: string;
  assignedSubjectIds?: string[];
  campus?: string;
}

export type AnnouncementCategory =
  | 'General'
  | 'Examination'
  | 'Fees & Bursary'
  | 'Holiday'
  | 'Tahfiz & Islamic'
  | 'Emergency';

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface SchoolAnnouncement {
  id: string;
  title: string;
  arabicTitle?: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetAudience: 'All' | 'Students & Parents' | 'Parents Only' | 'Tahfiz Students';
  content: string;
  arabicContent?: string;
  authorName: string;
  authorRole: string; // e.g. "School Secretary & Admissions Registrar"
  publishedDate: string; // YYYY-MM-DD
  expiryDate?: string;
  isPinned?: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  arabicName?: string;
  code: string;
  category: 'Islamic Studies' | 'Arabic & Language' | 'General Sciences' | 'Early Childhood' | 'Vocational & Arts';
}

export interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface ScoreRecord {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  sessionId: string;
  termId: string;
  weeklyAssignments?: number[]; // Array of 12 weeks of Unit Assignment grades, each 0-4
  unitAssignmentTotal?: number; // Sum of 12 weekly unit assignments (0 to 48)
  ca1: number; // Continuous Assessment 1 (e.g. max 20, or scaled from weekly unit assignments)
  ca2: number; // Continuous Assessment 2 (e.g. max 20)
  exam: number; // Terminal Exam (e.g. max 60)
  total: number; // Sum 0 - 100
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  timesOpened: number;
  timesPresent: number;
  timesAbsent: number;
  weeklyAttendance?: number[]; // Array of 12 weeks of unit attendance (e.g. days present per week, 0-5)
  unitAttendanceTotal?: number; // Total days present across weekly units
  dailyDetails?: boolean[][]; // 12 weeks x 5 days of tick boxes (true = ✅ Present, false = ❌ Absent)
}

export interface AffectiveDomain {
  punctuality: number; // 1 to 5 scale
  neatness: number;
  politeness: number;
  honesty: number;
  quranRecitation: number;
  memorization: number;
  attentiveness: number;
}

export interface StudentReportProfile {
  student: Student;
  classInfo: SchoolClass;
  scores: Array<{
    subject: Subject;
    score: ScoreRecord;
    classHighest: number;
    classLowest: number;
    classAverage: number;
    positionInSubject: number;
  }>;
  attendance?: AttendanceRecord;
  affective: AffectiveDomain;
  totalScore: number;
  maxPossibleScore: number;
  averageScore: number;
  classPosition: number;
  totalStudentsInClass: number;
  overallGrade: string;
  overallRemark: string;
  teacherRemark: string;
  principalRemark: string;
}

export interface SchoolProfile {
  name: string;
  arabicName: string;
  motto: string;
  arabicMotto: string;
  address: string;
  phone: string;
  email: string;
  nextTermBegins: string;
  mudirName: string;
}

export interface GradeScaleItem {
  min: number;
  max: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
  arabicRemark: string;
  points: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  actor: string;
  classId?: string;
  subjectId?: string;
  sessionNoteId?: string;
}

export interface ClassSessionNote {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  period?: string; // e.g. "Period 1 (08:00 - 08:45 AM)"
  sessionType: 'Lecture' | 'Tahfiz / Recitation' | 'Continuous Assessment' | 'Revision' | 'Practical / Activity';
  topic: string;
  notes: string;
  homework?: string;
  attendanceSummary?: string;
  sessionId: string;
  termId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackupDataPayload {
  version: string;
  exportedAt: string;
  schoolName?: string;
  schoolProfile?: SchoolProfile;
  students: Student[];
  teachers?: Teacher[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  classes?: SchoolClass[];
  subjects?: Subject[];
  auditLogs?: AuditLog[];
  classSessionNotes?: ClassSessionNote[];
  feeItems?: FeeItem[];
  feePayments?: FeePayment[];
  schoolExpenses?: SchoolExpense[];
  feeWaivers?: FeeWaiver[];
}

export type FeeCategory =
  | 'Tuition'
  | 'Development'
  | 'Materials'
  | 'Uniform'
  | 'Exam'
  | 'PTA'
  | 'Hostel'
  | 'Other';

export interface FeeItem {
  id: string;
  name: string;
  arabicName?: string;
  amount: number; // in Nigerian Naira (₦)
  targetClassIds: string[]; // 'all' or specific class IDs
  sessionId: string;
  termId: string; // 'all' or specific term ID
  category: FeeCategory;
  isMandatory: boolean;
  description?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'POS'
  | 'Bank Deposit / Teller'
  | 'Cheque';

export interface FeePayment {
  id: string;
  receiptNumber: string; // e.g. RCP-2026-0001
  studentId: string;
  studentRegNo: string;
  studentName: string;
  classId: string;
  sessionId: string;
  termId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  transactionRef?: string;
  payerName: string;
  payerPhone?: string;
  allocatedFeeItems?: Array<{ feeItemId: string; feeName: string; amount: number }>;
  receivedBy: string; // Accountant name
  receivedByStaffId?: string;
  date: string; // YYYY-MM-DD
  remarks?: string;
  createdAt: string;
}

export type WaiverReason =
  | 'Tahfiz Scholarship (Hifz)'
  | 'Orphan Support (Kafalat Yateem)'
  | 'Staff Child Concession'
  | 'Indigent / Needy Hardship Relief'
  | 'Academic Merit Award'
  | 'Sibling Discount'
  | 'Other';

export interface FeeWaiver {
  id: string;
  studentId: string;
  sessionId: string;
  termId: string;
  amount: number;
  reason: WaiverReason;
  notes?: string;
  approvedBy: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Staff Salaries & Honorarium'
  | 'Generator Fuel & Diesel'
  | 'Facility Maintenance & Repairs'
  | 'Printing, Books & Examination Materials'
  | 'Utilities, Water & Electricity'
  | 'Islamic Events & Tahfiz Prizes'
  | 'Administrative & Logistics'
  | 'Other';

export interface SchoolExpense {
  id: string;
  voucherNumber: string; // e.g. EXP-2026-001
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo: string; // Vendor, Contractor, Staff
  authorizedBy: string; // Mudir/Principal
  recordedBy: string; // Accountant
  date: string; // YYYY-MM-DD
  invoiceRef?: string;
  receiptImage?: string;
  createdAt: string;
}

export interface StudentAccountLedger {
  student: Student;
  classInfo?: SchoolClass;
  totalBilled: number;
  totalPaid: number;
  totalWaivers: number;
  balanceDue: number; // positive = owes money, 0 = cleared, negative = overpaid
  status: 'Fully Cleared' | 'Part Payment' | 'Defaulter' | 'Overpaid';
  applicableFeeItems: FeeItem[];
  payments: FeePayment[];
  waivers: FeeWaiver[];
}

export type BehavioralNoteType = 'positive' | 'constructive';

export type BehavioralCategory =
  | 'Islamic Character & Adab'
  | 'Academic Diligence'
  | 'Classroom Conduct'
  | 'Peer Relations'
  | 'Punctuality & Discipline'
  | 'Tahfiz & Memorization'
  | 'Leadership & Community'
  | 'Other';

export interface BehavioralNote {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  authorRole: 'teacher' | 'super_admin';
  category: BehavioralCategory;
  type: BehavioralNoteType;
  title: string;
  content: string;
  actionTaken?: string;
  sessionId: string;
  termId: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate: boolean; // Strictly confidential to faculty and administration
}

// ---------------------------------------------------------------------------
// Dedicated Computer-Based Testing (CBT) & Examination Center Models
// ---------------------------------------------------------------------------

export type ObjOptionId = 'A' | 'B' | 'C' | 'D';

export interface ExamQuestionOption {
  id: ObjOptionId;
  text: string;
  arabicText?: string;
  hausaText?: string; // Local language option (Hausa)
  localText?: string; // Generic local language alias
}

export interface ExamQuestion {
  id: string;
  questionNumber: number;
  text: string;
  arabicText?: string;
  hausaText?: string; // Local language option (Hausa)
  localText?: string; // Generic local language alias
  options: ExamQuestionOption[];
  correctOptionId: ObjOptionId;
  marks: number; // e.g. 2, 5, or 6
  explanation?: string;
  hausaExplanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  arabicTitle?: string;
  hausaTitle?: string; // Local language option (Hausa)
  localTitle?: string; // Generic local language alias
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  sessionId: string;
  termId: string;
  date: string; // YYYY-MM-DD scheduled date
  durationMinutes: number; // Time limit in minutes, e.g. 20, 30, 45, 60
  totalMarks: number; // e.g. 60 (standard terminal exam mark) or 20/40
  instructions?: string;
  arabicInstructions?: string;
  localInstructions?: string;
  isPublished: boolean; // Authorised teachers toggle to make active for students
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  termId: string;
  sessionId: string;
  answers: Record<string, ObjOptionId>; // questionId -> selectedOptionId ('A' | 'B' | 'C' | 'D')
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  status: 'completed' | 'timed_out' | 'in_progress';
}


