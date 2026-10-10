import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Trash2,
  Tag,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Lock,
  Compass,
  Smile,
  AlertCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import {
  BehavioralNote,
  BehavioralCategory,
  BehavioralNoteType,
  Student,
  AuthUser,
  AcademicSession,
  Term,
} from '../types';

interface BehavioralNotesSectionProps {
  student: Student;
  currentUser: AuthUser | null;
  notes: BehavioralNote[];
  currentSession: AcademicSession;
  currentTerm: Term;
  sessions: AcademicSession[];
  terms: Term[];
  onAddNote: (note: Omit<BehavioralNote, 'id' | 'createdAt'>) => void;
  onDeleteNote?: (noteId: string) => void;
}

const CATEGORY_OPTIONS: Array<{ value: BehavioralCategory; label: string; arabic: string }> = [
  { value: 'Islamic Character & Adab', label: 'Islamic Character & Adab', arabic: 'الأدب والأخلاق الإسلامية' },
  { value: 'Academic Diligence', label: 'Academic Diligence & Focus', arabic: 'الاجتهاد والمثابرة العلمية' },
  { value: 'Classroom Conduct', label: 'Classroom Conduct & Attentiveness', arabic: 'الانضباط والهدوء الصفي' },
  { value: 'Peer Relations', label: 'Peer Relations & Brotherhood', arabic: 'حسن المعاملة والأخوة' },
  { value: 'Punctuality & Discipline', label: 'Punctuality & Regularity', arabic: 'المواظبة والانضباط' },
  { value: 'Tahfiz & Memorization', label: 'Tahfiz & Qur\'an Etiquette', arabic: 'أدب القرآن وحلقات التحفيظ' },
  { value: 'Leadership & Community', label: 'Leadership & Helping Others', arabic: 'المبادرة والتعاون' },
  { value: 'Other', label: 'General / Other Observation', arabic: 'ملاحظات عامة' },
];

