import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  ScoreRecord,
  AttendanceRecord,
  SchoolProfile,
  GradeScaleItem,
  BackupDataPayload,
  Teacher,
  AuditLog,
  AuthUser,
  FeeItem,
  FeePayment,
  FeeWaiver,
  SchoolExpense,
  BehavioralNote,
  ClassSessionNote,
  Exam,
  ExamSubmission,
  SchoolAnnouncement,
} from './types';
import {
  initialSchoolProfile,
  defaultGradeScale,
  defaultSessions,
  defaultTerms,
  defaultClasses,
  defaultSubjects,
  defaultStudents,
  defaultScores,
  defaultAttendance,
  defaultTeachers,
  defaultFeeItems,
  defaultSchoolExpenses,
  defaultExams,
  defaultExamSubmissions,
  defaultAnnouncements,
} from './data/seedData';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { StudentRegistrationView } from './components/StudentRegistrationView';
import { TeacherRegistrationView } from './components/TeacherRegistrationView';
import { TeacherClassesView } from './components/TeacherClassesView';
import { SecretaryDashboardView } from './components/SecretaryDashboardView';
import { GradeEntryView } from './components/GradeEntryView';
import { PositionsRankingView } from './components/PositionsRankingView';
import { AttendanceView } from './components/AttendanceView';
import { ReportsGeneratorView } from './components/ReportsGeneratorView';
import { AdminCentralDatabaseView } from './components/AdminCentralDatabaseView';
import { SetupView } from './components/SetupView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { AccountantDashboardView } from './components/AccountantDashboardView';
import { ExamCenterTeacherView } from './components/exam/ExamCenterTeacherView';
import { ExamCenterStudentView } from './components/exam/ExamCenterStudentView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CloudSyncReminderBanner } from './components/CloudSyncReminderBanner';
import { OfflineShareModal } from './components/OfflineShareModal';
import { safeGetItem, safeSetItem, safeClear } from './utils/storage';
import {
  saveTeacherToCloud,
  deleteTeacherFromCloud,
  saveStudentToCloud,
  deleteStudentFromCloud,
  saveScoresToCloud,
  saveAttendanceToCloud,
  saveFeePaymentToCloud,
  saveClassToCloud,
  saveBehavioralNoteToCloud,
  deleteBehavioralNoteFromCloud,
  saveClassSessionNoteToCloud,
  deleteClassSessionNoteFromCloud,
  saveExamToCloud,
  deleteExamFromCloud,
  saveExamSubmissionToCloud,
  saveAnnouncementToCloud,
  deleteAnnouncementFromCloud,
  logAuditEvent,
  testCloudConnection,
  fetchAllFromCloud,
  pushAllToCloud,
  CloudStatus,
} from './services/firebaseService';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Award,
  CalendarCheck,
  FileText,
  Settings,
  GraduationCap,
  Sparkles,
  Database,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Lock,
  BookOpen,
  Receipt,
  Cloud,
  RefreshCw,
  Share2,
  Download,
  FileArchive,
} from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './i18n/LanguageContext';
import { ArabicKeyboardFloatingToggle } from './context/ArabicKeyboardContext';

const STORAGE_KEY = 'kulliyyat_tatbiq_v2';

