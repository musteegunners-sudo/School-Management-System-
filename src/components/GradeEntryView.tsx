import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  Term,
  AcademicSession,
  GradeScaleItem,
  AuthUser,
} from '../types';
import {
  normalizeWeeklyAssignments,
  calculateWeeklyTotal,
  scaleWeeklyToCa,
  calculateTotalScore,
  evaluateGradeAndRemark,
  normalizeWeeklyAttendance,
} from '../services/academicService';
import {
  Save,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  ClipboardList,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Info,
  RotateCcw,
  CalendarCheck,
  Bot,
} from 'lucide-react';
import { TeacherCommentGeneratorModal } from './TeacherCommentGeneratorModal';

interface GradeEntryViewProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance?: AttendanceRecord[];
  currentSession: AcademicSession;
  currentTerm: Term;
  gradeScale: GradeScaleItem[];
  currentUser?: AuthUser | null;
  targetClassId?: string;
  targetSubjectId?: string;
  targetViewMode?: 'weekly' | 'summary' | 'combined';
  targetStudentId?: string;
  onBackToTeacherClasses?: () => void;
  onSaveScores: (updatedScores: ScoreRecord[]) => void;
}

interface LocalGradeRow {
  student: Student;
  scoreId?: string;
  weeklyAssignments: number[]; // 12 weeks, 0-4 each (default 00)
  unitAssignmentTotal: number; // 0-48
  weeklyAttendance?: number[]; // 12 weeks of attendance
  attendanceDaysOpened?: number;
  attendanceDaysPresent?: number;
  attendanceRate?: number;
  ca1: number | string;
  ca2: number | string;
  exam: number | string;
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
}

type ViewMode = 'weekly' | 'summary' | 'combined';

