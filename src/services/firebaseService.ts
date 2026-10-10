import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  SchoolProfile,
  AcademicSession,
  Term,
  AuditLog,
  BehavioralNote,
  FeePayment,
  SchoolExpense,
  ClassSessionNote,
  FeeItem,
  FeeWaiver,
  Exam,
  ExamSubmission,
  SchoolAnnouncement,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let app: FirebaseApp;
let db: Firestore | null = null;
let isInitialized = false;

export function initializeFirebase(): { app: FirebaseApp; db: Firestore | null } {
  if (isInitialized && db) {
    return { app, db };
  }

  try {
    if (!getApps().length) {
      app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    } else {
      app = getApp();
    }

    // Initialize with custom firestoreDatabaseId
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Firebase Firestore initialization notice:', error);
    db = null;
  }

  return { app, db };
}

// Get Firestore instance
export function getDb(): Firestore | null {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

export interface CloudStatus {
  isConnected: boolean;
  projectId: string;
  databaseId: string;
  lastSynced: string | null;
  error?: string;
}

/**
 * Validate connection to Firestore per skill instructions
 */
export async function testCloudConnection(): Promise<CloudStatus> {
  const database = getDb();
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const projectId = firebaseConfig.projectId;

  if (!database) {
    return {
      isConnected: false,
      projectId,
      databaseId,
      lastSynced: null,
      error: 'Firestore client not initialized',
    };
  }

  try {
    // Quick test query / read from server
    try {
      await getDocFromServer(doc(database, 'system_health', 'ping'));
    } catch {
      // document might not exist yet, write ping
    }

    const pingRef = doc(database, 'system_health', 'ping');
    await setDoc(pingRef, {
      timestamp: new Date().toISOString(),
      source: 'kulliyyat-admin-console',
    });

    return {
      isConnected: true,
      projectId,
      databaseId,
      lastSynced: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return {
      isConnected: false,
      projectId,
      databaseId,
      lastSynced: null,
      error: err?.message || 'Connection failed',
    };
  }
}

// Centralized Collections Interface
export interface CentralSchoolData {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  schoolProfile?: SchoolProfile;
  sessions?: AcademicSession[];
  terms?: Term[];
  auditLogs?: AuditLog[];
  behavioralNotes?: BehavioralNote[];
  classSessionNotes?: ClassSessionNote[];
  feeItems?: FeeItem[];
  feePayments?: FeePayment[];
  schoolExpenses?: SchoolExpense[];
  feeWaivers?: FeeWaiver[];
  exams?: Exam[];
  examSubmissions?: ExamSubmission[];
  announcements?: SchoolAnnouncement[];
}

/**
 * Fetch all records from Centralized Firestore Database
 */
export async function fetchAllFromCloud(): Promise<CentralSchoolData | null> {
  const database = getDb();
  if (!database) return null;

  try {
    // 1. Students
    let students: Student[] = [];
    try {
      const studentsSnap = await getDocs(collection(database, 'students'));
      students = studentsSnap.docs.map((d) => d.data() as Student);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'students');
    }

    // 2. Teachers
    let teachers: Teacher[] = [];
    try {
      const teachersSnap = await getDocs(collection(database, 'teachers'));
      teachers = teachersSnap.docs.map((d) => d.data() as Teacher);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'teachers');
    }

    // 3. Classes
    let classes: SchoolClass[] = [];
    try {
      const classesSnap = await getDocs(collection(database, 'classes'));
      classes = classesSnap.docs.map((d) => d.data() as SchoolClass);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classes');
    }

    // 4. Subjects
    let subjects: Subject[] = [];
    try {
      const subjectsSnap = await getDocs(collection(database, 'subjects'));
      subjects = subjectsSnap.docs.map((d) => d.data() as Subject);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'subjects');
    }

    // 5. Scores
    let scores: ScoreRecord[] = [];
    try {
      const scoresSnap = await getDocs(collection(database, 'scores'));
      scores = scoresSnap.docs.map((d) => d.data() as ScoreRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'scores');
    }

    // 6. Attendance
    let attendance: AttendanceRecord[] = [];
    try {
      const attSnap = await getDocs(collection(database, 'attendance'));
      attendance = attSnap.docs.map((d) => d.data() as AttendanceRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'attendance');
    }

    // 7. Audit Logs
    let auditLogs: AuditLog[] = [];
    try {
      const logsSnap = await getDocs(collection(database, 'audit_logs'));
      auditLogs = logsSnap.docs.map((d) => d.data() as AuditLog);
    } catch {
      // optional
    }

    // 8. School Profile
    let schoolProfile: SchoolProfile | undefined;
    try {
      const profDoc = await getDoc(doc(database, 'school_profile', 'main'));
      if (profDoc.exists()) {
        schoolProfile = profDoc.data() as SchoolProfile;
      }
    } catch {
      // optional
    }

    // 9. Behavioral Notes
    let behavioralNotes: BehavioralNote[] = [];
    try {
      const notesSnap = await getDocs(collection(database, 'behavioral_notes'));
      behavioralNotes = notesSnap.docs.map((d) => d.data() as BehavioralNote);
    } catch {
      // optional
    }

    // 10. Class Session Notes
    let classSessionNotes: ClassSessionNote[] = [];
    try {
      const sessionNotesSnap = await getDocs(collection(database, 'class_session_notes'));
      classSessionNotes = sessionNotesSnap.docs.map((d) => d.data() as ClassSessionNote);
    } catch {
      // optional
    }

    // 11. Fee Items
    let feeItems: FeeItem[] = [];
    try {
      const feeItemsSnap = await getDocs(collection(database, 'fee_items'));
      feeItems = feeItemsSnap.docs.map((d) => d.data() as FeeItem);
    } catch {
      // optional
    }

    // 12. Fee Payments
    let feePayments: FeePayment[] = [];
    try {
      const paymentsSnap = await getDocs(collection(database, 'fee_payments'));
      feePayments = paymentsSnap.docs.map((d) => d.data() as FeePayment);
    } catch {
      // optional
    }

    // 13. Fee Waivers
    let feeWaivers: FeeWaiver[] = [];
    try {
      const waiversSnap = await getDocs(collection(database, 'fee_waivers'));
      feeWaivers = waiversSnap.docs.map((d) => d.data() as FeeWaiver);
    } catch {
      // optional
    }

    // 14. School Expenses
    let schoolExpenses: SchoolExpense[] = [];
    try {
      const expensesSnap = await getDocs(collection(database, 'school_expenses'));
      schoolExpenses = expensesSnap.docs.map((d) => d.data() as SchoolExpense);
    } catch {
      // optional
    }

    // 15. CBT Examination Center Exams
    let exams: Exam[] = [];
    try {
      const examsSnap = await getDocs(collection(database, 'exams'));
      exams = examsSnap.docs.map((d) => d.data() as Exam);
    } catch {
      // optional
    }

    // 16. Student Exam Submissions
    let examSubmissions: ExamSubmission[] = [];
    try {
      const submissionsSnap = await getDocs(collection(database, 'exam_submissions'));
      examSubmissions = submissionsSnap.docs.map((d) => d.data() as ExamSubmission);
    } catch {
      // optional
    }

    // 17. School Announcements (for Students & Parents)
    let announcements: SchoolAnnouncement[] = [];
    try {
      const annSnap = await getDocs(collection(database, 'announcements'));
      announcements = annSnap.docs.map((d) => d.data() as SchoolAnnouncement);
    } catch {
      // optional
    }

    return {
      students,
      teachers,
      classes,
      subjects,
      scores,
      attendance,
      schoolProfile,
      auditLogs,
      behavioralNotes,
      classSessionNotes,
      feeItems,
      feePayments,
      feeWaivers,
      schoolExpenses,
      exams,
      examSubmissions,
      announcements,
    };
  } catch (error) {
    console.warn('Notice while fetching centralized records from Firestore:', error);
    return null;
  }
}

