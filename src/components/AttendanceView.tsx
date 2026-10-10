import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  AttendanceRecord,
  Term,
  AcademicSession,
  AuthUser,
} from '../types';
import {
  calculateWeeklyAttendanceTotal,
} from '../services/academicService';
import {
  Save,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  UserCheck,
  Check,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Users,
  CheckSquare,
  Bookmark,
  Award,
} from 'lucide-react';
import { AttendanceHeatmapD3 } from './AttendanceHeatmapD3';

interface AttendanceViewProps {
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  currentTerm: Term;
  currentSession: AcademicSession;
  currentUser?: AuthUser | null;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

interface LocalAttendanceRow {
  student: Student;
  attendanceId?: string;
  // 12 units of 5 school days: true = ✅ Present, false = ❌ Absent
  dailyDetails: boolean[][];
  weeklyAttendance: number[]; // 12 unit counts (0 to 5 days present each)
  unitAttendanceTotal: number; // total days present across all 12 units (0 to 60)
  timesOpened: number;
  timesPresent: number | string;
  timesAbsent: number;
}

type AttendanceMode =
  | 'unit_box_tick'
  | 'all_units_matrix'
  | 'unit_roll_call'
  | 'term_summary'
  | 'heatmap';

export interface AcademicUnitInfo {
  index: number; // 0 to 11
  unitNumber: number; // 1 to 12
  name: string; // e.g. "Unit 1"
  arabicName: string; // e.g. "الوحدة الأولى"
  short: string; // e.g. "U1"
}

export const ACADEMIC_UNITS: AcademicUnitInfo[] = [
  { index: 0, unitNumber: 1, name: 'Unit 1', arabicName: 'الوحدة الأولى', short: 'U1' },
  { index: 1, unitNumber: 2, name: 'Unit 2', arabicName: 'الوحدة الثانية', short: 'U2' },
  { index: 2, unitNumber: 3, name: 'Unit 3', arabicName: 'الوحدة الثالثة', short: 'U3' },
  { index: 3, unitNumber: 4, name: 'Unit 4', arabicName: 'الوحدة الرابعة', short: 'U4' },
  { index: 4, unitNumber: 5, name: 'Unit 5', arabicName: 'الوحدة الخامسة', short: 'U5' },
  { index: 5, unitNumber: 6, name: 'Unit 6', arabicName: 'الوحدة السادسة', short: 'U6' },
  { index: 6, unitNumber: 7, name: 'Unit 7', arabicName: 'الوحدة السابعة', short: 'U7' },
  { index: 7, unitNumber: 8, name: 'Unit 8', arabicName: 'الوحدة الثامنة', short: 'U8' },
  { index: 8, unitNumber: 9, name: 'Unit 9', arabicName: 'الوحدة التاسعة', short: 'U9' },
  { index: 9, unitNumber: 10, name: 'Unit 10', arabicName: 'الوحدة العاشرة', short: 'U10' },
  { index: 10, unitNumber: 11, name: 'Unit 11', arabicName: 'الوحدة الحادية عشرة', short: 'U11' },
  { index: 11, unitNumber: 12, name: 'Unit 12', arabicName: 'الوحدة الثانية عشرة', short: 'U12' },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_ARABIC = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

/**
 * Initializes the 12 units x 5 days boolean array from existing attendance data or default
 */
function initDailyDetails(
  existingRecord?: AttendanceRecord,
  defaultDays: number[] = Array(12).fill(5)
): boolean[][] {
  if (
    existingRecord?.dailyDetails &&
    Array.isArray(existingRecord.dailyDetails) &&
    existingRecord.dailyDetails.length === 12
  ) {
    return existingRecord.dailyDetails.map((unit) => {
      if (Array.isArray(unit) && unit.length === 5) return [...unit];
      const count = Array.isArray(unit) ? unit.filter(Boolean).length : 0;
      return Array.from({ length: 5 }, (_, dIdx) => dIdx < count);
    });
  }

  const weekly = existingRecord?.weeklyAttendance || defaultDays;
  return Array.from({ length: 12 }, (_, uIdx) => {
    const daysPresent = Math.min(
      5,
      Math.max(0, Number(weekly[uIdx] !== undefined ? weekly[uIdx] : 5))
    );
    return Array.from({ length: 5 }, (_, dIdx) => dIdx < daysPresent);
  });
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  attendance,
  currentTerm,
  currentSession,
  currentUser,
  onSaveAttendance,
}) => {
  const initialClassId =
    currentUser?.role === 'teacher' && currentUser.assignedClassId
      ? currentUser.assignedClassId
      : classes[0]?.id || '';
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [termDaysOpened, setTermDaysOpened] = useState<number>(65);
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('unit_box_tick');
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(0); // 0 to 11 (Unit 1 to Unit 12)
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0); // 0 to 4 (Mon to Fri)
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [localRecords, setLocalRecords] = useState<LocalAttendanceRow[]>([]);

