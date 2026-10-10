import React from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AcademicSession,
  Term,
} from '../types';
import { computeClassRankings } from '../services/academicService';
import { defaultGradeScale } from '../data/seedData';
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ClipboardList,
  UserCheck,
  Database,
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  currentSession: AcademicSession;
  currentTerm: Term;
  onNavigate: (tab: string) => void;
  onSelectStudentForReport: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  classes,
  subjects,
  scores,
  currentSession,
  currentTerm,
  onNavigate,
  onSelectStudentForReport,
}) => {
  // Compute school-wide performance for currently active class
  const defaultClassId = React.useMemo(() => {
    const withScores = classes.find((c) => scores.some((sc) => sc.classId === c.id));
    if (withScores) return withScores.id;
    const withStudents = classes.find((c) => students.some((st) => st.classId === c.id));
    if (withStudents) return withStudents.id;
    return classes[0]?.id || '';
  }, [classes, scores, students]);

  const [selectedClassId, setSelectedClassId] = React.useState<string>(defaultClassId);

  const primaryClass =
    classes.find((c) => c.id === selectedClassId) ||
    classes.find((c) => c.id === defaultClassId) ||
    classes[0] || { id: '', name: 'Class' };

  const primaryClassStudents = students.filter((s) => s.classId === primaryClass.id);
  const primaryClassScores = scores.filter(
    (s) =>
      s.classId === primaryClass.id &&
      s.termId === currentTerm.id &&
      s.sessionId === currentSession.id
  );
  const rankings = computeClassRankings(
    primaryClassStudents,
    primaryClassScores,
    defaultGradeScale,
    currentTerm.id,
    currentSession.id
  );
  const gradedRankings = rankings.filter((r) => r.subjectCount > 0);

  // Overall pass rate calculation based on graded students
  const passedStudents = gradedRankings.filter((r) => r.averageScore >= 50).length;
  const passRate = gradedRankings.length > 0 ? Math.round((passedStudents / gradedRankings.length) * 100) : 0;
  const overallAvg =
    gradedRankings.length > 0
      ? (gradedRankings.reduce((acc, r) => acc + r.averageScore, 0) / gradedRankings.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner with Arabic Islamic Accent */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{currentSession.name} • {currentTerm.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Kulliyyat Academic Dashboard
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              بسم الله الرحمن الرحيم — Comprehensive student registry, continuous assessment grade recording, automated position rankings, and authenticated report card generation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              id="btn-quick-grade"
              onClick={() => onNavigate('grades')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <ClipboardList className="w-4 h-4" />
              Enter Grades
            </button>
            <button
              id="btn-quick-reports"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/15 backdrop-blur-sm active:scale-95"
            >
              <Award className="w-4 h-4" />
              View Report Cards
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Enrolled Students</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{students.length}</span>
            <span className="text-xs text-emerald-600 font-medium">Across all classes</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Classes</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{classes.length}</span>
            <span className="text-xs text-slate-500 font-medium">I'dadi & Thanawi</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Academic Subjects</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{subjects.length}</span>
            <span className="text-xs text-blue-600 font-medium">Quranic & Sciences</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Average Performance</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{overallAvg}%</span>
            <span className="text-xs text-amber-700 font-semibold">{passRate}% Pass rate</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Performers Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  Top Performers
                </h2>
                <select
                  value={primaryClass.id}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {classes.map((cls) => {
                    const studentCount = students.filter((s) => s.classId === cls.id).length;
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({studentCount} students)
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current term academic position rankings based on continuous assessment & exams
              </p>
            </div>
            <button
              onClick={() => onNavigate('positions')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group self-start sm:self-auto"
            >
              Full Rankings <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {gradedRankings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No grades entered yet for {primaryClass.name} in {currentTerm.name}.
                <div className="mt-2">
                  <button
                    onClick={() => onNavigate('grades')}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Go to Grade Entry →
                  </button>
                </div>
              </div>
            ) : (
              gradedRankings.slice(0, 5).map((item, idx) => (
                <div
                  key={item.student.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/40'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-800/10 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.rankSuffix}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {item.student.fullName}
                        </span>
                        {item.student.arabicName && (
                          <span className="text-xs text-emerald-800 font-arabic hidden sm:inline" dir="rtl">
                            {item.student.arabicName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Reg: {item.student.regNo}</span>
                        <span>•</span>
                        <span>{item.subjectCount} Subjects</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{item.averageScore}%</div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.overallGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.overallGrade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Grade {item.overallGrade}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectStudentForReport(item.student.id)}
                      title="Generate Result Sheet"
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <Award className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links & Modules info */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Modules & System Workflow
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Integrated from the Kulliyyat app Flutter database architecture:
            </p>

            <div className="space-y-3">
              <div
                onClick={() => onNavigate('registration')}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">1. Student Registration</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enroll students with biodata, Arabic names, admission numbers, and guardians.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('grades')}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800 mt-0.5">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">2. Grade & Exam Entry</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Record Continuous Assessments (CA1, CA2) and Exam scores with auto-evaluation.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('positions')}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">3. Class Rankings & Positions</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automated 1st to Nth standing, tie-breakers, promotion criteria, and statistics.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('reports')}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-800 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">4. Report Card & PDF Generation</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Printable terminal report sheets with Islamic crest, cognitive & affective domain ratings.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('teachers')}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-teal-100 text-teal-800 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">5. Faculty & Teacher Registration</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Manage instructors with Arabic names and auto-wire assigned teacher signatures to report cards.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('database')}
                className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-emerald-800 text-white mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-950">6. Central Database Portal (Admin)</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Centralized Firestore cloud database, instant two-way sync, audit trail, and full disaster backup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
