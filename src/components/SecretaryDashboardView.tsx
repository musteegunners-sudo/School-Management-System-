import React, { useState, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  SchoolProfile,
  AuthUser,
  SchoolAnnouncement,
  AnnouncementCategory,
  AnnouncementPriority,
} from '../types';
import {
  UserCheck,
  UserPlus,
  GraduationCap,
  Search,
  Filter,
  Calendar,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  Lock,
  ShieldCheck,
  Megaphone,
  Bell,
  Pin,
  KeyRound,
  Send,
  Camera,
  X,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  Keyboard,
  Check,
  Copy,
  ChevronRight,
  School,
  ExternalLink,
} from 'lucide-react';
import { StudentPhotoCaptureModal } from './StudentPhotoCaptureModal';
import { useArabicKeyboard } from '../context/ArabicKeyboardContext';
import { ACADEMIC_YEAR_OPTIONS } from './StudentRegistrationView';

interface SecretaryDashboardViewProps {
  students: Student[];
  classes: SchoolClass[];
  schoolProfile: SchoolProfile;
  currentUser: AuthUser | null;
  announcements: SchoolAnnouncement[];
  onAddStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => Student | void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectForReport?: (studentId: string) => void;
  onSaveAnnouncement: (announcement: SchoolAnnouncement) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
  onNavigateToStudentDashboard?: (studentId: string) => void;
}

