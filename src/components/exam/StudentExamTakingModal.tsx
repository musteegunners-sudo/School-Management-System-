import React, { useState, useEffect, useRef } from 'react';
import {
  Exam,
  ExamQuestion,
  ExamSubmission,
  Student,
  ObjOptionId,
} from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Award,
  BookOpen,
  X,
  Send,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface StudentExamTakingModalProps {
  exam: Exam;
  student: Student;
  existingSubmission?: ExamSubmission | null;
  onClose: () => void;
  onSubmitExam: (submission: ExamSubmission) => void;
}

export const StudentExamTakingModal: React.FC<StudentExamTakingModalProps> = ({
  exam,
  student,
  existingSubmission,
  onClose,
  onSubmitExam,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ObjOptionId>>(existingSubmission?.answers || {});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(exam.durationMinutes * 60);
  const [startedAt] = useState<string>(new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(existingSubmission || null);

  const { language: appLang } = useLanguage();
  const [examLanguageMode, setExamLanguageMode] = useState<'all' | 'en' | 'ar' | 'ha'>(() =>
    appLang === 'ar' ? 'ar' : appLang === 'ha' ? 'ha' : 'all'
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = exam.questions.length;
  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  // Countdown Timer
  useEffect(() => {
    if (submissionResult) return; // Stop timer if already submitted

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit('timed_out');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submissionResult]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: ObjOptionId) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleClearOption = (questionId: string) => {
    if (submissionResult) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const calculateGrade = (percentage: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' => {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  };

  const generateSubmission = (status: 'completed' | 'timed_out'): ExamSubmission => {
    let earnedMarks = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        earnedMarks += q.marks;
      }
    });

    const maxScore = exam.totalMarks || exam.questions.reduce((sum, q) => sum + q.marks, 0);
    // Scale accurately if sum of marks differs from totalMarks
    const totalQuestionMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0) || 1;
    const finalScore = Math.round((earnedMarks / totalQuestionMarks) * maxScore);
    const percentage = Math.min(100, Math.round((finalScore / maxScore) * 100));
    const grade = calculateGrade(percentage);

    const timeSpentSeconds = exam.durationMinutes * 60 - secondsRemaining;

    return {
      id: `sub_${exam.id}_${student.id}_${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.id,
      studentRegNo: student.regNo,
      studentName: student.fullName,
      classId: exam.classId,
      className: exam.className,
      subjectId: exam.subjectId,
      subjectName: exam.subjectName,
      termId: exam.termId,
      sessionId: exam.sessionId,
      answers,
      totalScore: finalScore,
      maxScore,
      percentage,
      grade,
      startedAt,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds,
      status,
    };
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    const sub = generateSubmission('completed');
    setSubmissionResult(sub);
    setShowConfirmModal(false);
    onSubmitExam(sub);
    setIsSubmitting(false);
  };

  const handleAutoSubmit = (status: 'timed_out') => {
    const sub = generateSubmission(status);
    setSubmissionResult(sub);
    onSubmitExam(sub);
  };

  const isLowTime = secondsRemaining <= 300; // Under 5 minutes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top CBT Header */}
        <header className="bg-[#3D1F0D] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#5E3114]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5E3114] flex items-center justify-center font-bold text-amber-200 shrink-0">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-100">{exam.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  {exam.subjectName}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Candidate: <strong className="text-white">{student.fullName}</strong> ({student.regNo}) • {exam.className}
              </p>
            </div>
          </div>

          {/* Countdown Timer or Completed Badge */}
          <div className="flex items-center gap-3">
            {!submissionResult ? (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-xs transition-colors ${
                  isLowTime
                    ? 'bg-rose-950 border-rose-500/60 text-rose-300 animate-pulse'
                    : 'bg-[#542B12] border-amber-500/30 text-amber-100'
                }`}
              >
                <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-400' : 'text-amber-300'}`} />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-emerald-800 text-emerald-100 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Exam Completed
              </span>
            )}

            {submissionResult && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* CBT Exam Language Switcher Bar */}
        <div className="bg-[#48240D] text-amber-100 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#5E3114]">
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-bold text-[11px]">Question Language / Harshe / لغة الأسئلة:</span>
          </div>

          <div className="flex items-center gap-1 bg-[#2E1405] p-1 rounded-xl border border-amber-900/60">
            <button
              type="button"
              onClick={() => setExamLanguageMode('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                examLanguageMode === 'all'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-amber-200/80 hover:text-white'
              }`}
              title="Show all available translations"
            >
              🌐 Trilingual (All)
            </button>
            <button
              type="button"
              onClick={() => setExamLanguageMode('en')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                examLanguageMode === 'en'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-amber-200/80 hover:text-white'
              }`}
              title="English Language"
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setExamLanguageMode('ar')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                examLanguageMode === 'ar'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-amber-200/80 hover:text-white'
              }`}
              title="اللغة العربية"
            >
              🇸🇦 العربية
            </button>
            <button
              type="button"
              onClick={() => setExamLanguageMode('ha')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                examLanguageMode === 'ha'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-amber-200/80 hover:text-white'
              }`}
              title="Harshen Hausa (Local)"
            >
              🇳🇬 Hausa
            </button>
          </div>
        </div>

        {/* Exam Content Area */}
        {!submissionResult ? (
          <div className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 space-y-5">
            {/* Progress Bar & Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span>
                  {answeredCount} of {totalQuestions} Answered ({Math.round((answeredCount / totalQuestions) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-[#FAF7F2] p-5 sm:p-6 rounded-2xl border border-[#E8D7C6] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#4E2D17] text-white font-bold text-xs">
                        Q{currentQuestion.questionNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({currentQuestion.marks} marks)
                      </span>
                      {flaggedQuestions[currentQuestion.id] && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <Bookmark className="w-3 h-3 text-amber-600" />
                          Flagged for Review
                        </span>
                      )}
                    </div>

                    {/* Question Text Rendering by Language Mode */}
                    {examLanguageMode === 'ar' ? (
                      <h2
                        dir="rtl"
                        className="text-lg sm:text-xl font-bold text-emerald-950 font-serif leading-relaxed"
                      >
                        {currentQuestion.arabicText || currentQuestion.text}
                      </h2>
                    ) : examLanguageMode === 'ha' ? (
                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {currentQuestion.hausaText || currentQuestion.text}
                        </h2>
                        {currentQuestion.hausaText && currentQuestion.hausaText !== currentQuestion.text && (
                          <p className="text-xs text-slate-500 italic">
                            ({currentQuestion.text})
                          </p>
                        )}
                      </div>
                    ) : examLanguageMode === 'en' ? (
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {currentQuestion.text}
                      </h2>
                    ) : (
                      /* Trilingual (All) Mode */
                      <div className="space-y-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {currentQuestion.text}
                        </h2>

                        {currentQuestion.arabicText && (
                          <p
                            dir="rtl"
                            className="text-base sm:text-lg font-semibold text-emerald-950 font-serif leading-relaxed pt-0.5"
                          >
                            {currentQuestion.arabicText}
                          </p>
                        )}

                        {currentQuestion.hausaText && (
                          <p className="text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block">
                            <span className="font-bold text-emerald-950">Hausa: </span>
                            {currentQuestion.hausaText}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      flaggedQuestions[currentQuestion.id]
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-stone-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Bookmark this question to review before submitting"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {flaggedQuestions[currentQuestion.id] ? 'Flagged' : 'Flag'}
                    </span>
                  </button>
                </div>

                {/* Multiple Choice Options (A, B, C, D) */}
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {option.id}
                          </span>

                          <div className="flex-1">
                            {examLanguageMode === 'ar' ? (
                              <span
                                dir="rtl"
                                className="block text-sm sm:text-base font-serif text-slate-900 font-medium"
                              >
                                {option.arabicText || option.text}
                              </span>
                            ) : examLanguageMode === 'ha' ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                {option.hausaText || option.text}
                              </span>
                            ) : examLanguageMode === 'en' ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                {option.text}
                              </span>
                            ) : (
                              /* Trilingual Mode */
                              <div className="space-y-0.5">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                                  {option.text}
                                </span>
                                {option.arabicText && (
                                  <span
                                    dir="rtl"
                                    className="block text-xs sm:text-sm font-serif text-emerald-950 font-medium"
                                  >
                                    {option.arabicText}
                                  </span>
                                )}
                                {option.hausaText && (
                                  <span className="block text-[11px] text-emerald-800 font-medium">
                                    🇳🇬 {option.hausaText}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Clear Choice button */}
                {answers[currentQuestion.id] && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleClearOption(currentQuestion.id)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear Choice
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Question Quick Palette */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Question Navigator
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exam.questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = flaggedQuestions[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'ring-2 ring-[#4E2D17] ring-offset-1 bg-[#4E2D17] text-white shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Submission Results & Score Card */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Award className="w-9 h-9" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
                Examination Completed!
              </h2>
              <p className="text-xs text-emerald-800">
                Alhamdulillah! Your answers have been recorded and auto-graded for your continuous assessment report card.
              </p>

              {/* Score Display Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    {submissionResult.totalScore} / {submissionResult.maxScore}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    Total Score (Marks)
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    {submissionResult.percentage}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    Percentage
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    Grade {submissionResult.grade}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    Grade Scale
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
                  <div className="text-base font-black text-slate-800 font-mono mt-1">
                    {Math.floor(submissionResult.timeSpentSeconds / 60)}m {submissionResult.timeSpentSeconds % 60}s
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                    Time Spent
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Review Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Question Review & Answer Key
              </h3>

              <div className="space-y-3">
                {exam.questions.map((q, idx) => {
                  const studentChoice = submissionResult.answers[q.id];
                  const isCorrect = studentChoice === q.correctOptionId;
                  const correctOption = q.options.find((o) => o.id === q.correctOptionId);
                  const chosenOption = q.options.find((o) => o.id === studentChoice);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          Q{idx + 1}. {q.text}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCorrect ? `+${q.marks} Marks` : '0 Marks'}
                        </span>
                      </div>

                      {q.arabicText && (
                        <p dir="rtl" className="text-emerald-900 font-serif font-medium">
                          {q.arabicText}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 font-medium">Your Answer: </span>
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {studentChoice ? `${studentChoice}: ${chosenOption?.text}` : 'Not Answered'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Correct Answer: </span>
                          <strong className="text-emerald-700">
                            {q.correctOptionId}: {correctOption?.text}
                          </strong>
                        </div>
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        {!submissionResult ? (
          <footer className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Exam</span>
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-3.5 py-2 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Finish & Submit</span>
                </button>
              )}
            </div>
          </footer>
        ) : (
          <footer className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Return to Student Dashboard
            </button>
          </footer>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Confirm Exam Submission</h3>
                  <p className="text-xs text-slate-500">
                    Are you ready to submit your answers?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Questions Answered:</span>
                  <strong className="text-emerald-700">{answeredCount}</strong>
                </div>
                {totalQuestions - answeredCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-rose-600 font-semibold">Unanswered Questions:</span>
                    <strong className="text-rose-600">{totalQuestions - answeredCount}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Remaining:</span>
                  <strong className="font-mono">{formatTime(secondsRemaining)}</strong>
                </div>
              </div>

              {totalQuestions - answeredCount > 0 && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Notice: You still have {totalQuestions - answeredCount} unanswered questions. You can go back and answer them before submitting.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Continue Answering
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Yes, Submit My Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