export const BehavioralNotesSection: React.FC<BehavioralNotesSectionProps> = ({
  student,
  currentUser,
  notes,
  currentSession,
  currentTerm,
  sessions,
  terms,
  onAddNote,
  onDeleteNote,
}) => {
  const isAuthorized = currentUser?.role === 'super_admin' || currentUser?.role === 'teacher';

  // State for form modal / accordion
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [type, setType] = useState<BehavioralNoteType>('positive');
  const [category, setCategory] = useState<BehavioralCategory>('Islamic Character & Adab');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [sessionId, setSessionId] = useState(currentSession.id);
  const [termId, setTermId] = useState(currentTerm.id);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'positive' | 'constructive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtered notes for this specific student
  const studentNotes = notes.filter((n) => n.studentId === student.id);

  const positiveCount = studentNotes.filter((n) => n.type === 'positive').length;
  const constructiveCount = studentNotes.filter((n) => n.type === 'constructive').length;

  const filteredNotes = studentNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.actionTaken && note.actionTaken.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || note.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const authorName = currentUser?.name || 'Authorized Faculty';
    const authorId = currentUser?.id || 'faculty_member';
    const authorRole = currentUser?.role === 'super_admin' ? 'super_admin' : 'teacher';

    onAddNote({
      studentId: student.id,
      authorId,
      authorName,
      authorRole,
      category,
      type,
      title: title.trim(),
      content: content.trim(),
      actionTaken: actionTaken.trim() || undefined,
      sessionId,
      termId,
      isPrivate: true,
    });

    // Reset form
    setTitle('');
    setContent('');
    setActionTaken('');
    setType('positive');
    setCategory('Islamic Character & Adab');
    setIsFormOpen(false);
  };

  // If viewing user is not authorized faculty or admin, render strict private notice
  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Confidential Faculty Records</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Behavioral and character development observations are strictly confidential to authorized school teachers and administration.
          They are not visible to student portal sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Privacy Guarantee Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-700/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Confidential Behavioral Observations</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Faculty & Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Log and review character development, adab, academic diligence, and guidance for <strong className="text-white">{student.fullName}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-open-log-behavioral-note"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? 'Close Note Form' : 'Log New Observation'}</span>
          </button>
        </div>
      </div>

      {/* Observation Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Observations
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              {studentNotes.length}
            </span>
            <span className="text-[11px] text-slate-400">Recorded for {student.fullName.split(' ')[0]}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Positive Observations
            </span>
            <span className="text-2xl font-black text-emerald-800 font-mono mt-0.5 block">
              {positiveCount}
            </span>
            <span className="text-[11px] text-emerald-700">Commendations & exemplary adab</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Constructive Guidance
            </span>
            <span className="text-2xl font-black text-amber-900 font-mono mt-0.5 block">
              {constructiveCount}
            </span>
            <span className="text-[11px] text-amber-800">Areas for growth & mentoring</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expandable Form: Log New Behavioral Observation */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-white border-2 border-emerald-600/30 shadow-md space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Record Behavioral Observation for {student.fullName}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Author: <strong className="text-slate-700">{currentUser?.name || 'Faculty Member'}</strong>
            </span>
          </div>

          {/* Observation Type Selector (Positive vs Constructive) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nature of Observation *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('positive')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  type === 'positive'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    type === 'positive' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Positive Commendation (إيجابي / ثناء)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Exemplary adab, helpfulness, Quranic dedication, academic improvement, or honesty.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('constructive')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  type === 'constructive'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    type === 'constructive' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Constructive Guidance (توجيه وإرشاد)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Inattention, tardiness, homework neglect, dispute with peers, or support needed.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Domain Category, Session, Term */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domain / Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BehavioralCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.arabic})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Session
              </label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Term
              </label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observation Summary / Headline *
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'positive'
                  ? 'e.g. Exhibited exemplary patience during group study and voluntary peer tutoring'
                  : 'e.g. Arrived late to Tahfiz circle twice and did not prepare assigned Hizb'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Detailed Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Observation Note *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide context on what happened, where, and any relevant behavioral details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Action Taken / Follow-up */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Faculty Action Taken / Recommended Follow-up (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">Internal Guidance</span>
            </label>
            <input
              type="text"
              placeholder={
                type === 'positive'
                  ? 'e.g. Verbally commended student before the class and awarded star sticker'
                  : 'e.g. Counseled student privately; agreed on 15-minute extra revision schedule'
              }
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Note will remain private to authorized faculty & administration.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                Save Observation Note
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search behavioral notes, titles, authors, or actions taken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Domains ({studentNotes.length})</option>
              {CATEGORY_OPTIONS.map((cat) => {
                const count = studentNotes.filter((n) => n.category === cat.value).length;
                return (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Observations ({studentNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('positive')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              typeFilter === 'positive'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Positive ({positiveCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('constructive')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              typeFilter === 'constructive'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Constructive Guidance ({constructiveCount})</span>
          </button>
        </div>
      </div>

      {/* Observation Notes Feed / List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Behavioral Observations Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'No observations match your search or filter criteria. Try resetting the filters.'
                : `No behavioral notes have been recorded for ${student.fullName} yet. Click "Log New Observation" above to record the first note.`}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isPositive = note.type === 'positive';
            const termObj = terms.find((t) => t.id === note.termId);
            const sessionObj = sessions.find((s) => s.id === note.sessionId);
            const formattedDate = new Date(note.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isPositive
                    ? 'bg-emerald-50/20 border-emerald-200/80 hover:border-emerald-300'
                    : 'bg-amber-50/25 border-amber-200/80 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300/80'
                          : 'bg-amber-100 text-amber-900 border border-amber-300/80'
                      }`}
                    >
                      {isPositive ? <CheckCircle2 className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                      <span>{isPositive ? 'Positive Commendation' : 'Constructive Guidance'}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                      {note.category}
                    </span>

                    {(termObj || sessionObj) && (
                      <span className="text-[10px] font-medium text-slate-500">
                        {termObj?.name || note.termId} • {sessionObj?.name || note.sessionId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </span>

                    {onDeleteNote && (currentUser?.role === 'super_admin' || currentUser?.name === note.authorName) && (
                      <div>
                        {deleteConfirmId === note.id ? (
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-[10px] text-rose-600 font-bold">Delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteNote(note.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(note.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete observation note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Note Title */}
                <h4 className="text-sm font-bold text-slate-900 mt-1">{note.title}</h4>

                {/* Note Content */}
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                {/* Action Taken Callout */}
                {note.actionTaken && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                      isPositive
                        ? 'bg-emerald-100/40 text-emerald-900 border-emerald-200'
                        : 'bg-amber-100/50 text-amber-950 border-amber-200'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Faculty Action / Follow-up: </span>
                      <span>{note.actionTaken}</span>
                    </div>
                  </div>
                )}

                {/* Author & Privacy Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                      {note.authorName.charAt(0)}
                    </div>
                    <span>
                      Logged by <strong className="text-slate-800">{note.authorName}</strong>{' '}
                      <span className="text-slate-400">
                        ({note.authorRole === 'super_admin' ? 'School Mudir / Admin' : 'Class Teacher / Faculty'})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Confidential Faculty Record</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
