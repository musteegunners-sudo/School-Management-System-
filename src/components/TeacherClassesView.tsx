import React, { useState, useMemo } from 'react';
import {
  Teacher,
  SchoolClass,
  Subject,
  Student,
  ScoreRecord,
  AttendanceRecord,
  Term,
  AcademicSession,
  GradeScaleItem,
  AuthUser,
  ClassSessionNote,
} from '../types';
import {
  calculateWeeklyTotal,
  scaleWeeklyToCa,
  calculateTotalScore,
  evaluateGradeAndRemark,
  normalizeWeeklyAssignments,
} from '../services/academicService';
import { ClassSessionNotesSection } from './ClassSessionNotesSection';
import { useArabicKeyboard } from '../context/ArabicKeyboardContext';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  FileText,
  UserCheck,
  ChevronRight,
  Award,
  Filter,
  ArrowUpDown,
  CalendarCheck,
  Building2,
  ExternalLink,
  Lock,
  Bookmark,
  Keyboard,
} from 'lucide-react';

interface TeacherClassesViewProps {
  currentUser: AuthUser | null;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  currentSession: AcademicSession;
  currentTerm: Term;
  gradeScale: GradeScaleItem[];
  sessionNotes?: ClassSessionNote[];
  onSaveSessionNote?: (note: ClassSessionNote) => void;
  onDeleteSessionNote?: (noteId: string) => void;
  onNavigateToGradeEntry: (
    classId: string,
    subjectId?: string,
    viewMode?: 'weekly' | 'summary' | 'combined',
    studentId?: string
  ) => void;
  onNavigateToAttendance?: (classId: string) => void;
  onNavigateToReports?: (studentId: string) => void;
  onNavigateToClassRankings?: (classId: string) => void;
  onNavigateToStudentDashboard?: (studentId: string) => void;
}

