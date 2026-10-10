import React, { useState, useMemo } from 'react';
import {
  ClassSessionNote,
  SchoolClass,
  Subject,
  Teacher,
  AuthUser,
  AcademicSession,
  Term,
} from '../types';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  Layers,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  X,
  Keyboard,
} from 'lucide-react';
import { useArabicKeyboard } from '../context/ArabicKeyboardContext';

interface ClassSessionNotesSectionProps {
  currentClass: SchoolClass;
  currentSubject: Subject;
  availableSubjects: Subject[];
  activeTeacher: Teacher | null;
  currentUser: AuthUser | null;
  currentSession: AcademicSession;
  currentTerm: Term;
  classStudentsCount: number;
  sessionNotes: ClassSessionNote[];
  onSaveSessionNote: (note: ClassSessionNote) => void;
  onDeleteSessionNote: (noteId: string) => void;
}

const SESSION_TYPES: Array<ClassSessionNote['sessionType']> = [
  'Lecture',
  'Tahfiz / Recitation',
  'Continuous Assessment',
  'Revision',
  'Practical / Activity',
];

const STANDARD_PERIODS = [
  'Period 1 (08:00 - 08:45 AM)',
  'Period 2 (08:45 - 09:30 AM)',
  'Period 3 (09:45 - 10:30 AM)',
  'Period 4 (10:30 - 11:15 AM)',
  'Period 5 (11:30 - 12:15 PM)',
  'Period 6 (12:15 - 01:00 PM)',
  'Afternoon Tahfiz Session (02:30 - 04:00 PM)',
  'Evening Halaqah (04:30 - 06:00 PM)',
];

