import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Check,
  Copy,
  X,
  Calendar,
  Award,
  User,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  HeartHandshake,
  Keyboard,
} from 'lucide-react';
import { useArabicKeyboard } from '../context/ArabicKeyboardContext';
import { Student } from '../types';
import {
  generateTeacherComment,
  GeneratedCommentResult,
} from '../services/commentGeneratorService';

interface StudentGradeData {
  student: Student;
  unitAssignmentTotal: number;
  ca1: number | string;
  ca2: number | string;
  exam: number | string;
  total: number;
  grade: string;
  attendanceRate?: number;
  attendanceDaysPresent?: number;
  attendanceDaysOpened?: number;
  currentRemark?: string;
}

interface TeacherCommentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: StudentGradeData;
  allStudentsData?: StudentGradeData[];
  className: string;
  subjectName: string;
  termName: string;
  sessionName: string;
  onApplyRemark: (studentId: string, remark: string) => void;
  onSelectAnotherStudent?: (studentId: string) => void;
}

type ToneOption = 'holistic' | 'encouraging' | 'high_achiever' | 'improvement' | 'islamic_values';

export const TeacherCommentGeneratorModal: React.FC<TeacherCommentGeneratorModalProps> = ({
  isOpen,
  onClose,
  studentData,
  allStudentsData = [],
  className,
  subjectName,
  termName,
  sessionName,
  onApplyRemark,
  onSelectAnotherStudent,
}) => {
  const { openKeyboard: openArabicKeyboard } = useArabicKeyboard();
  const [tone, setTone] = useState<ToneOption>('holistic');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedCommentResult | null>(null);
  const [selectedRemarkText, setSelectedRemarkText] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // When studentData changes or modal opens, reset or preload
  useEffect(() => {
    if (isOpen) {
      setGeneratedResult(null);
      setSelectedRemarkText(studentData.currentRemark || '');
      setAppliedSuccess(false);
      setTeacherNotes('');
      // Auto-trigger smart generation on open if not already generated
      handleGenerate();
    }
  }, [studentData.student.id, isOpen]);

  if (!isOpen) return null;

  const weeklyAvg = (studentData.unitAssignmentTotal / 12).toFixed(1);
  const attRate = studentData.attendanceRate ?? 85;

  const handleGenerate = async () => {
    setIsLoading(true);
    setAppliedSuccess(false);
    try {
      const result = await generateTeacherComment({
        studentName: studentData.student.fullName,
        regNo: studentData.student.regNo,
        gender: studentData.student.gender,
        className,
        subjectName,
        termName,
        sessionName,
        unitAssignmentTotal: studentData.unitAssignmentTotal,
        weeklyAverage: Number(weeklyAvg),
        ca1: Number(studentData.ca1) || 0,
        ca2: Number(studentData.ca2) || 0,
        exam: Number(studentData.exam) || 0,
        total: studentData.total,
        grade: studentData.grade,
        attendanceRate: studentData.attendanceRate,
        attendanceDaysPresent: studentData.attendanceDaysPresent,
        attendanceDaysOpened: studentData.attendanceDaysOpened,
        tone,
        teacherNotes: teacherNotes.trim() || undefined,
      });

      setGeneratedResult(result);
      // Default to the detailed or concise remark
      setSelectedRemarkText(result.detailedRemark || result.conciseRemark);
    } catch (e) {
      console.error('Comment generation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (textToApply?: string) => {
    const text = textToApply || selectedRemarkText;
    if (!text.trim()) return;
    onApplyRemark(studentData.student.id, text.trim());
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
    }, 2500);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-emerald-800/20 bg-linear-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                  Teacher Comment Generator
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  <Bot className="w-3 h-3" />
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Personalized report card remarks crafted from grades and attendance data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Student Selector & Live Stats Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 font-bold text-sm">
                  {studentData.student.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    {studentData.student.fullName}
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900">
                      {studentData.student.regNo}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{className}</span>
                    <span>•</span>
                    <span className="font-medium text-emerald-800">{subjectName}</span>
                    <span>•</span>
                    <span>{termName}</span>
                  </div>
                </div>
              </div>

              {/* Student Dropdown Switcher if multi-student provided */}
              {allStudentsData.length > 1 && onSelectAnotherStudent && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Student:</label>
                  <select
                    value={studentData.student.id}
                    onChange={(e) => onSelectAnotherStudent(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {allStudentsData.map((s) => (
                      <option key={s.student.id} value={s.student.id}>
                        {s.student.fullName} ({s.total}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Academic & Attendance Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Mark</span>
                <span className="text-lg font-bold font-mono text-slate-900">{studentData.total}</span>
                <span className="text-[10px] text-slate-400"> / 100</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Grade</span>
                <span
                  className={`inline-block text-base font-bold px-2 rounded-md ${
                    studentData.grade === 'A'
                      ? 'bg-emerald-100 text-emerald-900'
                      : studentData.grade === 'B'
                      ? 'bg-blue-100 text-blue-900'
                      : studentData.grade === 'C'
                      ? 'bg-teal-100 text-teal-900'
                      : studentData.grade === 'D'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {studentData.grade}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">12-Wk Units</span>
                <span className="text-base font-bold font-mono text-emerald-950">
                  {studentData.unitAssignmentTotal}
                </span>
                <span className="text-[10px] text-slate-400">/48 ({weeklyAvg}/4)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CA & Exam</span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">
                  CA1: {studentData.ca1} • CA2: {studentData.ca2}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">Exam: {studentData.exam}/60</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Attendance</span>
                <span
                  className={`inline-block text-base font-bold font-mono px-2 py-0.5 rounded-md mt-0.5 ${
                    attRate >= 85
                      ? 'bg-emerald-100 text-emerald-900'
                      : attRate >= 70
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {attRate}%
                </span>
                {studentData.attendanceDaysPresent !== undefined && (
                  <span className="text-[10px] text-slate-400 block">
                    {studentData.attendanceDaysPresent}/{studentData.attendanceDaysOpened} days
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Generator Controls */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Select Evaluation Tone & Focus:
              </label>
              {generatedResult?.source && (
                <span className="text-[10px] font-medium text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Engine: {generatedResult.source}
                </span>
              )}
            </div>

            {/* Tone Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'holistic', label: 'Balanced & Holistic', icon: TrendingUp },
                { id: 'high_achiever', label: 'Commendation / High', icon: Award },
                { id: 'encouraging', label: 'Encouraging & Motivating', icon: HeartHandshake },
                { id: 'improvement', label: 'Guidance & Improvement', icon: Calendar },
                { id: 'islamic_values', label: 'Islamic Adab & Character', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = tone === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTone(item.id as ToneOption)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold text-center flex flex-col items-center justify-center gap-1 transition-all border ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`} />
                    <span className="text-[11px] leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Teacher's Specific Note */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Teacher's Classroom Observations (Optional):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    openArabicKeyboard();
                    const el = document.getElementById('input-teacher-comment-notes');
                    if (el) el.focus();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-arabic"
                  title="Type observation notes in Arabic"
                >
                  <Keyboard className="w-3 h-3 text-emerald-700" />
                  <span>كتابة بالعربية</span>
                </button>
              </div>
              <input
                type="text"
                id="input-teacher-comment-notes"
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="e.g. Participates well in oral recitation, struggles with homework submission, very polite..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Regenerate Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing performance & generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Regenerate with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Suggestions Output */}
          {generatedResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Assessment Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-900 text-white shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                    AI Academic Evaluation Verdict
                  </span>
                  <span className="text-sm font-bold text-white">{generatedResult.summaryAssessment}</span>
                </div>
                <div className="text-xs text-emerald-200 italic max-w-xs text-right">
                  {generatedResult.attendanceAppraisal}
                </div>
              </div>

              {/* Strengths & Improvement tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generatedResult.keyStrengths?.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 block mb-1.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-700" /> Key Strengths Identified:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {generatedResult.keyStrengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedResult.areasForImprovement?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-700" /> Constructive Areas for Growth:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {generatedResult.areasForImprovement.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 3 Distinct Remark Options */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Suggested Report Card Remarks:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Click any card to select & edit</span>
                </div>

                {/* Option 1: Detailed Remark */}
                <div
                  onClick={() => setSelectedRemarkText(generatedResult.detailedRemark)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRemarkText === generatedResult.detailedRemark
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      Option A: Comprehensive Form Master Evaluation
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(generatedResult.detailedRemark, 'detailed');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedType === 'detailed' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(generatedResult.detailedRemark);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                      >
                        Apply This
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed italic">
                    "{generatedResult.detailedRemark}"
                  </p>
                </div>

                {/* Option 2: Concise Official Remark */}
                <div
                  onClick={() => setSelectedRemarkText(generatedResult.conciseRemark)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRemarkText === generatedResult.conciseRemark
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-700" />
                      Option B: Concise Report Card Stamp Remark (1-2 Sentences)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(generatedResult.conciseRemark, 'concise');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedType === 'concise' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(generatedResult.conciseRemark);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                      >
                        Apply This
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed italic">
                    "{generatedResult.conciseRemark}"
                  </p>
                </div>

                {/* Option 3: Islamic Virtues & Character Remark */}
                <div
                  onClick={() => setSelectedRemarkText(generatedResult.islamicCharacterRemark)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRemarkText === generatedResult.islamicCharacterRemark
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-700" />
                      Option C: Islamic Virtues & Adab (Akhlaq & Du'a)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(generatedResult.islamicCharacterRemark, 'islamic');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedType === 'islamic' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(generatedResult.islamicCharacterRemark);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-800 hover:bg-teal-900 text-white transition-colors"
                      >
                        Apply This
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed italic">
                    "{generatedResult.islamicCharacterRemark}"
                  </p>
                </div>
              </div>

              {/* Active Remark Editor & Final Apply */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Selected Remark to Save for {studentData.student.fullName}:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        openArabicKeyboard();
                        const el = document.getElementById('textarea-selected-remark');
                        if (el) el.focus();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-arabic"
                      title="Type or edit remark in Arabic using virtual keyboard"
                    >
                      <Keyboard className="w-3 h-3 text-emerald-700" />
                      <span>كتابة بالعربية</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedRemarkText.length} characters
                  </span>
                </div>
                <textarea
                  id="textarea-selected-remark"
                  rows={3}
                  value={selectedRemarkText}
                  onChange={(e) => setSelectedRemarkText(e.target.value)}
                  placeholder="Review or edit remark before saving..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white font-serif text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    {appliedSuccess ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                        <Check className="w-4 h-4" />
                        Applied successfully to student's grade sheet & report card!
                      </span>
                    ) : (
                      <span>Saves directly to Grade Entry sheet and Terminal Report Card.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedRemarkText, 'active')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedType === 'active' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Text
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApply()}
                      className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      Apply to Student Remark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Kulliyyat SIS • Gemini 3.8 Flash Educational Intelligence
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
