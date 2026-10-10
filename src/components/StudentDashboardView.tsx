import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  CalendarCheck,
  FileText,
  Clock,
  User,
  CheckCircle2,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  School,
  Sparkles,
  Phone,
  MapPin,
  Flame,
  AlertCircle,
  Lock,
  UserCheck,
  Compass,
  Smile,
  ShieldAlert,
  Bell,
  Pin,
  Megaphone,
  Search,
  Filter,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  SchoolProfile,
  AcademicSession,
  Term,
  GradeScaleItem,
  AuthUser,
  BehavioralNote,
  Exam,
  ExamSubmission,
  SchoolAnnouncement,
} from '../types';
import { defaultAnnouncements } from '../data/seedData';
import {
  generateStudentReportProfile,
  calculateWeeklyTotal,
} from '../services/academicService';
import { BehavioralNotesSection } from './BehavioralNotesSection';
import { ExamCenterStudentView } from './exam/ExamCenterStudentView';

interface StudentDashboardViewProps {
  student: Student;
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  allStudents: Student[];
  gradeScale: GradeScaleItem[];
  schoolProfile: SchoolProfile;
  currentSession: AcademicSession;
  currentTerm: Term;
  sessions: AcademicSession[];
  terms: Term[];
  currentUser?: AuthUser | null;
  behavioralNotes?: BehavioralNote[];
  onAddBehavioralNote?: (note: Omit<BehavioralNote, 'id' | 'createdAt'>) => void;
  onDeleteBehavioralNote?: (noteId: string) => void;
  onSelectStudent?: (studentId: string) => void;
  onViewOfficialReportCard?: (studentId: string) => void;
  onUpdateStudentPassword?: (student: Student, newPass: string) => void;
  exams?: Exam[];
  examSubmissions?: ExamSubmission[];
  onSubmitExam?: (submission: ExamSubmission) => void;
  announcements?: SchoolAnnouncement[];
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  classes,
  subjects,
  scores,
  attendance,
  allStudents,
  gradeScale,
  schoolProfile,
  currentSession,
  currentTerm,
  sessions,
  terms,
  currentUser,
  behavioralNotes = [],
  onAddBehavioralNote,
  onDeleteBehavioralNote,
  onSelectStudent,
  onViewOfficialReportCard,
  onUpdateStudentPassword,
  exams = [],
  examSubmissions = [],
  onSubmitExam = () => {},
  announcements = [],
}) => {
  const [selectedTermId, setSelectedTermId] = useState<string>(currentTerm.id);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession.id);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'results' | 'assignments' | 'attendance' | 'exam_center' | 'announcements' | 'security' | 'behavioral'
  >('overview');

  const studentAnnouncements = announcements.length > 0 ? announcements : defaultAnnouncements;
  const urgentOrPinnedAnnouncements = studentAnnouncements.filter((a) => a.isPinned || a.priority === 'urgent');

  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState<string>('ALL');
  const [announcementSearch, setAnnouncementSearch] = useState<string>('');

  const isFacultyOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'teacher';
  const studentBehavioralNotes = behavioralNotes.filter((n) => n.studentId === student.id);
  const positiveNotesCount = studentBehavioralNotes.filter((n) => n.type === 'positive').length;
  const constructiveNotesCount = studentBehavioralNotes.filter((n) => n.type === 'constructive').length;

  // Change password local state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const studentClass = classes.find((c) => c.id === student.classId) || {
    id: student.classId,
    name: 'Unassigned Class',
    category: 'I\'dadi (Junior)' as const,
    section: 'A',
  };

  const classStudents = allStudents.filter((s) => s.classId === student.classId);

  // Student Attendance record for selected term & session
  const studentAttendance = attendance.find(
    (a) =>
      a.studentId === student.id &&
      a.termId === selectedTermId &&
      a.sessionId === selectedSessionId
  );

  // Full academic profile calculation
  const reportProfile = generateStudentReportProfile(
    student,
    studentClass,
    subjects,
    scores,
    classStudents,
    gradeScale,
    studentAttendance,
    selectedTermId,
    selectedSessionId
  );

  const attendancePercentage =
    studentAttendance && studentAttendance.timesOpened > 0
      ? Math.round((studentAttendance.timesPresent / studentAttendance.timesOpened) * 100)
      : null;

  // Handler for password change
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (student.hasSetPassword && student.password) {
      if (currentPasswordInput !== student.password) {
        setSecurityMessage({ text: 'Current password does not match.', type: 'error' });
        return;
      }
    }

    if (!newPasswordInput || newPasswordInput.length < 4) {
      setSecurityMessage({ text: 'New password must be at least 4 characters long.', type: 'error' });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setSecurityMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    if (onUpdateStudentPassword) {
      onUpdateStudentPassword(student, newPasswordInput);
      setSecurityMessage({ text: 'Portal password updated successfully!', type: 'success' });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    }
  };

  const selectedTermObj = terms.find((t) => t.id === selectedTermId) || currentTerm;
  const selectedSessionObj = sessions.find((s) => s.id === selectedSessionId) || currentSession;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Faculty Student Switcher Bar (Authorized Teachers & Admin Only) */}
      {isFacultyOrAdmin && allStudents && allStudents.length > 1 && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">Faculty Inspection Mode</span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                Viewing student academic and behavioral record
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="select-faculty-student" className="text-xs font-semibold text-slate-600 shrink-0">
              Switch Student:
            </label>
            <select
              id="select-faculty-student"
              value={student.id}
              onChange={(e) => onSelectStudent && onSelectStudent(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              {allStudents.map((std) => {
                const cls = classes.find((c) => c.id === std.classId);
                return (
                  <option key={std.id} value={std.id}>
                    {std.fullName} ({std.regNo}) — {cls?.name || 'Class'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Student Welcome & Profile Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        {/* Background Islamic Watermark Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-5 pointer-events-none flex items-center justify-center font-arabic text-8xl select-none" dir="rtl">
          طالب
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-2 border-emerald-300/40">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{student.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-emerald-950 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-700/60 text-emerald-200 border border-emerald-500/30">
                  {student.regNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-100 border border-white/15">
                  {studentClass.name} ({studentClass.section})
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>{student.fullName}</span>
                {student.arabicName && (
                  <span className="text-emerald-300 text-lg sm:text-xl font-arabic font-normal" dir="rtl">
                    ({student.arabicName})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200/80 pt-0.5">
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{schoolProfile.name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gender: {student.gender}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button to Official Report Card */}
          <div className="flex flex-wrap items-center gap-3">
            {onViewOfficialReportCard && (
              <button
                type="button"
                id="btn-student-view-report"
                onClick={() => onViewOfficialReportCard(student.id)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-emerald-950" />
                <span>Open Terminal Report Card</span>
              </button>
            )}
          </div>
        </div>

        {/* Academic Session / Term Filters */}
        <div className="relative z-10 mt-6 pt-5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Academic Evaluation View:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="student-filter-session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-900/90 border border-emerald-700/80 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id} className="bg-slate-900 text-white">
                  {sess.name}
                </option>
              ))}
            </select>

            <select
              id="student-filter-term"
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-800/90 border border-emerald-600/80 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Featured / Urgent Announcements Banner for Parents & Students */}
      {urgentOrPinnedAnnouncements.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50/40 border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500 text-amber-950 font-bold">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Official Notice for Students & Parents</span>
                  <span className="font-arabic text-emerald-800" dir="rtl">(إعلان رسمي للطلاب وأولياء الأمور)</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Broadcast by the Office of the School Secretary & Principal
                </span>
              </div>
            </div>

            <button
              type="button"
              id="btn-goto-announcements-tab"
              onClick={() => setActiveTab('announcements')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <span>View All Notices ({studentAnnouncements.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentOrPinnedAnnouncements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {ann.priority === 'urgent' ? '🚨 Urgent / عاجل' : '📌 Featured / هام'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400">• {ann.publishedDate}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{ann.title}</h4>
                  {ann.arabicTitle && (
                    <div className="text-[11px] font-arabic font-bold text-emerald-800 leading-tight" dir="rtl">
                      {ann.arabicTitle}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>From: <strong>{ann.authorRole}</strong></span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('announcements')}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Read Full Notice →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Academic Overview', icon: GraduationCap },
          {
            id: 'announcements',
            label: `School Announcements (${studentAnnouncements.length})`,
            icon: Bell,
            badge: urgentOrPinnedAnnouncements.length > 0 ? 'Notices' : undefined,
          },
          { id: 'exam_center', label: 'CBT Exam Center', icon: Award, badge: 'Exams' },
          { id: 'results', label: `Subject Results (${reportProfile.scores.length})`, icon: FileText },
          { id: 'assignments', label: '12-Week Assignments', icon: BookOpen },
          { id: 'attendance', label: 'Attendance Record', icon: CalendarCheck },
          ...(isFacultyOrAdmin
            ? [
                {
                  id: 'behavioral',
                  label: `Behavioral Notes (${studentBehavioralNotes.length})`,
                  icon: Lock,
                  badge: 'Faculty Only',
                },
              ]
            : []),
          { id: 'security', label: 'Student Portal Security', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-student-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {(tab as any).badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {(tab as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Faculty Confidential Behavioral Notes Quick Banner */}
          {isFacultyOrAdmin && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Confidential Behavioral Record
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {studentBehavioralNotes.length} Logged
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {studentBehavioralNotes.length > 0
                      ? `${positiveNotesCount} positive commendation${positiveNotesCount !== 1 ? 's' : ''} and ${constructiveNotesCount} constructive guidance record${constructiveNotesCount !== 1 ? 's' : ''} logged.`
                      : `No behavioral observations logged yet for ${student.fullName}. Teachers can log observations anytime.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-goto-behavioral-tab"
                onClick={() => setActiveTab('behavioral')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <span>Open Behavioral Notes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Class Rank */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Class Position
                </span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {reportProfile.scores.length > 0 ? `${reportProfile.classPosition}` : '—'}
                </span>
                {reportProfile.scores.length > 0 && (
                  <span className="text-xs font-bold text-slate-400">
                    out of {reportProfile.totalStudentsInClass}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-1">
                {reportProfile.scores.length > 0
                  ? reportProfile.classPosition === 1
                    ? '🏆 1st in Class (Top Rank)'
                    : `${reportProfile.classPosition}th in ${studentClass.name}`
                  : 'Pending grade submission'}
              </div>
            </div>

            {/* Average Score */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Term Average
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                  {reportProfile.averageScore.toFixed(1)}%
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                  {reportProfile.scores.length > 0 ? (reportProfile.averageScore >= 70 ? 'Mumtaz' : reportProfile.averageScore >= 60 ? 'Jayyid Jiddan' : 'Jayyid') : '—'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total Score: {reportProfile.totalScore} / {reportProfile.scores.length * 100}
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Attendance
                </span>
                <CalendarCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {attendancePercentage !== null ? `${attendancePercentage}%` : '—'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {studentAttendance
                  ? `${studentAttendance.timesPresent} of ${studentAttendance.timesOpened} days present`
                  : 'Term attendance pending'}
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Coursework
                </span>
                <BookOpen className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {reportProfile.scores.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">Recorded Subjects</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-1">
                {reportProfile.scores.length > 0 ? 'Curriculum active' : 'Awaiting entries'}
              </div>
            </div>
          </div>

          {/* Form Master & Mudir Evaluation Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  Teacher Remarks & Academic Appraisal
                </h3>
                <p className="text-xs text-emerald-800">
                  Form Teacher evaluation for {selectedTermObj.name} ({selectedSessionObj.name})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Form Master's Academic Remark:
                </span>
                <p className="text-xs text-slate-800 font-serif italic leading-relaxed">
                  "{reportProfile.teacherRemark || 'Diligently participating in daily classes and recitations.'}"
                </p>
                <div className="text-[10px] font-medium text-emerald-900 pt-1">
                  Class Instructor • {studentClass.name}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Mudir / Principal's Recommendation:
                </span>
                <p className="text-xs text-slate-800 font-serif italic leading-relaxed">
                  "{reportProfile.principalRemark || 'Commendable effort. We pray Allah grants sustained wisdom and good character.'}"
                </p>
                <div className="text-[10px] font-medium text-emerald-900 pt-1">
                  {schoolProfile.mudirName || 'Principal Abubakar Alhassan'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Subject Highlights Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Term Subject Performance</h3>
                <p className="text-xs text-slate-500">Summary of graded subjects this term</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Full Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reportProfile.scores.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No exam or continuous assessment scores logged for {selectedTermObj.name} yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">12-Wk CA (20)</th>
                      <th className="py-2.5 px-3 text-center">CA 2 (20)</th>
                      <th className="py-2.5 px-3 text-center">Exam (60)</th>
                      <th className="py-2.5 px-3 text-center">Total (100)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportProfile.scores.map((scoreItem, idx) => {
                      const sc = scoreItem.score;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {scoreItem.subject.name}
                            {scoreItem.subject.arabicName && (
                              <span className="text-[11px] text-emerald-800 font-arabic ml-1.5" dir="rtl">
                                {scoreItem.subject.arabicName}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{sc.ca1}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{sc.ca2}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{sc.exam}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {sc.total}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                sc.grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : sc.grade === 'B'
                                  ? 'bg-blue-100 text-blue-900'
                                  : sc.grade === 'C'
                                  ? 'bg-teal-100 text-teal-900'
                                  : sc.grade === 'D'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {sc.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                            {scoreItem.positionInSubject ? `${scoreItem.positionInSubject} / ${reportProfile.totalStudentsInClass}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* School Announcements Section for Students & Parents */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-900 font-bold border border-amber-300">
                  <Megaphone className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>School Announcements for Students & Parents</span>
                    <span className="font-arabic text-emerald-800 text-xs" dir="rtl">(إعلانات الكلية لأولياء الأمور)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official circulars, exam notices, and bursary updates from the Office of the Registrar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full Bulletin ({studentAnnouncements.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentAnnouncements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 flex flex-col justify-between ${
                    ann.isPinned
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ann.publishedDate}</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{ann.title}</h4>
                    {ann.arabicTitle && (
                      <div className="text-[11px] font-arabic font-bold text-emerald-800 leading-tight" dir="rtl">
                        {ann.arabicTitle}
                      </div>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{ann.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Issued by: <strong>{ann.authorName}</strong></span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('announcements')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SCHOOL ANNOUNCEMENTS & PARENT BULLETINS */}
      {activeTab === 'announcements' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Bell className="w-4 h-4 text-amber-300" />
                <span>Official Information Bulletin & Circulars</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                <span>School Announcements for Students & Parents</span>
                <span className="text-sm font-arabic font-normal text-emerald-200" dir="rtl">
                  (إعلانات الكلية لأولياء الأمور والطلاب)
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                Stay updated with official college notices, terminal exam timetables, fee reconciliation directives,
                and Tahfiz Al-Qur'an halaqah schedules issued by the Office of the Registrar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Circulars</span>
              </button>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                placeholder="Search announcements by keyword, topic, or date..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'General', 'Examination', 'Fees & Bursary', 'Tahfiz & Islamic', 'Holiday'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAnnouncementCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    announcementCategoryFilter === cat
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Full Cards List */}
          <div className="space-y-4">
            {studentAnnouncements
              .filter((a) => {
                const matchesCat = announcementCategoryFilter === 'ALL' || a.category === announcementCategoryFilter;
                const matchesSearch =
                  !announcementSearch ||
                  a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                  a.content.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                  (a.arabicTitle && a.arabicTitle.includes(announcementSearch)) ||
                  (a.arabicContent && a.arabicContent.includes(announcementSearch));
                return matchesCat && matchesSearch;
              })
              .map((ann) => (
                <div
                  key={ann.id}
                  className={`p-6 rounded-3xl bg-white border transition-all space-y-3.5 shadow-2xs ${
                    ann.isPinned
                      ? 'border-amber-300 ring-2 ring-amber-200/50'
                      : 'border-slate-200/90 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                          <span>Pinned Notice</span>
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ann.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : ann.priority === 'important'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {ann.priority === 'urgent' ? '🚨 URGENT' : ann.priority}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        Category: {ann.category}
                      </span>

                      <span className="text-xs text-slate-400">• Target: {ann.targetAudience}</span>
                    </div>

                    <span className="text-xs text-slate-500 font-mono">Published: {ann.publishedDate}</span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{ann.title}</h4>
                    {ann.arabicTitle && (
                      <div className="text-sm sm:text-base font-arabic font-bold text-emerald-800 mt-1" dir="rtl">
                        {ann.arabicTitle}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {ann.content}
                  </div>

                  {ann.arabicContent && (
                    <div
                      className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs sm:text-sm font-arabic text-emerald-950 leading-relaxed"
                      dir="rtl"
                    >
                      {ann.arabicContent}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Authenticated by: <strong>{ann.authorName}</strong> ({ann.authorRole})</span>
                    </span>

                    <span className="text-[11px] text-emerald-800 italic">
                      Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah • {schoolProfile.campus || 'Kasuwan Magani Campus'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: CBT EXAM CENTER */}
      {activeTab === 'exam_center' && (
        <ExamCenterStudentView
          student={student}
          exams={exams}
          submissions={examSubmissions}
          currentSession={currentSession}
          currentTerm={currentTerm}
          onSubmitExam={onSubmitExam}
        />
      )}

      {/* TAB 2: DETAILED RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Comprehensive Subject Marks Sheet</h3>
              <p className="text-xs text-slate-500">
                Detailed scores, class benchmarks, and teacher subject remarks
              </p>
            </div>
            {onViewOfficialReportCard && (
              <button
                type="button"
                onClick={() => onViewOfficialReportCard(student.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report Card</span>
              </button>
            )}
          </div>

          {reportProfile.scores.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No score records logged for {student.fullName} in {selectedTermObj.name}.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Subject Name</th>
                      <th className="py-3 px-2.5 text-center">CA 1 (20)</th>
                      <th className="py-3 px-2.5 text-center">CA 2 (20)</th>
                      <th className="py-3 px-2.5 text-center">Exam (60)</th>
                      <th className="py-3 px-2.5 text-center font-bold text-slate-900">Total (100)</th>
                      <th className="py-3 px-2.5 text-center">Grade</th>
                      <th className="py-3 px-2.5 text-center">Class Highest</th>
                      <th className="py-3 px-2.5 text-center">Class Average</th>
                      <th className="py-3 px-3">Performance Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportProfile.scores.map((scoreItem, idx) => {
                      const sc = scoreItem.score;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div>{scoreItem.subject.name}</div>
                            {scoreItem.subject.arabicName && (
                              <div className="text-[11px] text-emerald-800 font-arabic" dir="rtl">
                                {scoreItem.subject.arabicName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono">{sc.ca1}</td>
                          <td className="py-3 px-2.5 text-center font-mono">{sc.ca2}</td>
                          <td className="py-3 px-2.5 text-center font-mono">{sc.exam}</td>
                          <td className="py-3 px-2.5 text-center font-mono font-bold text-emerald-950 text-sm">
                            {sc.total}
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                                sc.grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : sc.grade === 'B'
                                  ? 'bg-blue-100 text-blue-900'
                                  : sc.grade === 'C'
                                  ? 'bg-teal-100 text-teal-900'
                                  : sc.grade === 'D'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {sc.grade}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono text-slate-500">
                            {scoreItem.classHighest ?? '—'}
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono text-slate-500">
                            {scoreItem.classAverage ?? '—'}
                          </td>
                          <td className="py-3 px-3 text-slate-700 italic font-serif">
                            {sc.remark || 'Satisfactory progress'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 12-WEEK ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
            <h3 className="font-bold text-sm text-slate-900">12-Week Continuous Unit Assignments</h3>
            <p className="text-xs text-slate-500">
              Each week is graded out of 4.0 points (total 48 points) and scaled to Continuous Assessment 1 (20 marks).
            </p>
          </div>

          {reportProfile.scores.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No weekly assignment records logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reportProfile.scores.map((scoreItem, sIdx) => {
                const sc = scoreItem.score;
                const weekly = sc.weeklyAssignments || [];
                const weeklySum = calculateWeeklyTotal(weekly);
                return (
                  <div
                    key={sIdx}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{scoreItem.subject.name}</span>
                          {scoreItem.subject.arabicName && (
                            <span className="text-xs font-arabic text-emerald-800" dir="rtl">
                              ({scoreItem.subject.arabicName})
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-400">{scoreItem.subject.code}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600">
                          Raw Total: <strong className="text-slate-900 font-mono">{weeklySum} / 48</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                          Scaled CA1: {sc.ca1} / 20
                        </span>
                      </div>
                    </div>

                    {/* 12 Weeks Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                      {Array.from({ length: 12 }).map((_, wIdx) => {
                        const scoreVal = weekly[wIdx] !== undefined ? weekly[wIdx] : null;
                        return (
                          <div
                            key={wIdx}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              scoreVal !== null && scoreVal > 0
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-slate-50 border-slate-200/70 text-slate-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              W{wIdx + 1}
                            </span>
                            <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">
                              {scoreVal !== null ? scoreVal : '—'}
                            </span>
                            <span className="text-[9px] text-slate-400">/ 4.0</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Term Attendance Overview</h3>
                <p className="text-xs text-slate-500">
                  Record of school attendance for {selectedTermObj.name} ({selectedSessionObj.name})
                </p>
              </div>

              {attendancePercentage !== null && (
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-emerald-900">
                    {attendancePercentage}%
                  </span>
                  <span className="text-xs text-slate-400 block">Overall Presence</span>
                </div>
              )}
            </div>

            {studentAttendance ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    School Days Opened
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                    {studentAttendance.timesOpened}
                  </span>
                  <span className="text-xs text-slate-500">Scheduled school days</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Days Present
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-950 mt-1 block">
                    {studentAttendance.timesPresent}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">Days verified in class</span>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">
                    Days Absent
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-950 mt-1 block">
                    {studentAttendance.timesAbsent}
                  </span>
                  <span className="text-xs text-rose-700 font-medium">Recorded absences</span>
                </div>
              </div>

              {/* Unit-by-Unit Box Tick Breakdown Display */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Unit-by-Unit Attendance (Unit 1 – Unit 12)</span>
                    <span className="text-emerald-700">✅</span>
                    <span className="text-rose-600">❌</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Total Units: <strong className="text-slate-800 font-mono">{studentAttendance.unitAttendanceTotal || studentAttendance.timesPresent} / 60 days</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {Array.from({ length: 12 }).map((_, uIdx) => {
                    const daysPresent = studentAttendance.weeklyAttendance?.[uIdx] ?? 5;
                    const unitDetails =
                      studentAttendance.dailyDetails?.[uIdx] ||
                      Array.from({ length: 5 }, (_, dIdx) => dIdx < daysPresent);

                    return (
                      <div
                        key={uIdx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-center"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Unit {uIdx + 1}</span>
                          <span className="text-emerald-800 font-mono">{daysPresent}/5d</span>
                        </div>
                        {/* 5 Box Ticks */}
                        <div className="flex items-center justify-center gap-1">
                          {unitDetails.map((isDayPresent, dIdx) => (
                            <span
                              key={dIdx}
                              title={`Unit ${uIdx + 1} - ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dIdx]}: ${isDayPresent ? 'Present ✅' : 'Absent ❌'}`}
                              className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                                isDayPresent
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-700 border border-rose-300'
                              }`}
                            >
                              {isDayPresent ? '✓' : '✗'}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No attendance records have been registered for {student.fullName} in this term.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Student Portal Password Settings</h3>
                <p className="text-xs text-slate-500">
                  Update your personal password for logging into the Student Portal
                </p>
              </div>
            </div>

            {securityMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  securityMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {securityMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              {student.hasSetPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter at least 4 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: CONFIDENTIAL BEHAVIORAL NOTES (AUTHORIZED FACULTY & ADMIN ONLY) */}
      {activeTab === 'behavioral' && (
        <div className="space-y-4">
          {isFacultyOrAdmin ? (
            <BehavioralNotesSection
              student={student}
              currentUser={currentUser || null}
              notes={behavioralNotes}
              currentSession={selectedSessionObj}
              currentTerm={selectedTermObj}
              sessions={sessions}
              terms={terms}
              onAddNote={(newNote) => onAddBehavioralNote && onAddBehavioralNote(newNote)}
              onDeleteNote={(noteId) => onDeleteBehavioralNote && onDeleteBehavioralNote(noteId)}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Confidential Faculty Records</h3>
              <p className="text-xs text-slate-500">
                Behavioral observation records are confidential to school faculty and administration and cannot be accessed from student accounts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