export const GradeEntryView: React.FC<GradeEntryViewProps> = ({
  students,
  classes,
  subjects,
  scores,
  attendance = [],
  currentSession,
  currentTerm,
  gradeScale,
  currentUser,
  targetClassId,
  targetSubjectId,
  targetViewMode,
  targetStudentId,
  onBackToTeacherClasses,
  onSaveScores,
}) => {
  const initialClassId =
    targetClassId ||
    (currentUser?.role === 'teacher' && currentUser.assignedClassId
      ? currentUser.assignedClassId
      : classes[0]?.id || '');
  const initialSubjId = targetSubjectId || subjects[0]?.id || '';
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjId);
  const [viewMode, setViewMode] = useState<ViewMode>(targetViewMode || 'weekly');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [activeModalStudentIndex, setActiveModalStudentIndex] = useState<number | null>(null);
  const [isAiCommentModalOpen, setIsAiCommentModalOpen] = useState(false);
  const [aiCommentStudentIndex, setAiCommentStudentIndex] = useState<number>(0);

  const handleOpenAiCommentModal = (studentIndex?: number) => {
    if (studentIndex !== undefined && studentIndex >= 0 && studentIndex < localRows.length) {
      setAiCommentStudentIndex(studentIndex);
    } else if (localRows.length > 0) {
      setAiCommentStudentIndex(0);
    }
    setIsAiCommentModalOpen(true);
  };

  const handleApplyGeneratedRemark = (studentId: string, remark: string) => {
    setLocalRows((prev) =>
      prev.map((row) =>
        row.student.id === studentId ? { ...row, remark } : row
      )
    );
  };

  // Sync when target props change from external navigation
  useEffect(() => {
    if (targetClassId) {
      setSelectedClassId(targetClassId);
    }
  }, [targetClassId]);

  useEffect(() => {
    if (targetSubjectId) {
      setSelectedSubjectId(targetSubjectId);
    }
  }, [targetSubjectId]);

  useEffect(() => {
    if (targetViewMode) {
      setViewMode(targetViewMode);
    }
  }, [targetViewMode]);

  // Local table state for reactive entry
  const [localRows, setLocalRows] = useState<LocalGradeRow[]>([]);

  // Load students and existing scores when filters change
  useEffect(() => {
    const classStudents = students.filter((s) => s.classId === selectedClassId);

    const rows: LocalGradeRow[] = classStudents.map((student) => {
      const existingScore = scores.find(
        (sc) =>
          sc.studentId === student.id &&
          sc.subjectId === selectedSubjectId &&
          sc.classId === selectedClassId &&
          sc.termId === currentTerm.id &&
          sc.sessionId === currentSession.id
      );

      const existingAtt = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.classId === selectedClassId &&
          a.termId === currentTerm.id &&
          a.sessionId === currentSession.id
      );

      // Default unit marks to 00s (Array(12).fill(0)) when not existing
      const weekly = normalizeWeeklyAssignments(
        existingScore?.weeklyAssignments || Array(12).fill(0)
      );
      const unitTotal = calculateWeeklyTotal(weekly);

      // Default unit mark is 00; CA1 defaults to existing or scaled from weekly
      const ca1 = existingScore
        ? existingScore.ca1
        : existingScore?.weeklyAssignments
        ? scaleWeeklyToCa(unitTotal, 20)
        : 0;
      const ca2 = existingScore ? existingScore.ca2 : '';
      const exam = existingScore ? existingScore.exam : '';
      const total = calculateTotalScore(Number(ca1) || 0, Number(ca2) || 0, Number(exam) || 0);
      const evalRes = evaluateGradeAndRemark(total, gradeScale);

      // Attendance information
      const opened = existingAtt?.timesOpened ?? 118;
      const present = existingAtt?.timesPresent ?? 0;
      const attRate = opened > 0 ? Math.round((present / opened) * 100) : 0;
      const weeklyAtt = normalizeWeeklyAttendance(existingAtt?.weeklyAttendance || Array(12).fill(0), 5);

      return {
        student,
        scoreId: existingScore?.id,
        weeklyAssignments: weekly,
        unitAssignmentTotal: unitTotal,
        weeklyAttendance: weeklyAtt,
        attendanceDaysOpened: opened,
        attendanceDaysPresent: present,
        attendanceRate: existingAtt ? attRate : undefined,
        ca1,
        ca2,
        exam,
        total,
        grade: evalRes.grade,
        remark: evalRes.remark,
      };
    });

    setLocalRows(rows);

    if (targetStudentId) {
      const idx = rows.findIndex((r) => r.student.id === targetStudentId);
      if (idx !== -1) {
        setActiveModalStudentIndex(idx);
      }
    }
  }, [
    selectedClassId,
    selectedSubjectId,
    students,
    scores,
    attendance,
    currentTerm.id,
    currentSession.id,
    gradeScale,
    targetStudentId,
  ]);

  // Handle single week unit assignment change (weekIndex 0..11, val 0..4)
  const handleWeeklyChange = (studentIndex: number, weekIndex: number, valueStr: string) => {
    let val = parseInt(valueStr, 10);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 4) val = 4;

    setLocalRows((prev) => {
      const updated = [...prev];
      const targetRow = { ...updated[studentIndex] };
      const newWeekly = [...targetRow.weeklyAssignments];
      newWeekly[weekIndex] = val;
      targetRow.weeklyAssignments = newWeekly;

      const newUnitTotal = calculateWeeklyTotal(newWeekly);
      targetRow.unitAssignmentTotal = newUnitTotal;

      // Also auto-calculate CA1 scaled to 20
      const scaledCa1 = scaleWeeklyToCa(newUnitTotal, 20);
      targetRow.ca1 = scaledCa1;

      // Recompute total & grade
      const nCa1 = Number(targetRow.ca1) || 0;
      const nCa2 = Number(targetRow.ca2) || 0;
      const nExam = Number(targetRow.exam) || 0;
      targetRow.total = calculateTotalScore(nCa1, nCa2, nExam);
      const evalRes = evaluateGradeAndRemark(targetRow.total, gradeScale);
      targetRow.grade = evalRes.grade;
      targetRow.remark = evalRes.remark;

      updated[studentIndex] = targetRow;
      return updated;
    });
  };

  // Handle terminal assessment changes (ca1, ca2, exam)
  const handleScoreChange = (
    index: number,
    field: 'ca1' | 'ca2' | 'exam',
    valueStr: string
  ) => {
    let finalVal: number | string = valueStr;
    if (valueStr !== '') {
      let num = parseFloat(valueStr);
      if (isNaN(num)) num = 0;
      if (field === 'ca1' && num > 20) num = 20;
      if (field === 'ca2' && num > 20) num = 20;
      if (field === 'exam' && num > 60) num = 60;
      if (num < 0) num = 0;
      finalVal = num;
    }

    setLocalRows((prev) => {
      const updated = [...prev];
      const targetRow = { ...updated[index] };
      targetRow[field] = finalVal;

      const nCa1 = Number(targetRow.ca1) || 0;
      const nCa2 = Number(targetRow.ca2) || 0;
      const nExam = Number(targetRow.exam) || 0;
      targetRow.total = calculateTotalScore(nCa1, nCa2, nExam);
      const evalRes = evaluateGradeAndRemark(targetRow.total, gradeScale);
      targetRow.grade = evalRes.grade;
      targetRow.remark = evalRes.remark;

      updated[index] = targetRow;
      return updated;
    });
  };

  // Save all entered scores to parent state
  const handleSaveAll = () => {
    const updatedScores: ScoreRecord[] = localRows.map((row) => {
      const ca1Num = typeof row.ca1 === 'number' ? row.ca1 : parseFloat(row.ca1) || 0;
      const ca2Num = typeof row.ca2 === 'number' ? row.ca2 : parseFloat(row.ca2) || 0;
      const examNum = typeof row.exam === 'number' ? row.exam : parseFloat(row.exam) || 0;
      const totalNum = calculateTotalScore(ca1Num, ca2Num, examNum);
      const evalRes = evaluateGradeAndRemark(totalNum, gradeScale);

      return {
        id:
          row.scoreId ||
          `sc_${row.student.id}_${selectedSubjectId}_${selectedClassId}_${currentTerm.id}`,
        studentId: row.student.id,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        sessionId: currentSession.id,
        termId: currentTerm.id,
        weeklyAssignments: row.weeklyAssignments,
        unitAssignmentTotal: row.unitAssignmentTotal,
        ca1: ca1Num,
        ca2: ca2Num,
        exam: examNum,
        total: totalNum,
        grade: evalRes.grade,
        remark: evalRes.remark,
      };
    });

    onSaveScores(updatedScores);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Fast Batch: Fill all 12 weeks with specific score
  const handleFillAllWeeks = (scoreValue: number) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        const weekly = Array(12).fill(scoreValue);
        const unitTotal = calculateWeeklyTotal(weekly);
        const ca1 = scaleWeeklyToCa(unitTotal, 20);
        const ca2 = row.ca2;
        const exam = row.exam;
        const total = calculateTotalScore(ca1, Number(ca2) || 0, Number(exam) || 0);
        const evalRes = evaluateGradeAndRemark(total, gradeScale);
        return {
          ...row,
          weeklyAssignments: weekly,
          unitAssignmentTotal: unitTotal,
          ca1,
          ca2,
          exam,
          total,
          grade: evalRes.grade,
          remark: evalRes.remark,
        };
      })
    );
  };

  // Fast Batch: Reset all 12 weekly unit marks to default 00
  const handleResetWeeklyToDefault00 = () => {
    setLocalRows((prev) =>
      prev.map((row) => {
        const weekly = Array(12).fill(0);
        const unitTotal = 0;
        const ca1 = 0;
        const total = calculateTotalScore(0, Number(row.ca2) || 0, Number(row.exam) || 0);
        const evalRes = evaluateGradeAndRemark(total, gradeScale);
        return {
          ...row,
          weeklyAssignments: weekly,
          unitAssignmentTotal: unitTotal,
          ca1,
          total,
          grade: evalRes.grade,
          remark: evalRes.remark,
        };
      })
    );
  };

  // Sync Unit Total (/48) to CA 1 (/20) for all students
  const handleSyncWeeklyToCa1 = () => {
    setLocalRows((prev) =>
      prev.map((row) => {
        const ca1 = scaleWeeklyToCa(row.unitAssignmentTotal, 20);
        const total = calculateTotalScore(ca1, Number(row.ca2) || 0, Number(row.exam) || 0);
        const evalRes = evaluateGradeAndRemark(total, gradeScale);
        return {
          ...row,
          ca1,
          total,
          grade: evalRes.grade,
          remark: evalRes.remark,
        };
      })
    );
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back to Teacher Classes link if accessible */}
      {onBackToTeacherClasses && (
        <div>
          <button
            id="btn-back-to-teacher-classes"
            onClick={onBackToTeacherClasses}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to My Classes & Student Roster</span>
          </button>
        </div>
      )}

      {/* Top Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>Grade & Assignment Entry</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              12 Weeks Unit Assignments
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter 12-week unit assignments (Default 00) & weekly unit attendance for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold animate-fade-in border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Grades Saved Successfully!
            </div>
          )}

          <button
            id="btn-save-grades"
            onClick={handleSaveAll}
            disabled={localRows.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Grade Sheet
          </button>
        </div>
      </div>

      {/* Teacher Session Banner if logged in as faculty */}
      {currentUser?.role === 'teacher' && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-700 text-white font-bold">
              👨‍🏫
            </div>
            <div>
              <div className="font-bold text-teal-950">
                Teacher Session: {currentUser.name} {currentUser.arabicName ? `(${currentUser.arabicName})` : ''}
              </div>
              <div className="text-teal-700 font-medium text-[11px]">
                {currentUser.title} • Showing records for your assigned students
              </div>
            </div>
          </div>
          {currentUser.assignedClassId && (
            <span className="px-2.5 py-1 rounded-lg bg-teal-100/80 text-teal-800 font-semibold text-xs border border-teal-200">
              Class: {classes.find((c) => c.id === currentUser.assignedClassId)?.name}
            </span>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Class
          </label>
          <select
            id="select-grade-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.section})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject
          </label>
          <select
            id="select-grade-subject"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Academic Term
          </label>
          <div className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium flex items-center justify-between">
            <span>{currentTerm.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">12 Wks</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Academic Session
          </label>
          <div className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium truncate">
            {currentSession.name}
          </div>
        </div>
      </div>

      {/* Mode Switcher & Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Tab View Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'weekly'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            12-Week Unit Assignment Sheet (0-4 pts)
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'summary'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
            Terminal Grade Sheet (CA & Exam)
          </button>
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'combined'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            Full Matrix
          </button>
        </div>

        {/* Fast Batch Operations */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetWeeklyToDefault00}
            title="Sets all 12 weekly unit marks to default 00"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3 h-3 text-slate-600" />
            Default 00s (Reset All)
          </button>
          <button
            onClick={() => handleFillAllWeeks(4)}
            title="Sets 4/4 for all 12 weeks for all students"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Fill 4s (Full marks)
          </button>
          <button
            onClick={() => handleFillAllWeeks(3)}
            title="Sets 3/4 for all 12 weeks for all students"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            Fill 3s
          </button>
          <button
            onClick={handleSyncWeeklyToCa1}
            title="Calculates CA 1 out of 20 based on total unit assignment score / 48"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs"
          >
            <ArrowRight className="w-3 h-3" />
            Sync Weeks to CA 1 (20)
          </button>
          <button
            onClick={() => handleOpenAiCommentModal()}
            disabled={localRows.length === 0}
            title="Generate personalized report card remarks using Gemini AI"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-linear-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white shadow-2xs transition-all border border-emerald-700/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>AI Comment Generator</span>
          </button>
        </div>
      </div>

      {/* Grade Table Grid */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Sub-header */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800 text-sm">
              {currentClass?.name} — {currentSubject?.name}
            </span>
            <span className="text-xs text-slate-500 ml-2">
              (Subject Code: {currentSubject?.code})
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Marks: 0-4 pts/wk (Default: 00) • Attendance included
            </span>
            <span>• {localRows.length} Enrolled</span>
          </div>
        </div>

        {/* View Mode 1: 12-Week Unit Assignment Sheet */}
        {viewMode === 'weekly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Student Name & Reg No</th>
                  {Array.from({ length: 12 }).map((_, wIdx) => (
                    <th key={wIdx} className="py-3 px-1.5 text-center w-12">
                      <div className="font-bold text-emerald-900">W{wIdx + 1}</div>
                      <div className="text-[10px] text-slate-400 font-normal">0-4</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center w-24 bg-emerald-50/50">
                    <div className="font-bold text-emerald-950">Unit Total</div>
                    <div className="text-[10px] text-emerald-700 font-normal">/ 48</div>
                  </th>
                  <th className="py-3 px-3 text-center w-20 bg-emerald-50/50">
                    <div className="font-bold text-emerald-950">Scaled CA</div>
                    <div className="text-[10px] text-emerald-700 font-normal">/ 20</div>
                  </th>
                  <th className="py-3 px-3 text-center w-24 bg-slate-50">
                    <div className="font-bold text-slate-800">Unit Att.</div>
                    <div className="text-[10px] text-slate-400 font-normal">Present / %</div>
                  </th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {localRows.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-400">
                      No students currently enrolled in this class. Please assign students in the Registration tab.
                    </td>
                  </tr>
                ) : (
                  localRows.map((row, sIdx) => {
                    const avg = (row.unitAssignmentTotal / 12).toFixed(1);
                    return (
                      <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                          {sIdx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 leading-tight">{row.student.fullName}</div>
                          <div className="text-[11px] text-emerald-800 font-mono font-medium">{row.student.regNo}</div>
                        </td>

                        {/* 12 Week Inputs (Default 00) */}
                        {row.weeklyAssignments.map((weekScore, wIdx) => (
                          <td key={wIdx} className="py-2.5 px-1 text-center">
                            <input
                              type="number"
                              min={0}
                              max={4}
                              step={1}
                              value={weekScore === 0 ? '00' : weekScore}
                              placeholder="00"
                              onChange={(e) => handleWeeklyChange(sIdx, wIdx, e.target.value)}
                              className={`w-9 h-8 text-center font-bold text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                                weekScore === 4
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : weekScore === 3
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : weekScore === 2
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : weekScore === 1
                                  ? 'bg-orange-50 text-orange-900 border-orange-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 font-mono'
                              }`}
                              title={`Week ${wIdx + 1}: ${weekScore} of 4 points`}
                            />
                          </td>
                        ))}

                        {/* Total Unit Assignments out of 48 */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/40 font-mono font-bold text-emerald-950">
                          <span className="text-sm">
                            {row.unitAssignmentTotal === 0 ? '00' : row.unitAssignmentTotal}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">/48</span>
                          <div className="text-[10px] text-emerald-700 font-sans font-medium">{avg}/4.0</div>
                        </td>

                        {/* Scaled CA 1 */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/40 font-mono font-bold text-emerald-900">
                          <span className="text-sm">
                            {scaleWeeklyToCa(row.unitAssignmentTotal, 20) === 0 ? '00' : scaleWeeklyToCa(row.unitAssignmentTotal, 20)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">/20</span>
                        </td>

                        {/* Unit Attendance Column */}
                        <td className="py-2.5 px-3 text-center">
                          {row.attendanceRate !== undefined ? (
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  row.attendanceRate >= 85
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.attendanceRate >= 70
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {row.attendanceRate}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {row.attendanceDaysPresent}/{row.attendanceDaysOpened}d
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">00% (—)</span>
                          )}
                        </td>

                        {/* Open Student Modal & AI Remark */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAiCommentModal(sIdx)}
                              className="px-2 py-1 rounded-md text-xs font-semibold text-emerald-800 hover:bg-emerald-100 bg-emerald-50 border border-emerald-300 flex items-center gap-1 transition-colors shadow-2xs"
                              title="Generate personalized AI remark with Gemini"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>AI Remark</span>
                            </button>
                            <button
                              onClick={() => setActiveModalStudentIndex(sIdx)}
                              className="px-2 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                            >
                              Week Card
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Terminal Grade Sheet (Summary) */}
        {viewMode === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Student Name & Reg No</th>
                  <th className="py-3 px-4 w-28 text-center bg-emerald-50/50">
                    12-Wk Units (/48)
                  </th>
                  <th className="py-3 px-4 w-24 text-center">CA 1 (20)</th>
                  <th className="py-3 px-4 w-24 text-center">CA 2 (20)</th>
                  <th className="py-3 px-4 w-24 text-center">Exam (60)</th>
                  <th className="py-3 px-4 w-24 text-center">Total (100)</th>
                  <th className="py-3 px-4 w-24 text-center">Grade</th>
                  <th className="py-3 px-4 w-28 text-center">Unit Att.</th>
                  <th className="py-3 px-4 w-32">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {localRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No students enrolled.
                    </td>
                  </tr>
                ) : (
                  localRows.map((row, idx) => (
                    <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{row.student.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{row.student.regNo}</div>
                      </td>

                      {/* 12-Wk Unit Total */}
                      <td className="py-3 px-4 text-center bg-emerald-50/30 font-bold font-mono text-emerald-950">
                        {row.unitAssignmentTotal === 0 ? '00' : row.unitAssignmentTotal}
                      </td>

                      {/* CA 1 */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={row.ca1}
                          placeholder="00"
                          onChange={(e) => handleScoreChange(idx, 'ca1', e.target.value)}
                          className="w-20 px-2 py-1.5 text-center font-bold text-slate-800 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                        />
                      </td>

                      {/* CA 2 */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={row.ca2}
                          placeholder="00"
                          onChange={(e) => handleScoreChange(idx, 'ca2', e.target.value)}
                          className="w-20 px-2 py-1.5 text-center font-bold text-slate-800 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                        />
                      </td>

                      {/* Exam */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          step="1"
                          value={row.exam}
                          placeholder="00"
                          onChange={(e) => handleScoreChange(idx, 'exam', e.target.value)}
                          className="w-20 px-2 py-1.5 text-center font-bold text-slate-800 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                        />
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900 text-base font-mono">
                          {row.total}
                        </span>
                      </td>

                      {/* Grade Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                            row.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : row.grade === 'C'
                              ? 'bg-teal-100 text-teal-800'
                              : row.grade === 'D'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.grade}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-4 text-center">
                        {row.attendanceRate !== undefined ? (
                          <span className="font-semibold text-xs text-slate-700">
                            {row.attendanceRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Remark with inline edit & AI button */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 min-w-[230px]">
                          <input
                            type="text"
                            value={row.remark}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalRows((prev) => {
                                const upd = [...prev];
                                upd[idx] = { ...upd[idx], remark: val };
                                return upd;
                              });
                            }}
                            placeholder="Report card remark..."
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-serif text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 truncate"
                            title={row.remark}
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenAiCommentModal(idx)}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                            title="Generate personalized report card remark with Gemini"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>AI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 3: Combined Full Matrix */}
        {viewMode === 'combined' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[170px]">Student Name</th>
                  {Array.from({ length: 12 }).map((_, wIdx) => (
                    <th key={wIdx} className="py-2 px-1 text-center w-9 text-[10px]">
                      W{wIdx + 1}
                    </th>
                  ))}
                  <th className="py-3 px-2 text-center w-16 bg-emerald-50/50">Unit /48</th>
                  <th className="py-3 px-2 text-center w-16">CA1 (20)</th>
                  <th className="py-3 px-2 text-center w-16">CA2 (20)</th>
                  <th className="py-3 px-2 text-center w-16">Exam (60)</th>
                  <th className="py-3 px-2 text-center w-16">Total</th>
                  <th className="py-3 px-2 text-center w-14">Grade</th>
                  <th className="py-3 px-2 text-center w-16">Att. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {localRows.map((row, sIdx) => (
                  <tr key={row.student.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-2 text-center font-mono text-slate-400">{sIdx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{row.student.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.student.regNo}</div>
                    </td>
                    {row.weeklyAssignments.map((wVal, wIdx) => (
                      <td key={wIdx} className="py-2 px-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={wVal === 0 ? '00' : wVal}
                          placeholder="00"
                          onChange={(e) => handleWeeklyChange(sIdx, wIdx, e.target.value)}
                          className={`w-7 h-7 text-center font-bold text-xs rounded border ${
                            wVal === 0 ? 'text-slate-400 bg-slate-50 font-mono' : 'text-slate-900 bg-white'
                          } border-slate-200 focus:border-emerald-500`}
                        />
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-bold bg-emerald-50/30 text-emerald-900 font-mono">
                      {row.unitAssignmentTotal === 0 ? '00' : row.unitAssignmentTotal}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={row.ca1}
                        placeholder="00"
                        onChange={(e) => handleScoreChange(sIdx, 'ca1', e.target.value)}
                        className="w-14 px-1 py-1 text-center font-bold text-slate-800 rounded border border-slate-200"
                      />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={row.ca2}
                        placeholder="00"
                        onChange={(e) => handleScoreChange(sIdx, 'ca2', e.target.value)}
                        className="w-14 px-1 py-1 text-center font-bold text-slate-800 rounded border border-slate-200"
                      />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={row.exam}
                        placeholder="00"
                        onChange={(e) => handleScoreChange(sIdx, 'exam', e.target.value)}
                        className="w-14 px-1 py-1 text-center font-bold text-slate-800 rounded border border-slate-200"
                      />
                    </td>
                    <td className="py-2 px-2 text-center font-bold font-mono text-slate-900">
                      {row.total}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="font-bold text-emerald-700">{row.grade}</span>
                    </td>
                    <td className="py-2 px-2 text-center text-[11px] font-semibold text-slate-600">
                      {row.attendanceRate !== undefined ? `${row.attendanceRate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Student Weekly Assignment & Attendance Card Modal */}
      {activeModalStudentIndex !== null && localRows[activeModalStudentIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
              <div>
                <h3 className="font-bold text-base">
                  12-Week Unit Profile (Marks & Attendance)
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {localRows[activeModalStudentIndex].student.fullName} • {localRows[activeModalStudentIndex].student.regNo}
                </p>
              </div>
              <button
                onClick={() => setActiveModalStudentIndex(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Unit Mark Total</span>
                  <span className="text-xl font-bold font-mono text-emerald-950">
                    {localRows[activeModalStudentIndex].unitAssignmentTotal === 0
                      ? '00'
                      : localRows[activeModalStudentIndex].unitAssignmentTotal}{' '}
                    / 48
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[11px] text-blue-700 font-semibold block">Weekly Average</span>
                  <span className="text-xl font-bold font-mono text-blue-950">
                    {(localRows[activeModalStudentIndex].unitAssignmentTotal / 12).toFixed(2)} / 4.0
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[11px] text-amber-700 font-semibold block">Scaled CA 1</span>
                  <span className="text-xl font-bold font-mono text-amber-950">
                    {scaleWeeklyToCa(localRows[activeModalStudentIndex].unitAssignmentTotal, 20)} / 20
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-center">
                  <span className="text-[11px] text-teal-700 font-semibold block">Unit Attendance</span>
                  <span className="text-xl font-bold font-mono text-teal-950">
                    {localRows[activeModalStudentIndex].attendanceRate !== undefined
                      ? `${localRows[activeModalStudentIndex].attendanceRate}%`
                      : '00%'}
                  </span>
                </div>
              </div>

              {/* 12 Week Grid Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Weekly Unit Marks (Default: 00 | 0-4 pts) & Unit Attendance:
                  </h4>
                  <button
                    onClick={() => {
                      const newWeekly = Array(12).fill(0);
                      setLocalRows((prev) => {
                        const updated = [...prev];
                        const target = { ...updated[activeModalStudentIndex] };
                        target.weeklyAssignments = newWeekly;
                        target.unitAssignmentTotal = 0;
                        target.ca1 = 0;
                        target.total = calculateTotalScore(0, Number(target.ca2) || 0, Number(target.exam) || 0);
                        const ev = evaluateGradeAndRemark(target.total, gradeScale);
                        target.grade = ev.grade;
                        target.remark = ev.remark;
                        updated[activeModalStudentIndex] = target;
                        return updated;
                      });
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Reset Student to 00
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {localRows[activeModalStudentIndex].weeklyAssignments.map((score, wIdx) => {
                    const weekAttDays = localRows[activeModalStudentIndex].weeklyAttendance?.[wIdx] ?? 0;
                    return (
                      <div
                        key={wIdx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-800">Week {wIdx + 1}</span>
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-emerald-900">
                            {score === 0 ? '00' : score} / 4
                          </span>
                        </div>

                        {/* Attendance status for this week */}
                        <div className="text-[10px] text-slate-500 mb-2 flex items-center justify-between">
                          <span>Attended:</span>
                          <span className="font-semibold text-emerald-800">
                            {weekAttDays > 0 ? `${weekAttDays}/5 days` : '00/5 days'}
                          </span>
                        </div>

                        {/* Quick score buttons */}
                        <div className="flex items-center justify-between gap-1">
                          {[0, 1, 2, 3, 4].map((pts) => (
                            <button
                              key={pts}
                              onClick={() =>
                                handleWeeklyChange(activeModalStudentIndex, wIdx, String(pts))
                              }
                              className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                                score === pts
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                              }`}
                            >
                              {pts === 0 ? '00' : pts}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Report Card Remark Section inside Student Card Modal */}
              <div className="p-4 rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Gemini AI Report Card Remark
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Based on {localRows[activeModalStudentIndex].total}% overall score & {localRows[activeModalStudentIndex].attendanceRate ?? 85}% attendance
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAiCommentModal(activeModalStudentIndex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Open AI Comment Studio</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Remark on Report Card:
                    </span>
                    <p className="text-xs text-slate-800 font-serif italic mt-0.5">
                      "{localRows[activeModalStudentIndex].remark || 'Pending evaluation...'}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAiCommentModal(activeModalStudentIndex)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-850 hover:underline shrink-0 flex items-center gap-1"
                  >
                    <span>Switch Tone / Regenerate</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Changes update CA 1 and report cards immediately.
                </span>
                <button
                  onClick={() => setActiveModalStudentIndex(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini-Powered Teacher Comment Generator Modal */}
      {isAiCommentModalOpen && localRows[aiCommentStudentIndex] && (
        <TeacherCommentGeneratorModal
          isOpen={isAiCommentModalOpen}
          onClose={() => setIsAiCommentModalOpen(false)}
          studentData={{
            student: localRows[aiCommentStudentIndex].student,
            unitAssignmentTotal: localRows[aiCommentStudentIndex].unitAssignmentTotal,
            ca1: localRows[aiCommentStudentIndex].ca1,
            ca2: localRows[aiCommentStudentIndex].ca2,
            exam: localRows[aiCommentStudentIndex].exam,
            total: localRows[aiCommentStudentIndex].total,
            grade: localRows[aiCommentStudentIndex].grade,
            attendanceRate: localRows[aiCommentStudentIndex].attendanceRate,
            attendanceDaysPresent: localRows[aiCommentStudentIndex].attendanceDaysPresent,
            attendanceDaysOpened: localRows[aiCommentStudentIndex].attendanceDaysOpened,
            currentRemark: localRows[aiCommentStudentIndex].remark,
          }}
          allStudentsData={localRows.map((r) => ({
            student: r.student,
            unitAssignmentTotal: r.unitAssignmentTotal,
            ca1: r.ca1,
            ca2: r.ca2,
            exam: r.exam,
            total: r.total,
            grade: r.grade,
            attendanceRate: r.attendanceRate,
            attendanceDaysPresent: r.attendanceDaysPresent,
            attendanceDaysOpened: r.attendanceDaysOpened,
            currentRemark: r.remark,
          }))}
          className={classes.find((c) => c.id === selectedClassId)?.name || 'Selected Class'}
          subjectName={subjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject'}
          termName={currentTerm.name}
          sessionName={currentSession.name}
          onApplyRemark={handleApplyGeneratedRemark}
          onSelectAnotherStudent={(studentId) => {
            const nextIdx = localRows.findIndex((r) => r.student.id === studentId);
            if (nextIdx !== -1) {
              setAiCommentStudentIndex(nextIdx);
            }
          }}
        />
      )}
    </div>
  );
};
