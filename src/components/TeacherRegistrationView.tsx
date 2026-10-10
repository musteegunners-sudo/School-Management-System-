import React, { useState, useMemo } from 'react';
import { Teacher, SchoolClass, Subject } from '../types';
import {
  UserCheck,
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Award,
  Sparkles,
  Layers,
  KeyRound,
  Smartphone,
  Send,
  MessageSquare,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface TeacherRegistrationViewProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  currentUserRole?: string;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export const TeacherRegistrationView: React.FC<TeacherRegistrationViewProps> = ({
  teachers,
  classes,
  subjects,
  currentUserRole,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectModalCategoryFilter, setSubjectModalCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Mandate: Teacher registration & designation is mandated for Principal only
  const isPrincipal = currentUserRole === 'super_admin';

  // Success alert
  const [notification, setNotification] = useState<string | null>(null);

  // Teacher credentials modal state (shown immediately upon registration or on clicking Send Details)
  const [credentialsModalTeacher, setCredentialsModalTeacher] = useState<{
    teacher: Teacher;
    initialPin?: string;
  } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to generate next Staff ID: TCH-YYYY-001
  const nextStaffId = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const existingIds = teachers
      .map((t) => t.staffId)
      .filter((id) => id.startsWith(`TCH-${currentYear}`))
      .map((id) => {
        const parts = id.split('-');
        return parseInt(parts[2], 10) || 0;
      });
    const max = existingIds.length > 0 ? Math.max(...existingIds) : teachers.length;
    const nextNum = (max + 1).toString().padStart(3, '0');
    return `TCH-${currentYear}-${nextNum}`;
  }, [teachers]);

  // Form state
  const [formData, setFormData] = useState<{
    staffId: string;
    fullName: string;
    arabicName: string;
    gender: 'Male' | 'Female';
    qualification: string;
    designation: string;
    phone: string;
    email: string;
    pin: string;
    assignedClassId: string;
    assignedSubjectIds: string[];
    status: 'Active' | 'On Leave' | 'Inactive';
  }>({
    staffId: nextStaffId,
    fullName: '',
    arabicName: '',
    gender: 'Male',
    qualification: 'B.A. Islamic Studies',
    designation: 'Form Master / Class Teacher (رائد الفصل)',
    phone: '',
    email: '',
    pin: Math.floor(100000 + Math.random() * 900000).toString(),
    assignedClassId: '',
    assignedSubjectIds: [],
    status: 'Active',
  });

  const handleOpenNew = () => {
    if (!isPrincipal) {
      showNotice('🔒 Official Mandate: Faculty Teacher Registration & Designation is strictly mandated for the School Principal only.');
      return;
    }
    setEditingTeacherId(null);
    setFormData({
      staffId: nextStaffId,
      fullName: '',
      arabicName: '',
      gender: 'Male',
      qualification: 'B.A. Islamic Studies',
      designation: 'Form Master / Class Teacher (رائد الفصل)',
      phone: '',
      email: '',
      pin: Math.floor(100000 + Math.random() * 900000).toString(),
      assignedClassId: '',
      assignedSubjectIds: [],
      status: 'Active',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    if (!isPrincipal) {
      showNotice('🔒 Official Mandate: Modifying Teacher Faculty Profile & Designation is strictly mandated for the School Principal only.');
      return;
    }
    setEditingTeacherId(teacher.id);
    setFormData({
      staffId: teacher.staffId,
      fullName: teacher.fullName,
      arabicName: teacher.arabicName || '',
      gender: teacher.gender,
      qualification: teacher.qualification,
      designation: teacher.designation || 'Form Master / Class Teacher',
      phone: teacher.phone,
      email: teacher.email || '',
      pin: teacher.pin || '2026',
      assignedClassId: teacher.assignedClassId || '',
      assignedSubjectIds: teacher.assignedSubjectIds || [],
      status: teacher.status,
    });
    setIsFormOpen(true);
  };

  const handleSubjectToggle = (subjId: string) => {
    setFormData((prev) => {
      const current = prev.assignedSubjectIds;
      if (current.includes(subjId)) {
        return { ...prev, assignedSubjectIds: current.filter((id) => id !== subjId) };
      } else {
        return { ...prev, assignedSubjectIds: [...current, subjId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Please fill in required fields: Full Name and Phone Number.');
      return;
    }

    if (editingTeacherId) {
      const existing = teachers.find((t) => t.id === editingTeacherId);
      if (!existing) return;

      const updated: Teacher = {
        ...existing,
        staffId: formData.staffId.trim() || existing.staffId,
        fullName: formData.fullName.trim(),
        arabicName: formData.arabicName.trim() || undefined,
        gender: formData.gender,
        qualification: formData.qualification.trim(),
        designation: formData.designation.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        pin: formData.pin.trim() || existing.pin,
        password: formData.pin.trim() || existing.password,
        hasSetPassword: existing.hasSetPassword,
        assignedClassId: formData.assignedClassId || undefined,
        assignedSubjectIds: formData.assignedSubjectIds,
        status: formData.status,
      };

      onUpdateTeacher(updated);
      showNotice(`Teacher "${updated.fullName}" updated with Principal designation!`);
    } else {
      const initialPass = formData.pin.trim();
      const newTeacher: Teacher = {
        id: `tch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        staffId: formData.staffId.trim() || nextStaffId,
        fullName: formData.fullName.trim(),
        arabicName: formData.arabicName.trim() || undefined,
        gender: formData.gender,
        qualification: formData.qualification.trim(),
        designation: formData.designation.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        pin: initialPass || undefined,
        password: initialPass || undefined,
        hasSetPassword: Boolean(initialPass),
        assignedClassId: formData.assignedClassId || undefined,
        assignedSubjectIds: formData.assignedSubjectIds,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };

      onAddTeacher(newTeacher);
      showNotice(`Teacher "${newTeacher.fullName}" registered and designated by Principal!`);
      // Open credentials dispatch dialog so admin can send or copy login details via WhatsApp, SMS, or Email
      setCredentialsModalTeacher({
        teacher: newTeacher,
        initialPin: initialPass || undefined,
      });
    }

    setIsFormOpen(false);
  };

  const handleResetPassword = (t: Teacher) => {
    if (
      window.confirm(
        `Reset password for ${t.fullName}? This allows the teacher to activate and create a new password using their phone (${t.phone}).`
      )
    ) {
      const updated: Teacher = {
        ...t,
        password: '',
        pin: undefined,
        hasSetPassword: false,
        passwordUpdatedAt: undefined,
      };
      onUpdateTeacher(updated);
      showNotice(`Password reset for ${t.fullName}. They can now create a fresh password via phone.`);
    }
  };

  const handleDelete = (t: Teacher) => {
    if (window.confirm(`Are you sure you want to delete ${t.fullName}? This will unassign them from their class.`)) {
      onDeleteTeacher(t.id);
      showNotice(`Teacher ${t.fullName} removed.`);
    }
  };

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.arabicName && t.arabicName.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesClass = classFilter === 'all' || t.assignedClassId === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>Teacher Registration & Designation</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Mandated for Principal Only
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Auto-Wired to Reports
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive Mudir Portal — Register faculty members, allocate form class designations, and assign curriculum subjects. Their appointments automatically link to student terminal report cards and official signatures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {notification}
            </div>
          )}

          {isPrincipal ? (
            <button
              id="btn-register-teacher"
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register & Designate Teacher (Principal Mandate)
            </button>
          ) : (
            <button
              id="btn-register-teacher-restricted"
              type="button"
              onClick={() => showNotice('🔒 Official Mandate: Teacher registration and designation is strictly mandated for Principal Abubakar Alhassan only.')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              title="Teacher registration & designation is mandated for Principal only"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Registration: Principal Only</span>
            </button>
          )}
        </div>
      </div>

      {/* Administrative Security Enforcement Policy Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/60 border border-amber-300/80 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-900 text-xs">Principal's Executive Mandate (College Statute):</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Principal Abubakar Alhassan Only
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
              By official college statutes, <strong>Faculty Teacher Registration and Designation</strong> is strictly mandated for the <strong>School Principal</strong> (Principal Abubakar Alhassan / Mudir). Only the Principal possesses the authority to appoint faculty teachers, designate Class Teachers (Form Masters), allocate curriculum subjects, and confer official faculty titles.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Registered Teachers</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{teachers.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active Form Teachers</span>
            <span className="text-xl font-bold text-blue-950 font-mono">
              {teachers.filter((t) => t.assignedClassId && t.status === 'Active').length} / {classes.length} Classes
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Curriculum Subjects</span>
            <span className="text-xl font-bold text-teal-950 font-mono">{subjects.length} Subjects</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Faculty On Duty</span>
            <span className="text-xl font-bold text-amber-950 font-mono">
              {teachers.filter((t) => t.status === 'Active').length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, Staff ID, qualification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Form Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.section})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[190px]">Teacher Details</th>
                <th className="py-3 px-4 min-w-[180px]">Principal's Designation</th>
                <th className="py-3 px-4 min-w-[150px]">Assigned Form Class</th>
                <th className="py-3 px-4 min-w-[170px]">Subjects Taught</th>
                <th className="py-3 px-4 min-w-[150px]">Contact Info</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No faculty members found matching your search. Click "Register New Teacher" to get started.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => {
                  const assignedClass = classes.find((c) => c.id === teacher.assignedClassId);
                  const teacherSubjects = subjects.filter((s) =>
                    teacher.assignedSubjectIds?.includes(s.id)
                  );

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Teacher Details */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{teacher.fullName}</span>
                          {teacher.arabicName && (
                            <span className="text-xs text-emerald-800 font-arabic" dir="rtl">
                              ({teacher.arabicName})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-emerald-800 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {teacher.staffId}
                          </span>
                          <span>• {teacher.qualification}</span>
                        </div>
                      </td>

                      {/* Principal's Designation */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-950 border border-amber-300 w-fit shadow-2xs">
                            <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>{teacher.designation || 'Class Form Master & Tutor'}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Principal Appointed
                          </span>
                        </div>
                      </td>

                      {/* Assigned Form Class */}
                      <td className="py-3 px-4">
                        {assignedClass ? (
                          <div className="inline-flex flex-col">
                            <span className="font-bold text-xs text-emerald-950 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                              {assignedClass.name}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Section: {assignedClass.section}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              ✓ Auto-wired to Reports
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned (Subject Teacher)</span>
                        )}
                      </td>

                      {/* Subjects Taught */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {teacherSubjects.length > 0 ? (
                            teacherSubjects.map((s) => (
                              <span
                                key={s.id}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                          )}
                        </div>
                      </td>

                      {/* Contact & Phone Activation Status */}
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                        {teacher.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 truncate max-w-[180px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{teacher.email}</span>
                          </div>
                        )}
                        <div className="mt-1">
                          {teacher.password || teacher.hasSetPassword ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Password Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              Awaiting Phone Activation
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            teacher.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : teacher.status === 'On Leave'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setCredentialsModalTeacher({
                                teacher,
                                initialPin: teacher.pin || teacher.password || undefined,
                              })
                            }
                            title="Send Login Details (WhatsApp, SMS, Email, or Copy)"
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                          >
                            <Send className="w-4 h-4" />
                            <span className="hidden xl:inline">Send Login</span>
                          </button>
                          <button
                            onClick={() => handleResetPassword(teacher)}
                            title="Reset Password (allows teacher to create a new password on their phone)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            title="Edit Teacher"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher)}
                            title="Delete Teacher"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form for Teacher Registration & Editing */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  {editingTeacherId ? 'Edit Faculty Member' : 'Register New Faculty Teacher'}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Assigned class will automatically feature this teacher's name on all terminal report cards.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff ID / Identification Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono font-bold text-emerald-950 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format: TCH-YYYY-001</span>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Male">Male (ذكر)</option>
                    <option value="Female">Female (أنثى)</option>
                  </select>
                </div>

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name (English / Official Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ustadh Ibrahim Bello"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Arabic Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arabic Name (الاسم باللغة العربية) — Optional
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: أستاذ إبراهيم بيلو"
                    value={formData.arabicName}
                    onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-arabic text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Highest Educational Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.A. Islamic Studies, NCE, B.Ed, Sanad"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'Active' | 'On Leave' | 'Inactive' })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Teacher Mobile Phone Number (Required for Login & Password Setup) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567 or +234 803 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-emerald-300 text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                  />
                  <span className="text-[11px] text-emerald-800 mt-1 block">
                    The teacher will use this phone number on their device to activate their account and create their personal password.
                  </span>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="teacher@kulliyyat.edu.ng"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Optional Initial Password / PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password / Temporary PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty or set default"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    If left blank, teacher will create their private password directly on their phone.
                  </span>
                </div>

                {/* Principal's Official Faculty Designation */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-amber-50/80 border border-amber-300">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Principal's Official Faculty Designation & Appointment *</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                      Principal Mandate Only
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Form Master (I'dadi 1) & Head of ICT / Sciences"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-300 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />

                  {/* Quick Preset Pills */}
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-amber-900 block mb-1">
                      Quick Designation Presets (Click to apply):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Form Master / Class Teacher (رائد الفصل)",
                        "Senior Form Master & Tahfiz Lead",
                        "Head of Islamic Studies & Shari'ah",
                        "Senior Arabic Language Specialist (أستاذ أول)",
                        "General Sciences & ICT Tutor",
                        "Basic Education & Nursery Lead",
                        "Curriculum Subject Master (مدرس مادة)",
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setFormData({ ...formData, designation: preset })}
                          className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition-all ${
                            formData.designation === preset
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned Form Class */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center justify-between">
                    <span>Assigned Form Class (Class Teacher)</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      ★ Auto-wires teacher's name directly to student report cards
                    </span>
                  </label>
                  <select
                    value={formData.assignedClassId}
                    onChange={(e) => setFormData({ ...formData, assignedClassId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 bg-white font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">-- No Class Assigned (Subject Teacher Only) --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — Section: {cls.section} ({cls.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-800 mt-1.5">
                    When assigned, this teacher will appear as the official <strong>Class Teacher</strong> on all terminal report cards, continuous assessments, and signatures for this class.
                  </p>
                </div>

                {/* Subjects Taught */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Assigned Subjects ({formData.assignedSubjectIds.length} selected)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select all classes/subjects taught by this teacher
                    </span>
                  </div>

                  {/* Subject category quick filter pills */}
                  <div className="flex flex-wrap items-center gap-1 mb-2">
                    {(['all', 'Early Childhood', 'Islamic Studies', 'Arabic & Language', 'General Sciences', 'Vocational & Arts'] as const).map((cat) => {
                      const count = cat === 'all' ? subjects.length : subjects.filter((s) => s.category === cat).length;
                      const isSelected = subjectModalCategoryFilter === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setSubjectModalCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat === 'all' ? 'All' : cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    {subjects
                      .filter((subj) => subjectModalCategoryFilter === 'all' || subj.category === subjectModalCategoryFilter)
                      .map((subj) => {
                        const isChecked = formData.assignedSubjectIds.includes(subj.id);
                        return (
                          <button
                            type="button"
                            key={subj.id}
                            onClick={() => handleSubjectToggle(subj.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-all border ${
                              isChecked
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 pointer-events-none shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold">{subj.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{subj.code}</div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
                >
                  {editingTeacherId ? 'Update & Wire Teacher' : 'Save & Wire Teacher to Reports'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Send Credentials Modal for WhatsApp, SMS, Email, and Copying */}
      {credentialsModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-300">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Send Login Details</h3>
                  <p className="text-xs text-emerald-200">
                    Deliver portal access instructions to {credentialsModalTeacher.teacher.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsModalTeacher(null)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Teacher Summary Badge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {credentialsModalTeacher.teacher.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Staff ID: {credentialsModalTeacher.teacher.staffId}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Faculty Member
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registered Phone:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                      {credentialsModalTeacher.teacher.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address:</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {credentialsModalTeacher.teacher.email || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block text-[11px] text-emerald-950 mb-0.5">
                    Access Method:
                  </span>
                  The teacher can log in directly using their phone number (<strong>{credentialsModalTeacher.teacher.phone}</strong>) and {credentialsModalTeacher.initialPin ? <>the temporary password: <code className="px-1.5 py-0.5 rounded bg-white font-mono font-bold border border-emerald-200">{credentialsModalTeacher.initialPin}</code></> : 'their personal password created during activation.'}
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Dispatch Message Preview</label>
                  <button
                    type="button"
                    onClick={() => {
                      const portalUrl = window.location.origin;
                      const msg = `Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nYour faculty account for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah has been registered by the administration.\n\nPortal URL: ${portalUrl}\nYour Login Phone: ${credentialsModalTeacher.teacher.phone}${
                        credentialsModalTeacher.initialPin
                          ? `\nInitial Password: ${credentialsModalTeacher.initialPin}`
                          : '\nYou can create your personal password directly by clicking "Create or Reset Password" on the login page.'
                      }\n\nPlease keep your credentials confidential.`;
                      navigator.clipboard.writeText(msg);
                      setCopiedNotification(true);
                      setTimeout(() => setCopiedNotification(false), 3000);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    {copiedNotification ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
                  {`Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nYour faculty account for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah has been registered.\nPortal: ${window.location.origin}\nLogin Phone: ${credentialsModalTeacher.teacher.phone}${
                    credentialsModalTeacher.initialPin
                      ? `\nInitial Password: ${credentialsModalTeacher.initialPin}`
                      : '\nYou can create your password on the login screen using your phone.'
                  }`}
                </div>
              </div>

              {/* Automated Dispatch Primary Trigger */}
              <button
                type="button"
                id="btn-auto-forward-teacher-phone"
                onClick={() => {
                  const portalUrl = window.location.origin;
                  const cleanPhone = credentialsModalTeacher.teacher.phone.replace(/[^0-9]/g, '');
                  const targetPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone;
                  const msgText = encodeURIComponent(
                    `Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nYour faculty portal access for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah has been registered by the Super Admin.\n\n🌐 Portal Link: ${portalUrl}\n📱 Registered Phone: ${credentialsModalTeacher.teacher.phone}${
                      credentialsModalTeacher.initialPin
                        ? `\n🔑 Initial Password: ${credentialsModalTeacher.initialPin}`
                        : '\n🔑 Password: You can set or activate your password directly using your phone number on the login screen.'
                    }\n\nStaff ID: ${credentialsModalTeacher.teacher.staffId}\n\nKind regards,\nKulliyyat Administration`
                  );
                  window.open(`https://wa.me/${targetPhone}?text=${msgText}`, '_blank');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>Auto-Forward to Teacher's Phone ({credentialsModalTeacher.teacher.phone})</span>
              </button>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = window.location.origin;
                    const cleanPhone = credentialsModalTeacher.teacher.phone.replace(/[^0-9]/g, '');
                    const targetPhone = cleanPhone.startsWith('0')
                      ? '234' + cleanPhone.substring(1)
                      : cleanPhone;
                    const msgText = encodeURIComponent(
                      `Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nYour faculty portal access for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah has been registered.\n\n🌐 Portal Link: ${portalUrl}\n📱 Registered Phone: ${credentialsModalTeacher.teacher.phone}${
                        credentialsModalTeacher.initialPin
                          ? `\n🔑 Initial Password: ${credentialsModalTeacher.initialPin}`
                          : '\n🔑 Password: You can set or activate your password directly using your phone number on the login screen.'
                      }\n\nStaff ID: ${credentialsModalTeacher.teacher.staffId}`
                    );
                    window.open(`https://wa.me/${targetPhone}?text=${msgText}`, '_blank');
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* SMS button */}
                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = window.location.origin;
                    const cleanPhone = credentialsModalTeacher.teacher.phone.replace(/[^0-9]/g, '');
                    const msgText = encodeURIComponent(
                      `Salam ${credentialsModalTeacher.teacher.fullName}, your Kulliyyat portal is ready. Link: ${portalUrl}, Phone: ${credentialsModalTeacher.teacher.phone}${
                        credentialsModalTeacher.initialPin
                          ? `, Pass: ${credentialsModalTeacher.initialPin}`
                          : ', please activate password via phone.'
                      }`
                    );
                    window.location.href = `sms:${cleanPhone}?body=${msgText}`;
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>

                {/* Native Device Share button */}
                <button
                  type="button"
                  onClick={async () => {
                    const portalUrl = window.location.origin;
                    const msgText = `Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nFaculty account for Kulliyyat registered.\nPortal: ${portalUrl}\nPhone: ${credentialsModalTeacher.teacher.phone}${
                      credentialsModalTeacher.initialPin ? `\nPass: ${credentialsModalTeacher.initialPin}` : ''
                    }\nStaff ID: ${credentialsModalTeacher.teacher.staffId}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `Teacher Credentials - ${credentialsModalTeacher.teacher.fullName}`,
                          text: msgText,
                        });
                      } catch {}
                    } else {
                      navigator.clipboard.writeText(msgText);
                      setCopiedNotification(true);
                      setTimeout(() => setCopiedNotification(false), 3000);
                    }
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Beam</span>
                </button>

                {/* Email button */}
                <button
                  type="button"
                  disabled={!credentialsModalTeacher.teacher.email}
                  onClick={() => {
                    if (!credentialsModalTeacher.teacher.email) return;
                    const portalUrl = window.location.origin;
                    const subject = encodeURIComponent(
                      'Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah — Your Faculty Portal Login Details'
                    );
                    const body = encodeURIComponent(
                      `Salam Alaykum ${credentialsModalTeacher.teacher.fullName},\n\nYour faculty account for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah has been registered by the administration.\n\nPortal URL: ${portalUrl}\nYour Login Phone: ${credentialsModalTeacher.teacher.phone}${
                        credentialsModalTeacher.initialPin
                          ? `\nInitial Password: ${credentialsModalTeacher.initialPin}`
                          : '\nYou can create your password directly on the login page.'
                      }\n\nStaff ID: ${credentialsModalTeacher.teacher.staffId}\n\nKind regards,\nKulliyyat Administration`
                    );
                    window.location.href = `mailto:${credentialsModalTeacher.teacher.email}?subject=${subject}&body=${body}`;
                  }}
                  className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                    credentialsModalTeacher.teacher.email
                      ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-98 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={
                    credentialsModalTeacher.teacher.email
                      ? 'Send via Email client'
                      : 'No email address registered for this teacher'
                  }
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialsModalTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