export default function App() {
  const { t, language, dir, isArabic, isHausa } = useLanguage();

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'secretary_portal'
    | 'teacher_classes'
    | 'student_portal'
    | 'exam_center'
    | 'bursary'
    | 'registration'
    | 'teachers'
    | 'grades'
    | 'positions'
    | 'attendance'
    | 'reports'
    | 'database'
    | 'setup'
  >(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_auth_user`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'secretary') return 'secretary_portal';
        if (parsed?.role === 'teacher') return 'teacher_classes';
        if (parsed?.role === 'student') return 'student_portal';
        if (parsed?.role === 'accountant') return 'bursary';
      } catch (e) {}
    }
    return 'dashboard';
  });

  // Offline Sharing Center State
  const [showOfflineShareModal, setShowOfflineShareModal] = useState(false);

  // Academic State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_profile`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.name.includes('Taṭbīq')) {
          if (
            !parsed.mudirName ||
            parsed.mudirName === 'Ustadh Al-Mudir' ||
            parsed.mudirName.includes('Al-Mudir')
          ) {
            parsed.mudirName = 'Principal Abubakar Alhassan';
          }
          if (
            !parsed.address ||
            parsed.address.includes('Plot 12') ||
            parsed.address.includes('Islamic Education Complex')
          ) {
            parsed.address = 'Kasuwan Magani Campus';
          }
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return initialSchoolProfile;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_classes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((c: SchoolClass) => c.id));
          const existingNames = new Set(parsed.map((c: SchoolClass) => c.name.toLowerCase()));
          const missingDefaults = defaultClasses.filter(
            (dc) => !existingIds.has(dc.id) && !existingNames.has(dc.name.toLowerCase())
          );
          return [...parsed, ...missingDefaults];
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultClasses;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_subjects`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: Subject) => s.id));
          const existingCodes = new Set(parsed.map((s: Subject) => s.code.toUpperCase()));
          const missingDefaults = defaultSubjects.filter(
            (ds) => !existingIds.has(ds.id) && !existingCodes.has(ds.code.toUpperCase())
          );
          return [...parsed, ...missingDefaults];
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultSubjects;
  });

  const [sessions] = useState<AcademicSession[]>(defaultSessions);
  const [terms] = useState<Term[]>(defaultTerms);
  const [currentSessionId, setCurrentSessionId] = useState<string>(defaultSessions[0].id);
  const [currentTermId, setCurrentTermId] = useState<string>(defaultTerms[2].id); // default 3rd term

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_students`);
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: Student) => s.id));
          const missingDefaults = defaultStudents.filter((ds) => !existingIds.has(ds.id));
          return [...parsed, ...missingDefaults];
        }
      } catch (e) {
        return defaultStudents;
      }
    }
    return defaultStudents;
  });

  const [scores, setScores] = useState<ScoreRecord[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_scores`);
    if (saved) {
      try {
        const parsed: ScoreRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        return defaultScores;
      }
    }
    return defaultScores;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_attendance`);
    if (saved) {
      try {
        const parsed: AttendanceRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        return defaultAttendance;
      }
    }
    return defaultAttendance;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_teachers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return defaultTeachers;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_audit_logs`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'log_init',
        action: 'SYSTEM_BOOTSTRAP',
        details: 'Centralized database initialized with faculties and curriculum records.',
        timestamp: new Date().toISOString(),
        actor: 'Mudir / Admin',
      },
    ];
  });

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>(
    students[0]?.id || ''
  );

  const [selectedStudentForDashboard, setSelectedStudentForDashboard] = useState<string>('');

  const [behavioralNotes, setBehavioralNotes] = useState<BehavioralNote[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_behavioral_notes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [classSessionNotes, setClassSessionNotes] = useState<ClassSessionNote[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_class_session_notes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'note_demo_1',
        classId: 'cls_idadi_1',
        className: "I'dadi 1 (JSS 1)",
        subjectId: 'subj_quran',
        subjectName: "Al-Qur'an & Tajweed",
        teacherId: 'tch_1789473363124_ew74',
        teacherName: 'Mustapha Danmari',
        date: '2026-09-18',
        period: 'Period 1 (08:00 - 08:45 AM)',
        sessionType: 'Tahfiz / Recitation',
        topic: 'Surah Al-Mulk (Verses 1 - 10) Memorization & Ahkam Al-Nun Al-Sakinah',
        notes: 'Students practiced oral recitation in pairs. Emphasized Idgham with Ghunnah.',
        homework: 'Memorize verses 1 to 10 for tomorrow oral evaluation.',
        sessionId: 'sess_2025_2026',
        termId: 'term_3',
        createdAt: '2026-09-18T08:50:00.000Z',
      },
    ];
  });

  // Bursary & Financial Accounts State
  const [feeItems, setFeeItems] = useState<FeeItem[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_fee_items`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultFeeItems;
  });

  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_fee_payments`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'pay_seed_001',
        receiptNumber: 'RCP-2026-00101',
        studentId: 'std_1',
        sessionId: '2026-2027',
        termId: 'term_1',
        feeItemId: 'fee_tuition_thanawi',
        amountPaid: 35000,
        paymentMethod: 'Bank Transfer',
        transactionRef: 'GTB-TRF-9923847',
        payerName: 'Alhaji Abubakar Kasuwan Magani',
        payerPhone: '08031234567',
        paymentDate: '2026-09-02',
        recordedBy: 'Mallam Usman Bello (Bursar)',
        academicSessionName: '2026/2027',
        termName: 'First Term (Al-Faṣl al-Awwal)',
        createdAt: '2026-09-02T09:30:00.000Z',
      },
      {
        id: 'pay_seed_002',
        receiptNumber: 'RCP-2026-00102',
        studentId: 'std_1',
        sessionId: '2026-2027',
        termId: 'term_1',
        feeItemId: 'fee_books_materials',
        amountPaid: 10000,
        paymentMethod: 'Cash',
        payerName: 'Alhaji Abubakar Kasuwan Magani',
        payerPhone: '08031234567',
        paymentDate: '2026-09-02',
        recordedBy: 'Mallam Usman Bello (Bursar)',
        academicSessionName: '2026/2027',
        termName: 'First Term (Al-Faṣl al-Awwal)',
        createdAt: '2026-09-02T09:35:00.000Z',
      },
      {
        id: 'pay_seed_003',
        receiptNumber: 'RCP-2026-00103',
        studentId: 'std_2',
        sessionId: '2026-2027',
        termId: 'term_1',
        feeItemId: 'fee_tuition_idadi',
        amountPaid: 25000,
        paymentMethod: 'POS',
        transactionRef: 'POS-OPAY-883491',
        payerName: 'Hajiya Maryam Umar',
        payerPhone: '08029876543',
        paymentDate: '2026-09-04',
        recordedBy: 'Mallam Usman Bello (Bursar)',
        academicSessionName: '2026/2027',
        termName: 'First Term (Al-Faṣl al-Awwal)',
        createdAt: '2026-09-04T11:20:00.000Z',
      },
      {
        id: 'pay_seed_004',
        receiptNumber: 'RCP-2026-00104',
        studentId: 'std_3',
        sessionId: '2026-2027',
        termId: 'term_1',
        feeItemId: 'fee_tahfiz_hifz',
        amountPaid: 30000,
        paymentMethod: 'Bank Transfer',
        transactionRef: 'KUD-TRF-110293',
        payerName: 'Sheikh Muhammad Bello',
        payerPhone: '08134455667',
        paymentDate: '2026-09-08',
        recordedBy: 'Mallam Usman Bello (Bursar)',
        academicSessionName: '2026/2027',
        termName: 'First Term (Al-Faṣl al-Awwal)',
        createdAt: '2026-09-08T13:45:00.000Z',
      },
    ];
  });

  const [feeWaivers, setFeeWaivers] = useState<FeeWaiver[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_fee_waivers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [schoolExpenses, setSchoolExpenses] = useState<SchoolExpense[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_school_expenses`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultSchoolExpenses;
  });

  // Dedicated CBT Examination Center State (Teacher Created & Scheduled)
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_exams`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((e: Exam) => e.id));
          const missingDefaults = defaultExams.filter((de) => !existingIds.has(de.id));
          return [...parsed, ...missingDefaults];
        }
      } catch (e) {}
    }
    return defaultExams;
  });

  const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_exam_submissions`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return defaultExamSubmissions;
  });

  // School Announcements & Circulars State (Managed by Secretary Desk for Students & Parents)
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_announcements`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultAnnouncements;
  });

  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = safeGetItem(`${STORAGE_KEY}_auth_user`);
    if (saved) {
      try {
        const parsed: AuthUser = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  // Cloud Database Sync State
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    isConnected: false,
    projectId: 'gen-lang-client-0589561651',
    databaseId: 'ai-studio-kulliyyattabqatt-77d023d9-fd99-4bae-b38f-1fbfd7984982',
    lastSynced: null,
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Background boot-up synchronization with centralized Firestore database
  useEffect(() => {
    let isMounted = true;
    const syncWithCloudOnBoot = async () => {
      try {
        const status = await testCloudConnection();
        if (!isMounted) return;
        setCloudStatus(status);

        if (status.isConnected) {
          const cloudData = await fetchAllFromCloud();
          if (!isMounted) return;

          if (cloudData && cloudData.students && cloudData.students.length > 0) {
            // Hydrate local state from cloud
            setStudents(cloudData.students);
            if (cloudData.teachers?.length) setTeachers(cloudData.teachers);
            if (cloudData.classes?.length) setClasses(cloudData.classes);
            if (cloudData.subjects?.length) setSubjects(cloudData.subjects);
            if (cloudData.scores?.length) setScores(cloudData.scores);
            if (cloudData.attendance?.length) setAttendance(cloudData.attendance);
            if (cloudData.schoolProfile) setSchoolProfile(cloudData.schoolProfile);
            if (cloudData.behavioralNotes?.length) setBehavioralNotes(cloudData.behavioralNotes);
            if (cloudData.classSessionNotes?.length) setClassSessionNotes(cloudData.classSessionNotes);
            if (cloudData.feePayments?.length) setFeePayments(cloudData.feePayments);
            if (cloudData.schoolExpenses?.length) setSchoolExpenses(cloudData.schoolExpenses);
            if (cloudData.exams?.length) setExams(cloudData.exams);
            if (cloudData.examSubmissions?.length) setExamSubmissions(cloudData.examSubmissions);
            if (cloudData.announcements?.length) setAnnouncements(cloudData.announcements);
            setCloudStatus((prev) => ({ ...prev, lastSynced: new Date().toISOString() }));
          } else {
            // Cloud is empty, push initial school data to seed Firestore
            await pushAllToCloud({
              students,
              teachers,
              classes,
              subjects,
              scores,
              attendance,
              schoolProfile,
              behavioralNotes,
              classSessionNotes,
              feePayments,
              schoolExpenses,
              exams,
              examSubmissions,
              announcements,
            });
            setCloudStatus((prev) => ({ ...prev, lastSynced: new Date().toISOString() }));
          }
        }
      } catch (err) {
        console.warn('Background Firestore sync notice:', err);
      }
    };

    syncWithCloudOnBoot();

    const handleOnline = () => {
      syncWithCloudOnBoot();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const res = await testCloudConnection();
      setCloudStatus(res);
      if (res.isConnected) {
        await pushAllToCloud({
          students,
          teachers,
          classes,
          subjects,
          scores,
          attendance,
          schoolProfile,
          behavioralNotes,
          classSessionNotes,
          feePayments,
          schoolExpenses,
          exams,
          examSubmissions,
          announcements,
        });
        setCloudStatus((prev) => ({ ...prev, lastSynced: new Date().toISOString() }));
      }
    } catch (e) {
      console.warn('Manual cloud sync notice:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      safeSetItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
    }
  }, [currentUser]);

  // Grade Entry Target Navigation State (from Teacher Portal)
  const [gradeEntryTarget, setGradeEntryTarget] = useState<{
    classId?: string;
    subjectId?: string;
    viewMode?: 'weekly' | 'summary' | 'combined';
    studentId?: string;
  } | null>(null);

  const handleNavigateToGradeEntry = (
    classId: string,
    subjectId?: string,
    viewMode?: 'weekly' | 'summary' | 'combined',
    studentId?: string
  ) => {
    setGradeEntryTarget({ classId, subjectId, viewMode, studentId });
    setActiveTab('grades');
  };

  const handleLoginSuccess = (user: AuthUser, initialTab?: string) => {
    setCurrentUser(user);
    // Role-based initial landing
    if (initialTab) {
      setActiveTab(initialTab as any);
    } else if (user.role === 'secretary') {
      setActiveTab('secretary_portal');
    } else if (user.role === 'teacher') {
      setActiveTab('teacher_classes');
    } else if (user.role === 'student') {
      setActiveTab('student_portal');
    } else if (user.role === 'accountant') {
      setActiveTab('bursary');
    } else {
      setActiveTab('dashboard');
    }
    const roleLabel =
      user.role === 'super_admin'
        ? 'Super User / Mudir'
        : user.role === 'secretary'
        ? 'School Secretary & Admissions Registrar'
        : user.role === 'student'
        ? 'Enrolled Student'
        : user.role === 'accountant'
        ? 'School Bursar & Accountant'
        : 'Faculty Teacher';

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'USER_LOGIN',
      details: `${user.name} (${roleLabel}) signed in to portal.`,
      timestamp: new Date().toISOString(),
      actor: user.name,
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleLogout = () => {
    const actorName = currentUser ? currentUser.name : 'User';
    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'USER_LOGOUT',
      details: `${actorName} signed out of portal session.`,
      timestamp: new Date().toISOString(),
      actor: actorName,
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
    setCurrentUser(null);
  };

  // Persistence Effects
  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_profile`, JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_subjects`, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_scores`, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_teachers`, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_fee_items`, JSON.stringify(feeItems));
  }, [feeItems]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_fee_payments`, JSON.stringify(feePayments));
  }, [feePayments]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_fee_waivers`, JSON.stringify(feeWaivers));
  }, [feeWaivers]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_school_expenses`, JSON.stringify(schoolExpenses));
  }, [schoolExpenses]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_behavioral_notes`, JSON.stringify(behavioralNotes));
  }, [behavioralNotes]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_class_session_notes`, JSON.stringify(classSessionNotes));
  }, [classSessionNotes]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_exams`, JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_exam_submissions`, JSON.stringify(examSubmissions));
  }, [examSubmissions]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_announcements`, JSON.stringify(announcements));
  }, [announcements]);

  const handleSaveAnnouncement = async (ann: SchoolAnnouncement) => {
    setAnnouncements((prev) => {
      const idx = prev.findIndex((a) => a.id === ann.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = ann;
        return copy;
      }
      return [ann, ...prev];
    });
    saveAnnouncementToCloud(ann).catch(() => {});
    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'ANNOUNCEMENT_POSTED',
      details: `Circular notice "${ann.title}" published for ${ann.targetAudience}.`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'School Secretary',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    const target = announcements.find((a) => a.id === annId);
    setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
    deleteAnnouncementFromCloud(annId).catch(() => {});
    if (target) {
      const audit: AuditLog = {
        id: `log_${Date.now()}`,
        action: 'ANNOUNCEMENT_DELETED',
        details: `Circular notice "${target.title}" removed from school bulletin.`,
        timestamp: new Date().toISOString(),
        actor: currentUser?.name || 'School Secretary',
      };
      setAuditLogs((prev) => [audit, ...prev]);
      logAuditEvent(audit).catch(() => {});
    }
  };

  const handleSaveExam = async (exam: Exam) => {
    setExams((prev) => {
      const idx = prev.findIndex((e) => e.id === exam.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = exam;
        return copy;
      }
      return [exam, ...prev];
    });
    saveExamToCloud(exam).catch(() => {});
  };

  const handleDeleteExam = async (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    deleteExamFromCloud(examId).catch(() => {});
  };

  const handleSyncExamScoreToGradebook = (submission: ExamSubmission) => {
    setScores((prevScores) => {
      const existingScoreIdx = prevScores.findIndex(
        (s) =>
          s.studentId === submission.studentId &&
          s.subjectId === submission.subjectId &&
          s.termId === submission.termId
      );

      const examMarks = submission.totalScore;

      if (existingScoreIdx >= 0) {
        const existing = prevScores[existingScoreIdx];
        const newTotal = (existing.ca1 || 0) + (existing.ca2 || 0) + examMarks;
        let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
        let remark = 'Fail (Rasib)';
        if (newTotal >= 70) { grade = 'A'; remark = 'Distinction (Mumtaz)'; }
        else if (newTotal >= 60) { grade = 'B'; remark = 'Very Good (Jayyid Jiddan)'; }
        else if (newTotal >= 50) { grade = 'C'; remark = 'Good (Jayyid)'; }
        else if (newTotal >= 45) { grade = 'D'; remark = 'Pass (Maqbool)'; }
        else if (newTotal >= 40) { grade = 'E'; remark = 'Fair (Da\'eef)'; }

        const updatedScore: ScoreRecord = {
          ...existing,
          exam: examMarks,
          total: newTotal,
          grade,
          remark,
        };
        const copy = [...prevScores];
        copy[existingScoreIdx] = updatedScore;
        saveScoresToCloud([updatedScore]).catch(() => {});
        return copy;
      } else {
        const newTotal = examMarks;
        let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
        let remark = 'Fail (Rasib)';
        if (newTotal >= 70) { grade = 'A'; remark = 'Distinction (Mumtaz)'; }
        else if (newTotal >= 60) { grade = 'B'; remark = 'Very Good (Jayyid Jiddan)'; }
        else if (newTotal >= 50) { grade = 'C'; remark = 'Good (Jayyid)'; }
        else if (newTotal >= 45) { grade = 'D'; remark = 'Pass (Maqbool)'; }
        else if (newTotal >= 40) { grade = 'E'; remark = 'Fair (Da\'eef)'; }

        const newScore: ScoreRecord = {
          id: `scr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentId: submission.studentId,
          subjectId: submission.subjectId,
          classId: submission.classId,
          sessionId: submission.sessionId,
          termId: submission.termId,
          ca1: 0,
          ca2: 0,
          exam: examMarks,
          total: newTotal,
          grade,
          remark,
        };
        saveScoresToCloud([newScore]).catch(() => {});
        return [...prevScores, newScore];
      }
    });
  };

  const handleSubmitExam = async (submission: ExamSubmission) => {
    setExamSubmissions((prev) => [submission, ...prev.filter((s) => s.id !== submission.id)]);
    saveExamSubmissionToCloud(submission).catch(() => {});
    handleSyncExamScoreToGradebook(submission);
  };

  const handleSaveClassSessionNote = async (note: ClassSessionNote) => {
    setClassSessionNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = note;
        return updated;
      }
      return [note, ...prev];
    });
    try {
      await saveClassSessionNoteToCloud(note);
    } catch (e) {
      console.warn('Could not save session note to cloud:', e);
    }
  };

  const handleDeleteClassSessionNote = async (noteId: string) => {
    setClassSessionNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await deleteClassSessionNoteFromCloud(noteId);
    } catch (e) {
      console.warn('Could not delete session note from cloud:', e);
    }
  };

  // Bursary Handlers
  const handleSavePayment = (payment: FeePayment) => {
    setFeePayments((prev) => [payment, ...prev.filter((p) => p.id !== payment.id)]);
    saveFeePaymentToCloud(payment).catch(() => {});
    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'FEE_PAYMENT_RECORDED',
      details: `Recorded school fee payment of ₦${payment.amountPaid.toLocaleString()} (Receipt: ${payment.receiptNumber}).`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'Accountant',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleSaveExpense = (expense: SchoolExpense) => {
    setSchoolExpenses((prev) => [expense, ...prev.filter((e) => e.id !== expense.id)]);
    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'EXPENSE_RECORDED',
      details: `Created expense voucher ${expense.voucherNumber} for ${expense.description} (₦${expense.amount.toLocaleString()}).`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'Accountant',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleUpdateExpenseStatus = (
    expenseId: string,
    status: 'Pending' | 'Approved' | 'Paid' | 'Rejected',
    approvedBy?: string
  ) => {
    setSchoolExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              status,
              approvedBy: approvedBy || e.approvedBy,
              approvedAt: status === 'Approved' ? new Date().toISOString() : e.approvedAt,
            }
          : e
      )
    );
  };

  const handleSaveWaiver = (waiver: FeeWaiver) => {
    setFeeWaivers((prev) => [waiver, ...prev.filter((w) => w.id !== waiver.id)]);
  };

  const handleAddFeeItem = (item: FeeItem) => {
    setFeeItems((prev) => [...prev, item]);
  };

  const handleUpdateFeeItem = (item: FeeItem) => {
    setFeeItems((prev) => prev.map((f) => (f.id === item.id ? item : f)));
  };

  const handleDeleteFeeItem = (itemId: string) => {
    setFeeItems((prev) => prev.filter((f) => f.id !== itemId));
  };

  // Handlers
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'>): Student => {
    const defaultPin = newStudentData.pin || Math.floor(100000 + Math.random() * 900000).toString();
    const newStudent: Student = {
      ...newStudentData,
      pin: defaultPin,
      password: newStudentData.password || defaultPin,
      hasSetPassword: true,
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setStudents((prev) => [newStudent, ...prev]);
    saveStudentToCloud(newStudent).catch(() => {});

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'STUDENT_ENROLLED',
      details: `Enrolled student ${newStudent.fullName} (${newStudent.regNo}) and auto-generated portal credentials.`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'Super Admin',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
    return newStudent;
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    saveStudentToCloud(updatedStudent).catch(() => {});
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setScores((prev) => prev.filter((sc) => sc.studentId !== studentId));
    setAttendance((prev) => prev.filter((att) => att.studentId !== studentId));
    deleteStudentFromCloud(studentId).catch(() => {});
  };

  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers((prev) => [newTeacher, ...prev]);

    // If teacher is assigned to a class, auto-wire classTeacher and assignedTeacherId
    if (newTeacher.assignedClassId) {
      setClasses((prevClasses) =>
        prevClasses.map((cls) => {
          if (cls.id === newTeacher.assignedClassId) {
            const updatedCls = {
              ...cls,
              classTeacher: newTeacher.fullName,
              assignedTeacherId: newTeacher.id,
            };
            saveClassToCloud(updatedCls).catch(() => {});
            return updatedCls;
          }
          return cls;
        })
      );
    }

    saveTeacherToCloud(newTeacher).catch(() => {});

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'TEACHER_REGISTERED',
      details: `Registered ${newTeacher.fullName} (${newTeacher.staffId}) and auto-wired to report cards.`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );

    // Auto-update class assignment
    setClasses((prevClasses) =>
      prevClasses.map((cls) => {
        if (cls.id === updatedTeacher.assignedClassId) {
          const updatedCls = {
            ...cls,
            classTeacher: updatedTeacher.fullName,
            assignedTeacherId: updatedTeacher.id,
          };
          saveClassToCloud(updatedCls).catch(() => {});
          return updatedCls;
        }
        if (cls.assignedTeacherId === updatedTeacher.id && cls.id !== updatedTeacher.assignedClassId) {
          return {
            ...cls,
            assignedTeacherId: undefined,
          };
        }
        return cls;
      })
    );

    saveTeacherToCloud(updatedTeacher).catch(() => {});

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'TEACHER_UPDATED',
      details: `Updated teacher ${updatedTeacher.fullName} profile and wired form class.`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));

    setClasses((prevClasses) =>
      prevClasses.map((cls) =>
        cls.assignedTeacherId === teacherId
          ? { ...cls, assignedTeacherId: undefined }
          : cls
      )
    );

    deleteTeacherFromCloud(teacherId).catch(() => {});

    if (teacher) {
      const audit: AuditLog = {
        id: `log_${Date.now()}`,
        action: 'TEACHER_REMOVED',
        details: `Deleted teacher ${teacher.fullName} from centralized records.`,
        timestamp: new Date().toISOString(),
        actor: 'Admin',
      };
      setAuditLogs((prev) => [audit, ...prev]);
      logAuditEvent(audit).catch(() => {});
    }
  };

  const handleSaveScores = (updatedScores: ScoreRecord[]) => {
    setScores((prev) => {
      const remaining = prev.filter(
        (p) => !updatedScores.some((u) => u.id === p.id || (u.studentId === p.studentId && u.subjectId === p.subjectId && u.termId === p.termId))
      );
      return [...remaining, ...updatedScores];
    });
    saveScoresToCloud(updatedScores).catch(() => {});
  };

  const handleSaveAttendance = (updatedAttendance: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const remaining = prev.filter(
        (p) => !updatedAttendance.some((u) => u.id === p.id || (u.studentId === p.studentId && u.termId === p.termId))
      );
      return [...remaining, ...updatedAttendance];
    });
    saveAttendanceToCloud(updatedAttendance).catch(() => {});
  };

  const handleResetData = () => {
    setSchoolProfile(initialSchoolProfile);
    setClasses(defaultClasses);
    setSubjects(defaultSubjects);
    setStudents(defaultStudents);
    setTeachers(defaultTeachers);
    setScores(defaultScores);
    setAttendance(defaultAttendance);
    safeClear();
  };

  const handleAddBehavioralNote = (noteData: Omit<BehavioralNote, 'id' | 'createdAt'>) => {
    const newNote: BehavioralNote = {
      ...noteData,
      id: `bn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isPrivate: true,
    };
    setBehavioralNotes((prev) => [newNote, ...prev]);

    saveBehavioralNoteToCloud(newNote).catch((err) =>
      console.warn('Could not sync behavioral note to cloud:', err)
    );

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'LOG_BEHAVIORAL_NOTE',
      details: `${noteData.type === 'positive' ? 'Positive observation' : 'Constructive guidance'} recorded for student ID ${noteData.studentId} (${noteData.category})`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'Faculty Member',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleDeleteBehavioralNote = (noteId: string) => {
    setBehavioralNotes((prev) => prev.filter((n) => n.id !== noteId));

    deleteBehavioralNoteFromCloud(noteId).catch((err) =>
      console.warn('Could not delete behavioral note from cloud:', err)
    );

    const audit: AuditLog = {
      id: `log_${Date.now()}`,
      action: 'DELETE_BEHAVIORAL_NOTE',
      details: `Behavioral note ${noteId} deleted`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.name || 'Faculty Member',
    };
    setAuditLogs((prev) => [audit, ...prev]);
    logAuditEvent(audit).catch(() => {});
  };

  const handleCentralDataRestored = (payload: {
    students?: Student[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
    subjects?: Subject[];
    scores?: ScoreRecord[];
    attendance?: AttendanceRecord[];
    schoolProfile?: SchoolProfile;
    behavioralNotes?: BehavioralNote[];
    classSessionNotes?: ClassSessionNote[];
  }) => {
    if (payload.students) setStudents(payload.students);
    if (payload.teachers) setTeachers(payload.teachers);
    if (payload.classes) setClasses(payload.classes);
    if (payload.subjects) setSubjects(payload.subjects);
    if (payload.scores) setScores(payload.scores);
    if (payload.attendance) setAttendance(payload.attendance);
    if (payload.schoolProfile) setSchoolProfile(payload.schoolProfile);
    if (payload.behavioralNotes) setBehavioralNotes(payload.behavioralNotes);
    if (payload.classSessionNotes) setClassSessionNotes(payload.classSessionNotes);
  };

  const handleAddAuditLog = (log: AuditLog) => {
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleImportData = (
    data: BackupDataPayload,
    mode: 'replace' | 'merge' = 'replace'
  ) => {
    if (mode === 'replace') {
      if (data.students) setStudents(data.students);
      if (data.scores) setScores(data.scores);
      if (data.attendance) setAttendance(data.attendance);
      if (data.classes && data.classes.length > 0) setClasses(data.classes);
      if (data.subjects && data.subjects.length > 0) setSubjects(data.subjects);
      if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
    } else {
      // Merge mode
      if (data.students && data.students.length > 0) {
        setStudents((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newStudents = data.students.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newStudents];
        });
      }
      if (data.scores && data.scores.length > 0) {
        setScores((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newScores = data.scores.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newScores];
        });
      }
      if (data.attendance && data.attendance.length > 0) {
        setAttendance((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newAtt = data.attendance.filter((a) => !existingIds.has(a.id));
          return [...prev, ...newAtt];
        });
      }
      if (data.classes && data.classes.length > 0) {
        setClasses((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newClasses = data.classes!.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newClasses];
        });
      }
      if (data.subjects && data.subjects.length > 0) {
        setSubjects((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSubj = data.subjects!.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newSubj];
        });
      }
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const currentTerm = terms.find((t) => t.id === currentTermId) || terms[0];

  const handleSelectStudentAndShowReport = (studentId: string) => {
    setSelectedStudentForReport(studentId);
    setActiveTab('reports');
  };

  // If no user is authenticated, display the secure Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col justify-between font-sans selection:bg-emerald-200">
        <OfflineIndicator />
        <header className="p-3 sm:p-4 max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4E2D17] text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-4 h-4 text-[#debca3]" />
            </div>
            <span className="font-bold text-xs text-slate-900 hidden sm:inline">{schoolProfile.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              id="btn-login-offline-share"
              onClick={() => setShowOfflineShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4D0BD] bg-white hover:bg-[#FAF4ED] text-[#3E2213] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Share app offline via QR Code, Bluetooth, or export complete offline data package"
            >
              <Share2 className="w-3.5 h-3.5 text-[#5F341B]" />
              <span>Offline Share</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <LoginView
            schoolProfile={schoolProfile}
            teachers={teachers}
            classes={classes}
            students={students}
            onLoginSuccess={handleLoginSuccess}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateStudent={handleUpdateStudent}
          />
        </main>
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
          {schoolProfile.name} • {schoolProfile.address || 'Kasuwan Magani Campus'}
        </footer>

        {/* Offline Sharing Center Modal */}
        <OfflineShareModal
          isOpen={showOfflineShareModal}
          onClose={() => setShowOfflineShareModal(false)}
          students={students}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          scores={scores}
          attendance={attendance}
          schoolProfile={schoolProfile}
          feePayments={feePayments}
          behavioralNotes={behavioralNotes}
          classSessionNotes={classSessionNotes}
          onImportOfflinePackage={(imported) => {
            handleImportData({
              version: '2.5',
              exportedAt: new Date().toISOString(),
              students: imported.students,
              teachers: imported.teachers,
              classes: imported.classes,
              subjects: imported.subjects,
              scores: imported.scores,
              attendance: imported.attendance,
              schoolProfile: imported.schoolProfile,
            });
            setShowOfflineShareModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Application Navbar (hidden when printing) */}
      <header className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* School Crest & Brand Name */}
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-slate-900 text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5 flex-wrap">
                  <span>{schoolProfile.name}</span>
                  <span className="text-emerald-700 font-medium text-xs font-arabic hidden lg:inline" dir="rtl">
                    ({schoolProfile.arabicName})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                  <span>{schoolProfile.motto}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold">{schoolProfile.address}</span>
                </div>
              </div>
            </div>

            {/* Academic Session & Term Switchers + User Authentication */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              <PWAInstallButton />

              {/* Offline Sharing Center Button */}
              <button
                type="button"
                id="btn-header-offline-share"
                onClick={() => setShowOfflineShareModal(true)}
                title="Share application offline via QR code, Bluetooth, or export complete offline data package"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4D0BD] bg-[#FAF4ED] hover:bg-[#F2E7DC] text-[#3E2213] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#5F341B]" />
                <span className="hidden sm:inline">Offline Share</span>
                <span className="sm:hidden">Share</span>
              </button>

              {/* Central Cloud Database Sync Pill */}
              <button
                type="button"
                id="btn-cloud-sync-status"
                onClick={handleManualCloudSync}
                title={`Firestore Cloud Database: ${cloudStatus.isConnected ? 'Connected & Synchronized' : 'Offline Mode'} (${cloudStatus.databaseId})`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  cloudStatus.isConnected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {isCloudSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Cloud className={`w-3.5 h-3.5 ${cloudStatus.isConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
                )}
                <span className="hidden sm:inline">
                  {cloudStatus.isConnected ? 'Cloud Synced' : 'Offline Cache'}
                </span>
              </button>

              <div className="hidden md:block">
                <select
                  id="header-session-select"
                  value={currentSessionId}
                  onChange={(e) => setCurrentSessionId(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {sessions.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  id="header-term-select"
                  value={currentTermId}
                  onChange={(e) => setCurrentTermId(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* App Language Option (English, Arabic, Local Hausa) */}
              <LanguageSelector />

              {/* Authenticated User Badge & Logout */}
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs shadow-2xs">
                  {currentUser.role === 'super_admin' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : currentUser.role === 'secretary' ? (
                    <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : currentUser.role === 'student' ? (
                    <BookOpen className="w-4 h-4 text-teal-700 shrink-0" />
                  ) : currentUser.role === 'accountant' ? (
                    <Receipt className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold leading-none truncate max-w-[140px]">
                      {currentUser.title || (currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role === 'secretary' ? 'School Secretary' : currentUser.role === 'student' ? 'Student' : currentUser.role === 'accountant' ? 'School Bursar' : 'Faculty Member')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-header-logout"
                  onClick={handleLogout}
                  title="Sign Out / Switch Account"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {currentUser.role === 'student' && (
              <button
                id="nav-tab-student-portal"
                onClick={() => setActiveTab('student_portal')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'student_portal'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-bold hover:bg-emerald-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>My Academic Dashboard</span>
              </button>
            )}

            {currentUser.role === 'student' && (
              <button
                id="nav-tab-student-report"
                onClick={() => {
                  if (currentUser.studentId) {
                    setSelectedStudentForReport(currentUser.studentId);
                  }
                  setActiveTab('reports');
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'reports'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Terminal Report Card</span>
              </button>
            )}

            {/* Dedicated CBT Exam Center Button for Enrolled Students */}
            {currentUser.role === 'student' && (
              <button
                type="button"
                id="nav-tab-student-exam-center"
                onClick={() => setActiveTab('exam_center')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'exam_center'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-300/80 font-bold hover:bg-amber-100'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>CBT Exam Center</span>
              </button>
            )}

            {/* Dedicated Secretary Admissions & Registration Desk (Secretary & Super Admin) */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'secretary') && (
              <button
                id="nav-tab-secretary-portal"
                onClick={() => setActiveTab('secretary_portal')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'secretary_portal'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : currentUser.role === 'secretary'
                    ? 'bg-amber-50 text-amber-950 border border-amber-300 font-bold hover:bg-amber-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {currentUser.role === 'secretary'
                    ? 'Student Registration Desk (Mandated)'
                    : 'Secretary Desk (Student Admissions)'}
                </span>
                {currentUser.role === 'secretary' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-600 text-white font-bold uppercase">
                    Mandate
                  </span>
                )}
              </button>
            )}

            {/* Dedicated Bursary & Accounts Tab (Accountant & Super Admin) */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'accountant') && (
              <button
                id="nav-tab-bursary"
                onClick={() => setActiveTab('bursary')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'bursary'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : currentUser.role === 'accountant'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-bold hover:bg-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bursary & Accounts</span>
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'accountant' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-teacher-classes"
                onClick={() => setActiveTab('teacher_classes')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'teacher_classes'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : currentUser.role === 'teacher'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-bold hover:bg-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{currentUser.role === 'teacher' ? 'My Classes & Students' : 'Class Rosters (Teachers)'}</span>
              </button>
            )}

            {/* Dedicated CBT Examination Center for Teachers & Super Admin */}
            {currentUser.role !== 'student' && currentUser.role !== 'accountant' && currentUser.role !== 'secretary' && (
              <button
                type="button"
                id="nav-tab-exam-center"
                onClick={() => setActiveTab('exam_center')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'exam_center'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Exam Center (CBT)</span>
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
            )}

            {currentUser.role !== 'student' && (
              <button
                id="nav-tab-registration"
                onClick={() => setActiveTab('registration')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'registration'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {currentUser.role === 'secretary'
                    ? `Student Registration (${students.length})`
                    : `Students Directory (${students.length})`}
                </span>
                {currentUser.role !== 'secretary' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                    Sec. Mandate
                  </span>
                )}
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-teachers"
                onClick={() => setActiveTab('teachers')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'teachers'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Faculty Teachers & Designation ({teachers.length})</span>
                {currentUser.role === 'super_admin' ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                    Principal Mandate
                  </span>
                ) : (
                  <Lock className="w-3 h-3 text-amber-600 ml-0.5" title="Principal Only" />
                )}
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-grades"
                onClick={() => setActiveTab('grades')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'grades'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Grade Entry
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-positions"
                onClick={() => setActiveTab('positions')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'positions'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Class Rankings
              </button>
            )}

            {currentUser.role !== 'student' && currentUser.role !== 'secretary' && (
              <button
                id="nav-tab-attendance"
                onClick={() => setActiveTab('attendance')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'attendance'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Attendance
              </button>
            )}

            {currentUser.role !== 'student' && (
              <button
                id="nav-tab-reports"
                onClick={() => setActiveTab('reports')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'reports'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Report Cards & PDF
              </button>
            )}

            {currentUser.role !== 'student' && (
              <button
                id="nav-tab-database"
                onClick={() => setActiveTab('database')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'database'
                    ? 'bg-emerald-900 text-white ring-1 ring-emerald-400 shadow-2xs'
                    : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/60'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Central Database (Admin)</span>
                {currentUser.role !== 'super_admin' && (
                  <Lock className="w-3 h-3 text-amber-600 ml-0.5" title="Super User Only" />
                )}
              </button>
            )}

            {currentUser.role !== 'student' && (
              <button
                id="nav-tab-setup"
                onClick={() => setActiveTab('setup')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'setup'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Setup & Settings</span>
                {currentUser.role !== 'super_admin' && (
                  <Lock className="w-3 h-3 text-amber-600 ml-0.5" title="Super User Only" />
                )}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Gentle Periodic Cloud Sync Reminder Banner (Super Admin) */}
      <CloudSyncReminderBanner
        currentUserRole={currentUser.role}
        cloudStatus={cloudStatus}
        isCloudSyncing={isCloudSyncing}
        onTriggerSync={handleManualCloudSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Administrative Access Restriction Guard for Teachers and Students */}
        {currentUser.role !== 'super_admin' &&
          ['teachers', 'database', 'setup'].includes(activeTab) && (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Administrative Authorization Required
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                This administrative section ({activeTab === 'database' ? 'Central Cloud Firestore Database' : activeTab === 'teachers' ? 'Faculty Teachers Registration & Designation (Principal Mandate)' : 'College Setup & Settings'}) is strictly restricted and mandated to <strong>Principal Abubakar Alhassan</strong> (Super User / Mudir). Only the Principal possesses statutory authority to appoint faculty teachers and designate form classes and subjects.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-sm mx-auto">
                Logged in as: <span className="font-bold text-teal-800">{currentUser.name}</span> ({currentUser.title})
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      currentUser.role === 'student'
                        ? 'student_portal'
                        : currentUser.role === 'accountant'
                        ? 'bursary'
                        : 'grades'
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {currentUser.role === 'student'
                    ? 'Return to Student Dashboard'
                    : currentUser.role === 'accountant'
                    ? 'Return to Bursary Dashboard'
                    : 'Return to Grade Entry'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Sign In as Super User
                </button>
              </div>
            </div>
          )}

        {/* Dedicated School Secretary Admissions & Registration Dashboard */}
        {activeTab === 'secretary_portal' && (currentUser.role === 'super_admin' || currentUser.role === 'secretary') && (
          <SecretaryDashboardView
            students={students}
            classes={classes}
            schoolProfile={schoolProfile}
            currentUser={currentUser}
            announcements={announcements}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSelectForReport={(stdId) => {
              setSelectedStudentForReport(stdId);
              setActiveTab('reports');
            }}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onNavigateToStudentDashboard={(stdId) => {
              setSelectedStudentForDashboard(stdId);
              setActiveTab('student_portal');
            }}
          />
        )}

        {/* Dedicated School Accountant & Bursary Dashboard */}
        {activeTab === 'bursary' && (currentUser.role === 'super_admin' || currentUser.role === 'accountant') && (
          <AccountantDashboardView
            students={students}
            classes={classes}
            currentSession={currentSession}
            currentTerm={currentTerm}
            sessions={sessions}
            terms={terms}
            schoolProfile={schoolProfile}
            feeItems={feeItems}
            feePayments={feePayments}
            schoolExpenses={schoolExpenses}
            feeWaivers={feeWaivers}
            currentUser={currentUser}
            onSavePayment={handleSavePayment}
            onSaveExpense={handleSaveExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onSaveWaiver={handleSaveWaiver}
            onAddFeeItem={handleAddFeeItem}
            onUpdateFeeItem={handleUpdateFeeItem}
            onDeleteFeeItem={handleDeleteFeeItem}
          />
        )}

        {/* Dedicated Student Academic Dashboard */}
        {activeTab === 'student_portal' && (
          (() => {
            const activeStudent =
              (selectedStudentForDashboard && students.find((s) => s.id === selectedStudentForDashboard)) ||
              (currentUser.role === 'student'
                ? (students.find((s) => s.id === currentUser.studentId || s.id === currentUser.id) ||
                   students.find((s) => s.regNo === currentUser.regNo))
                : null) ||
              students[0];

            if (!activeStudent) {
              return (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <BookOpen className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-900">Student Profile Not Found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No active student record could be mapped to your session. Please contact the school administrator.
                  </p>
                </div>
              );
            }

            return (
              <StudentDashboardView
                student={activeStudent}
                classes={classes}
                subjects={subjects}
                scores={scores}
                attendance={attendance}
                allStudents={students}
                gradeScale={defaultGradeScale}
                schoolProfile={schoolProfile}
                currentSession={currentSession}
                currentTerm={currentTerm}
                sessions={sessions}
                terms={terms}
                currentUser={currentUser}
                behavioralNotes={behavioralNotes}
                onAddBehavioralNote={handleAddBehavioralNote}
                onDeleteBehavioralNote={handleDeleteBehavioralNote}
                onSelectStudent={(stdId) => setSelectedStudentForDashboard(stdId)}
                onViewOfficialReportCard={(stdId) => {
                  setSelectedStudentForReport(stdId);
                  setActiveTab('reports');
                }}
                onUpdateStudentPassword={(std, newPass) => {
                  const updated: Student = {
                    ...std,
                    password: newPass,
                    hasSetPassword: true,
                    passwordUpdatedAt: new Date().toISOString(),
                  };
                  handleUpdateStudent(updated);
                }}
                exams={exams}
                examSubmissions={examSubmissions}
                onSubmitExam={handleSubmitExam}
                announcements={announcements}
              />
            );
          })()
        )}

        {/* Dedicated CBT Examination Center Tab */}
        {activeTab === 'exam_center' && (
          currentUser.role === 'student' ? (
            (() => {
              const activeStudent =
                (selectedStudentForDashboard && students.find((s) => s.id === selectedStudentForDashboard)) ||
                students.find((s) => s.id === currentUser.studentId || s.id === currentUser.id) ||
                students.find((s) => s.regNo === currentUser.regNo) ||
                students[0];

              if (!activeStudent) {
                return (
                  <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm text-slate-500 text-xs">
                    No active student record could be mapped to this session. Please log in with approved registration details.
                  </div>
                );
              }

              return (
                <ExamCenterStudentView
                  student={activeStudent}
                  exams={exams}
                  submissions={examSubmissions}
                  currentSession={currentSession}
                  currentTerm={currentTerm}
                  onSubmitExam={handleSubmitExam}
                />
              );
            })()
          ) : (
            <ExamCenterTeacherView
              currentUser={currentUser}
              teachers={teachers}
              classes={classes}
              subjects={subjects}
              students={students}
              exams={exams}
              examSubmissions={examSubmissions}
              currentSession={currentSession}
              currentTerm={currentTerm}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onSyncExamScoreToGradebook={handleSyncExamScoreToGradebook}
            />
          )
        )}

        {activeTab === 'teacher_classes' && (
          <TeacherClassesView
            currentUser={currentUser}
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            students={students}
            scores={scores}
            attendance={attendance}
            currentSession={currentSession}
            currentTerm={currentTerm}
            gradeScale={defaultGradeScale}
            sessionNotes={classSessionNotes}
            onSaveSessionNote={handleSaveClassSessionNote}
            onDeleteSessionNote={handleDeleteClassSessionNote}
            onNavigateToGradeEntry={handleNavigateToGradeEntry}
            onNavigateToAttendance={(classId) => {
              setActiveTab('attendance');
            }}
            onNavigateToReports={(studentId) => {
              setSelectedStudentForReport(studentId);
              setActiveTab('reports');
            }}
            onNavigateToClassRankings={(classId) => {
              setActiveTab('positions');
            }}
            onNavigateToStudentDashboard={(studentId) => {
              setSelectedStudentForDashboard(studentId);
              setActiveTab('student_portal');
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            classes={classes}
            subjects={subjects}
            scores={scores}
            currentSession={currentSession}
            currentTerm={currentTerm}
            onNavigate={(tab) => setActiveTab(tab as any)}
            onSelectStudentForReport={handleSelectStudentAndShowReport}
          />
        )}

        {activeTab === 'registration' && (
          <StudentRegistrationView
            students={students}
            classes={classes}
            currentUserRole={currentUser.role}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSelectForReport={handleSelectStudentAndShowReport}
          />
        )}

        {activeTab === 'teachers' && currentUser.role === 'super_admin' && (
          <TeacherRegistrationView
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            currentUserRole={currentUser.role}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
          />
        )}

        {activeTab === 'grades' && (
          <GradeEntryView
            students={students}
            classes={classes}
            subjects={subjects}
            scores={scores}
            attendance={attendance}
            currentSession={currentSession}
            currentTerm={currentTerm}
            gradeScale={defaultGradeScale}
            currentUser={currentUser}
            targetClassId={gradeEntryTarget?.classId}
            targetSubjectId={gradeEntryTarget?.subjectId}
            targetViewMode={gradeEntryTarget?.viewMode}
            targetStudentId={gradeEntryTarget?.studentId}
            onBackToTeacherClasses={() => setActiveTab('teacher_classes')}
            onSaveScores={handleSaveScores}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsRankingView
            students={students}
            classes={classes}
            scores={scores}
            currentTerm={currentTerm}
            currentSession={currentSession}
            gradeScale={defaultGradeScale}
            onSelectStudentForReport={handleSelectStudentAndShowReport}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            classes={classes}
            attendance={attendance}
            currentTerm={currentTerm}
            currentSession={currentSession}
            currentUser={currentUser}
            onSaveAttendance={handleSaveAttendance}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsGeneratorView
            students={students}
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            scores={scores}
            attendance={attendance}
            currentTerm={currentTerm}
            currentSession={currentSession}
            terms={terms}
            sessions={sessions}
            schoolProfile={schoolProfile}
            gradeScale={defaultGradeScale}
            selectedStudentId={selectedStudentForReport}
            currentUser={currentUser}
            onSelectStudent={setSelectedStudentForReport}
            onSelectTerm={(termId) => setCurrentTermId(termId)}
            onSelectSession={(sessId) => setCurrentSessionId(sessId)}
          />
        )}

        {activeTab === 'database' && currentUser.role === 'super_admin' && (
          <AdminCentralDatabaseView
            students={students}
            teachers={teachers}
            classes={classes}
            subjects={subjects}
            scores={scores}
            attendance={attendance}
            schoolProfile={schoolProfile}
            currentSession={currentSession}
            currentTerm={currentTerm}
            auditLogs={auditLogs}
            behavioralNotes={behavioralNotes}
            classSessionNotes={classSessionNotes}
            onDataRestored={handleCentralDataRestored}
            onAddAuditLog={handleAddAuditLog}
          />
        )}

        {activeTab === 'setup' && currentUser.role === 'super_admin' && (
          <SetupView
            schoolProfile={schoolProfile}
            classes={classes}
            subjects={subjects}
            sessions={sessions}
            terms={terms}
            gradeScale={defaultGradeScale}
            students={students}
            scores={scores}
            attendance={attendance}
            onUpdateSchoolProfile={setSchoolProfile}
            onUpdateClasses={setClasses}
            onUpdateSubjects={setSubjects}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer (hidden when printing) */}
      <footer className="print:hidden border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-700 font-semibold">
            <span>{schoolProfile.name}</span>
            <span className="text-slate-300">•</span>
            <span className="italic text-emerald-800 font-normal">"{schoolProfile.motto}"</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-slate-600">
            <span>© {new Date().getFullYear()} All rights reserved by <strong className="text-slate-800 font-bold">Danmari brothers Ventures LLC</strong></span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>Address: A23 Aliyu makama road barnawa Kaduna, Nigeria</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
              🇳🇬 Made in Nigeria
            </span>
            <span>•</span>
            <span>Kulliyyat Assessment & Reporting Engine</span>
          </div>
        </div>
      </footer>

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />

      {/* Floating Arabic Keyboard Quick Toggle for Teachers, Secretary and Academic Views */}
      {(currentUser?.role === 'teacher' ||
        currentUser?.role === 'secretary' ||
        activeTab === 'teacher_classes' ||
        activeTab === 'secretary_portal' ||
        activeTab === 'exam_center' ||
        activeTab === 'grades') && (
        <ArabicKeyboardFloatingToggle />
      )}

      {/* Offline Sharing Center Modal */}
      <OfflineShareModal
        isOpen={showOfflineShareModal}
        onClose={() => setShowOfflineShareModal(false)}
        students={students}
        teachers={teachers}
        classes={classes}
        subjects={subjects}
        scores={scores}
        attendance={attendance}
        schoolProfile={schoolProfile}
        feePayments={feePayments}
        behavioralNotes={behavioralNotes}
        classSessionNotes={classSessionNotes}
        onImportOfflinePackage={(imported) => {
          handleImportData({
            version: '2.5',
            exportedAt: new Date().toISOString(),
            students: imported.students,
            teachers: imported.teachers,
            classes: imported.classes,
            subjects: imported.subjects,
            scores: imported.scores,
            attendance: imported.attendance,
            schoolProfile: imported.schoolProfile,
          });
          setShowOfflineShareModal(false);
        }}
      />
    </div>
  );
}