  // Synchronize state when selected class or source attendance changes
  useEffect(() => {
    const classStudents = students.filter((s) => s.classId === selectedClassId);
    const rows: LocalAttendanceRow[] = classStudents.map((student) => {
      const existing = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.classId === selectedClassId &&
          a.termId === currentTerm.id &&
          a.sessionId === currentSession.id
      );

      const opened = existing?.timesOpened ?? termDaysOpened;
      const dailyDetails = initDailyDetails(existing, Array(12).fill(5));
      const weekly = dailyDetails.map((u) => u.filter(Boolean).length);
      const unitTotal = calculateWeeklyAttendanceTotal(weekly);

      let present: number | string;
      if (existing && typeof existing.timesPresent === 'number') {
        present = existing.timesPresent;
      } else if (unitTotal > 0) {
        present = unitTotal;
      } else {
        present = unitTotal;
      }

      const numPresent = typeof present === 'number' ? present : parseInt(present, 10) || 0;
      const absent = Math.max(0, opened - numPresent);

      return {
        student,
        attendanceId: existing?.id,
        dailyDetails,
        weeklyAttendance: weekly,
        unitAttendanceTotal: unitTotal,
        timesOpened: opened,
        timesPresent: present,
        timesAbsent: absent,
      };
    });

    setLocalRecords(rows);
  }, [selectedClassId, students, attendance, currentTerm.id, currentSession.id]);

  // Toggle single day box tick for a specific unit (studentIndex, unitIndex, dayIndex)
  const handleToggleDay = (studentIndex: number, unitIndex: number, dayIndex: number) => {
    setLocalRecords((prev) => {
      const updated = [...prev];
      const target = { ...updated[studentIndex] };
      const newDetails = target.dailyDetails.map((u, uIdx) =>
        uIdx === unitIndex ? [...u] : u
      );
      newDetails[unitIndex][dayIndex] = !newDetails[unitIndex][dayIndex];
      target.dailyDetails = newDetails;

      const newWeekly = newDetails.map((u) => u.filter(Boolean).length);
      target.weeklyAttendance = newWeekly;

      const newUnitTotal = newWeekly.reduce((a, b) => a + b, 0);
      target.unitAttendanceTotal = newUnitTotal;
      target.timesPresent = newUnitTotal;
      target.timesAbsent = Math.max(0, target.timesOpened - newUnitTotal);

      updated[studentIndex] = target;
      return updated;
    });
  };

  // Set all 5 days for a specific student in the active unit (All ✅ or All ❌)
  const handleSetStudentUnitAttendance = (
    studentIndex: number,
    unitIndex: number,
    isPresent: boolean
  ) => {
    setLocalRecords((prev) => {
      const updated = [...prev];
      const target = { ...updated[studentIndex] };
      const newDetails = target.dailyDetails.map((u, uIdx) =>
        uIdx === unitIndex ? Array(5).fill(isPresent) : u
      );
      target.dailyDetails = newDetails;

      const newWeekly = newDetails.map((u) => u.filter(Boolean).length);
      target.weeklyAttendance = newWeekly;

      const newUnitTotal = newWeekly.reduce((a, b) => a + b, 0);
      target.unitAttendanceTotal = newUnitTotal;
      target.timesPresent = newUnitTotal;
      target.timesAbsent = Math.max(0, target.timesOpened - newUnitTotal);

      updated[studentIndex] = target;
      return updated;
    });
  };

  // Set a specific day for all students in the class for the active unit
  const handleSetDayForAllStudentsInUnit = (
    unitIndex: number,
    dayIndex: number,
    isPresent: boolean
  ) => {
    setLocalRecords((prev) =>
      prev.map((row) => {
        const newDetails = row.dailyDetails.map((u, uIdx) => {
          if (uIdx !== unitIndex) return u;
          const copy = [...u];
          copy[dayIndex] = isPresent;
          return copy;
        });
        const newWeekly = newDetails.map((u) => u.filter(Boolean).length);
        const newUnitTotal = newWeekly.reduce((a, b) => a + b, 0);

        return {
          ...row,
          dailyDetails: newDetails,
          weeklyAttendance: newWeekly,
          unitAttendanceTotal: newUnitTotal,
          timesPresent: newUnitTotal,
          timesAbsent: Math.max(0, row.timesOpened - newUnitTotal),
        };
      })
    );
  };

  // Set all 5 days for the whole class for the active unit
  const handleSetWholeClassForUnit = (unitIndex: number, isPresent: boolean) => {
    setLocalRecords((prev) =>
      prev.map((row) => {
        const newDetails = row.dailyDetails.map((u, uIdx) =>
          uIdx === unitIndex ? Array(5).fill(isPresent) : u
        );
        const newWeekly = newDetails.map((u) => u.filter(Boolean).length);
        const newUnitTotal = newWeekly.reduce((a, b) => a + b, 0);

        return {
          ...row,
          dailyDetails: newDetails,
          weeklyAttendance: newWeekly,
          unitAttendanceTotal: newUnitTotal,
          timesPresent: newUnitTotal,
          timesAbsent: Math.max(0, row.timesOpened - newUnitTotal),
        };
      })
    );
  };

  // Quick fill all 12 units with full attendance (5 days per unit = 60 days total)
  const handleMarkAllUnitsFull = () => {
    setLocalRecords((prev) =>
      prev.map((row) => {
        const newDetails = Array.from({ length: 12 }, () => Array(5).fill(true));
        const newWeekly = Array(12).fill(5);
        return {
          ...row,
          dailyDetails: newDetails,
          weeklyAttendance: newWeekly,
          unitAttendanceTotal: 60,
          timesPresent: 60,
          timesAbsent: Math.max(0, row.timesOpened - 60),
        };
      })
    );
  };

  // Reset all 12 units to all absent (0 days)
  const handleResetAllUnitsAbsent = () => {
    setLocalRecords((prev) =>
      prev.map((row) => {
        const newDetails = Array.from({ length: 12 }, () => Array(5).fill(false));
        const newWeekly = Array(12).fill(0);
        return {
          ...row,
          dailyDetails: newDetails,
          weeklyAttendance: newWeekly,
          unitAttendanceTotal: 0,
          timesPresent: 0,
          timesAbsent: row.timesOpened,
        };
      })
    );
  };

  // Handle total term present change in summary mode
  const handlePresentSummaryChange = (index: number, presentValStr: string) => {
    if (presentValStr === '') {
      setLocalRecords((prev) => {
        const updated = [...prev];
        const row = { ...updated[index] };
        row.timesPresent = '';
        row.timesAbsent = row.timesOpened;
        updated[index] = row;
        return updated;
      });
      return;
    }

    let present = parseInt(presentValStr, 10);
    if (isNaN(present)) present = 0;
    if (present < 0) present = 0;
    if (present > termDaysOpened) present = termDaysOpened;

    setLocalRecords((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.timesPresent = present;
      row.timesAbsent = Math.max(0, row.timesOpened - present);
      updated[index] = row;
      return updated;
    });
  };

  const handleSaveAll = () => {
    const recordsToSave: AttendanceRecord[] = localRecords.map((row) => {
      const presentNum =
        typeof row.timesPresent === 'number'
          ? row.timesPresent
          : parseInt(row.timesPresent, 10) || 0;

      return {
        id:
          row.attendanceId ||
          `att_${row.student.id}_${selectedClassId}_${currentTerm.id}`,
        studentId: row.student.id,
        classId: selectedClassId,
        sessionId: currentSession.id,
        termId: currentTerm.id,
        timesOpened: row.timesOpened,
        timesPresent: presentNum,
        timesAbsent: Math.max(0, row.timesOpened - presentNum),
        weeklyAttendance: row.weeklyAttendance,
        unitAttendanceTotal: row.unitAttendanceTotal,
        dailyDetails: row.dailyDetails,
      };
    });

    onSaveAttendance(recordsToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Filtered rows by search query
  const filteredRecords = useMemo(() => {
    if (!studentSearch.trim()) return localRecords;
    const q = studentSearch.toLowerCase().trim();
    return localRecords.filter(
      (r) =>
        r.student.fullName.toLowerCase().includes(q) ||
        r.student.regNo.toLowerCase().includes(q)
    );
  }, [localRecords, studentSearch]);

  const activeUnit = ACADEMIC_UNITS[activeUnitIndex];

  // Unit statistics for the currently selected active unit
  const activeUnitStats = useMemo(() => {
    if (localRecords.length === 0) {
      return { totalPossible: 0, totalPresents: 0, totalAbsences: 0, rate: 0 };
    }
    const totalPossible = localRecords.length * 5;
    const totalPresents = localRecords.reduce((acc, r) => {
      const unitDays = r.dailyDetails[activeUnitIndex] || [];
      return acc + unitDays.filter(Boolean).length;
    }, 0);
    const totalAbsences = totalPossible - totalPresents;
    const rate = totalPossible > 0 ? Math.round((totalPresents / totalPossible) * 100) : 0;
    return { totalPossible, totalPresents, totalAbsences, rate };
  }, [localRecords, activeUnitIndex]);

  // Overall term statistics across all 12 units
  const termOverallStats = useMemo(() => {
    if (localRecords.length === 0) return { avgRate: 0, totalAttended: 0, maxPossible: 0 };
    const maxPossible = localRecords.length * 60;
    const totalAttended = localRecords.reduce((acc, r) => acc + r.unitAttendanceTotal, 0);
    const avgRate = maxPossible > 0 ? Math.round((totalAttended / maxPossible) * 100) : 0;
    return { avgRate, totalAttended, maxPossible };
  }, [localRecords]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header with Save and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Unit-by-Unit Register • سجل الحضور بالوحدات
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 flex-wrap">
            <span>Unit-by-Unit Attendance Register</span>
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
              <span className="text-emerald-700">✅</span>
              <span>Box Tick (❌ / ✅)</span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mark student attendance unit by unit across the 12 curriculum blocks (Unit 1 – Unit 12) with daily box ticks
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {saveSuccess && (
            <div className="p-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Unit Attendance Saved to Database!</span>
            </div>
          )}

          <button
            id="btn-save-attendance"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Attendance Sheet</span>
          </button>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-5">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            Select Enrolled Class
          </label>
          <select
            id="select-attendance-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.section})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            Total School Days in Term
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={termDaysOpened}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              setTermDaysOpened(val);
              setLocalRecords((prev) =>
                prev.map((r) => ({
                  ...r,
                  timesOpened: val,
                  timesAbsent: Math.max(0, val - Number(r.timesPresent || 0)),
                }))
              );
            }}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Academic Term
          </label>
          <div className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold truncate flex items-center justify-between">
            <span>{currentSession.name} • {currentTerm.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              12 Units
            </span>
          </div>
        </div>
      </div>

      {/* KPI Badges for Selected Unit and Overall Term */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Class Students</div>
            <div className="text-lg font-black text-slate-900 font-mono leading-tight">
              {localRecords.length}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 font-bold text-base">
            ✅
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">
              {activeUnit.name} Present
            </div>
            <div className="text-lg font-black text-emerald-800 font-mono leading-tight">
              {activeUnitStats.totalPresents}{' '}
              <span className="text-xs text-slate-400 font-normal">
                / {activeUnitStats.totalPossible}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0 border border-rose-200 font-bold text-base">
            ❌
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">
              {activeUnit.name} Absent
            </div>
            <div className="text-lg font-black text-rose-800 font-mono leading-tight">
              {activeUnitStats.totalAbsences}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">
              {activeUnit.name} Rate
            </div>
            <div className="text-lg font-black text-teal-900 font-mono leading-tight">
              {activeUnitStats.rate}%
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            id="btn-mode-unit-box-tick"
            onClick={() => setAttendanceMode('unit_box_tick')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              attendanceMode === 'unit_box_tick'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-300" />
            <span>Unit Box Tick Register ❌✅</span>
          </button>

          <button
            type="button"
            id="btn-mode-all-units-matrix"
            onClick={() => setAttendanceMode('all_units_matrix')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              attendanceMode === 'all_units_matrix'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            <span>All Units Matrix (Unit 1 – 12)</span>
          </button>

          <button
            type="button"
            id="btn-mode-unit-roll-call"
            onClick={() => setAttendanceMode('unit_roll_call')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              attendanceMode === 'unit_roll_call'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Single-Day Unit Roll Call</span>
          </button>

          <button
            type="button"
            id="btn-mode-term-summary"
            onClick={() => setAttendanceMode('term_summary')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              attendanceMode === 'term_summary'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-300" />
            <span>Term Totals & Summary</span>
          </button>

          <button
            type="button"
            id="btn-mode-heatmap"
            onClick={() => setAttendanceMode('heatmap')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              attendanceMode === 'heatmap'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Unit Heatmap</span>
          </button>
        </div>

        {/* Search Student Filter */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student or Reg No..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
          />
        </div>
      </div>

      {/* D3 Heatmap Standalone Mode */}
      {attendanceMode === 'heatmap' && (
        <AttendanceHeatmapD3
          selectedClass={classes.find((c) => c.id === selectedClassId)}
          records={localRecords}
          currentTerm={currentTerm}
          currentSession={currentSession}
          termDaysOpened={termDaysOpened}
        />
      )}

      {/* MODE 1: UNIT-BY-UNIT BOX TICK REGISTER ❌✅ (Primary Mode) */}
      {attendanceMode === 'unit_box_tick' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Unit Selector Carousel & Navigation Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveUnitIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeUnitIndex === 0}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Previous Unit"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>

              <div>
                <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Curriculum Unit Block • {activeUnit.arabicName}</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  <span>{activeUnit.name} of 12</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    5 School Days
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveUnitIndex((prev) => Math.min(11, prev + 1))}
                disabled={activeUnitIndex === 11}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Next Unit"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* 12 Unit Buttons Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              {ACADEMIC_UNITS.map((unit) => {
                const isActive = activeUnitIndex === unit.index;
                return (
                  <button
                    key={unit.index}
                    type="button"
                    onClick={() => setActiveUnitIndex(unit.index)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-center ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <div className="font-extrabold">{unit.short}</div>
                    <div className="text-[9px] opacity-80">{unit.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch Quick Operations for Active Unit */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <span className="text-emerald-900 font-bold">{activeUnit.name} Controls:</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300">
                <span>Click</span>
                <strong>❌</strong>
                <span>to mark</span>
                <strong>✅ Present</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-300">
                <span>Click</span>
                <strong>✅</strong>
                <span>to mark</span>
                <strong>❌ Absent</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetWholeClassForUnit(activeUnitIndex, true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>✅ Mark All Present for {activeUnit.name} (5 Days)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetWholeClassForUnit(activeUnitIndex, false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>❌ Mark All Absent for {activeUnit.name} (0 Days)</span>
              </button>
            </div>
          </div>

          {/* Unit Day-by-Day Table of 5 Days Box Ticks */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Student Name & Reg No</th>
                  {DAY_SHORT.map((dayName, dIdx) => (
                    <th key={dIdx} className="py-3 px-2 text-center w-28">
                      <div className="font-extrabold text-slate-900 text-sm">{dayName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Day {dIdx + 1} • {DAY_ARABIC[dIdx]}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleSetDayForAllStudentsInUnit(activeUnitIndex, dIdx, true)}
                          title={`Mark entire class Present on ${DAY_NAMES[dIdx]}`}
                          className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold cursor-pointer"
                        >
                          All ✅
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetDayForAllStudentsInUnit(activeUnitIndex, dIdx, false)}
                          title={`Mark entire class Absent on ${DAY_NAMES[dIdx]}`}
                          className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold cursor-pointer"
                        >
                          All ❌
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center w-28 bg-emerald-50/50">
                    <div className="font-bold text-emerald-950">{activeUnit.name} Total</div>
                    <div className="text-[10px] text-emerald-700 font-normal">/ 5 days</div>
                  </th>
                  <th className="py-3 px-3 text-center w-32">
                    <span>{activeUnit.name} Quick Fill</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row, sIdx) => {
                    const originalIdx = localRecords.findIndex((r) => r.student.id === row.student.id);
                    const unitDays = row.dailyDetails[activeUnitIndex] || [false, false, false, false, false];
                    const unitPresentCount = unitDays.filter(Boolean).length;
                    const unitRate = Math.round((unitPresentCount / 5) * 100);

                    return (
                      <tr
                        key={row.student.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                          {sIdx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 leading-tight">
                            {row.student.fullName}
                          </div>
                          <div className="text-xs text-emerald-800 font-mono font-medium mt-0.5">
                            {row.student.regNo}
                          </div>
                        </td>

                        {/* Mon - Fri Interactive Box Ticks (❌/✅) */}
                        {unitDays.map((isDayPresent, dIdx) => (
                          <td key={dIdx} className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDay(originalIdx, activeUnitIndex, dIdx)}
                              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black transition-all active:scale-90 shadow-2xs cursor-pointer select-none mx-auto border-2 ${
                                isDayPresent
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-500 text-emerald-700 shadow-emerald-100 ring-2 ring-emerald-200/50'
                                  : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-600 shadow-rose-100'
                              }`}
                              title={`${row.student.fullName} — ${activeUnit.name}, ${DAY_NAMES[dIdx]}: ${
                                isDayPresent ? 'PRESENT ✅ (Click to mark ❌)' : 'ABSENT ❌ (Click to mark ✅)'
                              }`}
                            >
                              {isDayPresent ? (
                                <>
                                  <span className="text-xl leading-none">✅</span>
                                  <span className="text-[9px] font-bold text-emerald-800 uppercase mt-0.5">Present</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xl leading-none">❌</span>
                                  <span className="text-[9px] font-bold text-rose-700 uppercase mt-0.5">Absent</span>
                                </>
                              )}
                            </button>
                          </td>
                        ))}

                        {/* Unit Total Present */}
                        <td className="py-3 px-3 text-center bg-emerald-50/40">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-base font-black font-mono text-emerald-950">
                              {unitPresentCount} / 5
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                                unitRate >= 80
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : unitRate >= 60
                                  ? 'bg-blue-100 text-blue-900'
                                  : unitRate >= 40
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {unitRate}%
                            </span>
                          </div>
                        </td>

                        {/* Unit Row Shortcuts (All ✅ or All ❌) */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetStudentUnitAttendance(originalIdx, activeUnitIndex, true)}
                              className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs cursor-pointer shadow-2xs transition-all active:scale-95"
                              title={`Mark all 5 days Present in ${activeUnit.name} for this student`}
                            >
                              All ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentUnitAttendance(originalIdx, activeUnitIndex, false)}
                              className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs cursor-pointer shadow-2xs transition-all active:scale-95"
                              title={`Mark all 5 days Absent in ${activeUnit.name} for this student`}
                            >
                              All ❌
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
        </div>
      )}

      {/* MODE 2: ALL UNITS MATRIX TABLE (Unit 1 – Unit 12) */}
      {attendanceMode === 'all_units_matrix' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>All Units Attendance Matrix (Unit 1 – Unit 12)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                  60 Days Term Total
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any unit cell to toggle between Full Unit Present (5d ✅) or Absent (0d ❌). Click "Inspect" to jump to unit box ticks.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMarkAllUnitsFull}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs cursor-pointer"
              >
                Mark Full Term Present (60d ✅)
              </button>
              <button
                type="button"
                onClick={handleResetAllUnitsAbsent}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs cursor-pointer"
              >
                Reset All Units Absent (0d ❌)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Student Name & Reg No</th>
                  {ACADEMIC_UNITS.map((unit) => (
                    <th key={unit.index} className="py-3 px-1 text-center w-14">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveUnitIndex(unit.index);
                          setAttendanceMode('unit_box_tick');
                        }}
                        className="group cursor-pointer hover:bg-emerald-100/60 p-1 rounded-lg transition-all"
                        title={`Click to inspect ${unit.name} (${unit.arabicName})`}
                      >
                        <div className="font-extrabold text-emerald-900 group-hover:underline">
                          {unit.short}
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal">
                          {unit.name}
                        </div>
                      </button>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center w-24 bg-emerald-50/50">
                    <div className="font-bold text-emerald-950">Unit Total</div>
                    <div className="text-[10px] text-emerald-700 font-normal">/ 60 days</div>
                  </th>
                  <th className="py-3 px-3 text-center w-24">Att. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((row, sIdx) => {
                  const originalIdx = localRecords.findIndex((r) => r.student.id === row.student.id);
                  const rate = Math.round((row.unitAttendanceTotal / 60) * 100);

                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                        {sIdx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 leading-tight">
                          {row.student.fullName}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-mono font-medium">
                          {row.student.regNo}
                        </div>
                      </td>

                      {/* 12 Academic Unit Matrix Cells */}
                      {row.weeklyAttendance.map((daysAttended, uIdx) => {
                        const isFull = daysAttended === 5;
                        const isNone = daysAttended === 0;

                        return (
                          <td key={uIdx} className="py-2 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                handleSetStudentUnitAttendance(originalIdx, uIdx, !isFull);
                              }}
                              className={`w-12 h-10 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-xs border transition-all cursor-pointer shadow-2xs mx-auto active:scale-90 ${
                                isFull
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-400 hover:bg-emerald-100'
                                  : isNone
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              }`}
                              title={`Unit ${uIdx + 1}: ${daysAttended}/5 days. Tap to toggle 5d ✅ or 0d ❌`}
                            >
                              <span className="flex items-center gap-0.5 text-xs">
                                {isFull ? '✅' : isNone ? '❌' : '⚠️'}
                                <span>{daysAttended}d</span>
                              </span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Unit Total */}
                      <td className="py-2.5 px-3 text-center bg-emerald-50/40 font-mono font-bold text-emerald-950">
                        <span className="text-sm">{row.unitAttendanceTotal}</span>
                        <span className="text-slate-400 text-xs font-normal"> /60</span>
                      </td>

                      {/* Rate */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            rate >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : rate >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: SINGLE-DAY UNIT ROLL CALL */}
      {attendanceMode === 'unit_roll_call' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Unit Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Active Unit
                </label>
                <select
                  value={activeUnitIndex}
                  onChange={(e) => setActiveUnitIndex(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  {ACADEMIC_UNITS.map((u) => (
                    <option key={u.index} value={u.index}>
                      {u.name} ({u.arabicName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  School Day
                </label>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                  {DAY_NAMES.map((name, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => setActiveDayIndex(dIdx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        activeDayIndex === dIdx
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetDayForAllStudentsInUnit(activeUnitIndex, activeDayIndex, true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold cursor-pointer"
              >
                Mark Class Present on {DAY_NAMES[activeDayIndex]} ✅
              </button>
              <button
                type="button"
                onClick={() => handleSetDayForAllStudentsInUnit(activeUnitIndex, activeDayIndex, false)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold cursor-pointer"
              >
                Mark Class Absent on {DAY_NAMES[activeDayIndex]} ❌
              </button>
            </div>
          </div>

          {/* Student Roll Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredRecords.map((row, sIdx) => {
              const originalIdx = localRecords.findIndex((r) => r.student.id === row.student.id);
              const isPresent = row.dailyDetails[activeUnitIndex]?.[activeDayIndex] ?? false;

              return (
                <div
                  key={row.student.id}
                  onClick={() => handleToggleDay(originalIdx, activeUnitIndex, activeDayIndex)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs active:scale-[0.98] select-none ${
                    isPresent
                      ? 'bg-emerald-50/80 border-emerald-400 hover:border-emerald-500'
                      : 'bg-rose-50/80 border-rose-300 hover:border-rose-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-mono">#{sIdx + 1}</div>
                    <div className="font-bold text-slate-900 truncate text-sm">
                      {row.student.fullName}
                    </div>
                    <div className="text-xs text-emerald-800 font-mono mt-0.5">
                      {row.student.regNo}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPresent ? (
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center gap-1.5 shadow-sm">
                        <span>✅</span>
                        <span>PRESENT</span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center gap-1.5 shadow-sm">
                        <span>❌</span>
                        <span>ABSENT</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 4: TERM TOTALS & SUMMARY */}
      {attendanceMode === 'term_summary' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Official Term Totals & Cumulative Unit Records
              </h3>
              <p className="text-xs text-slate-500">
                Summary of total days present out of {termDaysOpened} school days in the term
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700">
              Total Students: <span className="text-emerald-800">{localRecords.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Student Name & Reg No</th>
                  <th className="py-3 px-3 text-center w-28 bg-emerald-50/50">Units Attended</th>
                  <th className="py-3 px-3 text-center w-28">Days Opened</th>
                  <th className="py-3 px-3 text-center w-28">Days Present</th>
                  <th className="py-3 px-3 text-center w-28">Days Absent</th>
                  <th className="py-3 px-3 text-center w-28">Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((row, sIdx) => {
                  const originalIdx = localRecords.findIndex((r) => r.student.id === row.student.id);
                  const numPresent = Number(row.timesPresent) || 0;
                  const rate = row.timesOpened > 0 ? Math.round((numPresent / row.timesOpened) * 100) : 0;

                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                        {sIdx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.student.fullName}</div>
                        <div className="text-xs text-emerald-800 font-mono mt-0.5">{row.student.regNo}</div>
                      </td>
                      <td className="py-3 px-3 text-center bg-emerald-50/40 font-mono font-bold text-emerald-950">
                        {row.unitAttendanceTotal} / 60
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {row.timesOpened}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={row.timesOpened}
                          value={row.timesPresent}
                          onChange={(e) => handlePresentSummaryChange(originalIdx, e.target.value)}
                          className="w-20 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-rose-700 font-bold">
                        {row.timesAbsent}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            rate >= 80
                              ? 'bg-emerald-100 text-emerald-900'
                              : rate >= 60
                              ? 'bg-blue-100 text-blue-900'
                              : rate >= 40
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {rate}%
                        </span>
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
  );
};
