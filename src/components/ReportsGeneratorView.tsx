import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  Term,
  AcademicSession,
  SchoolProfile,
  GradeScaleItem,
  Teacher,
  AuthUser,
} from '../types';
import { generateStudentReportProfile } from '../services/academicService';
import { exportElementToPdf } from '../utils/pdfExport';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Calendar,
  User,
  GraduationCap,
  Award,
  CheckCircle,
  CalendarCheck,
  Clock,
  TrendingUp,
  FileDown,
  Loader2,
} from 'lucide-react';

interface ReportsGeneratorViewProps {
  students: Student[];
  teachers?: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  currentTerm: Term;
  currentSession: AcademicSession;
  terms?: Term[];
  sessions?: AcademicSession[];
  schoolProfile: SchoolProfile;
  gradeScale: GradeScaleItem[];
  selectedStudentId?: string;
  currentUser?: AuthUser | null;
  onSelectStudent: (id: string) => void;
  onSelectTerm?: (termId: string) => void;
  onSelectSession?: (sessionId: string) => void;
}

export const ReportsGeneratorView: React.FC<ReportsGeneratorViewProps> = ({
  students,
  teachers = [],
  classes,
  subjects,
  scores,
  attendance,
  currentTerm,
  currentSession,
  terms,
  sessions,
  schoolProfile,
  gradeScale,
  selectedStudentId,
  currentUser,
  onSelectStudent,
  onSelectTerm,
  onSelectSession,
}) => {
  const initialClassFilter =
    currentUser?.role === 'teacher' && currentUser.assignedClassId
      ? currentUser.assignedClassId
      : 'ALL';
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassFilter);

  // Term & Session selection for dynamic report card generation
  const [selectedTermId, setSelectedTermId] = useState<string>(currentTerm.id);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession.id);

  useEffect(() => {
    setSelectedTermId(currentTerm.id);
  }, [currentTerm.id]);

  useEffect(() => {
    setSelectedSessionId(currentSession.id);
  }, [currentSession.id]);

  const activeTerm = terms?.find((t) => t.id === selectedTermId) || currentTerm;
  const activeSession = sessions?.find((s) => s.id === selectedSessionId) || currentSession;

  // Filter students based on class selection
  const filteredStudents = selectedClassFilter === 'ALL'
    ? students
    : students.filter((s) => s.classId === selectedClassFilter);

  const activeStudentId =
    selectedStudentId && filteredStudents.some((s) => s.id === selectedStudentId)
      ? selectedStudentId
      : filteredStudents[0]?.id || students[0]?.id || '';

  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];
  const currentStudentClass = classes.find((c) => c.id === currentStudent?.classId) || classes[0];
  const classStudents = students.filter((s) => s.classId === currentStudentClass?.id);

  // Automatically wire registered teacher name to report card
  const assignedTeacher = teachers?.find(
    (t) =>
      (currentStudentClass && t.assignedClassId === currentStudentClass.id) ||
      (currentStudentClass?.assignedTeacherId && t.id === currentStudentClass.assignedTeacherId)
  );
  const resolvedTeacherName = assignedTeacher?.fullName || currentStudentClass?.classTeacher || 'Assigned Form Teacher';
  const resolvedTeacherArabic = assignedTeacher?.arabicName;

  // Find attendance record matching this student and selected term/session
  const studentAttendance = attendance.find(
    (a) =>
      a.studentId === currentStudent?.id &&
      a.termId === activeTerm.id &&
      (a.sessionId === activeSession.id || !a.sessionId)
  ) || attendance.find(
    (a) => a.studentId === currentStudent?.id && a.termId === activeTerm.id
  );

  // Automatically compute Days Present / Total Days metrics
  const daysOpened = studentAttendance?.timesOpened ?? 65;

  let daysPresent = 0;
  if (studentAttendance) {
    if (typeof studentAttendance.timesPresent === 'number' && !isNaN(studentAttendance.timesPresent)) {
      daysPresent = studentAttendance.timesPresent;
    } else if (typeof studentAttendance.unitAttendanceTotal === 'number' && !isNaN(studentAttendance.unitAttendanceTotal)) {
      daysPresent = studentAttendance.unitAttendanceTotal;
    } else if (Array.isArray(studentAttendance.weeklyAttendance)) {
      daysPresent = studentAttendance.weeklyAttendance.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    } else if (Array.isArray(studentAttendance.dailyDetails)) {
      daysPresent = studentAttendance.dailyDetails.reduce((acc, week) => {
        return acc + (Array.isArray(week) ? week.filter(Boolean).length : 0);
      }, 0);
    }
  }

  const daysAbsent = studentAttendance?.timesAbsent !== undefined
    ? studentAttendance.timesAbsent
    : Math.max(0, daysOpened - daysPresent);

  const attendanceRate = daysOpened > 0 ? Math.round((daysPresent / daysOpened) * 100) : 0;
  const isAttendanceRecorded = Boolean(studentAttendance);
  const unitsTotal = studentAttendance?.unitAttendanceTotal ?? daysPresent;

  const reportProfile = currentStudent && currentStudentClass
    ? generateStudentReportProfile(
        currentStudent,
        currentStudentClass,
        subjects,
        scores,
        classStudents,
        gradeScale,
        studentAttendance,
        activeTerm.id,
        activeSession.id
      )
    : null;

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStage, setExportStage] = useState('');
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportStage('Rendering...');
      const cleanStudentName = currentStudent.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanClassName = currentStudentClass.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanTermName = activeTerm.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${cleanStudentName}_${cleanClassName}_${cleanTermName}_ReportCard.pdf`;

      await exportElementToPdf({
        elementId: 'official-report-card',
        fileName,
        onProgress: (_prog, stage) => {
          setExportStage(stage);
        },
      });

      setPdfSuccessMessage(true);
      setTimeout(() => setPdfSuccessMessage(false), 4500);
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback seamlessly to native window.print()
      window.print();
    } finally {
      setIsExportingPdf(false);
      setExportStage('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrevStudent = () => {
    const currentIndex = filteredStudents.findIndex((s) => s.id === activeStudentId);
    if (currentIndex > 0) {
      onSelectStudent(filteredStudents[currentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    const currentIndex = filteredStudents.findIndex((s) => s.id === activeStudentId);
    if (currentIndex < filteredStudents.length - 1) {
      onSelectStudent(filteredStudents[currentIndex + 1].id);
    }
  };

  if (!currentStudent || !reportProfile) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No student record available to generate report card.
      </div>
    );
  }

  const hasScores = reportProfile.scores.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar (hidden when printing) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Filter By Class
            </label>
            <select
              id="select-report-class-filter"
              value={selectedClassFilter}
              onChange={(e) => {
                const newFilter = e.target.value;
                setSelectedClassFilter(newFilter);
                const matching = newFilter === 'ALL'
                  ? students
                  : students.filter((s) => s.classId === newFilter);
                if (matching.length > 0) {
                  onSelectStudent(matching[0].id);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Classes ({students.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Selected Term
            </label>
            <select
              id="select-report-term"
              value={selectedTermId}
              onChange={(e) => {
                const newTermId = e.target.value;
                setSelectedTermId(newTermId);
                if (onSelectTerm) onSelectTerm(newTermId);
              }}
              className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            >
              {(terms || [currentTerm]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Session
            </label>
            <select
              id="select-report-session"
              value={selectedSessionId}
              onChange={(e) => {
                const newSessId = e.target.value;
                setSelectedSessionId(newSessId);
                if (onSelectSession) onSelectSession(newSessId);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {(sessions || [currentSession]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Active Student ({filteredStudents.findIndex((s) => s.id === activeStudentId) + 1} of {filteredStudents.length})
            </label>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevStudent}
                  disabled={filteredStudents.findIndex((s) => s.id === activeStudentId) <= 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Previous Student"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={handleNextStudent}
                  disabled={filteredStudents.findIndex((s) => s.id === activeStudentId) >= filteredStudents.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Next Student"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <select
                id="select-report-student"
                value={activeStudentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 max-w-xs"
              >
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.regNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-right hidden xl:block mr-1">
            <div className="text-xs font-bold text-slate-800">
              {hasScores ? `Position: ${reportProfile.classPosition} of ${reportProfile.totalStudentsInClass}` : 'Status: Ungraded'}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              Attendance: {isAttendanceRecorded ? `${daysPresent} / ${daysOpened} Days (${attendanceRate}%)` : 'Not recorded'}
            </div>
          </div>

          {pdfSuccessMessage && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>PDF Downloaded!</span>
            </div>
          )}

          {/* Primary Direct PDF Report Export Button */}
          <button
            id="btn-export-pdf"
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            title="Download high-resolution official PDF transcript directly to your device"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-emerald-200" />
                <span>{exportStage || 'Exporting PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Export PDF Report</span>
              </>
            )}
          </button>

          {/* Secondary Print / Browser PDF dialog */}
          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Open browser print preview dialog"
          >
            <Printer className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Print Dialog</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Card Container */}
      <div
        id="official-report-card"
        className="w-full max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md print:shadow-none print:border-0 print:p-0 print:m-0"
      >
        {/* Islamic Basmalah Banner */}
        <div className="text-center mb-3">
          <div className="text-base sm:text-lg font-arabic font-bold text-emerald-900 tracking-wide">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
          <p className="text-[11px] text-slate-400 font-serif italic">
            In the Name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>

        {/* School Header Banner */}
        <div className="border-b-2 border-emerald-900/40 pb-5 mb-6 flex items-center justify-between gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-900 flex flex-col items-center justify-center text-white p-2 shadow-sm shrink-0">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
            <span className="text-[9px] font-bold tracking-wider uppercase mt-1">Kulliyyah</span>
          </div>

          <div className="text-center flex-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase">
              {schoolProfile.name}
            </h1>
            <div className="text-sm font-arabic font-bold text-emerald-800 mt-0.5" dir="rtl">
              {schoolProfile.arabicName}
            </div>
            <p className="text-xs font-medium text-slate-600 italic mt-1">
              "{schoolProfile.motto}" • <span className="font-arabic" dir="rtl">{schoolProfile.arabicMotto}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {schoolProfile.address} | Tel: {schoolProfile.phone} | Email: {schoolProfile.email}
            </p>
            <div className="inline-block px-3 py-1 mt-2 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              Terminal Academic Performance & Progress Report
            </div>
          </div>

          {currentStudent.photoUrl ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-800 shadow-sm shrink-0">
              <img
                src={currentStudent.photoUrl}
                alt={currentStudent.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-1 shrink-0 text-center">
              <User className="w-6 h-6 text-slate-300 mb-0.5" />
              <span className="text-[9px] font-semibold">Student Photo</span>
            </div>
          )}
        </div>

        {/* Student Biodata Information Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-400 block font-medium">Student Full Name</span>
            <span className="font-bold text-slate-900 text-sm">{currentStudent.fullName}</span>
            {currentStudent.arabicName && (
              <span className="text-emerald-800 font-arabic block mt-0.5" dir="rtl">
                {currentStudent.arabicName}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Admission Reg No</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {currentStudent.regNo}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Class / Arm</span>
            <span className="font-bold text-slate-900">{currentStudentClass.name}</span>
            <span className="text-slate-500 block text-[11px]">
              Sec: {currentStudentClass.section}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Session & Academic Year</span>
            <span className="font-bold text-slate-900">{currentStudent.academicYear || activeSession.name}</span>
            <span className="text-emerald-700 block font-semibold text-[11px]">
              {activeTerm.name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Gender / DOB</span>
            <span className="font-semibold text-slate-800">
              {currentStudent.gender} • {currentStudent.dob}
            </span>
          </div>

          {/* Integrated Days Present / Total Days Summary */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90">
            <span className="text-emerald-950 block font-bold text-[10px] uppercase tracking-wider">
              Days Present / Total Days
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-extrabold text-emerald-950 font-mono text-base">
                {isAttendanceRecorded ? `${daysPresent} / ${daysOpened} Days` : 'Not recorded'}
              </span>
              {isAttendanceRecorded && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    attendanceRate >= 80
                      ? 'bg-emerald-200 text-emerald-900'
                      : attendanceRate >= 60
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {attendanceRate}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isAttendanceRecorded
                ? `Present: ${daysPresent}d • Absent: ${daysAbsent}d`
                : `Awaiting register for ${activeTerm.name}`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Class Teacher</span>
            <span className="font-semibold text-slate-800">{resolvedTeacherName}</span>
            {resolvedTeacherArabic && (
              <span className="text-[11px] text-emerald-800 block font-arabic font-medium" dir="rtl">
                {resolvedTeacherArabic}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Next Term Resumes</span>
            <span className="font-bold text-emerald-800">{schoolProfile.nextTermBegins}</span>
          </div>
        </div>

        {/* Detailed Subject Scores Table */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Cognitive Academic Assessment</span>
            <span className="text-slate-500 font-normal lowercase text-[11px]">
              CA1 (20) + CA2 (20) + Exam (60) = 100
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-emerald-950 text-white">
                <th className="py-2 px-3 border border-slate-400 font-semibold">Subject Title</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-14 bg-emerald-900/60">Unit Act.<br/>(48)</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">CA 1<br/>(20)</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">CA 2<br/>(20)</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">Exam<br/>(60)</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-bold w-14">Total<br/>(100)</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-bold w-12">Grade</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">Class<br/>Avg</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">Class<br/>High</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">Class<br/>Low</th>
                <th className="py-2 px-2 border border-slate-400 text-center font-semibold w-12">Pos.</th>
                <th className="py-2 px-3 border border-slate-400 font-semibold">Subject Remark</th>
              </tr>
            </thead>
            <tbody>
              {reportProfile.scores.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No scores entered for this student in this term ({activeTerm.name}).
                  </td>
                </tr>
              ) : (
                reportProfile.scores.map((scItem, idx) => (
                  <tr
                    key={scItem.subject.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                  >
                    <td className="py-2 px-3 border border-slate-300 font-medium">
                      <div className="font-semibold text-slate-900">{scItem.subject.name}</div>
                      {scItem.subject.arabicName && (
                        <div className="text-[10px] text-emerald-800 font-arabic" dir="rtl">
                          {scItem.subject.arabicName}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40">
                      {scItem.score.unitAssignmentTotal ?? (scItem.score.weeklyAssignments ? scItem.score.weeklyAssignments.reduce((a, b) => a + b, 0) : '—')}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center text-slate-700">
                      {scItem.score.ca1}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center text-slate-700">
                      {scItem.score.ca2}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center text-slate-700">
                      {scItem.score.exam}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-bold text-slate-900">
                      {scItem.score.total}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          scItem.score.grade === 'A'
                            ? 'text-emerald-800 bg-emerald-100'
                            : scItem.score.grade === 'B'
                            ? 'text-blue-800 bg-blue-100'
                            : scItem.score.grade === 'C'
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-rose-800 bg-rose-100'
                        }`}
                      >
                        {scItem.score.grade}
                      </span>
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono text-slate-600">
                      {scItem.classAverage}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono text-emerald-700">
                      {scItem.classHighest}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono text-slate-400">
                      {scItem.classLowest}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                      {scItem.positionInSubject}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-slate-700 italic text-[11px]">
                      {scItem.score.remark}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 12-Unit Continuous Assessment Activity Breakdown */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Continuous Assessment Unit-by-Unit Log (Units 1 - 12)</span>
            <span className="text-slate-500 font-normal text-[11px]">
              Each unit graded on 0 - 4 scale • Total 48 Marks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-center">
                  <th className="py-1.5 px-3 border border-slate-300 text-left font-semibold">Subject</th>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <th key={i} className="py-1.5 px-1 border border-slate-300 w-8 font-semibold">
                      U{i + 1}
                    </th>
                  ))}
                  <th className="py-1.5 px-2 border border-slate-300 font-bold bg-slate-200/80 w-12">
                    Total
                  </th>
                  <th className="py-1.5 px-2 border border-slate-300 font-semibold w-12">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportProfile.scores.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-4 text-center text-slate-400">
                      No weekly continuous assessment records available.
                    </td>
                  </tr>
                ) : (
                  reportProfile.scores.map((scItem) => {
                    const weekly = scItem.score.weeklyAssignments || [4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 4];
                    const uTotal = scItem.score.unitAssignmentTotal ?? weekly.reduce((a, b) => a + b, 0);
                    const avg = (uTotal / 12).toFixed(1);
                    return (
                      <tr key={scItem.subject.id} className="text-center hover:bg-white transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 text-left font-medium text-slate-900">
                          {scItem.subject.name}
                        </td>
                        {weekly.map((wkVal, wIdx) => (
                          <td
                            key={wIdx}
                            className={`py-1.5 px-1 border border-slate-300 font-mono font-semibold ${
                              wkVal === 4
                                ? 'text-emerald-800 bg-emerald-50/50'
                                : wkVal === 3
                                ? 'text-blue-800'
                                : wkVal === 2
                                ? 'text-amber-800'
                                : 'text-slate-500'
                            }`}
                          >
                            {wkVal}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-emerald-950 bg-emerald-50">
                          {uTotal}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-300 font-mono font-medium text-emerald-800 bg-emerald-50">
                          {avg}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall Academic & Attendance Summary Metrics (5 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-emerald-900 text-white text-xs mb-6">
          <div className="text-center border-r border-emerald-700/60">
            <span className="text-emerald-200 block text-[11px]">Marks Obtained</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block font-mono">
              {hasScores ? `${reportProfile.totalScore} / ${reportProfile.maxPossibleScore}` : '—'}
            </span>
          </div>

          <div className="text-center border-r border-emerald-700/60">
            <span className="text-emerald-200 block text-[11px]">Term Average</span>
            <span className="text-xl font-extrabold text-emerald-300 mt-0.5 block font-mono">
              {hasScores ? `${reportProfile.averageScore}%` : '—'}
            </span>
          </div>

          <div className="text-center border-r border-emerald-700/60">
            <span className="text-emerald-200 block text-[11px]">Class Position</span>
            <span className="text-xl font-extrabold text-amber-300 mt-0.5 block font-mono">
              {hasScores ? `${reportProfile.classPosition} of ${reportProfile.totalStudentsInClass}` : '—'}
            </span>
          </div>

          {/* Automatic 'Days Present / Total Days' Summary */}
          <div className="text-center border-r border-emerald-700/60">
            <span className="text-emerald-200 block text-[11px]">Days Present / Total Days</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block font-mono">
              {isAttendanceRecorded ? `${daysPresent} / ${daysOpened}` : '—'}
            </span>
            {isAttendanceRecorded && (
              <span className="text-[10px] text-emerald-300 block font-medium mt-0.5">
                {attendanceRate}% Rate ({daysAbsent}d absent)
              </span>
            )}
          </div>

          <div className="text-center">
            <span className="text-emerald-200 block text-[11px]">Final Evaluation</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block truncate">
              {hasScores ? reportProfile.overallRemark : 'Pending'}
            </span>
          </div>
        </div>

        {/* Dedicated Attendance Summary Card (Days Present / Total Days) */}
        <div className="mb-6 p-4 rounded-xl border border-slate-300 bg-slate-50/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-800" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Official Attendance Summary • سجل الحضور والمواظبة ({activeTerm.name})
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Standing:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  attendanceRate >= 85
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : attendanceRate >= 70
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {attendanceRate >= 90
                  ? '🌟 Excellent Regularity (ممتاز)'
                  : attendanceRate >= 75
                  ? '✅ Good Regularity (جيد جداً)'
                  : attendanceRate >= 60
                  ? '⚠️ Fair Regularity (مقبول)'
                  : '❌ Needs Improvement (غير منتظم)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-3">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Days Opened</span>
              <span className="text-lg font-black text-slate-900 font-mono block mt-0.5">{daysOpened} Days</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 block uppercase font-bold">Days Present</span>
              <span className="text-lg font-black text-emerald-900 font-mono block mt-0.5">
                {isAttendanceRecorded ? `${daysPresent} Days` : 'Not recorded'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-800 block uppercase font-bold">Days Absent</span>
              <span className="text-lg font-black text-rose-900 font-mono block mt-0.5">
                {isAttendanceRecorded ? `${daysAbsent} Days` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 shadow-2xs">
              <span className="text-[10px] text-teal-800 block uppercase font-bold">Curriculum Units Present</span>
              <span className="text-lg font-black text-teal-950 font-mono block mt-0.5">
                {isAttendanceRecorded ? `${unitsTotal} / 60 Units` : '—'}
              </span>
            </div>
          </div>

          {/* Progress Bar for Days Present / Total Days */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-700">Days Present / Total Days Attendance Ratio:</span>
              <span className="font-mono text-emerald-900 font-bold">
                {isAttendanceRecorded ? `${daysPresent} / ${daysOpened} Days (${attendanceRate}%)` : 'Not recorded for this term'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  attendanceRate >= 80 ? 'bg-emerald-600' : attendanceRate >= 60 ? 'bg-blue-600' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Affective & Behavioral Domain (Islamic Morals & Conduct) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Behavioral & Affective Traits (1 - 5 Scale)
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-1.5 border border-slate-300 text-left">Behavioral Trait</th>
                  <th className="p-1.5 border border-slate-300 text-center w-12">Rating</th>
                  <th className="p-1.5 border border-slate-300 text-left">Evaluation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border border-slate-300">Punctuality & Discipline</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                    {reportProfile.affective.punctuality}/5
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-500">Exemplary</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300">Neatness & Islamic Decorum</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                    {reportProfile.affective.neatness}/5
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-500">Very Clean</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300">Al-Qur'an Recitation (Tilawah)</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                    {reportProfile.affective.quranRecitation}/5
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-500">Fluent & Tajweed</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300">Memorization (Hifz) Attitude</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                    {reportProfile.affective.memorization}/5
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-500">Diligent</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300">Honesty & Trustworthiness (Amanah)</td>
                  <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                    {reportProfile.affective.honesty}/5
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-500">Trustworthy</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grading System Scale Key */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Official Grading Key & Scale
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-1.5 border border-slate-300 text-center">Score Range</th>
                  <th className="p-1.5 border border-slate-300 text-center">Grade</th>
                  <th className="p-1.5 border border-slate-300 text-left">Remark (Arabic / English)</th>
                </tr>
              </thead>
              <tbody>
                {gradeScale.map((item) => (
                  <tr key={item.grade}>
                    <td className="p-1 border border-slate-300 text-center font-mono text-[11px]">
                      {item.min}% - {item.max}%
                    </td>
                    <td className="p-1 border border-slate-300 text-center font-bold">
                      {item.grade}
                    </td>
                    <td className="p-1 border border-slate-300 text-[11px]">
                      <span className="font-arabic font-bold text-emerald-800 ml-1" dir="rtl">
                        {item.arabicRemark}
                      </span>{' '}
                      — {item.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks & Signatures Area */}
        <div className="space-y-4 border-t-2 border-slate-200 pt-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">Class Teacher's Remark:</span>
            <p className="text-xs text-slate-800 italic mt-0.5">{reportProfile.teacherRemark}</p>
            <div className="mt-2 flex justify-between items-end">
              <span className="text-[11px] text-slate-500">
                Form Teacher: <strong className="text-slate-800">{resolvedTeacherName}</strong>
                {assignedTeacher?.staffId && (
                  <span className="text-emerald-700 font-mono ml-1.5 text-[10px]">({assignedTeacher.staffId})</span>
                )}
              </span>
              <span className="text-[11px] text-slate-700 font-serif italic border-b border-dashed border-slate-400 px-4">
                Signature: <em>{resolvedTeacherName}</em>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-xs font-bold text-emerald-950 block">Mudir / Principal's General Assessment:</span>
            <p className="text-xs text-emerald-900 italic mt-0.5">{reportProfile.principalRemark}</p>
            <div className="mt-3 flex justify-between items-end">
              <div>
                <span className="text-[11px] text-emerald-950 block font-semibold">
                  {schoolProfile.mudirName}
                </span>
                <span className="text-[10px] text-slate-500">Mudir (Head of College)</span>
              </div>
              <div className="text-center">
                <div className="inline-block border border-emerald-600/40 rounded-full px-3 py-1 text-[10px] text-emerald-900 font-bold uppercase tracking-wider bg-white shadow-2xs">
                  Official Stamp & Seal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
          <div>
            Generated officially via Kulliyyat School Information System • Document valid with official school stamp and mudir's signature.
          </div>
          <div className="text-[9px] text-slate-500">
            All rights reserved by <strong>Danmari brothers Ventures LLC</strong> • Address: A23 Aliyu makama road barnawa Kaduna, Nigeria • <strong>Made in Nigeria</strong>
          </div>
        </div>
      </div>

      {/* Bottom Floating Export Toolbar (hidden during print) */}
      <div className="print:hidden max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{currentStudent.fullName} • {currentStudentClass.name}</div>
            <div className="text-[11px] text-slate-500">Official Report Card • {activeTerm.name} ({activeSession.name})</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>{exportStage || 'Exporting PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-200" />
                <span>Export PDF Report</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Dialog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
