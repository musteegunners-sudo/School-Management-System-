import React, { useState } from 'react';
import {
  Student,
  SchoolClass,
  ScoreRecord,
  Term,
  AcademicSession,
  GradeScaleItem,
} from '../types';
import { computeClassRankings } from '../services/academicService';
import {
  Award,
  Trophy,
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface PositionsRankingViewProps {
  students: Student[];
  classes: SchoolClass[];
  scores: ScoreRecord[];
  currentTerm: Term;
  currentSession: AcademicSession;
  gradeScale: GradeScaleItem[];
  onSelectStudentForReport: (studentId: string) => void;
}

export const PositionsRankingView: React.FC<PositionsRankingViewProps> = ({
  students,
  classes,
  scores,
  currentTerm,
  currentSession,
  gradeScale,
  onSelectStudentForReport,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const classScores = scores.filter(
    (s) =>
      s.classId === selectedClassId &&
      s.termId === currentTerm.id &&
      s.sessionId === currentSession.id
  );

  const rankings = computeClassRankings(classStudents, classScores, gradeScale, currentTerm.id, currentSession.id);
  const gradedRankings = rankings.filter((r) => r.subjectCount > 0);
  const hasScores = gradedRankings.length > 0;

  // Overall analytics based on graded students
  const totalStudents = classStudents.length;
  const gradedCount = gradedRankings.length;
  const passedCount = gradedRankings.filter((r) => r.averageScore >= 50).length;
  const highestAvg = hasScores ? gradedRankings[0].averageScore : 0;
  const lowestAvg = hasScores ? gradedRankings[gradedRankings.length - 1].averageScore : 0;
  const classAverage = hasScores
    ? parseFloat((gradedRankings.reduce((acc, r) => acc + r.averageScore, 0) / gradedCount).toFixed(1))
    : 0;

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Class Performance Rankings & Leaderboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Replicating Kulliyyat Positions Service — Automatic 1st to Nth standing computation, tie handling, and promotion status
          </p>
        </div>

        <div className="w-full sm:w-64">
          <select
            id="select-ranking-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Statistics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Evaluated</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {gradedCount} <span className="text-sm font-normal text-slate-400">/ {totalStudents}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">Class: {currentClass?.name}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Highest Average</span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-700">
            {hasScores ? `${highestAvg}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {hasScores ? gradedRankings[0].student.fullName : 'Awaiting grades'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Class Average</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {hasScores ? `${classAverage}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {hasScores ? `Lowest: ${lowestAvg}%` : 'No scores entered'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">
            {gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {passedCount} of {gradedCount} graded passed (≥50%)
          </div>
        </div>
      </div>

      {/* Podium Showcase for Top 3 (Only shown when at least 3 graded students exist) */}
      {gradedRankings.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center order-2 sm:order-1">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-inner mb-2">
              2nd
            </div>
            <div className="font-bold text-slate-900 text-sm">{gradedRankings[1].student.fullName}</div>
            <div className="text-xs text-slate-500 font-mono mb-2">{gradedRankings[1].student.regNo}</div>
            <div className="text-lg font-extrabold text-slate-800">{gradedRankings[1].averageScore}%</div>
            <span className="text-xs px-2 py-0.5 mt-1 rounded bg-slate-200 text-slate-700 font-semibold">
              Grade {gradedRankings[1].overallGrade}
            </span>
          </div>

          {/* 1st Place */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/50 border-2 border-amber-300 flex flex-col items-center text-center order-1 sm:order-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-base shadow-md mb-2 ring-4 ring-amber-200/80">
              1st
            </div>
            <div className="font-bold text-amber-950 text-base">{gradedRankings[0].student.fullName}</div>
            <div className="text-xs text-amber-800/80 font-mono mb-2">{gradedRankings[0].student.regNo}</div>
            <div className="text-2xl font-black text-amber-900">{gradedRankings[0].averageScore}%</div>
            <span className="text-xs px-2.5 py-0.5 mt-1 rounded bg-amber-200/90 text-amber-950 font-bold">
              ★ {gradedRankings[0].overallRemark}
            </span>
          </div>

          {/* 3rd Place */}
          <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex flex-col items-center text-center order-3 sm:order-3">
            <div className="w-10 h-10 rounded-full bg-amber-700/15 text-amber-900 font-bold flex items-center justify-center text-sm shadow-inner mb-2">
              3rd
            </div>
            <div className="font-bold text-slate-900 text-sm">{gradedRankings[2].student.fullName}</div>
            <div className="text-xs text-slate-500 font-mono mb-2">{gradedRankings[2].student.regNo}</div>
            <div className="text-lg font-extrabold text-slate-800">{gradedRankings[2].averageScore}%</div>
            <span className="text-xs px-2 py-0.5 mt-1 rounded bg-amber-100 text-amber-900 font-semibold">
              Grade {gradedRankings[2].overallGrade}
            </span>
          </div>
        </div>
      )}

      {/* Rankings Leaderboard Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">
            Official Position Sheet: {currentClass?.name} ({currentTerm.name})
          </span>
          <span className="text-xs text-slate-500">
            Sorted by Average Score Descending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-6 w-24 text-center">Position</th>
                <th className="py-3 px-6">Student Biodata</th>
                <th className="py-3 px-6 text-center">Subjects</th>
                <th className="py-3 px-6 text-center">Grand Total</th>
                <th className="py-3 px-6 text-center">Average %</th>
                <th className="py-3 px-6 text-center">Grade</th>
                <th className="py-3 px-6 text-center">Academic Standing</th>
                <th className="py-3 px-6 text-right">Result Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students currently enrolled in this class. Add students in the Registration tab.
                  </td>
                </tr>
              ) : (
                rankings.map((res) => {
                  const isGraded = res.subjectCount > 0;
                  return (
                    <tr key={res.student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 text-center">
                        {isGraded ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
                              res.rank === 1
                                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                                : res.rank === 2
                                ? 'bg-slate-200 text-slate-700'
                                : res.rank === 3
                                ? 'bg-amber-900/10 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {res.rankSuffix}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{res.student.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                          <span>Reg: {res.student.regNo}</span>
                          {res.student.arabicName && (
                            <span className="text-emerald-800 font-arabic" dir="rtl">
                              {res.student.arabicName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 font-medium">
                        {res.subjectCount}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {isGraded ? res.totalScore : '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-black text-slate-900 text-base">
                          {isGraded ? `${res.averageScore}%` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isGraded ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                              res.overallGrade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.overallGrade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : res.overallGrade === 'C'
                                ? 'bg-teal-100 text-teal-800'
                                : res.overallGrade === 'D'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {res.overallGrade}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-xs font-medium">
                            Ungraded
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isGraded ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              res.passStatus === 'Promoted'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : res.passStatus === 'Promoted on Trial'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {res.passStatus === 'Promoted' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {res.passStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Awaiting Marks</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onSelectStudentForReport(res.student.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Report Card
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
