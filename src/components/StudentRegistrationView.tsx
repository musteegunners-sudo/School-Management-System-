import React, { useState } from 'react';
import { Student, SchoolClass } from '../types';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Filter,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  GraduationCap,
  Sparkles,
  Camera,
  Upload,
  KeyRound,
  Send,
  MessageSquare,
  Smartphone,
  Copy,
  CheckCircle2,
  Share2,
  ShieldCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { StudentPhotoCaptureModal } from './StudentPhotoCaptureModal';

export const ACADEMIC_YEAR_OPTIONS = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
  '2031/2032',
  '2032/2033',
  '2033/2034',
  '2034/2035',
  '2035/2036',
];

interface StudentRegistrationViewProps {
  students: Student[];
  classes: SchoolClass[];
  currentUserRole?: string;
  onAddStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => Student | void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectForReport: (studentId: string) => void;
}

export const StudentRegistrationView: React.FC<StudentRegistrationViewProps> = ({
  students,
  classes,
  currentUserRole,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectForReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Mandate: Student Registration is mandated for School Secretary only
  const isSecretary = currentUserRole === 'secretary';
  const [mandateNotice, setMandateNotice] = useState<string | null>(null);

  const notifySecretaryMandate = (actionDesc: string = 'register or edit students') => {
    setMandateNotice(`🔒 Official Mandate: Only the School Secretary (Admissions Registrar) is authorized to ${actionDesc}. Current session has directory access only.`);
    setTimeout(() => setMandateNotice(null), 4500);
  };

  // Automated Student Portal Credentials Modal State
  const [credentialsModalStudent, setCredentialsModalStudent] = useState<{
    student: Student;
    initialPin: string;
  } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [portalPin, setPortalPin] = useState<string>(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [autoForwardToPhone, setAutoForwardToPhone] = useState(true);
  const [forwardNotice, setForwardNotice] = useState<string | null>(null);

  // Form State
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
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Auto-generate next sequence for the given academic year
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

  const openAddModal = () => {
    if (!isSecretary) {
      notifySecretaryMandate('enroll new students. Student admission and registration is mandated for the School Secretary only');
      return;
    }
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
    setAutoForwardToPhone(true);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    if (!isSecretary) {
      notifySecretaryMandate('modify student enrollment profiles. Profile modification is mandated for the School Secretary only');
      return;
    }
    setEditingStudent(student);
    const detectedYear = student.academicYear || '2026/2027';
    setAcademicYear(detectedYear);
    setRegNo(student.regNo);

    // Extract sequence if format matches KUL-YYYY-XXXX
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
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regNo.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        regNo,
        fullName,
        arabicName,
        gender,
        dob,
        classId,
        academicYear,
        guardianName,
        guardianPhone,
        address,
        photoUrl: photoUrl || undefined,
        pin: portalPin || editingStudent.pin,
        password: portalPin || editingStudent.password,
      });
    } else {
      const generatedPin = portalPin || Math.floor(100000 + Math.random() * 900000).toString();
      const newStudentPayload = {
        regNo,
        fullName,
        arabicName,
        gender,
        dob,
        classId,
        academicYear,
        guardianName,
        guardianPhone,
        address,
        photoUrl: photoUrl || undefined,
        pin: generatedPin,
        password: generatedPin,
        hasSetPassword: true,
      };

      const created = onAddStudent(newStudentPayload);
      const studentObj: Student = created || {
        ...newStudentPayload,
        id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Automatically open the Student Portal Credentials & Phone Forwarding Dialog
      setCredentialsModalStudent({
        student: studentObj,
        initialPin: generatedPin,
      });

      if (guardianPhone.trim()) {
        setForwardNotice(`Portal credentials prepared for ${studentObj.fullName} (Guardian Phone: ${guardianPhone})`);
        setTimeout(() => setForwardNotice(null), 5000);
      }
    }
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.guardianName && student.guardianName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;
    const matchesYear =
      selectedYearFilter === 'ALL' ||
      student.academicYear === selectedYearFilter ||
      (selectedYearFilter && student.regNo.includes(selectedYearFilter.split('/')[0]));
    return matchesSearch && matchesClass && matchesYear;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>Student Registration & Admissions Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Mandated for Secretary Only
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-300">
              Auto-Generates Portal PIN
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kulliyyat Student Registry — Admissions, biodata registration, and automatic portal access credentials. Student admission enrollment is mandated exclusively for the School Secretary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {forwardNotice && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{forwardNotice}</span>
            </div>
          )}

          {isSecretary ? (
            <button
              id="btn-register-student"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Enroll New Student (Secretary Mandate)
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-register-student-restricted"
                type="button"
                onClick={() => notifySecretaryMandate('enroll new students. Student admission is mandated for the School Secretary')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                title="Student Registration is mandated for the School Secretary only"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Registration: Secretary Only</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Secretary Mandate Warning Alert (when triggered) */}
      {mandateNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400 text-amber-950 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="font-semibold">{mandateNotice}</span>
          </div>
          <button
            onClick={() => setMandateNotice(null)}
            className="text-amber-900 font-bold text-xs px-2 py-0.5 hover:bg-amber-200/50 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Official College Statute Policy Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-blue-50/60 border border-amber-300/80 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-xs">Official College Admissions Statute:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase">
                Secretary Mandate Only
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
              Student admission, biodata registration, and portal credential generation are <strong>mandated for the School Secretary only</strong> (Malama Fatima Umar - Admissions Registrar). All teachers and administrators have read-only student directory and result-sheet generation privileges.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-student-search"
            type="text"
            placeholder="Search by student name, admission reg number, or guardian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-[180px]">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="select-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">All Classes ({students.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-[200px]">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="select-year-filter"
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">All Academic Years</option>
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Reg Number & Year</th>
                <th className="py-3.5 px-6">Full Name & Arabic</th>
                <th className="py-3.5 px-6">Class</th>
                <th className="py-3.5 px-6">Gender / DOB</th>
                <th className="py-3.5 px-6">Guardian Info</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      No student records found.
                    </p>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      All pioneer demo students have been cleared. Ready to enroll real students for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah.
                    </p>
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Enroll Student Now
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/60 shadow-2xs">
                          {student.regNo}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{student.academicYear || student.regNo.slice(4, 8) || '2026/2027'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200/80 shadow-2xs">
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{student.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{student.fullName}</div>
                            {student.arabicName && (
                              <div className="text-xs text-slate-500 font-arabic" dir="rtl">
                                {student.arabicName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {studentClass ? studentClass.name : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-700 text-xs font-medium">{student.gender}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {student.dob}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800 text-xs font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {student.guardianName || 'N/A'}
                        </div>
                        {student.guardianPhone && (
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.guardianPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSecretary ? (
                            <button
                              id={`btn-photo-student-${student.id}`}
                              onClick={() => {
                                openEditModal(student);
                                setIsPhotoModalOpen(true);
                              }}
                              title="Capture or Update Passport Photo"
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          ) : null}

                          <button
                            id={`btn-forward-pin-${student.id}`}
                            onClick={() => {
                              setCredentialsModalStudent({
                                student,
                                initialPin: student.pin || student.password || '2026',
                              });
                            }}
                            title="Forward Portal Login Credentials to Guardian Phone"
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectForReport(student.id)}
                            title="Generate Result Sheet"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {isSecretary ? (
                            <>
                              <button
                                onClick={() => openEditModal(student)}
                                title="Edit Student Profile (Secretary Mandate)"
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${student.fullName}?`)) {
                                    onDeleteStudent(student.id);
                                  }
                                }}
                                title="Delete Student"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => notifySecretaryMandate('edit or remove student records')}
                              title="Profile editing and record management is mandated for School Secretary only"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                          )}
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

      {/* Modal for Enrollment / Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Student Admission & Registration'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Student Passport Photo Box with Camera & Upload Access */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-emerald-300 shadow-xs flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Student passport"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <Camera className="w-7 h-7 text-emerald-600 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-500">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                      <span>Student Passport Photo</span>
                      {photoUrl ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" /> Photo Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Capture live using device webcam or upload passport image for official terminal report cards and portal profile.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      id="btn-open-camera-photo"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {photoUrl ? 'Retake / Change Photo' : 'Capture with Camera'}
                    </button>

                    <button
                      type="button"
                      id="btn-upload-file-photo"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        id="btn-remove-photo"
                        onClick={() => setPhotoUrl('')}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Year Selection & Generated Reg Number */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      Academic Year (Select Year) *
                    </label>
                    <select
                      id="select-modal-academic-year"
                      value={academicYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 bg-white font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} Academic Year
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-emerald-700 mt-1 block">
                      Options from current to future academic years
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Admission Number (Auto-Generated)</span>
                      <span className="text-[10px] font-normal text-emerald-700 font-mono">KUL-YYYY-XXXX</span>
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-white border border-emerald-300 font-mono font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
                      <span>{regNo}</span>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Sequence #:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          maxLength={4}
                          value={sequenceNum}
                          onChange={(e) => handleSequenceChange(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-center font-mono text-xs border border-emerald-300 rounded bg-white text-emerald-900 font-bold"
                          title="4-digit sequence number"
                        />
                        <span className="text-slate-400 text-[10px]">(auto-increments)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Class *
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Student Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. Ibrahim Abubakar Sadiq"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name in Arabic Script (الاسم باللغة العربية)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-arabic text-right"
                  placeholder="مثال: إبراهيم أبو بكر صادق"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="Male">Male (ذكر)</option>
                    <option value="Female">Female (أنثى)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-3">
                  Parent / Guardian Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="e.g. Alhaji Abubakar Sadiq"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Guardian Phone Number
                    </label>
                    <input
                      type="tel"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="e.g. 08031234567"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. No 15 Gwarzo Road, Kano"
                  />
                </div>

                {/* Automated Student Portal Account & Login Credentials Box */}
                <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                      Student Portal Account (Automated)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                      Auto-Generated
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 mb-3 leading-relaxed">
                    A personal student portal access account is automatically created upon registration. Students or parents can log in to check real-time terminal reports, attendance, and continuous assessment scores.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Portal Access PIN (6 Digits)</span>
                        <button
                          type="button"
                          onClick={() => setPortalPin(Math.floor(100000 + Math.random() * 900000).toString())}
                          className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Generate New
                        </button>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={portalPin}
                        onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-1.5 text-sm font-mono font-bold text-blue-900 rounded-xl border border-blue-300 bg-white tracking-widest text-center"
                        placeholder="e.g. 582910"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-blue-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoForwardToPhone}
                          onChange={(e) => setAutoForwardToPhone(e.target.checked)}
                          className="mt-0.5 text-blue-700 rounded focus:ring-blue-500"
                        />
                        <span className="text-[11px] text-slate-700 leading-tight">
                          <strong>Auto-Forward to Phone:</strong> Prompt and prepare WhatsApp / SMS message to guardian's phone number upon registration.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Portal Credentials & Phone Forwarding Modal */}
      {credentialsModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setCredentialsModalStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shrink-0">
                <KeyRound className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Student Portal Account Created
                </h3>
                <p className="text-xs text-slate-500">
                  Login credentials generated & ready for phone dispatch
                </p>
              </div>
            </div>

            {/* Notification Badge */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Account activated for <strong>{credentialsModalStudent.student.fullName}</strong>. Forward login details to the parent/guardian phone below.
              </span>
            </div>

            {/* Student Credential Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{credentialsModalStudent.student.fullName}</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {credentialsModalStudent.student.regNo}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Guardian Phone:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    {credentialsModalStudent.student.guardianPhone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Class:</span>
                  <span className="font-semibold text-slate-700">
                    {classes.find((c) => c.id === credentialsModalStudent.student.classId)?.name || 'Class Assigned'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-700 font-bold block uppercase">Student Portal Access PIN</span>
                  <span className="font-mono text-base font-black tracking-widest text-blue-900">
                    {credentialsModalStudent.initialPin}
                  </span>
                </div>
                <div className="text-right text-[11px] text-blue-700">
                  <span>Sign-in via:</span>
                  <div className="font-semibold text-blue-950 font-mono">Reg No or Phone</div>
                </div>
              </div>
            </div>

            {/* Monospace Message Preview */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Phone Message Dispatch Preview</label>
                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = window.location.origin;
                    const cName = classes.find((c) => c.id === credentialsModalStudent.student.classId)?.name || '';
                    const msg = `Salam Alaykum ${credentialsModalStudent.student.guardianName || 'Parent / Guardian'},\n\nYour student portal account for ${credentialsModalStudent.student.fullName} has been registered at Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah.\n\n🌐 Portal Link: ${portalUrl}\n🎓 Student: ${credentialsModalStudent.student.fullName}\n🆔 Reg Number: ${credentialsModalStudent.student.regNo}\n🔑 Portal Access PIN: ${credentialsModalStudent.initialPin}${cName ? `\n🏫 Class: ${cName}` : ''}\n\nYou can log in to view continuous assessments, examination marks, and attendance reports.`;
                    navigator.clipboard.writeText(msg);
                    setCopiedNotification(true);
                    setTimeout(() => setCopiedNotification(false), 3000);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
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
                {`Salam Alaykum ${credentialsModalStudent.student.guardianName || 'Guardian'},\nPortal account for ${credentialsModalStudent.student.fullName} registered.\nPortal: ${window.location.origin}\nReg No: ${credentialsModalStudent.student.regNo}\nPIN: ${credentialsModalStudent.initialPin}\nPhone: ${credentialsModalStudent.student.guardianPhone || 'Not Set'}`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const portalUrl = window.location.origin;
                  const cleanPhone = (credentialsModalStudent.student.guardianPhone || '').replace(/[^0-9]/g, '');
                  const targetPhone = cleanPhone.startsWith('0')
                    ? '234' + cleanPhone.substring(1)
                    : cleanPhone;
                  const cName = classes.find((c) => c.id === credentialsModalStudent.student.classId)?.name || '';
                  const msgText = encodeURIComponent(
                    `Salam Alaykum ${credentialsModalStudent.student.guardianName || 'Parent / Guardian'},\n\nYour student portal account for ${credentialsModalStudent.student.fullName} has been registered at Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah.\n\n🌐 Portal Link: ${portalUrl}\n🎓 Student: ${credentialsModalStudent.student.fullName}\n🆔 Reg Number: ${credentialsModalStudent.student.regNo}\n🔑 Portal Access PIN: ${credentialsModalStudent.initialPin}${cName ? `\n🏫 Class: ${cName}` : ''}\n\nYou can log in to view continuous assessments, examination marks, and attendance reports.`
                  );
                  window.open(`https://wa.me/${targetPhone}?text=${msgText}`, '_blank');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const portalUrl = window.location.origin;
                  const cleanPhone = (credentialsModalStudent.student.guardianPhone || '').replace(/[^0-9]/g, '');
                  const msgText = encodeURIComponent(
                    `Salam, student portal for ${credentialsModalStudent.student.fullName} is ready. Link: ${portalUrl}, RegNo: ${credentialsModalStudent.student.regNo}, PIN: ${credentialsModalStudent.initialPin}`
                  );
                  window.location.href = `sms:${cleanPhone}?body=${msgText}`;
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Send via SMS</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const portalUrl = window.location.origin;
                  const cName = classes.find((c) => c.id === credentialsModalStudent.student.classId)?.name || '';
                  const msgText = `Salam Alaykum ${credentialsModalStudent.student.guardianName || 'Parent / Guardian'},\n\nStudent portal credentials for ${credentialsModalStudent.student.fullName}:\nPortal: ${portalUrl}\nReg No: ${credentialsModalStudent.student.regNo}\nPIN: ${credentialsModalStudent.initialPin}${cName ? `\nClass: ${cName}` : ''}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Student Portal Login - ${credentialsModalStudent.student.fullName}`,
                        text: msgText,
                      });
                    } catch {}
                  } else {
                    navigator.clipboard.writeText(msgText);
                    setCopiedNotification(true);
                    setTimeout(() => setCopiedNotification(false), 3000);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share / Beam</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture & Upload Modal */}
      <StudentPhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={(newPhoto) => setPhotoUrl(newPhoto)}
        currentPhotoUrl={photoUrl}
        studentName={fullName || editingStudent?.fullName || 'Student'}
      />
    </div>
  );
};