export const SecretaryDashboardView: React.FC<SecretaryDashboardViewProps> = ({
  students,
  classes,
  schoolProfile,
  currentUser,
  announcements,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectForReport,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onNavigateToStudentDashboard,
}) => {
  const { openKeyboard, toggleKeyboard, isOpen: isArabicKbOpen } = useArabicKeyboard();

  const [activeTab, setActiveTab] = useState<'students' | 'quotas' | 'announcements' | 'credentials'>('students');

  // Filter & Search states for Student Registry
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'Male' | 'Female'>('ALL');

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<'create' | 'edit'>('create');

  // Admission Letter Modal
  const [admissionLetterStudent, setAdmissionLetterStudent] = useState<Student | null>(null);

  // Credentials Dispatch Modal
  const [credentialsModalStudent, setCredentialsModalStudent] = useState<{
    student: Student;
    pin: string;
  } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Announcement Modal
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Student Form State
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [sequenceNum, setSequenceNum] = useState('0001');
  const [regNo, setRegNo] = useState('KUL-2026-0001');
  const [fullName, setFullName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('2011-05-15');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [portalPin, setPortalPin] = useState<string>(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annArabicTitle, setAnnArabicTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<AnnouncementCategory>('General');
  const [annPriority, setAnnPriority] = useState<AnnouncementPriority>('normal');
  const [annTargetAudience, setAnnTargetAudience] = useState<'All' | 'Students & Parents' | 'Parents Only' | 'Tahfiz Students'>('Students & Parents');
  const [annContent, setAnnContent] = useState('');
  const [annArabicContent, setAnnArabicContent] = useState('');
  const [annIsPinned, setAnnIsPinned] = useState(false);

  // Auto-generate next sequence for year
  const getNextSequenceForYear = (yearStr: string, currentStudents: Student[], excludeId?: string): string => {
    const yearCode = yearStr.split('/')[0] || yearStr;
    const prefix = `KUL-${yearCode}-`;
    const relevant = currentStudents.filter(
      (s) => s.id !== excludeId && (s.regNo.startsWith(prefix) || s.academicYear === yearStr)
    );
    return String(relevant.length + 1).padStart(4, '0');
  };

  const handleYearChange = (newYear: string) => {
    setAcademicYear(newYear);
    const yearCode = newYear.split('/')[0] || newYear;
    const nextSeq = getNextSequenceForYear(newYear, students, editingStudent?.id);
    setSequenceNum(nextSeq);
    setRegNo(`KUL-${yearCode}-${nextSeq}`);
  };

  const handleSequenceChange = (newSeq: string) => {
    const cleaned = newSeq.replace(/\D/g, '').slice(0, 5);
    setSequenceNum(cleaned);
    const yearCode = academicYear.split('/')[0] || academicYear;
    setRegNo(`KUL-${yearCode}-${cleaned.padStart(4, '0')}`);
  };

  const openAddStudentModal = () => {
    setEditingStudent(null);
    const defaultYear = '2026/2027';
    setAcademicYear(defaultYear);
    const yearCode = defaultYear.split('/')[0];
    const nextSeq = getNextSequenceForYear(defaultYear, students);
    setSequenceNum(nextSeq);
    setRegNo(`KUL-${yearCode}-${nextSeq}`);
    setFullName('');
    setArabicName('');
    setGender('Male');
    setDob('2011-05-15');
    setClassId(classes[0]?.id || '');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setPhotoUrl('');
    setPortalPin(Math.floor(100000 + Math.random() * 900000).toString());
    setIsStudentModalOpen(true);
  };

  const openEditStudentModal = (student: Student) => {
    setEditingStudent(student);
    const detectedYear = student.academicYear || '2026/2027';
    setAcademicYear(detectedYear);
    setRegNo(student.regNo);

    const match = student.regNo.match(/KUL-(\d{4})-(\d+)/i);
    if (match) {
      setSequenceNum(match[2]);
    } else {
      setSequenceNum('0001');
    }

    setFullName(student.fullName);
    setArabicName(student.arabicName || '');
    setGender(student.gender);
    setDob(student.dob);
    setClassId(student.classId);
    setGuardianName(student.guardianName);
    setGuardianPhone(student.guardianPhone);
    setAddress(student.address);
    setPhotoUrl(student.photoUrl || '');
    setPortalPin(student.pin || student.password || Math.floor(100000 + Math.random() * 900000).toString());
    setIsStudentModalOpen(true);
  };

  const handleStudentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regNo.trim()) return;

    if (editingStudent) {
      const updatedStudent: Student = {
        ...editingStudent,
        regNo: regNo.trim(),
        fullName: fullName.trim(),
        arabicName: arabicName.trim() || undefined,
        gender,
        dob,
        classId,
        academicYear,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        address: address.trim(),
        photoUrl: photoUrl || undefined,
        pin: portalPin || editingStudent.pin,
        password: portalPin || editingStudent.password,
      };
      onUpdateStudent(updatedStudent);
      setIsStudentModalOpen(false);
    } else {
      const generatedPin = portalPin || Math.floor(100000 + Math.random() * 900000).toString();
      const newStudentPayload = {
        regNo: regNo.trim(),
        fullName: fullName.trim(),
        arabicName: arabicName.trim() || undefined,
        gender,
        dob,
        classId,
        academicYear,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        address: address.trim(),
        photoUrl: photoUrl || undefined,
        pin: generatedPin,
        password: generatedPin,
        hasSetPassword: false,
      };
      const created = onAddStudent(newStudentPayload);
      setIsStudentModalOpen(false);

      if (created) {
        setCredentialsModalStudent({
          student: created,
          pin: generatedPin,
        });
      }
    }
  };

  // Announcement Handlers
  const openCreateAnnouncementModal = () => {
    setEditingAnnouncement(null);
    setAnnTitle('');
    setAnnArabicTitle('');
    setAnnCategory('General');
    setAnnPriority('normal');
    setAnnTargetAudience('Students & Parents');
    setAnnContent('');
    setAnnArabicContent('');
    setAnnIsPinned(false);
    setIsAnnouncementModalOpen(true);
  };

  const openEditAnnouncementModal = (ann: SchoolAnnouncement) => {
    setEditingAnnouncement(ann);
    setAnnTitle(ann.title);
    setAnnArabicTitle(ann.arabicTitle || '');
    setAnnCategory(ann.category);
    setAnnPriority(ann.priority);
    setAnnTargetAudience(ann.targetAudience);
    setAnnContent(ann.content);
    setAnnArabicContent(ann.arabicContent || '');
    setAnnIsPinned(Boolean(ann.isPinned));
    setIsAnnouncementModalOpen(true);
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const payload: SchoolAnnouncement = {
      id: editingAnnouncement ? editingAnnouncement.id : `ann_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: annTitle.trim(),
      arabicTitle: annArabicTitle.trim() || undefined,
      category: annCategory,
      priority: annPriority,
      targetAudience: annTargetAudience,
      content: annContent.trim(),
      arabicContent: annArabicContent.trim() || undefined,
      authorName: currentUser?.name || 'Malama Fatima Umar',
      authorRole: currentUser?.title || 'School Secretary & Admissions Registrar',
      publishedDate: editingAnnouncement?.publishedDate || new Date().toISOString().split('T')[0],
      isPinned: annIsPinned,
      createdAt: editingAnnouncement?.createdAt || new Date().toISOString(),
    };

    onSaveAnnouncement(payload);
    setIsAnnouncementModalOpen(false);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.arabicName && s.arabicName.includes(searchTerm)) ||
        s.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardianPhone.includes(searchTerm);

      const matchClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
      const matchYear = selectedYearFilter === 'ALL' || s.academicYear === selectedYearFilter;
      const matchGender = selectedGenderFilter === 'ALL' || s.gender === selectedGenderFilter;

      return matchSearch && matchClass && matchYear && matchGender;
    });
  }, [students, searchTerm, selectedClassFilter, selectedYearFilter, selectedGenderFilter]);

  // Key Statistics
  const maleCount = students.filter((s) => s.gender === 'Male').length;
  const femaleCount = students.filter((s) => s.gender === 'Female').length;
  const currentSessionAdmissions = students.filter((s) => s.academicYear === '2026/2027').length;
  const totalCapacity = classes.length * 35; // benchmark capacity
  const occupancyPercentage = Math.min(100, Math.round((students.length / Math.max(1, totalCapacity)) * 100));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Official Secretary Mandate Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        {/* Background Islamic Watermark Pattern */}
        <div
          className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-center font-arabic text-8xl select-none"
          dir="rtl"
        >
          أمانة السر
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg border-2 border-amber-300/40 shrink-0">
              <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  SEC-2026-001 • MANDATED DESK
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Student Admissions Authority</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
                <span>Office of the School Secretary & Admissions Registrar</span>
                <span className="text-amber-300 text-lg sm:text-xl font-arabic font-normal" dir="rtl">
                  (مكتب أمانة السر وشؤون القبول)
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200/80 pt-0.5">
                <span className="font-semibold text-emerald-100">
                  Officer in Charge: {currentUser?.name || 'Malama Fatima Umar'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{schoolProfile.name}</span>
                </span>
                <span>•</span>
                <span className="text-slate-300">{schoolProfile.address || 'Kasuwan Magani Campus'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-secretary-register-student"
              onClick={openAddStudentModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Register New Student</span>
            </button>

            <button
              type="button"
              id="btn-secretary-post-announcement"
              onClick={openCreateAnnouncementModal}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-600/50 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-300" />
              <span>Broadcast Notice</span>
            </button>

            <button
              type="button"
              id="btn-secretary-arabic-keyboard"
              onClick={toggleKeyboard}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                isArabicKbOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Toggle Arabic Virtual Keyboard"
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Arabic Keyboard</span>
              <span className="font-arabic text-xs font-normal" dir="rtl">(عربي)</span>
            </button>
          </div>
        </div>

        {/* Mandate Summary Footnote */}
        <div className="relative z-10 mt-5 pt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Administrative Mandate:</strong> Centralized management of student admissions, registry records, guardian clearances, and official notifications for students and parents.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300">
            <span>Session: 2026/2027</span>
            <span>•</span>
            <span>Portal Sync: Active ✅</span>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students Enrolled */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled Students
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {students.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700">active records</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
            <span>👦 Boys: <strong className="text-slate-800">{maleCount}</strong></span>
            <span>👧 Girls: <strong className="text-slate-800">{femaleCount}</strong></span>
          </div>
        </div>

        {/* 2026/2027 Intake */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              2026/2027 Admissions
            </span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
              {currentSessionAdmissions}
            </span>
            <span className="text-xs font-semibold text-slate-400">new candidates</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold pt-1">
            ✓ Registration desk ongoing
          </div>
        </div>

        {/* Capacity & Quotas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Class Capacity & Quotas
            </span>
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
              {occupancyPercentage}%
            </span>
            <span className="text-xs font-bold text-slate-400">
              {students.length}/{totalCapacity} seats
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Parent & Student Broadcasts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              School Announcements
            </span>
            <Megaphone className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {announcements.length}
            </span>
            <span className="text-xs font-semibold text-rose-700">active circulars</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            <span>Broadcasts live on Student Portal</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          {
            id: 'students',
            label: `Student Registration & Registry (${students.length})`,
            icon: Users,
            badge: 'Mandated',
          },
          {
            id: 'quotas',
            label: `Class Quotas & Enrollment (${classes.length} Classes)`,
            icon: BookOpen,
          },
          {
            id: 'announcements',
            label: `Parent & Student Announcements (${announcements.length})`,
            icon: Megaphone,
            badge: announcements.some((a) => a.priority === 'urgent') ? 'Urgent' : undefined,
          },
          {
            id: 'credentials',
            label: 'Portal Credentials Dispatch',
            icon: KeyRound,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-secretary-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {(tab as any).badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                    isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {(tab as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENT REGISTRATION & ENROLLED REGISTRY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="secretary-student-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, Arabic name, Reg No, or phone..."
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => openKeyboard('secretary-student-search')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700"
                  title="Arabic Keyboard for student search"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-secretary-add-new-student-bar"
                  onClick={openAddStudentModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Register Candidate</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Roster</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Class Filter */}
              <select
                id="secretary-filter-class"
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Classes ({students.length})</option>
                {classes.map((cls) => {
                  const count = students.filter((s) => s.classId === cls.id).length;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Year Filter */}
              <select
                id="secretary-filter-year"
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Academic Years</option>
                {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              {/* Gender Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                {(['ALL', 'Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenderFilter(g)}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      selectedGenderFilter === g
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {g === 'ALL' ? 'All' : g === 'Male' ? 'Boys' : 'Girls'}
                  </button>
                ))}
              </div>

              {(searchTerm || selectedClassFilter !== 'ALL' || selectedYearFilter !== 'ALL' || selectedGenderFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedClassFilter('ALL');
                    setSelectedYearFilter('ALL');
                    setSelectedGenderFilter('ALL');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline ml-auto"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Student Table / Roster */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No student registration records match your filter.</h3>
              <p className="text-xs text-slate-400">
                You can add a candidate to the official school roster using the registration button above.
              </p>
              <button
                type="button"
                onClick={openAddStudentModal}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Student Now</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Candidate & Arabic Name</th>
                      <th className="py-3 px-2.5">Reg Number</th>
                      <th className="py-3 px-2.5">Class / Section</th>
                      <th className="py-3 px-2.5">Year of Entry</th>
                      <th className="py-3 px-3">Guardian & Phone</th>
                      <th className="py-3 px-2.5 text-center">Portal PIN</th>
                      <th className="py-3 px-3 text-right">Mandated Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((std) => {
                      const studentClass = classes.find((c) => c.id === std.classId);
                      return (
                        <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Candidate Name & Photo */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300/40">
                                {std.photoUrl ? (
                                  <img
                                    src={std.photoUrl}
                                    alt={std.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{std.fullName.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{std.fullName}</div>
                                {std.arabicName && (
                                  <div className="text-[11px] font-arabic font-normal text-emerald-800" dir="rtl">
                                    {std.arabicName}
                                  </div>
                                )}
                                <span className="text-[10px] text-slate-400">Gender: {std.gender}</span>
                              </div>
                            </div>
                          </td>

                          {/* Reg Number */}
                          <td className="py-3 px-2.5">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
                              {std.regNo}
                            </span>
                          </td>

                          {/* Class */}
                          <td className="py-3 px-2.5">
                            <span className="font-semibold text-slate-800">
                              {studentClass?.name || 'Unassigned'}
                            </span>
                            <div className="text-[10px] text-slate-400">{studentClass?.category}</div>
                          </td>

                          {/* Year of Entry */}
                          <td className="py-3 px-2.5 text-slate-600 font-medium">
                            {std.academicYear || '2026/2027'}
                          </td>

                          {/* Guardian & Contact */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{std.guardianName || 'Guardian'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={`tel:${std.guardianPhone}`}
                                className="text-[11px] font-mono text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{std.guardianPhone}</span>
                              </a>
                              {std.guardianPhone && (
                                <a
                                  href={`https://wa.me/${std.guardianPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Assalamu Alaikum ${std.guardianName}, this is the Office of the School Secretary at Kulliyyat Tatbiq at-Ta'alim al-Islamiyyah regarding your ward ${std.fullName} (${std.regNo}).`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-bold"
                                  title="Chat via WhatsApp"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Portal PIN */}
                          <td className="py-3 px-2.5 text-center">
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {std.pin || std.password || '••••••'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Official Admission Slip */}
                              <button
                                type="button"
                                onClick={() => setAdmissionLetterStudent(std)}
                                className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                                title="Official Admission Confirmation Letter / Slip"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Credentials Dispatch */}
                              <button
                                type="button"
                                onClick={() =>
                                  setCredentialsModalStudent({
                                    student: std,
                                    pin: std.pin || std.password || '202601',
                                  })
                                }
                                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors"
                                title="Dispatch Student Credentials to Parent"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Student Dashboard */}
                              {onNavigateToStudentDashboard && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToStudentDashboard(std.id)}
                                  className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors"
                                  title="Inspect Student Portal"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Student */}
                              <button
                                type="button"
                                onClick={() => openEditStudentModal(std)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="Edit Candidate Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Student */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete ${std.fullName} (${std.regNo}) from the school registry? This action is permanent.`
                                    )
                                  ) {
                                    onDeleteStudent(std.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* TAB 2: CLASS ENROLLMENT QUOTAS & CAPACITY */}
      {activeTab === 'quotas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <h3 className="font-bold text-sm text-slate-900">
              Class Enrollment Capacity & Roster Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Monitor classroom vacancy, gender distribution, and form teacher assignments across all nursery, primary, tahfiz, and secondary levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const enrolledStudents = students.filter((s) => s.classId === cls.id);
              const boys = enrolledStudents.filter((s) => s.gender === 'Male').length;
              const girls = enrolledStudents.filter((s) => s.gender === 'Female').length;
              const targetCapacity = 35;
              const percentage = Math.min(100, Math.round((enrolledStudents.length / targetCapacity) * 100));
              const availableSeats = Math.max(0, targetCapacity - enrolledStudents.length);

              return (
                <div
                  key={cls.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900">
                        {cls.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Section {cls.section}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                      <span>{cls.name}</span>
                      <span className="font-mono text-emerald-900 text-xs">
                        {enrolledStudents.length} / {targetCapacity}
                      </span>
                    </h4>

                    {cls.classTeacher && (
                      <div className="text-[11px] text-slate-500">
                        Form Teacher: <strong className="text-slate-800">{cls.classTeacher}</strong>
                      </div>
                    )}

                    {/* Capacity Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 95
                            ? 'bg-rose-500'
                            : percentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{percentage}% Occupied</span>
                      <span className="font-semibold text-emerald-800">
                        {availableSeats > 0 ? `${availableSeats} seats vacant` : 'Full capacity'}
                      </span>
                    </div>

                    {/* Gender Breakdown */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>👦 Boys: <strong>{boys}</strong></span>
                      <span>👧 Girls: <strong>{girls}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassFilter(cls.id);
                        setActiveTab('students');
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <span>View Roster ({enrolledStudents.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openAddStudentModal();
                        setClassId(cls.id);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      + Enroll Candidate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: OFFICIAL SCHOOL ANNOUNCEMENTS DESK (FOR STUDENTS & PARENTS) */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Official School Circulars & Bulletins Desk</span>
                <span className="font-arabic text-emerald-800 text-xs" dir="rtl">(نشرات وإعلانات أولياء الأمور)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Draft, pin, and broadcast terminal circulars, exam notifications, and bursary updates directly to the Student & Parent Portal.
              </p>
            </div>

            <button
              type="button"
              id="btn-secretary-compose-notice"
              onClick={openCreateAnnouncementModal}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-300" />
              <span>Draft New Announcement</span>
            </button>
          </div>

          {/* Announcements List */}
          {announcements.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">No active circulars broadcasted yet.</h4>
              <p className="text-xs">Publish your first announcement for students and parents using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 sm:p-5 rounded-2xl border shadow-2xs transition-all space-y-3 flex flex-col justify-between ${
                    ann.isPinned
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-white border-slate-200/90 hover:border-emerald-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-200 text-amber-950 flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Pinned</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            ann.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ann.priority === 'urgent' ? '🚨 Urgent' : ann.priority === 'important' ? 'Important' : 'Normal'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-900">
                          {ann.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">{ann.publishedDate}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{ann.title}</h4>
                      {ann.arabicTitle && (
                        <div className="text-xs font-arabic font-bold text-emerald-800 mt-0.5" dir="rtl">
                          {ann.arabicTitle}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

                    {ann.arabicContent && (
                      <div
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-arabic text-emerald-950 leading-relaxed"
                        dir="rtl"
                      >
                        {ann.arabicContent}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-2">
                      <span>Audience: <strong>{ann.targetAudience}</strong></span>
                      <span>•</span>
                      <span>Author: {ann.authorName} ({ann.authorRole})</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const updated: SchoolAnnouncement = {
                          ...ann,
                          isPinned: !ann.isPinned,
                        };
                        onSaveAnnouncement(updated);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <Pin className="w-3 h-3 text-amber-600" />
                      <span>{ann.isPinned ? 'Unpin' : 'Pin to Top'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditAnnouncementModal(ann)}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete circular "${ann.title}"?`)) {
                            onDeleteAnnouncement(ann.id);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PORTAL CREDENTIALS DISPATCH */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Student Portal Access Credentials Dispatch Desk</span>
            </h3>
            <p className="text-xs text-slate-500">
              Disseminate student login credentials (Registration Number & 6-digit Portal Access PIN) to parents via SMS, WhatsApp, or official slip.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-2.5">Reg Number</th>
                    <th className="py-3 px-2.5">Class</th>
                    <th className="py-3 px-3">Guardian Name & Phone</th>
                    <th className="py-3 px-2.5 text-center">Portal PIN</th>
                    <th className="py-3 px-3 text-right">Quick Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((std) => {
                    const studentClass = classes.find((c) => c.id === std.classId);
                    const currentPin = std.pin || std.password || '202601';
                    const dispatchMessage = `Assalamu Alaikum ${std.guardianName || 'Guardian'}, this is the Office of the Registrar at Kulliyyat Tatbiq at-Ta'alim al-Islamiyyah.
Your ward ${std.fullName} has been enrolled in ${studentClass?.name || 'Class'}.
Portal Reg Number: ${std.regNo}
Portal Secret PIN: ${currentPin}
Please keep these details secure to access terminal examination reports and official notices.`;

                    return (
                      <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {std.fullName}
                          {std.arabicName && (
                            <span className="text-[11px] font-arabic font-normal text-emerald-800 ml-2" dir="rtl">
                              ({std.arabicName})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 font-mono text-emerald-900 font-bold">
                          {std.regNo}
                        </td>
                        <td className="py-3 px-2.5 font-semibold text-slate-700">
                          {studentClass?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{std.guardianName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{std.guardianPhone}</div>
                        </td>
                        <td className="py-3 px-2.5 text-center">
                          <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200">
                            {currentPin}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(dispatchMessage)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1"
                              title="Copy SMS/Text Template"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Text</span>
                            </button>

                            {std.guardianPhone && (
                              <a
                                href={`https://wa.me/${std.guardianPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  dispatchMessage
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                                title="Send via WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Message copied to clipboard!</span>
        </div>
      )}

      {/* STUDENT REGISTRATION / EDIT MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Office of the School Secretary • Official Enrolment
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {editingStudent ? 'Edit Candidate Enrollment Record' : 'Register New Student (تسجيل طالب جديد)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentFormSubmit} className="space-y-4">
              {/* Photo & Identity Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="relative w-20 h-20 rounded-2xl bg-emerald-700 text-white font-bold text-2xl flex items-center justify-center overflow-hidden border-2 border-emerald-500/40 shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{fullName.charAt(0) || 'S'}</span>
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-slate-800">Student Passport Photo</div>
                  <p className="text-[11px] text-slate-500">
                    Capture via webcam or upload image for official school badge and terminal report card.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoTarget(editingStudent ? 'edit' : 'create');
                        setIsPhotoModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-emerald-900"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take / Upload Photo</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Year & Sequence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Session of Entry
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} Session
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sequence Number
                  </label>
                  <input
                    type="text"
                    value={sequenceNum}
                    onChange={(e) => handleSequenceChange(e.target.value)}
                    maxLength={5}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Reg Number
                  </label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-black text-emerald-900 bg-emerald-50/70 rounded-xl border border-emerald-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Zuhriyya Nura"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Arabic Name (الاسم بالعربية)
                    </label>
                    <button
                      type="button"
                      onClick={() => openKeyboard('secretary-modal-arabic-name')}
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Keyboard className="w-3 h-3" />
                      <span>Arabic KB</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    id="secretary-modal-arabic-name"
                    value={arabicName}
                    onChange={(e) => setArabicName(e.target.value)}
                    placeholder="مثال: زهرية نورا"
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs font-arabic rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Class, Gender, DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Enrolled <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.section})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Male">Male (ذكر)</option>
                    <option value="Female">Female (أنثى)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian / Parent Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Mallam Nura Abubakar"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Address & Portal PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Home Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Kasuwan Magani, Kaduna"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Portal PIN (6 Digits)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={portalPin}
                      onChange={(e) => setPortalPin(e.target.value)}
                      maxLength={8}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPortalPin(Math.floor(100000 + Math.random() * 900000).toString())
                      }
                      className="px-2.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 shrink-0"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
                >
                  {editingStudent ? 'Save Modifications' : 'Confirm Registration & Issue PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PHOTO CAPTURE MODAL */}
      {isPhotoModalOpen && (
        <StudentPhotoCaptureModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onPhotoCaptured={(photo) => {
            setPhotoUrl(photo);
            setIsPhotoModalOpen(false);
          }}
          studentName={fullName || 'Student'}
        />
      )}

      {/* OFFICIAL ADMISSION LETTER & CLEARANCE SLIP MODAL */}
      {admissionLetterStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Official College Document • Office of Admissions</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Admission Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdmissionLetterStudent(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Admission Certificate Paper */}
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-emerald-900/40 bg-radial from-white to-emerald-50/20 space-y-6 text-slate-900">
              {/* College Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-emerald-900/30">
                <div className="font-arabic text-xl sm:text-2xl font-bold text-emerald-950" dir="rtl">
                  {schoolProfile.arabicName}
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                  {schoolProfile.name}
                </h2>
                <p className="text-xs text-slate-600 italic font-serif">{schoolProfile.motto}</p>
                <div className="text-[11px] text-slate-500">
                  {schoolProfile.address || 'Kasuwan Magani Campus'} • Phone: {schoolProfile.phone}
                </div>
              </div>

              {/* Title Badge */}
              <div className="text-center">
                <span className="inline-block px-4 py-1 rounded-full bg-emerald-900 text-white font-black text-xs uppercase tracking-widest">
                  OFFICIAL ADMISSION CONFIRMATION & REGISTRATION SLIP
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  REF: ADM/{admissionLetterStudent.academicYear?.replace('/', '-') || '2026-2027'}/{admissionLetterStudent.regNo}
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border-2 border-emerald-700 text-emerald-900 font-bold flex items-center justify-center mx-auto sm:mx-0">
                  {admissionLetterStudent.photoUrl ? (
                    <img
                      src={admissionLetterStudent.photoUrl}
                      alt={admissionLetterStudent.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{admissionLetterStudent.fullName.charAt(0)}</span>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-1 text-xs">
                  <div>
                    <span className="text-slate-400">Student Name:</span>{' '}
                    <strong className="text-sm text-slate-900">{admissionLetterStudent.fullName}</strong>
                  </div>
                  {admissionLetterStudent.arabicName && (
                    <div className="font-arabic text-sm font-bold text-emerald-900" dir="rtl">
                      {admissionLetterStudent.arabicName}
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Official Reg No:</span>{' '}
                    <strong className="font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {admissionLetterStudent.regNo}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned Class:</span>{' '}
                    <strong>
                      {classes.find((c) => c.id === admissionLetterStudent.classId)?.name || 'Class'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Guardian Name:</span>{' '}
                    <strong>{admissionLetterStudent.guardianName}</strong> ({admissionLetterStudent.guardianPhone})
                  </div>
                </div>
              </div>

              {/* Official Mandate Wording */}
              <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                <p>
                  This is to certify that <strong>{admissionLetterStudent.fullName}</strong> has fulfilled the admission requirements of Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah and has been duly matriculated for the <strong>{admissionLetterStudent.academicYear || '2026/2027'}</strong> Academic Session.
                </p>
                <p>
                  The candidate and guardians are required to maintain strict adherence to college regulations, regular class attendance, and ethical Islamic etiquette.
                </p>
              </div>

              {/* Portal Login Credentials Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Student Portal Access Credentials:</span>
                  <div className="text-[11px] text-slate-500">
                    Use these credentials to view terminal report cards and CBT examination schedules.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Reg ID</span>
                    <strong className="font-mono text-slate-900">{admissionLetterStudent.regNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Access PIN</span>
                    <strong className="font-mono text-amber-900 font-bold">
                      {admissionLetterStudent.pin || admissionLetterStudent.password || '202601'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                <div className="space-y-1">
                  <div className="font-serif italic text-emerald-900 font-bold">
                    Malama Fatima Umar
                  </div>
                  <div className="h-0.5 w-32 bg-slate-300 mx-auto" />
                  <div className="font-bold text-slate-800">School Secretary & Registrar</div>
                  <div className="text-[10px] text-slate-400">Admissions Mandate Authority</div>
                </div>

                <div className="space-y-1">
                  <div className="font-serif italic text-emerald-900 font-bold">
                    {schoolProfile.mudirName || 'Principal Abubakar Alhassan'}
                  </div>
                  <div className="h-0.5 w-32 bg-slate-300 mx-auto" />
                  <div className="font-bold text-slate-800">Principal / Mudir</div>
                  <div className="text-[10px] text-slate-400">Kulliyyat Tatbiq Complex</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS DISPATCH MODAL (FOR SINGLE CANDIDATE) */}
      {credentialsModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Portal Credentials Issued</h3>
                  <span className="text-[11px] text-slate-400">Ready to dispatch to parent</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsModalStudent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Student:</span>{' '}
                <strong className="text-slate-900">{credentialsModalStudent.student.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Registration Number:</span>{' '}
                <strong className="font-mono text-emerald-900">{credentialsModalStudent.student.regNo}</strong>
              </div>
              <div>
                <span className="text-slate-400">Secret Portal Access PIN:</span>{' '}
                <strong className="font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  {credentialsModalStudent.pin}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Guardian Contact:</span>{' '}
                <strong>{credentialsModalStudent.student.guardianName}</strong> ({credentialsModalStudent.student.guardianPhone})
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `Assalamu Alaikum ${credentialsModalStudent.student.guardianName},
Your ward ${credentialsModalStudent.student.fullName} has been registered at Kulliyyat Tatbiq at-Ta'alim al-Islamiyyah.
Portal Reg Number: ${credentialsModalStudent.student.regNo}
Portal PIN: ${credentialsModalStudent.pin}
Please keep this PIN secure.`;
                  copyToClipboard(msg);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Credentials Message</span>
              </button>

              {credentialsModalStudent.student.guardianPhone && (
                <a
                  href={`https://wa.me/${credentialsModalStudent.student.guardianPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Assalamu Alaikum ${credentialsModalStudent.student.guardianName}, your ward ${credentialsModalStudent.student.fullName} is registered at Kulliyyat Tatbiq. Reg No: ${credentialsModalStudent.student.regNo}, PIN: ${credentialsModalStudent.pin}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Directly via WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT DRAFT / EDIT MODAL */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Broadcast Notice Desk • Students & Parents
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {editingAnnouncement ? 'Edit Circular Notice' : 'Draft New School Announcement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              {/* Category, Priority, Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="General">General Notice</option>
                    <option value="Examination">Examination & CBT</option>
                    <option value="Fees & Bursary">Fees & Bursary Clearance</option>
                    <option value="Holiday">Vacation & Resumption</option>
                    <option value="Tahfiz & Islamic">Tahfiz & Muraja'ah</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="normal">Normal (عادي)</option>
                    <option value="important">Important (هام)</option>
                    <option value="urgent">Urgent / Red Banner (عاجل)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={annTargetAudience}
                    onChange={(e) => setAnnTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Students & Parents">Students & Parents (الطلاب وأولياء الأمور)</option>
                    <option value="Parents Only">Parents Only (أولياء الأمور فقط)</option>
                    <option value="Tahfiz Students">Tahfiz Students (طلاب التحفيظ)</option>
                    <option value="All">All School (الجميع)</option>
                  </select>
                </div>
              </div>

              {/* Title & Arabic Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Announcement Title (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Third Term CBT Examination Schedule"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Arabic Title (عنوان الإعلان بالعربية)
                    </label>
                    <button
                      type="button"
                      onClick={() => openKeyboard('secretary-ann-arabic-title')}
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Keyboard className="w-3 h-3" />
                      <span>Arabic KB</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    id="secretary-ann-arabic-title"
                    value={annArabicTitle}
                    onChange={(e) => setAnnArabicTitle(e.target.value)}
                    placeholder="مثال: جدول الاختبارات النهائية للفصل الثالث"
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs font-arabic rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Circular Content (English) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Provide complete instructions, dates, guidelines for students and parents..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Arabic Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Arabic Content (نص الإعلان بالعربية)
                  </label>
                  <button
                    type="button"
                    onClick={() => openKeyboard('secretary-ann-arabic-content')}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Keyboard className="w-3 h-3" />
                    <span>Arabic KB</span>
                  </button>
                </div>
                <textarea
                  id="secretary-ann-arabic-content"
                  value={annArabicContent}
                  onChange={(e) => setAnnArabicContent(e.target.value)}
                  rows={3}
                  dir="rtl"
                  placeholder="اكتب تفاصيل الإعلان والتوجيهات لأولياء الأمور باللغة العربية..."
                  className="w-full px-3 py-2 text-xs font-arabic rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Pinned Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="secretary-ann-pin"
                  checked={annIsPinned}
                  onChange={(e) => setAnnIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="secretary-ann-pin" className="text-xs font-bold text-slate-800 cursor-pointer">
                  📌 Pin to Top Banner of Student Portal
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
                >
                  {editingAnnouncement ? 'Save Modifications' : 'Broadcast to Student Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