export const ClassSessionNotesSection: React.FC<ClassSessionNotesSectionProps> = ({
  currentClass,
  currentSubject,
  availableSubjects,
  activeTeacher,
  currentUser,
  currentSession,
  currentTerm,
  classStudentsCount,
  sessionNotes,
  onSaveSessionNote,
  onDeleteSessionNote,
}) => {
  const {
    openKeyboard: openArabicKeyboard,
    toggleKeyboard: toggleArabicKeyboard,
    isOpen: isArabicKeyboardOpen,
  } = useArabicKeyboard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClassSessionNote | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Form State
  const [formData, setFormData] = useState<{
    subjectId: string;
    date: string;
    period: string;
    sessionType: ClassSessionNote['sessionType'];
    topic: string;
    notes: string;
    homework: string;
    attendanceSummary: string;
  }>({
    subjectId: currentSubject.id,
    date: new Date().toISOString().split('T')[0],
    period: STANDARD_PERIODS[0],
    sessionType: 'Lecture',
    topic: '',
    notes: '',
    homework: '',
    attendanceSummary: `${classStudentsCount} / ${classStudentsCount} present`,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Filter notes for the active class and term
  const classNotes = useMemo(() => {
    return sessionNotes
      .filter((n) => n.classId === currentClass.id && n.termId === currentTerm.id && n.sessionId === currentSession.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessionNotes, currentClass.id, currentTerm.id, currentSession.id]);

  // Filtered by subject and search
  const filteredNotes = useMemo(() => {
    return classNotes.filter((note) => {
      if (filterSubjectId !== 'all' && note.subjectId !== filterSubjectId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = note.topic.toLowerCase().includes(q);
        const matchesNotes = note.notes.toLowerCase().includes(q);
        const matchesTeacher = note.teacherName.toLowerCase().includes(q);
        const matchesSubject = note.subjectName.toLowerCase().includes(q);
        const matchesHomework = note.homework?.toLowerCase().includes(q);
        if (!matchesTopic && !matchesNotes && !matchesTeacher && !matchesSubject && !matchesHomework) {
          return false;
        }
      }
      return true;
    });
  }, [classNotes, filterSubjectId, searchQuery]);

  const openCreateModal = () => {
    setEditingNote(null);
    setFormData({
      subjectId: currentSubject.id,
      date: new Date().toISOString().split('T')[0],
      period: STANDARD_PERIODS[0],
      sessionType: currentSubject.name.toLowerCase().includes('quran') || currentSubject.name.toLowerCase().includes('tahfiz')
        ? 'Tahfiz / Recitation'
        : 'Lecture',
      topic: '',
      notes: '',
      homework: '',
      attendanceSummary: `${classStudentsCount} / ${classStudentsCount} present`,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: ClassSessionNote) => {
    setEditingNote(note);
    setFormData({
      subjectId: note.subjectId,
      date: note.date,
      period: note.period || STANDARD_PERIODS[0],
      sessionType: note.sessionType,
      topic: note.topic,
      notes: note.notes,
      homework: note.homework || '',
      attendanceSummary: note.attendanceSummary || `${classStudentsCount} / ${classStudentsCount} present`,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setFormError('Please enter a lesson topic or title.');
      return;
    }
    if (!formData.notes.trim()) {
      setFormError('Please provide brief session notes or learning summary.');
      return;
    }

    const selectedSub = availableSubjects.find((s) => s.id === formData.subjectId) || currentSubject;
    const teacherName = activeTeacher?.fullName || currentUser?.name || 'Assigned Subject Teacher';
    const teacherId = activeTeacher?.id || currentUser?.id || 'tch_general';

    const noteToSave: ClassSessionNote = {
      id: editingNote ? editingNote.id : `sn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId: currentClass.id,
      className: currentClass.name,
      subjectId: selectedSub.id,
      subjectName: selectedSub.name,
      teacherId,
      teacherName,
      date: formData.date,
      period: formData.period,
      sessionType: formData.sessionType,
      topic: formData.topic.trim(),
      notes: formData.notes.trim(),
      homework: formData.homework.trim() || undefined,
      attendanceSummary: formData.attendanceSummary.trim() || undefined,
      sessionId: currentSession.id,
      termId: currentTerm.id,
      createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
      updatedAt: editingNote ? new Date().toISOString() : undefined,
    };

    onSaveSessionNote(noteToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Academic Activity & Session Notes</span>
            <span>•</span>
            <span className="text-emerald-200 font-mono">Audited Trail</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Class Session Log — {currentClass.name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 font-normal">
              {classNotes.length} Logged
            </span>
          </h3>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Log pedagogical session notes, learning objectives, Tahfiz progress, and homework for every conducted class. Every entry is automatically written to the school's central audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-session-notes-arabic-kb"
            onClick={toggleArabicKeyboard}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
              isArabicKeyboardOpen
                ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
            title="Toggle Arabic Virtual Keyboard"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-arabic">لوحة المفاتيح</span>
          </button>
          <button
            id="btn-log-class-session"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Class Session Note</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isExpanded ? 'Collapse notes' : 'Expand notes'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filter by Subject:
              </span>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Subjects in {currentClass.name}</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.arabicName ? `(${s.arabicName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic, notes, homework..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List of Session Notes */}
          {filteredNotes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-semibold text-slate-700 text-sm">No session notes logged yet</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || filterSubjectId !== 'all'
                  ? 'No session note matches your current filter.'
                  : `Teachers can record lesson topics, coverage notes, and homework here after conducting classes for ${currentClass.name}.`}
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log First Session Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => {
                const subObj = availableSubjects.find((s) => s.id === note.subjectId);
                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Meta Line */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900">
                            {note.subjectName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              note.sessionType === 'Tahfiz / Recitation'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : note.sessionType === 'Continuous Assessment'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : note.sessionType === 'Revision'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {note.sessionType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(note)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                            title="Edit session note"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the session note "${note.topic}"? This action will be recorded in the audit trail.`)) {
                                onDeleteSessionNote(note.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete session note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Topic Title */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {note.topic}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {note.date}
                          </span>
                          {note.period && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {note.period}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Notes Body */}
                      <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                        {note.notes}
                      </p>

                      {/* Homework Badge */}
                      {note.homework && (
                        <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[11px] text-amber-900 block">
                              Assignment / Homework:
                            </span>
                            <span className="text-slate-800">{note.homework}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer: Teacher info & Audit badge */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Teacher: <span className="text-slate-800 font-semibold">{note.teacherName}</span></span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Audited Log
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create / Edit Session Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                  {editingNote ? 'Edit Academic Log' : 'New Class Session Log'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingNote ? 'Update Session Note' : 'Log Class Teaching Activity'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Class & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Class (Read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentClass.name} (${currentClass.section})`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-session-subject"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.arabicName ? `(${s.arabicName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date Conducted <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="input-session-date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Period / Time Slot
                  </label>
                  <select
                    id="input-session-period"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {STANDARD_PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Session Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Session Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map((type) => {
                    const isSel = formData.sessionType === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setFormData({ ...formData, sessionType: type })}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                          isSel
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Lesson Topic / Unit Title <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      openArabicKeyboard();
                      const el = document.getElementById('input-session-topic');
                      if (el) el.focus();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-arabic"
                    title="Type Topic in Arabic"
                  >
                    <Keyboard className="w-3 h-3 text-emerald-700" />
                    <span>كتابة بالعربية</span>
                  </button>
                </div>
                <input
                  type="text"
                  id="input-session-topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Surah Al-Mulk Verses 1-15 (Tajweed & Memorization), or Fractions in Mathematics"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Session Notes & Learning Outcomes <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      openArabicKeyboard();
                      const el = document.getElementById('input-session-notes');
                      if (el) el.focus();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-arabic"
                    title="Type Notes in Arabic"
                  >
                    <Keyboard className="w-3 h-3 text-emerald-700" />
                    <span>كتابة بالعربية</span>
                  </button>
                </div>
                <textarea
                  id="input-session-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Summarize key concepts covered, student understanding, group exercises, or notable achievements..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Homework / Assignment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Homework / Follow-up Assignment (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      openArabicKeyboard();
                      const el = document.getElementById('input-session-homework');
                      if (el) el.focus();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors font-arabic"
                    title="Type Homework in Arabic"
                  >
                    <Keyboard className="w-3 h-3 text-emerald-700" />
                    <span>كتابة بالعربية</span>
                  </button>
                </div>
                <input
                  type="text"
                  id="input-session-homework"
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  placeholder="e.g. Practice recitation of verses 1-15 twice at home and complete Exercise 3"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                />
              </div>

              {/* Attendance Quick Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Class Attendance Note
                </label>
                <input
                  type="text"
                  value={formData.attendanceSummary}
                  onChange={(e) => setFormData({ ...formData, attendanceSummary: e.target.value })}
                  placeholder="e.g. 24 / 25 students present"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Audit Notice */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Automatic Audit Trail Logging</span>
                  <span>
                    Saving this note will automatically record an immutable activity log entry with timestamp and teacher signature into the central school audit register and Firebase Firestore.
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-session-note"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingNote ? 'Update & Record' : 'Save & Log to Audit Trail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