/**
 * Strips undefined properties recursively from objects before persisting to Firestore.
 * Firestore strictly forbids `undefined` values in documents.
 */
function cleanDataForCloud<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanDataForCloud(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForCloud(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Push full school records state to Centralized Firestore Database
 */
export async function pushAllToCloud(data: CentralSchoolData): Promise<boolean> {
  const database = getDb();
  if (!database) return false;

  try {
    // 1. Teachers
    for (const teacher of data.teachers) {
      await setDoc(doc(database, 'teachers', teacher.id), cleanDataForCloud(teacher));
    }

    // 2. Students
    for (const student of data.students) {
      await setDoc(doc(database, 'students', student.id), cleanDataForCloud(student));
    }

    // 3. Classes
    for (const cls of data.classes) {
      await setDoc(doc(database, 'classes', cls.id), cleanDataForCloud(cls));
    }

    // 4. Subjects
    for (const subj of data.subjects) {
      await setDoc(doc(database, 'subjects', subj.id), cleanDataForCloud(subj));
    }

    // 5. Scores
    for (const score of data.scores) {
      await setDoc(doc(database, 'scores', score.id), cleanDataForCloud(score));
    }

    // 6. Attendance
    for (const att of data.attendance) {
      await setDoc(doc(database, 'attendance', att.id), cleanDataForCloud(att));
    }

    // 7. Behavioral Notes
    if (data.behavioralNotes && data.behavioralNotes.length > 0) {
      for (const note of data.behavioralNotes) {
        await setDoc(doc(database, 'behavioral_notes', note.id), cleanDataForCloud(note));
      }
    }

    // 8. Fee Payments
    if (data.feePayments && data.feePayments.length > 0) {
      for (const pay of data.feePayments) {
        await setDoc(doc(database, 'fee_payments', pay.id), cleanDataForCloud(pay));
      }
    }

    // 9. Class Session Notes
    if (data.classSessionNotes && data.classSessionNotes.length > 0) {
      for (const note of data.classSessionNotes) {
        await setDoc(doc(database, 'class_session_notes', note.id), cleanDataForCloud(note));
      }
    }

    // 10. Fee Items
    if (data.feeItems && data.feeItems.length > 0) {
      for (const item of data.feeItems) {
        await setDoc(doc(database, 'fee_items', item.id), cleanDataForCloud(item));
      }
    }

    // 11. School Expenses
    if (data.schoolExpenses && data.schoolExpenses.length > 0) {
      for (const exp of data.schoolExpenses) {
        await setDoc(doc(database, 'school_expenses', exp.id), cleanDataForCloud(exp));
      }
    }

    // 12. Fee Waivers
    if (data.feeWaivers && data.feeWaivers.length > 0) {
      for (const waiver of data.feeWaivers) {
        await setDoc(doc(database, 'fee_waivers', waiver.id), cleanDataForCloud(waiver));
      }
    }

    // 13. School Profile
    if (data.schoolProfile) {
      await setDoc(doc(database, 'school_profile', 'main'), cleanDataForCloud(data.schoolProfile));
    }

    // 14. CBT Exams
    if (data.exams && data.exams.length > 0) {
      for (const exam of data.exams) {
        await setDoc(doc(database, 'exams', exam.id), cleanDataForCloud(exam));
      }
    }

    // 15. Student Exam Submissions
    if (data.examSubmissions && data.examSubmissions.length > 0) {
      for (const sub of data.examSubmissions) {
        await setDoc(doc(database, 'exam_submissions', sub.id), cleanDataForCloud(sub));
      }
    }

    // 16. School Announcements (Students & Parents)
    if (data.announcements && data.announcements.length > 0) {
      for (const ann of data.announcements) {
        await setDoc(doc(database, 'announcements', ann.id), cleanDataForCloud(ann));
      }
    }

    // Log the sync event
    await logAuditEvent({
      action: 'CENTRAL_CLOUD_SYNC',
      details: `Full database synchronized: ${data.students.length} students, ${data.teachers.length} teachers, ${data.scores.length} score records`,
      actor: 'School Administrator',
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_sync');
  }
}

/**
 * Save / Update a Single Teacher in Firestore
 */
export async function saveTeacherToCloud(teacher: Teacher): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(teacher);
    await setDoc(doc(database, 'teachers', teacher.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `teachers/${teacher.id}`);
  }
}

/**
 * Delete a Single Teacher from Firestore
 */
export async function deleteTeacherFromCloud(teacherId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'teachers', teacherId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teachers/${teacherId}`);
  }
}

/**
 * Save / Update a Single Student in Firestore
 */
export async function saveStudentToCloud(student: Student): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await setDoc(doc(database, 'students', student.id), cleanDataForCloud(student));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${student.id}`);
  }
}

/**
 * Delete a Single Student from Firestore
 */
export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
  }
}

