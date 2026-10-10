import React, { useState, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  ScoreRecord,
  AcademicSession,
  Term,
} from '../types';
import { defaultTerms, defaultGradeScale } from '../data/seedData';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  BookOpen,
  PieChart as PieChartIcon,
  Filter,
  Sparkles,
  Award,
  Layers,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';

interface AcademicPerformanceChartsProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  currentSession: AcademicSession;
  currentTerm: Term;
  terms?: Term[];
  onNavigate?: (tab: string) => void;
}

// Chart Palette matching the Kulliyyat Islamic Educational Aesthetic
const CHART_COLORS = [
  '#047857', // Emerald 700 (Primary)
  '#0d9488', // Teal 600
  '#0284c7', // Sky 600
  '#d97706', // Amber 600
  '#6366f1', // Indigo 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#14b8a6', // Teal 500
];

const GRADE_PIE_COLORS: Record<string, string> = {
  A: '#059669', // Emerald 600 - Mumtaz
  B: '#0284c7', // Sky 600 - Jayyid Jiddan
  C: '#0d9488', // Teal 600 - Jayyid
  D: '#d97706', // Amber 600 - Maqbool
  E: '#ea580c', // Orange 600 - Da'eef
  F: '#e11d48', // Rose 600 - Rasib
};

type ViewMode = 'trend' | 'class_bar' | 'subject_bar' | 'grade_dist';

