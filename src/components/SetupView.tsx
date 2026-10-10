import React, { useState, useRef } from 'react';
import {
  Student,
  ScoreRecord,
  AttendanceRecord,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  SchoolProfile,
  GradeScaleItem,
  BackupDataPayload,
} from '../types';
import {
  Settings,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  FileJson,
  Database,
  AlertCircle,
  Check,
  FileUp,
  FileDown,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  parseSubjectCsv,
  generateSubjectCsvTemplate,
  exportSubjectsToCsv,
  ParsedSubjectResult,
} from '../utils/subjectCsvParser';

interface SetupViewProps {
  schoolProfile: SchoolProfile;
  classes: SchoolClass[];
  subjects: Subject[];
  sessions: AcademicSession[];
  terms: Term[];
  gradeScale: GradeScaleItem[];
  students: Student[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  onUpdateSchoolProfile: (profile: SchoolProfile) => void;
  onUpdateClasses: (classes: SchoolClass[]) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onImportData: (data: BackupDataPayload, mode: 'replace' | 'merge') => void;
  onResetData: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  schoolProfile,
  classes,
  subjects,
  sessions,
  terms,
  gradeScale,
  students,
  scores,
  attendance,
  onUpdateSchoolProfile,
  onUpdateClasses,
  onUpdateSubjects,
  onImportData,
  onResetData,
}) => {
  // Local state for School Profile
  const [profile, setProfile] = useState<SchoolProfile>(schoolProfile);
  const [savedNotice, setSavedNotice] = useState(false);

  // Export / Import State
  const [exportNotice, setExportNotice] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    payload: BackupDataPayload;
    fileName: string;
    studentCount: number;
    scoreCount: number;
    attendanceCount: number;
    classCount: number;
    subjectCount: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassCategory, setNewClassCategory] = useState<SchoolClass['category']>('Primary');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [classCategoryFilter, setClassCategoryFilter] = useState<string>('all');

  // New Subject Form State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectArabic, setNewSubjectArabic] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<Subject['category']>('Islamic Studies');
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState<string>('all');

  // Automated Subject CSV Import State
  const subjectCsvInputRef = useRef<HTMLInputElement>(null);
  const [pendingSubjectImport, setPendingSubjectImport] = useState<{
    result: ParsedSubjectResult;
    fileName: string;
  } | null>(null);
  const [subjectImportStrategy, setSubjectImportStrategy] = useState<'merge' | 'update' | 'replace'>('merge');
  const [subjectImportNotice, setSubjectImportNotice] = useState<string | null>(null);
  const [showPasteSubjectModal, setShowPasteSubjectModal] = useState(false);
  const [pastedSubjectCsvText, setPastedSubjectCsvText] = useState('');
  const [subjectCsvError, setSubjectCsvError] = useState<string | null>(null);

  const handleSubjectCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubjectCsvError(null);
    try {
      const text = await file.text();
      const result = parseSubjectCsv(text, subjects);
      if (result.errors.length > 0 && result.validSubjects.length === 0) {
        setSubjectCsvError(result.errors.join(' '));
        return;
      }
      setPendingSubjectImport({
        result,
        fileName: file.name,
      });
    } catch {
      setSubjectCsvError('Failed to read or parse the CSV file.');
    } finally {
      if (subjectCsvInputRef.current) {
        subjectCsvInputRef.current.value = '';
      }
    }
  };

  const handleProcessPastedSubjectCsv = () => {
    if (!pastedSubjectCsvText.trim()) return;
    setSubjectCsvError(null);
    const result = parseSubjectCsv(pastedSubjectCsvText, subjects);
    if (result.errors.length > 0 && result.validSubjects.length === 0) {
      setSubjectCsvError(result.errors.join(' '));
      return;
    }
    setShowPasteSubjectModal(false);
    setPastedSubjectCsvText('');
    setPendingSubjectImport({
      result,
      fileName: 'Pasted_Curriculum_List.csv',
    });
  };

  const handleConfirmSubjectImport = () => {
    if (!pendingSubjectImport) return;
    const { result } = pendingSubjectImport;
    let updatedSubjects: Subject[] = [];

    if (subjectImportStrategy === 'replace') {
      updatedSubjects = [...result.validSubjects];
    } else if (subjectImportStrategy === 'update') {
      const existingMap = new Map<string, Subject>();
      subjects.forEach((s) => existingMap.set(s.code.toLowerCase(), s));
      result.validSubjects.forEach((imp) => {
        existingMap.set(imp.code.toLowerCase(), imp);
      });
      updatedSubjects = Array.from(existingMap.values());
    } else {
      updatedSubjects = [...subjects, ...result.newSubjects];
    }

    onUpdateSubjects(updatedSubjects);
    const count =
      subjectImportStrategy === 'replace'
        ? result.validSubjects.length
        : subjectImportStrategy === 'update'
        ? result.validSubjects.length
        : result.newSubjects.length;

    setSubjectImportNotice(`Successfully imported and organized ${count} curriculum subjects!`);
    setTimeout(() => setSubjectImportNotice(null), 5000);
    setPendingSubjectImport(null);
  };

  const handleDownloadSubjectCsvTemplateClick = () => {
    const csvData = generateSubjectCsvTemplate();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kulliyyat_Curriculum_Subjects_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSubjectsCsvClick = () => {
    exportSubjectsToCsv(subjects, profile.name || schoolProfile.name);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolProfile(profile);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const newCls: SchoolClass = {
      id: `cls_${Date.now()}`,
      name: newClassName.trim(),
      category: newClassCategory,
      section: 'A',
      classTeacher: newClassTeacher.trim() || 'Unassigned',
    };
    onUpdateClasses([...classes, newCls]);
    setNewClassName('');
    setNewClassTeacher('');
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      onUpdateClasses(classes.filter((c) => c.id !== id));
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;
    const newSubj: Subject = {
      id: `subj_${Date.now()}`,
      name: newSubjectName.trim(),
      arabicName: newSubjectArabic.trim() || undefined,
      code: newSubjectCode.trim().toUpperCase(),
      category: newSubjectCategory,
    };
    onUpdateSubjects([...subjects, newSubj]);
    setNewSubjectName('');
    setNewSubjectArabic('');
    setNewSubjectCode('');
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      onUpdateSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  // Export Application State to JSON
  const handleExportJSON = () => {
    const backup: BackupDataPayload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      schoolName: schoolProfile.name,
      schoolProfile,
      students,
      scores,
      attendance,
      classes,
      subjects,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = (schoolProfile.name || 'kulliyyat')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 20);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${safeName}_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  // Process selected or dropped JSON file
  const processFile = (file: File) => {
    setImportError(null);
    setImportSuccess(null);

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setImportError('Please select a valid JSON (.json) backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let payload: BackupDataPayload;
        if (Array.isArray(parsed)) {
          // In case user provided an array of students directly
          payload = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            students: parsed,
            scores: [],
            attendance: [],
          };
        } else if (typeof parsed === 'object' && parsed !== null) {
          payload = {
            version: parsed.version || '2.0',
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            schoolName: parsed.schoolName,
            schoolProfile: parsed.schoolProfile,
            students: Array.isArray(parsed.students) ? parsed.students : [],
            scores: Array.isArray(parsed.scores) ? parsed.scores : [],
            attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
            classes: Array.isArray(parsed.classes) ? parsed.classes : undefined,
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : undefined,
          };
        } else {
          throw new Error('Unsupported JSON file format');
        }

        if (
          payload.students.length === 0 &&
          payload.scores.length === 0 &&
          payload.attendance.length === 0 &&
          (!payload.classes || payload.classes.length === 0)
        ) {
          setImportError('The selected file does not contain any valid students, scores, or attendance records.');
          return;
        }

        setPendingImport({
          payload,
          fileName: file.name,
          studentCount: payload.students.length,
          scoreCount: payload.scores.length,
          attendanceCount: payload.attendance.length,
          classCount: payload.classes?.length || 0,
          subjectCount: payload.subjects?.length || 0,
        });
      } catch (err: any) {
        setImportError(`Failed to parse file: ${err?.message || 'Invalid JSON syntax'}`);
      }
    };
    reader.onerror = () => {
      setImportError('Error reading the selected file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onImportData(pendingImport.payload, importMode);
    const modeLabel = importMode === 'replace' ? 'Full Restore (All replaced)' : 'Merged with existing records';
    setImportSuccess(
      `Restored: ${pendingImport.studentCount} students, ${pendingImport.scoreCount} scores, ${pendingImport.attendanceCount} attendance entries (${modeLabel}).`
    );
    setPendingImport(null);
    setTimeout(() => setImportSuccess(null), 6000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic & System Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Replicating Kulliyyat Setup Screen — Configure school details, academic sessions, classes, and subjects
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>School configuration saved successfully.</span>
        </div>
      )}

      {/* School Profile Settings */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
          <School className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-900">School Identity & Report Card Header</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / School Name (English)
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Name in Arabic (الاسم باللغة العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={profile.arabicName}
                onChange={(e) => setProfile({ ...profile, arabicName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-arabic text-right font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Motto (English)
              </label>
              <input
                type="text"
                value={profile.motto}
                onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motto in Arabic (شعار الكلية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={profile.arabicMotto}
                onChange={(e) => setProfile({ ...profile, arabicMotto: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-arabic text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal & Physical Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Term Resumption Date
              </label>
              <input
                type="text"
                value={profile.nextTermBegins}
                onChange={(e) => setProfile({ ...profile, nextTermBegins: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. Monday, 12th October, 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mudir / Head of College Name
              </label>
              <input
                type="text"
                value={profile.mudirName}
                onChange={(e) => setProfile({ ...profile, mudirName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. Ustadh Dr. Muhammad Al-Ameen"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save School Profile
            </button>
          </div>
        </form>
      </div>

      {/* Classes Management */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900">Registered Classes</h2>
          </div>
          <span className="text-xs text-slate-500">{classes.length} Total classes</span>
        </div>

        {/* Add Class Inline Form */}
        <form onSubmit={handleAddClass} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Thanawi 2 (SS 2)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Level Category</label>
            <select
              value={newClassCategory}
              onChange={(e) => setNewClassCategory(e.target.value as SchoolClass['category'])}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="Nursery">Nursery & Early Childhood (روضة)</option>
              <option value="Primary">Primary / Basic 1-6 (ابتدائي)</option>
              <option value="Tahfiz">Tahfiz & Qira'at (تحفيظ)</option>
              <option value="I'dadi (Junior)">I'dadi (Junior / إعدادي)</option>
              <option value="Thanawi (Senior)">Thanawi (Senior / ثانوي)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class Teacher</label>
            <input
              type="text"
              placeholder="e.g. Ustadh Khalid"
              value={newClassTeacher}
              onChange={(e) => setNewClassTeacher(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Class
            </button>
          </div>
        </form>

        {/* Class Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {(['all', 'Nursery', 'Primary', 'Tahfiz', 'I\'dadi (Junior)', 'Thanawi (Senior)'] as const).map((cat) => {
            const count = cat === 'all' ? classes.length : classes.filter((c) => c.category === cat).length;
            const isSelected = classCategoryFilter === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setClassCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Classes' : cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes
            .filter((cls) => classCategoryFilter === 'all' || cls.category === classCategoryFilter)
            .map((cls) => {
              const badgeColors =
                cls.category === 'Nursery'
                  ? 'bg-purple-50 text-purple-800 border-purple-200/70'
                  : cls.category === 'Primary'
                  ? 'bg-sky-50 text-sky-800 border-sky-200/70'
                  : cls.category === 'Tahfiz'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                  : cls.category === 'I\'dadi (Junior)'
                  ? 'bg-teal-50 text-teal-800 border-teal-200/70'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200/70';

              return (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span>Section: {cls.section} • Teacher: {cls.classTeacher || 'Unassigned'}</span>
                    </div>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColors}`}>
                      {cls.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Subjects Management */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h2 className="text-lg font-bold text-slate-900">Academic Subjects Curriculum</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {subjects.length} registered subjects across Islamic Studies, Arabic, Sciences, and Arts.
            </p>
          </div>

          {/* Automated CSV Tools Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={subjectCsvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleSubjectCsvFileChange}
              className="hidden"
            />

            <button
              type="button"
              id="btn-import-subjects-csv"
              onClick={() => subjectCsvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Import subjects list from a CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-200" />
              <span>Import via CSV</span>
            </button>

            <button
              type="button"
              id="btn-paste-subjects-csv"
              onClick={() => setShowPasteSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Paste CSV text directly from Excel or Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Paste CSV</span>
            </button>

            <button
              type="button"
              id="btn-download-subjects-csv-template"
              onClick={handleDownloadSubjectCsvTemplateClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title="Download official sample CSV template with Arabic font support"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>CSV Template</span>
            </button>

            <button
              type="button"
              id="btn-export-subjects-csv"
              onClick={handleExportSubjectsCsvClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Export all current curriculum subjects to CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {subjectImportNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{subjectImportNotice}</span>
            </div>
            <button
              onClick={() => setSubjectImportNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {subjectCsvError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{subjectCsvError}</span>
            </div>
            <button
              onClick={() => setSubjectCsvError(null)}
              className="text-rose-700 hover:text-rose-900 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Add Subject Inline Form */}
        <form onSubmit={handleAddSubject} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Islamic History (Tarikh)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Arabic Name</label>
            <input
              type="text"
              dir="rtl"
              placeholder="التاريخ الإسلامي"
              value={newSubjectArabic}
              onChange={(e) => setNewSubjectArabic(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-arabic text-right"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Course Code</label>
            <input
              type="text"
              required
              placeholder="TRK109"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={newSubjectCategory}
              onChange={(e) => setNewSubjectCategory(e.target.value as Subject['category'])}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="Early Childhood">Early Childhood & Nursery</option>
              <option value="Islamic Studies">Islamic Studies</option>
              <option value="Arabic & Language">Arabic & Language</option>
              <option value="General Sciences">General Sciences & Mathematics</option>
              <option value="Vocational & Arts">Vocational, Social & Creative Arts</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </div>
        </form>

        {/* Subject Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {(['all', 'Early Childhood', 'Islamic Studies', 'Arabic & Language', 'General Sciences', 'Vocational & Arts'] as const).map((cat) => {
            const count = cat === 'all' ? subjects.length : subjects.filter((s) => s.category === cat).length;
            const isSelected = subjectCategoryFilter === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setSubjectCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Subjects' : cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects
            .filter((subj) => subjectCategoryFilter === 'all' || subj.category === subjectCategoryFilter)
            .map((subj) => {
              const catBadge =
                subj.category === 'Early Childhood'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : subj.category === 'Islamic Studies'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : subj.category === 'Arabic & Language'
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : subj.category === 'General Sciences'
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

              return (
                <div
                  key={subj.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-xs truncate">{subj.name}</div>
                    {subj.arabicName && (
                      <div className="text-xs text-emerald-800 font-arabic mt-0.5" dir="rtl">
                        {subj.arabicName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200">
                        {subj.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${catBadge}`}>
                        {subj.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSubject(subj.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Delete subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pending Subject Import Modal */}
      {pendingSubjectImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPendingSubjectImport(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Review & Import Curriculum Subjects</h3>
                <p className="text-xs text-slate-500 font-mono truncate max-w-sm">{pendingSubjectImport.fileName}</p>
              </div>
            </div>

            {/* Data Summary Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xl font-black text-slate-900 font-mono">
                  {pendingSubjectImport.result.validSubjects.length}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Total in CSV
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xl font-black text-emerald-800 font-mono">
                  {pendingSubjectImport.result.newSubjects.length}
                </div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
                  New Subjects
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-xl font-black text-amber-800 font-mono">
                  {pendingSubjectImport.result.existingDuplicates.length}
                </div>
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">
                  Existing Matches
                </div>
              </div>
            </div>

            {/* Import Strategy Selection */}
            <div className="space-y-2 mb-5">
              <label className="block text-xs font-bold text-slate-800">
                Curriculum Import Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  onClick={() => setSubjectImportStrategy('merge')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    subjectImportStrategy === 'merge'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="subjStrategy"
                      checked={subjectImportStrategy === 'merge'}
                      onChange={() => setSubjectImportStrategy('merge')}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold">Append New Only</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Adds {pendingSubjectImport.result.newSubjects.length} new subjects. Keeps existing untouched.
                  </p>
                </div>

                <div
                  onClick={() => setSubjectImportStrategy('update')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    subjectImportStrategy === 'update'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="subjStrategy"
                      checked={subjectImportStrategy === 'update'}
                      onChange={() => setSubjectImportStrategy('update')}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold">Update & Merge</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Updates matching courses and adds new subjects from CSV.
                  </p>
                </div>

                <div
                  onClick={() => setSubjectImportStrategy('replace')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    subjectImportStrategy === 'replace'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="subjStrategy"
                      checked={subjectImportStrategy === 'replace'}
                      onChange={() => setSubjectImportStrategy('replace')}
                      className="text-rose-700 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-900">Replace All</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Replaces all current subjects with the {pendingSubjectImport.result.validSubjects.length} items from CSV.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>Parsed Subjects Preview ({pendingSubjectImport.result.validSubjects.length})</span>
                <span className="text-[11px] font-normal text-slate-500">Includes Arabic names & auto-assigned departments</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-slate-200 font-semibold">Subject Title</th>
                      <th className="p-2 border-b border-slate-200 font-semibold">Arabic</th>
                      <th className="p-2 border-b border-slate-200 font-semibold text-center">Code</th>
                      <th className="p-2 border-b border-slate-200 font-semibold">Department</th>
                      <th className="p-2 border-b border-slate-200 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSubjectImport.result.validSubjects.map((s, idx) => {
                      const isDuplicate = pendingSubjectImport.result.existingDuplicates.some(
                        (d) => d.imported.code === s.code || d.imported.name.toLowerCase() === s.name.toLowerCase()
                      );
                      return (
                        <tr key={idx} className={isDuplicate ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                          <td className="p-2 font-medium text-slate-900">{s.name}</td>
                          <td className="p-2 font-arabic text-emerald-800 font-medium" dir="rtl">
                            {s.arabicName || '—'}
                          </td>
                          <td className="p-2 font-mono text-center font-bold text-slate-700">{s.code}</td>
                          <td className="p-2 text-slate-600 text-[11px]">{s.category}</td>
                          <td className="p-2 text-center">
                            {isDuplicate ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                Existing Match
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                New Course
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingSubjectImport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-import-subjects"
                onClick={handleConfirmSubjectImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  {subjectImportStrategy === 'replace'
                    ? `Replace All (${pendingSubjectImport.result.validSubjects.length} Subjects)`
                    : subjectImportStrategy === 'update'
                    ? `Update & Merge (${pendingSubjectImport.result.validSubjects.length} Subjects)`
                    : `Import New (${pendingSubjectImport.result.newSubjects.length} Subjects)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Subject CSV Modal */}
      {showPasteSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowPasteSubjectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Paste Curriculum CSV Data</h3>
                <p className="text-xs text-slate-500">
                  Paste comma-separated rows directly from Excel, Numbers, or Google Sheets
                </p>
              </div>
            </div>

            <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 mb-1">Standard Header Columns:</div>
              <code className="text-[11px] font-mono text-emerald-900 bg-white px-2 py-1 rounded border border-slate-200 block overflow-x-auto">
                name,arabicName,code,category
              </code>
              <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                <span>Arabic names and course codes will be automatically auto-detected.</span>
                <button
                  type="button"
                  onClick={() => {
                    setPastedSubjectCsvText(
                      `name,arabicName,code,category\nAl-Qur'an & Tajweed,القرآن الكريم والتجويد,QRN101,Islamic Studies\nHadith Studies,الحديث الشريف,HDT102,Islamic Studies\nArabic Grammar,النحو والصرف,ARB103,Arabic & Language\nMathematics,الرياضيات,MTH104,General Sciences\nEnglish Studies,اللغة الإنجليزية,ENG105,Arabic & Language\nCivic & Social Education,التربية الوطنية,CIV106,Vocational & Arts`
                    );
                  }}
                  className="text-emerald-800 hover:underline font-bold text-[11px]"
                >
                  Paste Sample Template
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CSV Text Rows:
              </label>
              <textarea
                rows={8}
                value={pastedSubjectCsvText}
                onChange={(e) => setPastedSubjectCsvText(e.target.value)}
                placeholder={`name,arabicName,code,category\nAl-Qur'an & Tajweed,القرآن الكريم والتجويد,QRN101,Islamic Studies\nMathematics,الرياضيات,MTH108,General Sciences`}
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasteSubjectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-process-pasted-subjects"
                onClick={handleProcessPastedSubjectCsv}
                disabled={!pastedSubjectCsvText.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Parse & Review Subjects</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Backup & State Restore (Export / Import) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application State Backup & Restore (JSON)</h2>
              <p className="text-xs text-slate-500">
                Export and restore the complete system database (students, assessment scores, attendance) as a standard JSON file
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 font-semibold text-[11px] flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5" />
            JSON Backup
          </span>
        </div>

        {/* Notices */}
        {exportNotice && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Export complete!</strong> Your application state JSON backup has been downloaded. You can store it safely or use it to restore data on any device.
            </span>
          </div>
        )}

        {importSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {importError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* 2-Column Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-emerald-700" />
                  Export Application State
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                  EXPORT
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Generates a structured, human-readable JSON backup file containing all registered students, continuous assessment scores, and attendance records.
              </p>

              {/* Current Counts */}
              <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-white border border-slate-200/80 mb-5 text-center shadow-2xs">
                <div>
                  <div className="text-lg font-black text-slate-900">{students.length}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Students</div>
                </div>
                <div className="border-x border-slate-100">
                  <div className="text-lg font-black text-emerald-700">{scores.length}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Scores</div>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{attendance.length}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Attendance</div>
                </div>
              </div>
            </div>

            <button
              id="btn-export-backup-json"
              onClick={handleExportJSON}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              Export Application State (.json)
            </button>
          </div>

          {/* Import Card */}
          <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-blue-700" />
                  Import & Restore Data
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  RESTORE
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Restore student records, examination scores, and attendance from a previously saved JSON file. You will preview records before applying.
              </p>

              {/* Drag & drop upload area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="input-import-json"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  Click to choose JSON file or drag & drop here
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Validates file format before restoring data
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Supports full snapshot or student arrays</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-700 font-semibold hover:underline"
              >
                Browse File
              </button>
            </div>
          </div>
        </div>

        {/* Pending Import Modal / Review Box */}
        {pendingImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setPendingImport(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Review & Restore Backup</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{pendingImport.fileName}</p>
                </div>
              </div>

              {pendingImport.payload.schoolName && (
                <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">Source School / College:</div>
                  <div className="font-medium text-slate-700">{pendingImport.payload.schoolName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Exported: {new Date(pendingImport.payload.exportedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Data Summary */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-center">
                  <div className="text-xl font-bold text-emerald-800">{pendingImport.studentCount}</div>
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Students</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 text-center">
                  <div className="text-xl font-bold text-blue-800">{pendingImport.scoreCount}</div>
                  <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Scores</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-center">
                  <div className="text-xl font-bold text-amber-800">{pendingImport.attendanceCount}</div>
                  <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Attendance</div>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Select Restore Strategy:
                </label>
                <div
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    importMode === 'replace'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-emerald-700 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Full Restore (Replace Current Records)
                    </div>
                    <div className="text-[11px] text-slate-500 leading-normal">
                      Replaces existing students, scores, and attendance with the exact records from this backup file. Recommended for complete state restore.
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    importMode === 'merge'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-emerald-700 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Merge (Append New Records Without Duplicates)
                    </div>
                    <div className="text-[11px] text-slate-500 leading-normal">
                      Keeps all existing registered students and imports additional students, scores, or attendance records from the backup.
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-import-data"
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Restore Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Reset & Data Management */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Database & Demo Seed Reset</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Restore initial Kulliyyat school setup, sample students, classes, and assessment scores.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset database back to initial seed data?')) {
              onResetData();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore Initial Data
        </button>
      </div>

      {/* System Architecture & Developer Credits */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-bold text-slate-900 block text-sm">System Engineering & Software Development</span>
          <p className="text-slate-700 text-[11px] mt-0.5">
            All rights reserved by <strong className="text-slate-900 font-bold">Danmari brothers Ventures LLC</strong>
          </p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Address: A23 Aliyu makama road barnawa Kaduna, Nigeria • <strong className="text-emerald-900 font-bold">Made in Nigeria 🇳🇬</strong>
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-semibold">
            Super Admin: musteegunners@gmail.com
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Danmari brothers Ventures LLC</span>
        </div>
      </div>
    </div>
  );
};