export const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({
  currentUser,
  teachers,
  classes,
  subjects,
  students,
  scores,
  attendance,
  currentSession,
  currentTerm,
  gradeScale,
  sessionNotes = [],
  onSaveSessionNote = () => {},
  onDeleteSessionNote = () => {},
  onNavigateToGradeEntry,
  onNavigateToAttendance,
  onNavigateToReports,
  onNavigateToClassRankings,
  onNavigateToStudentDashboard,
}) => {
  const {
    isOpen: isArabicKeyboardOpen,
    toggleKeyboard: toggleArabicKeyboard,
    openKeyboard: openArabicKeyboard,
  } = useArabicKeyboard();

  // If Super Admin is viewing, they can select which teacher's view to inspect or view all
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (currentUser?.role === 'teacher') {
      return currentUser.id;
    }
    return teachers[0]?.id || 'all';
  });

  // Effective teacher object (if a specific teacher is selected)
  const activeTeacher = useMemo(() => {
    if (currentUser?.role === 'teacher') {
      return teachers.find((t) => t.id === currentUser.id) || null;
    }
    if (selectedTeacherId === 'all') return null;
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [currentUser, teachers, selectedTeacherId]);

  // Determine assigned classes for the active teacher
  const assignedClassList = useMemo(() => {
    if (!activeTeacher) {
      return classes;
    }

    const assignedIds = new Set<string>();

    // 1. Direct form master assignment on teacher record
    if (activeTeacher.assignedClassId) {
      assignedIds.add(activeTeacher.assignedClassId);
    }

    // 2. Class record pointing to this teacher
    classes.forEach((cls) => {
      if (
        cls.assignedTeacherId === activeTeacher.id ||
        (cls.classTeacher &&
          cls.classTeacher.toLowerCase().trim() === activeTeacher.fullName.toLowerCase().trim())
      ) {
        assignedIds.add(cls.id);
      }
    });

    // If teacher has assigned classes, prioritize them, followed by other classes
    const directlyAssigned = classes.filter((c) => assignedIds.has(c.id));
    if (directlyAssigned.length > 0) {
      return directlyAssigned;
    }

    // Fallback: if no class is explicitly assigned yet, show all classes
    return classes;
  }, [activeTeacher, classes]);

  // Selected Class ID
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (currentUser?.role === 'teacher' && currentUser.assignedClassId) {
      return currentUser.assignedClassId;
    }
    return classes[0]?.id || '';
  });

  // Keep selectedClassId valid
  React.useEffect(() => {
    if (assignedClassList.length > 0 && !assignedClassList.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(assignedClassList[0].id);
    }
  }, [assignedClassList, selectedClassId]);

  // Active School Class object
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Subjects assigned to active teacher, or all subjects in this class
  const availableSubjects = useMemo(() => {
    if (activeTeacher?.assignedSubjectIds && activeTeacher.assignedSubjectIds.length > 0) {
      const teacherSubs = subjects.filter((s) => activeTeacher.assignedSubjectIds?.includes(s.id));
      if (teacherSubs.length > 0) return teacherSubs;
    }
    return subjects;
  }, [activeTeacher, subjects]);

  // Selected subject for focused grading overview
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || subjects[0]?.id || ''
  );

  React.useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubjectId]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [gradingFilter, setGradingFilter] = useState<'all' | 'graded' | 'needs_units' | 'needs_exam'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'regNo' | 'score' | 'attendance'>('name');
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'session_notes'>('roster');

  // Count of session notes for active class
  const classSessionNotesCount = useMemo(() => {
    if (!currentClass) return 0;
    return sessionNotes.filter(
      (n) => n.classId === currentClass.id && n.termId === currentTerm.id && n.sessionId === currentSession.id
    ).length;
  }, [sessionNotes, currentClass?.id, currentTerm.id, currentSession.id]);

  // Enrolled students in the selected class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass]);

  // Student metrics with grades and attendance for the selected subject
  interface StudentSummaryRow {
    student: Student;
    scoreRecord?: ScoreRecord;
    attendanceRecord?: AttendanceRecord;
    weeklyAssignments: number[];
    unitTotal: number;
    ca1: number;
    ca2: number;
    exam: number;
    total: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    remark: string;
    hasWeeklyMarks: boolean;
    hasTerminalMarks: boolean;
    attendanceRate: number;
    daysPresent: number;
    daysOpened: number;
  }

  const studentRows = useMemo<StudentSummaryRow[]>(() => {
    return classStudents.map((student) => {
      const score = scores.find(
        (sc) =>
          sc.studentId === student.id &&
          sc.classId === currentClass?.id &&
          sc.subjectId === selectedSubjectId &&
          sc.termId === currentTerm.id &&
          sc.sessionId === currentSession.id
      );

      const att = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.classId === currentClass?.id &&
          a.termId === currentTerm.id &&
          a.sessionId === currentSession.id
      );

      const weekly = normalizeWeeklyAssignments(score?.weeklyAssignments || Array(12).fill(0));
      const unitTotal = calculateWeeklyTotal(weekly);
      const hasWeeklyMarks = weekly.some((w) => w > 0);

      const ca1 = score ? Number(score.ca1) || 0 : scaleWeeklyToCa(unitTotal, 20);
      const ca2 = score ? Number(score.ca2) || 0 : 0;
      const exam = score ? Number(score.exam) || 0 : 0;
      const total = calculateTotalScore(ca1, ca2, exam);
      const hasTerminalMarks = Boolean(score && (score.ca1 > 0 || score.ca2 > 0 || score.exam > 0));

      const evalRes = evaluateGradeAndRemark(total, gradeScale);

      const opened = att?.timesOpened ?? 118;
      const present = att?.timesPresent ?? 0;
      const rate = opened > 0 ? Math.round((present / opened) * 100) : 0;

      return {
        student,
        scoreRecord: score,
        attendanceRecord: att,
        weeklyAssignments: weekly,
        unitTotal,
        ca1,
        ca2,
        exam,
        total,
        grade: evalRes.grade,
        remark: evalRes.remark,
        hasWeeklyMarks,
        hasTerminalMarks,
        attendanceRate: rate,
        daysPresent: present,
        daysOpened: opened,
      };
    });
  }, [
    classStudents,
    scores,
    attendance,
    currentClass?.id,
    selectedSubjectId,
    currentTerm.id,
    currentSession.id,
    gradeScale,
  ]);

  // Filtered & Sorted Student Rows
  const filteredStudents = useMemo(() => {
    return studentRows
      .filter((row) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = row.student.fullName.toLowerCase().includes(q);
          const matchesReg = row.student.regNo.toLowerCase().includes(q);
          const matchesGuardian = row.student.guardianName.toLowerCase().includes(q);
          const matchesArabic = row.student.arabicName?.toLowerCase().includes(q);
          if (!matchesName && !matchesReg && !matchesGuardian && !matchesArabic) {
            return false;
          }
        }

        // Gender filter
        if (genderFilter !== 'all' && row.student.gender !== genderFilter) {
          return false;
        }

        // Grading status filter
        if (gradingFilter === 'graded') {
          return row.hasWeeklyMarks || row.hasTerminalMarks;
        }
        if (gradingFilter === 'needs_units') {
          return !row.hasWeeklyMarks;
        }
        if (gradingFilter === 'needs_exam') {
          return !row.hasTerminalMarks;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.student.fullName.localeCompare(b.student.fullName);
        }
        if (sortBy === 'regNo') {
          return a.student.regNo.localeCompare(b.student.regNo);
        }
        if (sortBy === 'score') {
          return b.total - a.total;
        }
        if (sortBy === 'attendance') {
          return b.attendanceRate - a.attendanceRate;
        }
        return 0;
      });
  }, [studentRows, searchQuery, genderFilter, gradingFilter, sortBy]);

  // Overall Class Statistics for Current Subject
  const stats = useMemo(() => {
    const totalStudents = classStudents.length;
    const boysCount = classStudents.filter((s) => s.gender === 'Male').length;
    const girlsCount = classStudents.filter((s) => s.gender === 'Female').length;

    const studentsWithWeekly = studentRows.filter((r) => r.hasWeeklyMarks).length;
    const studentsWithTerminal = studentRows.filter((r) => r.hasTerminalMarks).length;

    const totalScoresSum = studentRows.reduce((acc, r) => acc + r.total, 0);
    const classAvgScore = totalStudents > 0 ? (totalScoresSum / totalStudents).toFixed(1) : '0.0';

    const totalAttendanceSum = studentRows.reduce((acc, r) => acc + r.attendanceRate, 0);
    const classAvgAttendance = totalStudents > 0 ? Math.round(totalAttendanceSum / totalStudents) : 0;

    const distinctions = studentRows.filter((r) => r.grade === 'A').length;

    return {
      totalStudents,
      boysCount,
      girlsCount,
      studentsWithWeekly,
      studentsWithTerminal,
      classAvgScore,
      classAvgAttendance,
      distinctions,
      weeklyCompletionRate: totalStudents > 0 ? Math.round((studentsWithWeekly / totalStudents) * 100) : 0,
      terminalCompletionRate: totalStudents > 0 ? Math.round((studentsWithTerminal / totalStudents) * 100) : 0,
    };
  }, [classStudents, studentRows]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Context Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-emerald-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-white text-2xl shadow-inner shrink-0">
              👨‍🏫
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Teacher Portal: My Classes & Students
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-500/40">
                  {currentSession.name} • {currentTerm.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl leading-relaxed">
                Comprehensive overview of your assigned classes, enrolled students, and rapid 1-click
                navigation to 12-week unit assignments and terminal exam scoring.
              </p>

              {/* Active Teacher Details Badge */}
              <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                {activeTeacher ? (
                  <>
                    <span className="font-bold text-white flex items-center gap-1.5 bg-emerald-800/60 px-3 py-1 rounded-xl border border-emerald-700/60">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                      {activeTeacher.fullName} {activeTeacher.arabicName ? `(${activeTeacher.arabicName})` : ''}
                    </span>
                    <span className="text-emerald-300 font-mono bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800">
                      Staff ID: {activeTeacher.staffId}
                    </span>
                    {activeTeacher.assignedClassId && (
                      <span className="bg-teal-800/60 text-teal-100 px-2.5 py-1 rounded-xl border border-teal-600/50 font-medium">
                        Form Master:{' '}
                        {classes.find((c) => c.id === activeTeacher.assignedClassId)?.name || 'Assigned'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-emerald-300 font-medium">
                    Showing all school classes (Administrative Master View)
                  </span>
                )}
              </div>

              {/* Arabic Keyboard Quick Trigger */}
              <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                <button
                  type="button"
                  id="btn-teacher-banner-arabic-keyboard"
                  onClick={toggleArabicKeyboard}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                    isArabicKeyboardOpen
                      ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                      : 'bg-emerald-800/90 hover:bg-emerald-700 text-white border border-emerald-600/60'
                  }`}
                  title="Toggle Arabic Virtual Keyboard for typing student names, remarks, lesson topics, and notes (Alt+A)"
                >
                  <Keyboard className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-arabic text-sm">لوحة المفاتيح العربية</span>
                  <span className="text-[10px] font-sans opacity-80">
                    {isArabicKeyboardOpen ? '(إخفاء)' : '(Arabic Keyboard)'}
                  </span>
                </button>
                <span className="text-[11px] text-emerald-200/80 hidden sm:inline">
                  • Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono text-[10px] border border-emerald-800">Alt + A</kbd>
                </span>
              </div>
            </div>
          </div>

          {/* Super Admin Switcher / Quick Action */}
          {currentUser?.role === 'super_admin' && (
            <div className="bg-emerald-950/80 p-3.5 rounded-2xl border border-emerald-700/60 shrink-0">
              <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5 uppercase tracking-wider">
                Viewing As Teacher (Principal View):
              </label>
              <select
                id="select-teacher-view-filter"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-900 border border-emerald-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="all">★ All Classes (Complete School Roster)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.staffId}) — {classes.find((c) => c.id === t.assignedClassId)?.name || 'Subject Teacher'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Classes Carousel / Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Assigned Classes ({assignedClassList.length})
            </h2>
            <span className="text-xs text-slate-500">
              — Select a class to view student roster and grading options
            </span>
          </div>

          {/* Quick toggle to view all classes if teacher teaches across grades */}
          {assignedClassList.length < classes.length && (
            <button
              onClick={() => {
                // If there are other classes, cycle or select all
                const nextClass = classes.find((c) => !assignedClassList.some((ac) => ac.id === c.id));
                if (nextClass) setSelectedClassId(nextClass.id);
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
            >
              View Other Classes
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {assignedClassList.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            const enrolledCount = students.filter((s) => s.classId === cls.id).length;
            const isFormMaster =
              activeTeacher &&
              (cls.id === activeTeacher.assignedClassId ||
                cls.assignedTeacherId === activeTeacher.id ||
                cls.classTeacher === activeTeacher.fullName);

            // Calculate class-level scores entered count
            const classScores = scores.filter(
              (sc) =>
                sc.classId === cls.id &&
                sc.termId === currentTerm.id &&
                sc.sessionId === currentSession.id
            );
            const recordedCount = new Set(classScores.map((s) => s.studentId)).size;
            const progress = enrolledCount > 0 ? Math.round((recordedCount / enrolledCount) * 100) : 0;

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-xs'
                }`}
              >
                {isFormMaster && (
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    ★ Your Class
                  </span>
                )}

                <div className="font-bold text-base leading-tight pr-16">{cls.name}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    isSelected ? 'text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  Section: {cls.section} • {cls.category}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 opacity-80" />
                    <span>{enrolledCount} Students</span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-emerald-800 text-emerald-100'
                        : progress > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {progress}% Graded
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isSelected ? 'bg-amber-400' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Class Action Hub & Subject Selector */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                Active Class
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {currentClass?.name} ({currentClass?.section})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                • {classStudents.length} Students Enrolled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select your subject below to review student marks, or click directly to launch grade entry.
            </p>
          </div>

          {/* Direct Navigation Action Buttons to Grade Entry */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-teacher-enter-weekly"
              onClick={() => onNavigateToGradeEntry(currentClass.id, selectedSubjectId, 'weekly')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
              title="Open 12-Week Unit Assignment Sheet for this class"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-200" />
              <span>Enter 12-Week Units (0-4)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              id="btn-teacher-enter-terminal"
              onClick={() => onNavigateToGradeEntry(currentClass.id, selectedSubjectId, 'summary')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
              title="Open Terminal CA & Exam Sheet for this class"
            >
              <ClipboardList className="w-3.5 h-3.5 text-teal-200" />
              <span>Enter CA & Exam (60)</span>
            </button>

            {onNavigateToAttendance && (
              <button
                onClick={() => onNavigateToAttendance(currentClass.id)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all"
                title="Open 12-Week Attendance Register"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Attendance</span>
              </button>
            )}

            {onNavigateToClassRankings && (
              <button
                onClick={() => onNavigateToClassRankings(currentClass.id)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all"
                title="View Academic Positions and Rankings"
              >
                <Award className="w-3.5 h-3.5 text-slate-600" />
                <span>Rankings</span>
              </button>
            )}

            <button
              id="btn-teacher-toggle-session-notes"
              onClick={() => setActiveSubTab(activeSubTab === 'session_notes' ? 'roster' : 'session_notes')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shadow-xs active:scale-95 ${
                activeSubTab === 'session_notes'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
              title="Log and review pedagogical session notes for this class"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>Session Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                {classSessionNotesCount}
              </span>
            </button>
          </div>
        </div>

        {/* Subject Chips / Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-600 shrink-0 mr-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            Subject for Grading:
          </span>
          {availableSubjects.map((sub) => {
            const isSubSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isSubSelected
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <span>{sub.name}</span>
                {sub.arabicName && (
                  <span
                    dir="rtl"
                    className={`text-[11px] font-arabic ${
                      isSubSelected ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    ({sub.arabicName})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Metric Ribbon for the Selected Subject */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-700 text-white font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-800 font-medium">12-Week Units Entered</div>
              <div className="text-lg font-bold text-emerald-950 font-mono">
                {stats.studentsWithWeekly} / {stats.totalStudents}{' '}
                <span className="text-xs font-normal text-emerald-700 font-sans">
                  ({stats.weeklyCompletionRate}%)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-700 text-white font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-teal-800 font-medium">Terminal Exam Entered</div>
              <div className="text-lg font-bold text-teal-950 font-mono">
                {stats.studentsWithTerminal} / {stats.totalStudents}{' '}
                <span className="text-xs font-normal text-teal-700 font-sans">
                  ({stats.terminalCompletionRate}%)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-700 text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-blue-800 font-medium">Class Average ({currentSubject.code})</div>
              <div className="text-lg font-bold text-blue-950 font-mono">
                {stats.classAvgScore}{' '}
                <span className="text-xs font-normal text-blue-700 font-sans">/ 100</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-700 text-white font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-amber-800 font-medium">Average Attendance</div>
              <div className="text-lg font-bold text-amber-950 font-mono">
                {stats.classAvgAttendance}%{' '}
                <span className="text-xs font-normal text-amber-700 font-sans">Present</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs: Student Roster & Assessment vs Class Session Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-1">
        <div className="flex items-center gap-2">
          <button
            id="tab-teacher-student-roster"
            onClick={() => setActiveSubTab('roster')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'roster'
                ? 'bg-emerald-900 text-white shadow-xs ring-1 ring-emerald-800'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Roster & Marks ({classStudents.length})</span>
          </button>

          <button
            id="tab-teacher-session-notes"
            onClick={() => setActiveSubTab('session_notes')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'session_notes'
                ? 'bg-emerald-900 text-white shadow-xs ring-1 ring-emerald-800'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span>Class Session Notes & Learning Logs</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === 'session_notes' ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {classSessionNotesCount}
            </span>
          </button>
        </div>

        {activeSubTab === 'roster' ? (
          <button
            onClick={() => setActiveSubTab('session_notes')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 font-bold"
          >
            <span>Class academic logs ({classSessionNotesCount} recorded)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setActiveSubTab('roster')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 font-bold"
          >
            <span>Back to student assessment marks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* View Content: Either Session Notes or Student Roster */}
      {activeSubTab === 'session_notes' ? (
        <ClassSessionNotesSection
          currentClass={currentClass}
          currentSubject={currentSubject}
          availableSubjects={availableSubjects}
          activeTeacher={activeTeacher}
          currentUser={currentUser}
          currentSession={currentSession}
          currentTerm={currentTerm}
          classStudentsCount={classStudents.length}
          sessionNotes={sessionNotes}
          onSaveSessionNote={onSaveSessionNote}
          onDeleteSessionNote={onDeleteSessionNote}
        />
      ) : (
        /* Summary List of Students in the Selected Class */
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Toolbar & Filters */}
          <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-teacher-search-students"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name, registration number, or guardian..."
              className="w-full pl-9 pr-16 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <button
              type="button"
              id="btn-open-arabic-kb-search"
              onClick={() => {
                openArabicKeyboard();
                const el = document.getElementById('input-teacher-search-students');
                if (el) el.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-emerald-800 hover:bg-emerald-100/80 text-[11px] font-bold font-arabic flex items-center gap-1 transition-colors border border-emerald-200 bg-emerald-50/80"
              title="Type Arabic search query using virtual keyboard (كتابة بالعربية)"
            >
              <Keyboard className="w-3 h-3 text-emerald-700" />
              <span>عربي</span>
            </button>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Gender Filter */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All ({classStudents.length})
              </button>
              <button
                onClick={() => setGenderFilter('Male')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === 'Male' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Boys ({stats.boysCount})
              </button>
              <button
                onClick={() => setGenderFilter('Female')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === 'Female' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Girls ({stats.girlsCount})
              </button>
            </div>

            {/* Grading Status Filter */}
            <select
              value={gradingFilter}
              onChange={(e) => setGradingFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Status: All</option>
              <option value="graded">Graded (Units or Exam)</option>
              <option value="needs_units">Needs 12-Wk Units</option>
              <option value="needs_exam">Needs Terminal Exam</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="regNo">Sort: Reg No</option>
              <option value="score">Sort: Score (Highest)</option>
              <option value="attendance">Sort: Attendance %</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Student Information</th>
                <th className="py-3 px-3 text-center w-28 bg-emerald-50/40">
                  <div className="font-bold text-emerald-950">12-Wk Units</div>
                  <div className="text-[10px] text-emerald-700 font-normal">Score / 48 (Avg)</div>
                </th>
                <th className="py-3 px-3 text-center w-20">CA 1 (20)</th>
                <th className="py-3 px-3 text-center w-20">CA 2 (20)</th>
                <th className="py-3 px-3 text-center w-20">Exam (60)</th>
                <th className="py-3 px-3 text-center w-24">
                  <div className="font-bold text-slate-900">Total (100)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Grade</div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="font-bold text-slate-800">Attendance</div>
                  <div className="text-[10px] text-slate-400 font-normal">Rate & Days</div>
                </th>
                <th className="py-3 px-4 min-w-[160px]">Guardian Contact</th>
                <th className="py-3 px-4 text-right min-w-[150px]">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-300" />
                      <div className="font-bold text-slate-700">No students found</div>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? `No student matches "${searchQuery}". Try changing your search query.`
                          : 'No students enrolled in this class yet. Enrol students in the Registration tab.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((row, idx) => {
                  const avg = (row.unitTotal / 12).toFixed(1);
                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Serial Number */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Student Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              row.student.gender === 'Male'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {row.student.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {row.student.fullName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="text-emerald-700 font-bold">{row.student.regNo}</span>
                              <span>•</span>
                              <span>{row.student.gender}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 12-Week Units Summary */}
                      <td className="py-3 px-3 text-center bg-emerald-50/30">
                        <div className="font-mono font-bold text-emerald-950">
                          {row.unitTotal === 0 ? '00' : row.unitTotal}
                          <span className="text-[10px] text-slate-400 font-normal">/48</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Avg: {avg} / 4.0
                        </div>
                      </td>

                      {/* CA 1 */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                        {row.ca1 > 0 ? row.ca1 : <span className="text-slate-400">00</span>}
                      </td>

                      {/* CA 2 */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                        {row.ca2 > 0 ? row.ca2 : <span className="text-slate-400">00</span>}
                      </td>

                      {/* Exam */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                        {row.exam > 0 ? row.exam : <span className="text-slate-400">00</span>}
                      </td>

                      {/* Total & Grade Badge */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {row.total > 0 ? row.total : '00'}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            row.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : row.grade === 'C'
                              ? 'bg-teal-100 text-teal-800'
                              : row.grade === 'D'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {row.grade} ({row.remark.split(' ')[0]})
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            row.attendanceRate >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.attendanceRate >= 70
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.attendanceRate}%
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {row.daysPresent}/{row.daysOpened}d
                        </div>
                      </td>

                      {/* Guardian Contact */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800 leading-tight">
                          {row.student.guardianName || 'Guardian'}
                        </div>
                        {row.student.guardianPhone && (
                          <a
                            href={`tel:${row.student.guardianPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-mono mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {row.student.guardianPhone}
                          </a>
                        )}
                      </td>

                      {/* Quick Navigation Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-grade-student-${row.student.id}`}
                            onClick={() =>
                              onNavigateToGradeEntry(
                                currentClass.id,
                                selectedSubjectId,
                                'weekly',
                                row.student.id
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-2xs active:scale-95"
                            title={`Open 12-Week assessment card for ${row.student.fullName}`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Grade</span>
                          </button>

                          {onNavigateToReports && (
                            <button
                              onClick={() => onNavigateToReports(row.student.id)}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                              title={`View full report card for ${row.student.fullName}`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onNavigateToStudentDashboard && (
                            <button
                              id={`btn-nav-behavioral-${row.student.id}`}
                              onClick={() => onNavigateToStudentDashboard(row.student.id)}
                              className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                              title={`View confidential behavioral notes & profile for ${row.student.fullName}`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredStudents.length}</span> of{' '}
            <span className="font-bold text-slate-800">{classStudents.length}</span> enrolled students
            in {currentClass.name}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              {stats.distinctions} Distinctions (A)
            </span>
            <span>•</span>
            <button
              onClick={() => onNavigateToGradeEntry(currentClass.id, selectedSubjectId, 'combined')}
              className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
            >
              <span>Open Full Matrix</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