export const AcademicPerformanceCharts: React.FC<AcademicPerformanceChartsProps> = ({
  classes,
  subjects,
  scores,
  currentSession,
  currentTerm,
  terms = defaultTerms,
  onNavigate,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('trend');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showSamplePreview, setShowSamplePreview] = useState<boolean>(false);

  // Filter scores for the current academic session
  const sessionScores = useMemo(() => {
    return scores.filter((s) => s.sessionId === currentSession.id);
  }, [scores, currentSession.id]);

  // Generate benchmark/demo data if actual scores are empty and user enables preview
  const effectiveScores = useMemo(() => {
    if (sessionScores.length > 0) return sessionScores;
    if (!showSamplePreview) return [];

    // Synthetic benchmark data for preview purposes across terms and classes
    const demo: ScoreRecord[] = [];
    const sampleClasses = classes.slice(0, 5);
    const sampleSubjects = subjects.slice(0, 4);

    terms.forEach((term, tIdx) => {
      sampleClasses.forEach((cls, cIdx) => {
        sampleSubjects.forEach((sub, sIdx) => {
          // Progressively improving trend: term 1 base ~64, term 2 ~68, term 3 ~73
          const base = 60 + tIdx * 5 + (cIdx % 3) * 3 + (sIdx % 2) * 4;
          const noise = ((cIdx + sIdx + tIdx) * 7) % 11;
          const total = Math.min(95, Math.max(42, base + noise));
          const ca1 = Math.round(total * 0.2);
          const ca2 = Math.round(total * 0.2);
          const exam = total - ca1 - ca2;

          let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'C';
          if (total >= 70) grade = 'A';
          else if (total >= 60) grade = 'B';
          else if (total >= 50) grade = 'C';
          else if (total >= 45) grade = 'D';
          else if (total >= 40) grade = 'E';
          else grade = 'F';

          demo.push({
            id: `demo_${term.id}_${cls.id}_${sub.id}`,
            studentId: `demo_std_${cIdx}`,
            subjectId: sub.id,
            classId: cls.id,
            sessionId: currentSession.id,
            termId: term.id,
            ca1,
            ca2,
            exam,
            total,
            grade,
            remark: 'Benchmark Record',
          });
        });
      });
    });
    return demo;
  }, [sessionScores, showSamplePreview, classes, subjects, terms, currentSession.id]);

  const hasData = effectiveScores.length > 0;

  // 1. Term-by-Term Trend Data (Progression across Term 1, Term 2, Term 3)
  const termTrendData = useMemo(() => {
    return terms.map((term) => {
      const termScores = effectiveScores.filter((s) => s.termId === term.id);
      
      // Calculate overall school average for this term
      const overallAvg =
        termScores.length > 0
          ? Number((termScores.reduce((acc, s) => acc + s.total, 0) / termScores.length).toFixed(1))
          : null;

      const row: Record<string, any> = {
        termId: term.id,
        termName: term.name.split(' (')[0], // Short name: "First Term", etc.
        fullTermName: term.name,
        overallAvg,
        scoreCount: termScores.length,
      };

      if (selectedClassId === 'all') {
        // Compute average for each class in this term
        classes.forEach((c) => {
          const classTermScores = termScores.filter((s) => s.classId === c.id);
          if (classTermScores.length > 0) {
            const avg = classTermScores.reduce((acc, s) => acc + s.total, 0) / classTermScores.length;
            row[c.id] = Number(avg.toFixed(1));
          } else {
            row[c.id] = null;
          }
        });
      } else {
        // Deep dive for selected class: CA, Exam, and Total averages
        const classTermScores = termScores.filter((s) => s.classId === selectedClassId);
        if (classTermScores.length > 0) {
          const avgTotal = classTermScores.reduce((acc, s) => acc + s.total, 0) / classTermScores.length;
          const avgCa = classTermScores.reduce((acc, s) => acc + (s.ca1 + s.ca2), 0) / classTermScores.length;
          const avgExam = classTermScores.reduce((acc, s) => acc + s.exam, 0) / classTermScores.length;
          row.classAvg = Number(avgTotal.toFixed(1));
          row.caAvg = Number(avgCa.toFixed(1));
          row.examAvg = Number(avgExam.toFixed(1));
        } else {
          row.classAvg = null;
          row.caAvg = null;
          row.examAvg = null;
        }
      }

      return row;
    });
  }, [terms, effectiveScores, selectedClassId, classes]);

  // 2. Class-by-Class Comparative Bar Data (For current term or all terms)
  const classComparisonData = useMemo(() => {
    return classes
      .map((c) => {
        const classScores = effectiveScores.filter(
          (s) => s.classId === c.id && s.termId === currentTerm.id
        );
        if (classScores.length === 0) return null;

        const totalAvg = classScores.reduce((acc, s) => acc + s.total, 0) / classScores.length;
        const caAvg = classScores.reduce((acc, s) => acc + (s.ca1 + s.ca2), 0) / classScores.length;
        const examAvg = classScores.reduce((acc, s) => acc + s.exam, 0) / classScores.length;
        const passCount = classScores.filter((s) => s.total >= 50).length;
        const passRate = Math.round((passCount / classScores.length) * 100);

        return {
          classId: c.id,
          className: c.name.length > 18 ? `${c.name.substring(0, 16)}...` : c.name,
          fullClassName: c.name,
          category: c.category,
          average: Number(totalAvg.toFixed(1)),
          caAverage: Number(caAvg.toFixed(1)),
          examAverage: Number(examAvg.toFixed(1)),
          passRate,
          recordsCount: classScores.length,
        };
      })
      .filter(Boolean) as Array<{
        classId: string;
        className: string;
        fullClassName: string;
        category: string;
        average: number;
        caAverage: number;
        examAverage: number;
        passRate: number;
        recordsCount: number;
      }>;
  }, [classes, effectiveScores, currentTerm.id]);

  // 3. Subject Performance Data (Ranked by highest average score)
  const subjectPerformanceData = useMemo(() => {
    const relevantScores =
      selectedClassId === 'all'
        ? effectiveScores.filter((s) => s.termId === currentTerm.id)
        : effectiveScores.filter(
            (s) => s.termId === currentTerm.id && s.classId === selectedClassId
          );

    return subjects
      .map((sub) => {
        const subScores = relevantScores.filter((s) => s.subjectId === sub.id);
        if (subScores.length === 0) return null;

        const avg = subScores.reduce((acc, s) => acc + s.total, 0) / subScores.length;
        const passCount = subScores.filter((s) => s.total >= 50).length;
        const passRate = Math.round((passCount / subScores.length) * 100);

        return {
          subjectId: sub.id,
          subjectName: sub.name.length > 20 ? `${sub.name.substring(0, 18)}...` : sub.name,
          fullSubjectName: sub.name,
          code: sub.code,
          category: sub.category,
          average: Number(avg.toFixed(1)),
          passRate,
          count: subScores.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.average || 0) - (a?.average || 0)) as Array<{
        subjectId: string;
        subjectName: string;
        fullSubjectName: string;
        code: string;
        category: string;
        average: number;
        passRate: number;
        count: number;
      }>;
  }, [subjects, effectiveScores, currentTerm.id, selectedClassId]);

  // 4. Grade Distribution Breakdown (A, B, C, D, E, F)
  const gradeDistributionData = useMemo(() => {
    const relevantScores =
      selectedClassId === 'all'
        ? effectiveScores.filter((s) => s.termId === currentTerm.id)
        : effectiveScores.filter(
            (s) => s.termId === currentTerm.id && s.classId === selectedClassId
          );

    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    relevantScores.forEach((s) => {
      if (counts[s.grade] !== undefined) {
        counts[s.grade]++;
      } else {
        // Fallback evaluate
        for (const item of defaultGradeScale) {
          if (s.total >= item.min && s.total <= item.max) {
            counts[item.grade] = (counts[item.grade] || 0) + 1;
            break;
          }
        }
      }
    });

    const total = relevantScores.length;

    return [
      { name: 'Grade A (Mumtaz • 70-100%)', grade: 'A', count: counts.A, percentage: total > 0 ? Math.round((counts.A / total) * 100) : 0 },
      { name: 'Grade B (Jayyid Jiddan • 60-69%)', grade: 'B', count: counts.B, percentage: total > 0 ? Math.round((counts.B / total) * 100) : 0 },
      { name: 'Grade C (Jayyid • 50-59%)', grade: 'C', count: counts.C, percentage: total > 0 ? Math.round((counts.C / total) * 100) : 0 },
      { name: 'Grade D (Maqbool • 45-49%)', grade: 'D', count: counts.D, percentage: total > 0 ? Math.round((counts.D / total) * 100) : 0 },
      { name: 'Grade E (Da\'eef • 40-44%)', grade: 'E', count: counts.E, percentage: total > 0 ? Math.round((counts.E / total) * 100) : 0 },
      { name: 'Grade F (Rasib • 0-39%)', grade: 'F', count: counts.F, percentage: total > 0 ? Math.round((counts.F / total) * 100) : 0 },
    ].filter((g) => g.count > 0);
  }, [effectiveScores, currentTerm.id, selectedClassId]);

  // Overall statistics for the quick insight bar
  const summaryStats = useMemo(() => {
    if (!hasData) return null;

    const termScores = effectiveScores.filter((s) => s.termId === currentTerm.id);
    const allTotals = termScores.map((s) => s.total);
    const overallAvg =
      allTotals.length > 0 ? (allTotals.reduce((a, b) => a + b, 0) / allTotals.length).toFixed(1) : '0.0';

    // Best class in current term
    let topClass = { name: 'None', avg: 0 };
    classes.forEach((c) => {
      const clsScores = termScores.filter((s) => s.classId === c.id);
      if (clsScores.length > 0) {
        const avg = clsScores.reduce((acc, s) => acc + s.total, 0) / clsScores.length;
        if (avg > topClass.avg) {
          topClass = { name: c.name, avg: Number(avg.toFixed(1)) };
        }
      }
    });

    // Best subject in current term
    let topSubject = { name: 'None', avg: 0 };
    subjects.forEach((s) => {
      const subScores = termScores.filter((sc) => sc.subjectId === s.id);
      if (subScores.length > 0) {
        const avg = subScores.reduce((acc, sc) => acc + sc.total, 0) / subScores.length;
        if (avg > topSubject.avg) {
          topSubject = { name: s.name, avg: Number(avg.toFixed(1)) };
        }
      }
    });

    return {
      overallAvg,
      topClass,
      topSubject,
      recordsCount: termScores.length,
    };
  }, [hasData, effectiveScores, currentTerm.id, classes, subjects]);

  // Classes that currently have at least one score in the trend data
  const classesWithScores = useMemo(() => {
    return classes.filter((c) => effectiveScores.some((s) => s.classId === c.id));
  }, [classes, effectiveScores]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Analytics Card Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-b from-slate-50/70 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Academic Performance Trends & Visual Analytics
            </h2>
            {showSamplePreview && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" /> Benchmark Preview Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time visual tracking of average class scores per term, term-by-term progression, and subject performance distribution across Kulliyyat curriculum.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start lg:self-auto">
          <button
            id="btn-view-trend"
            onClick={() => setViewMode('trend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'trend'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            Term Trends
          </button>

          <button
            id="btn-view-class-bar"
            onClick={() => setViewMode('class_bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'class_bar'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
            Class Scores
          </button>

          <button
            id="btn-view-subject-bar"
            onClick={() => setViewMode('subject_bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'subject_bar'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            Subjects
          </button>

          <button
            id="btn-view-grade-dist"
            onClick={() => setViewMode('grade_dist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grade_dist'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-amber-700" />
            Grades
          </button>
        </div>
      </div>

      {/* Filter Bar & Quick Stats */}
      <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Filter Class:</span>
            <select
              id="select-chart-class-filter"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Classes (School-wide Overview)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Pass Threshold (50%)</span>
          </label>
        </div>

        {/* Quick KPI Badges */}
        {summaryStats && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/60 font-semibold flex items-center gap-1">
              <span>Current Term Avg:</span>
              <span className="font-bold text-emerald-800">{summaryStats.overallAvg}%</span>
            </div>
            {summaryStats.topClass.avg > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200/60 font-semibold flex items-center gap-1">
                <Award className="w-3 h-3 text-teal-700" />
                <span>Top Class:</span>
                <span className="font-bold text-teal-800">
                  {summaryStats.topClass.name} ({summaryStats.topClass.avg}%)
                </span>
              </div>
            )}
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <span>{summaryStats.recordsCount} score records</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-6">
        {!hasData ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200/60">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No Assessment Data for {currentSession.name}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Academic score records have not been recorded yet. Record CA and Exam scores in Grade Entry to visualize real-time progression charts, or toggle preview mode to view benchmark analytics.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onNavigate && (
                <button
                  id="btn-chart-go-grades"
                  onClick={() => onNavigate('grades')}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  Enter Grades in Grade Entry
                </button>
              )}
              <button
                id="btn-chart-toggle-preview"
                onClick={() => setShowSamplePreview(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Preview Benchmark Chart
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* View 1: Term-by-Term Progression Trend */}
            {viewMode === 'trend' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedClassId === 'all'
                        ? 'Average Class Scores Progression across Terms (Term 1 → Term 2 → Term 3)'
                        : `${selectedClass?.name || 'Class'} — Score Trend Progression by Term`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedClassId === 'all'
                        ? 'Tracking class performance trajectories over First, Second, and Third terms'
                        : 'Tracking continuous assessment (CA) vs. terminal exam performance per term'}
                    </p>
                  </div>
                </div>

                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedClassId === 'all' ? (
                      <LineChart data={termTrendData} margin={{ top: 15, right: 30, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="termName"
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 50, 60, 80, 100]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          unit="%"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any) => {
                            const foundClass = classes.find((c) => c.id === name);
                            const displayName = name === 'overallAvg' ? 'School Overall Average' : foundClass?.name || name;
                            return [`${value}%`, displayName];
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                          formatter={(value) => {
                            if (value === 'overallAvg') return '⭐ School Overall Average';
                            const foundClass = classes.find((c) => c.id === value);
                            return foundClass ? foundClass.name : value;
                          }}
                        />

                        {showBenchmark && (
                          <ReferenceLine
                            y={50}
                            label={{ value: 'Pass Mark (50%)', fill: '#d97706', fontSize: 11, position: 'insideTopLeft' }}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Overall School Average Line */}
                        <Line
                          type="monotone"
                          dataKey="overallAvg"
                          name="overallAvg"
                          stroke="#047857"
                          strokeWidth={3.5}
                          dot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                          activeDot={{ r: 8, stroke: '#047857', strokeWidth: 2 }}
                        />

                        {/* Class individual lines for active classes */}
                        {classesWithScores.slice(0, 6).map((c, idx) => (
                          <Line
                            key={c.id}
                            type="monotone"
                            dataKey={c.id}
                            name={c.id}
                            stroke={CHART_COLORS[(idx + 1) % CHART_COLORS.length]}
                            strokeWidth={2}
                            strokeDasharray={idx > 2 ? '4 2' : undefined}
                            dot={{ r: 4, fill: CHART_COLORS[(idx + 1) % CHART_COLORS.length] }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    ) : (
                      // Single Class Deep-dive Chart with Area & Lines
                      <AreaChart data={termTrendData} margin={{ top: 15, right: 30, left: 0, bottom: 25 }}>
                        <defs>
                          <linearGradient id="classAvgGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="termName"
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 50, 60, 80, 100]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          unit="%"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any) => {
                            if (name === 'classAvg') return [`${value}%`, 'Class Total Average'];
                            if (name === 'caAvg') return [`${value} pts`, 'Continuous Assessment (CA Avg)'];
                            if (name === 'examAvg') return [`${value} pts`, 'Terminal Exam (Avg)'];
                            if (name === 'overallAvg') return [`${value}%`, 'School-wide Benchmark'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />

                        {showBenchmark && (
                          <ReferenceLine
                            y={50}
                            label={{ value: 'Pass Mark (50%)', fill: '#d97706', fontSize: 11, position: 'insideTopLeft' }}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                          />
                        )}

                        <Area
                          type="monotone"
                          dataKey="classAvg"
                          name="Class Total Average"
                          stroke="#047857"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#classAvgGrad)"
                          dot={{ r: 5, fill: '#047857' }}
                        />

                        <Line
                          type="monotone"
                          dataKey="caAvg"
                          name="CA Average (Max 40)"
                          stroke="#0284c7"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          dot={{ r: 4, fill: '#0284c7' }}
                        />

                        <Line
                          type="monotone"
                          dataKey="examAvg"
                          name="Exam Average (Max 60)"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#d97706' }}
                        />

                        <Line
                          type="monotone"
                          dataKey="overallAvg"
                          name="School Overall Benchmark"
                          stroke="#94a3b8"
                          strokeWidth={1.5}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* View 2: Class Comparison Bar Chart */}
            {viewMode === 'class_bar' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Class Academic Performance Comparison — {currentTerm.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Side-by-side comparison of overall class score averages, Continuous Assessment, and Exam components
                    </p>
                  </div>
                </div>

                {classComparisonData.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No scores recorded for classes in {currentTerm.name}.
                  </div>
                ) : (
                  <div className="w-full h-80 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classComparisonData} margin={{ top: 15, right: 30, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="className"
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          unit="%"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any) => {
                            if (name === 'average') return [`${value}%`, 'Average Total Score'];
                            if (name === 'caAverage') return [`${value} pts`, 'Avg Continuous Assessment (CA)'];
                            if (name === 'examAverage') return [`${value} pts`, 'Avg Terminal Exam'];
                            return [value, name];
                          }}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]?.payload?.fullClassName) {
                              return payload[0].payload.fullClassName;
                            }
                            return label;
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />

                        {showBenchmark && (
                          <ReferenceLine
                            y={50}
                            label={{ value: 'Pass Mark (50%)', fill: '#d97706', fontSize: 11, position: 'insideTopLeft' }}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                          />
                        )}

                        <Bar
                          dataKey="average"
                          name="Average Score (%)"
                          fill="#047857"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="caAverage"
                          name="CA Component (Max 40)"
                          fill="#0284c7"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="examAverage"
                          name="Exam Component (Max 60)"
                          fill="#d97706"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* View 3: Subject Performance Breakdown */}
            {viewMode === 'subject_bar' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Subject Performance Ranking — {currentTerm.name}
                      {selectedClassId !== 'all' && ` (${selectedClass?.name})`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Curriculum subject averages across Islamic Studies, Arabic Language, and General Sciences
                    </p>
                  </div>
                </div>

                {subjectPerformanceData.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No subject scores recorded for this selection.
                  </div>
                ) : (
                  <div className="w-full h-80 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectPerformanceData.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 15, right: 30, left: 40, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          unit="%"
                        />
                        <YAxis
                          type="category"
                          dataKey="subjectName"
                          tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any, item: any) => {
                            return [
                              `${value}% (${item.payload.passRate}% pass rate • ${item.payload.count} students)`,
                              item.payload.fullSubjectName,
                            ];
                          }}
                        />
                        {showBenchmark && (
                          <ReferenceLine
                            x={50}
                            label={{ value: 'Pass (50%)', fill: '#d97706', fontSize: 11, position: 'insideTopRight' }}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                          />
                        )}
                        <Bar
                          dataKey="average"
                          name="Subject Average Score"
                          fill="#0d9488"
                          radius={[0, 6, 6, 0]}
                        >
                          {subjectPerformanceData.slice(0, 10).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.average >= 70
                                  ? '#047857' // Emerald
                                  : entry.average >= 50
                                  ? '#0d9488' // Teal
                                  : '#e11d48' // Rose
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* View 4: Grade Distribution Breakdown */}
            {viewMode === 'grade_dist' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Overall Academic Grade Distribution — {currentTerm.name}
                      {selectedClassId !== 'all' && ` (${selectedClass?.name})`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Proportional distribution of Mumtaz (A), Jayyid Jiddan (B), Jayyid (C), Maqbool (D), Da'eef (E), and Rasib (F)
                    </p>
                  </div>
                </div>

                {gradeDistributionData.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No grades to distribute for this selection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistributionData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {gradeDistributionData.map((entry) => (
                              <Cell
                                key={`grade-${entry.grade}`}
                                fill={GRADE_PIE_COLORS[entry.grade] || '#64748b'}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px',
                            }}
                            formatter={(value: any, name: any, item: any) => [
                              `${value} scores (${item.payload.percentage}%)`,
                              item.payload.name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Grade Legend & Distribution
                      </h4>
                      {gradeDistributionData.map((g) => (
                        <div
                          key={g.grade}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: GRADE_PIE_COLORS[g.grade] || '#64748b' }}
                            />
                            <span className="text-xs font-medium text-slate-800">{g.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{g.count}</span>
                            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {g.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Insight Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Charts update dynamically as teachers submit continuous assessments and examination marks.
                </span>
              </div>
              {showSamplePreview && (
                <button
                  onClick={() => setShowSamplePreview(false)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Exit Benchmark Preview
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
