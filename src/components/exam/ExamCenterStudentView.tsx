import React, { useState } from 'react';
import {
  Exam,
  ExamSubmission,
  Student,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
} from '../../types';
import {
  BookOpen,
  Clock,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText,
  UserCheck,
} from 'lucide-react';
import { StudentExamTakingModal } from './StudentExamTakingModal';

interface ExamCenterStudentViewProps {
  student: Student;
  exams: Exam[];
  submissions: ExamSubmission[];
  currentSession: AcademicSession;
  currentTerm: Term;
  onSubmitExam: (submission: ExamSubmission) => void;
}

export const ExamCenterStudentView: React.FC<ExamCenterStudentViewProps> = ({
  student,
  exams,
  submissions,
  currentSession,
  currentTerm,
  onSubmitExam,
}) => {
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>(student.classId);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filter exams specifically published for selected class and subject
  const studentExams = exams.filter((e) => {
    if (!e.isPublished) return false;
    if (selectedClassId !== 'all' && e.classId !== selectedClassId) return false;
    if (selectedSubjectFilter !== 'all') {
      const subName = (e.subjectName || '').toLowerCase();
      if (selectedSubjectFilter === 'maths' && !subName.includes('math')) return false;
      if (selectedSubjectFilter === 'english' && !subName.includes('eng')) return false;
      if (selectedSubjectFilter === 'quran' && !subName.includes('qur')) return false;
      if (selectedSubjectFilter === 'islamic' && !subName.includes('islam') && !subName.includes('fiqh') && !subName.includes('tawhid')) return false;
      if (selectedSubjectFilter === 'arabic' && !subName.includes('arab')) return false;
      if (selectedSubjectFilter === 'science' && !subName.includes('scien') && !subName.includes('tech') && !subName.includes('bio') && !subName.includes('chem') && !subName.includes('phys')) return false;
      if (selectedSubjectFilter === 'social' && !subName.includes('social') && !subName.includes('civic') && !subName.includes('econ')) return false;
    }
    return true;
  });

  const classOptions = [
    { id: student.classId, label: `My Enrolled Class (${student.regNo})` },
    { id: 'all', label: 'All Classes (Primary 3 to SS 3)' },
    { id: 'cls_primary_3', label: 'Primary 3 (Basic 3)' },
    { id: 'cls_primary_4', label: 'Primary 4 (Basic 4)' },
    { id: 'cls_primary_5', label: 'Primary 5 (Basic 5)' },
    { id: 'cls_primary_6', label: 'Primary 6 (Basic 6)' },
    { id: 'cls_idadi_1', label: "I'dadi 1 (JSS 1)" },
    { id: 'cls_idadi_2', label: "I'dadi 2 (JSS 2)" },
    { id: 'cls_idadi_3', label: "I'dadi 3 (JSS 3)" },
    { id: 'cls_thanawi_1', label: 'Thanawi 1 (SS 1)' },
    { id: 'cls_thanawi_2', label: 'Thanawi 2 (SS 2)' },
    { id: 'cls_thanawi_3', label: 'Thanawi 3 (SS 3)' },
  ];

  const getSubmissionForExam = (examId: string) => {
    return submissions.find((s) => s.examId === examId && s.studentId === student.id);
  };

  return (
    <div className="space-y-6">
      {/* Student Exam Center Header Banner */}
      <div className="p-6 rounded-2xl bg-[#4E2D17] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#6B3F20] text-amber-200 flex items-center justify-center font-bold shadow-xs shrink-0">
            <BookOpen className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Student CBT Examination Center</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                Official Portal
              </span>
            </div>
            <p className="text-xs text-[#debca3] mt-0.5">
              Candidate: <strong className="text-white">{student.fullName}</strong> ({student.regNo}) • {currentTerm.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#debca3] bg-[#3B1F0D] px-3.5 py-2 rounded-xl border border-[#6B3F20]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>School Approved Registration Credentials Verified</span>
        </div>
      </div>

      {/* CBT Instructions Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-900 block">Examination Guidelines for Students:</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            1. All questions are Multiple Choice (OBJ). Select the single best option (A, B, C, or D).<br />
            2. Once you start an examination, your countdown timer begins. When the time expires, your exam will automatically submit.<br />
            3. You can review and change your selected options before clicking "Submit Exam".
          </p>
        </div>
      </div>

      {/* Scheduled Exams List & Level Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="space-y-1">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4E2D17]" />
              CBT Examinations ({studentExams.length} Available)
            </h3>
            <p className="text-xs text-slate-500">
              Select class level (Primary 3 to SS 3) and subject to take or practice examinations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 shrink-0">Class Level:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              {classOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'maths', label: 'Mathematics' },
            { id: 'english', label: 'English Language' },
            { id: 'quran', label: "Al-Qur'an & Tajweed" },
            { id: 'islamic', label: 'Islamic Studies & Fiqh' },
            { id: 'arabic', label: 'Arabic Language' },
            { id: 'science', label: 'Sciences' },
            { id: 'social', label: 'Social & Civic' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedSubjectFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubjectFilter === pill.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {studentExams.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">No active examinations at this time</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your subject teachers will publish objective examinations here when scheduled. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentExams.map((exam) => {
              const submission = getSubmissionForExam(exam.id);
              const isCompleted = Boolean(submission);

              return (
                <div
                  key={exam.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-white border-emerald-200 shadow-2xs'
                      : 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                        {exam.subjectName}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold text-[10px]">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Ready to Take
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-slate-900 leading-snug">
                      {exam.title}
                    </h4>

                    {exam.arabicTitle && (
                      <p dir="rtl" className="text-xs font-serif text-emerald-900 font-medium">
                        {exam.arabicTitle}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: <strong>{exam.durationMinutes} Mins</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Total Marks: <strong>{exam.totalMarks} Pts</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Questions: <strong>{exam.questions.length} Items</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">Teacher: <strong>{exam.teacherName}</strong></span>
                      </div>
                    </div>

                    {/* Result Summary if Completed */}
                    {isCompleted && submission && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">Your Score</span>
                          <strong className="text-base text-emerald-950 font-mono">
                            {submission.totalScore} / {submission.maxScore} ({submission.percentage}%)
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">Grade</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-black text-xs">
                            Grade {submission.grade}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setActiveTakingExam(exam)}
                        className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-emerald-700" />
                        <span>Review Questions & Answers</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTakingExam(exam)}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Take Examination Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CBT Modal */}
      {activeTakingExam && (
        <StudentExamTakingModal
          exam={activeTakingExam}
          student={student}
          existingSubmission={getSubmissionForExam(activeTakingExam.id)}
          onClose={() => setActiveTakingExam(null)}
          onSubmitExam={(submission) => {
            onSubmitExam(submission);
          }}
        />
      )}
    </div>
  );
};