/**
 * Save / Update Score Records in Firestore
 */
export async function saveScoresToCloud(scores: ScoreRecord[]): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    for (const score of scores) {
      await setDoc(doc(database, 'scores', score.id), cleanDataForCloud(score));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'scores');
  }
}

/**
 * Save Attendance Records in Firestore
 */
export async function saveAttendanceToCloud(attendance: AttendanceRecord[]): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    for (const att of attendance) {
      await setDoc(doc(database, 'attendance', att.id), cleanDataForCloud(att));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'attendance');
  }
}

/**
 * Save Fee Payment in Firestore
 */
export async function saveFeePaymentToCloud(payment: FeePayment): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await setDoc(doc(database, 'fee_payments', payment.id), cleanDataForCloud(payment));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `fee_payments/${payment.id}`);
  }
}

/**
 * Save Class update (such as assigning class teacher)
 */
export async function saveClassToCloud(schoolClass: SchoolClass): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await setDoc(doc(database, 'classes', schoolClass.id), cleanDataForCloud(schoolClass));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${schoolClass.id}`);
  }
}

/**
 * Append an Audit Log in Firestore
 */
export async function logAuditEvent(entry: {
  action: string;
  details: string;
  actor?: string;
}): Promise<void> {
  const database = getDb();
  if (!database) return;

  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditLog: AuditLog = {
    id: logId,
    action: entry.action,
    details: entry.details,
    timestamp: new Date().toISOString(),
    actor: entry.actor || 'Administrator',
  };

  try {
    await setDoc(doc(database, 'audit_logs', logId), auditLog);
  } catch (err) {
    console.warn('Could not write audit log to cloud:', err);
  }
}

/**
 * Save / Update a Single Behavioral Note in Firestore
 */
export async function saveBehavioralNoteToCloud(note: BehavioralNote): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(note);
    await setDoc(doc(database, 'behavioral_notes', note.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `behavioral_notes/${note.id}`);
  }
}

/**
 * Delete a Single Behavioral Note from Firestore
 */
export async function deleteBehavioralNoteFromCloud(noteId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'behavioral_notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `behavioral_notes/${noteId}`);
  }
}

/**
 * Save / Update a Single Class Session Note in Firestore
 */
export async function saveClassSessionNoteToCloud(note: ClassSessionNote): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(note);
    await setDoc(doc(database, 'class_session_notes', note.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `class_session_notes/${note.id}`);
  }
}

/**
 * Delete a Single Class Session Note from Firestore
 */
export async function deleteClassSessionNoteFromCloud(noteId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'class_session_notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `class_session_notes/${noteId}`);
  }
}

/**
 * Save / Update a Single Exam in Firestore
 */
export async function saveExamToCloud(exam: Exam): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(exam);
    await setDoc(doc(database, 'exams', exam.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `exams/${exam.id}`);
  }
}

/**
 * Delete a Single Exam from Firestore
 */
export async function deleteExamFromCloud(examId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'exams', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `exams/${examId}`);
  }
}

/**
 * Save / Submit a Student Exam Submission in Firestore
 */
export async function saveExamSubmissionToCloud(submission: ExamSubmission): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(submission);
    await setDoc(doc(database, 'exam_submissions', submission.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `exam_submissions/${submission.id}`);
  }
}

/**
 * Save / Update a Single School Announcement in Firestore
 */
export async function saveAnnouncementToCloud(announcement: SchoolAnnouncement): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const payload = cleanDataForCloud(announcement);
    await setDoc(doc(database, 'announcements', announcement.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${announcement.id}`);
  }
}

/**
 * Delete a Single School Announcement from Firestore
 */
export async function deleteAnnouncementFromCloud(announcementId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await deleteDoc(doc(database, 'announcements', announcementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${announcementId}`);
  }
}

