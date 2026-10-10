import React, { useState, useId } from 'react';
import { SchoolProfile, Teacher, SchoolClass, AuthUser, Student } from '../types';
import { matchTeacherByPhone } from '../utils/phoneUtils';
import { defaultSecretaryUser } from '../data/seedData';
import {
  ShieldCheck,
  GraduationCap,
  Lock,
  User,
  KeyRound,
  School,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Smartphone,
  Sparkles,
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Receipt,
  Award,
  Megaphone,
} from 'lucide-react';

interface LoginViewProps {
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  classes: SchoolClass[];
  students?: Student[];
  onLoginSuccess: (user: AuthUser, initialTab?: string) => void;
  onUpdateTeacher?: (teacher: Teacher) => void;
  onUpdateStudent?: (student: Student) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolProfile,
  teachers,
  classes,
  students = [],
  onLoginSuccess,
  onUpdateTeacher,
  onUpdateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'secretary' | 'accountant' | 'super_admin'>('teacher');
  const [teacherMode, setTeacherMode] = useState<'signin' | 'create_password'>('signin');
  const [studentMode, setStudentMode] = useState<'signin' | 'activate'>('signin');

  // Super Admin Form State
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Secretary / Admissions Form State
  const [secretaryIdentifier, setSecretaryIdentifier] = useState('SEC-2026-001');
  const [secretaryPassword, setSecretaryPassword] = useState('');
  const [showSecretaryPassword, setShowSecretaryPassword] = useState(false);
  const [secretaryError, setSecretaryError] = useState<string | null>(null);

  // Accountant / Bursar Form State
  const [accountantIdentifier, setAccountantIdentifier] = useState('ACC-2026-001');
  const [accountantPassword, setAccountantPassword] = useState('');
  const [showAccountantPassword, setShowAccountantPassword] = useState(false);
  const [accountantError, setAccountantError] = useState<string | null>(null);

  // Teacher Sign In State
  const [teacherPhoneInput, setTeacherPhoneInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherSignInError, setTeacherSignInError] = useState<string | null>(null);
  const [unactivatedTeacher, setUnactivatedTeacher] = useState<Teacher | null>(null);

  // Teacher Create Password / Activation State
  const [activationPhoneInput, setActivationPhoneInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Student Portal Sign In State
  const [studentRegInput, setStudentRegInput] = useState('');
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentSignInError, setStudentSignInError] = useState<string | null>(null);
  const [unactivatedStudent, setUnactivatedStudent] = useState<Student | null>(null);

  // Student Password Activation State
  const [studentActivationReg, setStudentActivationReg] = useState('');
  const [studentActivationPhone, setStudentActivationPhone] = useState('');
  const [studentNewPass, setStudentNewPass] = useState('');
  const [studentConfirmPass, setStudentConfirmPass] = useState('');
  const [showStudentNewPass, setShowStudentNewPass] = useState(false);
  const [studentActivationError, setStudentActivationError] = useState<string | null>(null);
  const [studentActivationSuccess, setStudentActivationSuccess] = useState<string | null>(null);

  // Quick 1-Click Access for Evaluation and Demo Testing
  const handleQuickLogin = (
    role: 'super_admin' | 'teacher' | 'secretary' | 'accountant' | 'student' | 'student_cbt'
  ) => {
    if (role === 'super_admin') {
      const isDevLogin = true;
      const superUser: AuthUser = {
        id: 'super_admin_developer',
        role: 'super_admin',
        name: 'Mustapha Danmari',
        arabicName: 'المشرف التقني ومطور النظام',
        title: 'Lead System Developer & Super Admin',
        email: 'musteegunners@gmail.com',
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(superUser);
    } else if (role === 'teacher') {
      const targetTeacher = teachers[0] || {
        id: 'tch_1789473363124_ew74',
        fullName: 'Mustapha Danmari',
        arabicName: 'مصطفى دانمري',
        staffId: 'TCH-2026-001',
        assignedClassId: 'cls_idadi_1',
        assignedSubjectIds: ['subj_maths', 'subj_science', 'subj_quran'],
        email: 'musteegunners@gmail.com',
      };
      const tClass = classes.find((c) => c.id === targetTeacher.assignedClassId) || classes[0];
      const authUser: AuthUser = {
        id: targetTeacher.id,
        role: 'teacher',
        name: targetTeacher.fullName,
        arabicName: targetTeacher.arabicName,
        title: tClass ? `Form Teacher • ${tClass.name}` : 'Form Teacher',
        email: targetTeacher.email,
        staffId: targetTeacher.staffId,
        assignedClassId: targetTeacher.assignedClassId,
        assignedSubjectIds: targetTeacher.assignedSubjectIds,
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(authUser);
    } else if (role === 'secretary') {
      onLoginSuccess(defaultSecretaryUser, 'secretary_portal');
    } else if (role === 'accountant') {
      const accountantUser: AuthUser = {
        id: 'acc_bursar_01',
        role: 'accountant',
        name: 'Mallam Usman Bello',
        arabicName: 'الأستاذ عثمان بيلو',
        title: 'School Bursar & Head of Accounts',
        email: 'bursar@kulliyyat-tatbiq.edu.ng',
        staffId: 'ACC-2026-001',
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(accountantUser);
    } else if (role === 'student' || role === 'student_cbt') {
      const targetStudent = students[0] || {
        id: 'std_1789596426554',
        fullName: 'Zuhriyya Nura',
        arabicName: 'زهرية نورا',
        regNo: 'KUL-2026-0001',
        classId: 'cls_idadi_1',
      };
      const sClass = classes.find((c) => c.id === targetStudent.classId) || classes[0];
      const authUser: AuthUser = {
        id: targetStudent.id,
        role: 'student',
        name: targetStudent.fullName,
        arabicName: targetStudent.arabicName,
        title: sClass ? `Student • ${sClass.name}` : 'Student',
        studentId: targetStudent.id,
        regNo: targetStudent.regNo,
        assignedClassId: targetStudent.classId,
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(authUser, role === 'student_cbt' ? 'exam_center' : 'student_portal');
    }
  };

  // Unique element IDs
  const adminUserInputId = useId();
  const adminPassInputId = useId();
  const teacherPhoneId = useId();
  const teacherPassId = useId();
  const activationPhoneId = useId();
  const newPassId = useId();
  const confirmPassId = useId();
  const studentRegId = useId();
  const studentPassId = useId();
  const studentActRegId = useId();
  const studentActPhoneId = useId();
  const accountantUserInputId = useId();
  const accountantPassInputId = useId();
  const secretaryUserInputId = useId();
  const secretaryPassInputId = useId();

  // Handle Secretary / Admissions Registrar Login
  const handleSecretarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecretaryError(null);

    const idClean = secretaryIdentifier.trim().toLowerCase();
    const passClean = secretaryPassword.trim();

    const isIdentifierValid =
      idClean === 'sec-2026-001' ||
      idClean === 'secretary' ||
      idClean === 'secretary@kulliyyat-tatbiq.edu.ng' ||
      idClean.includes('fatima') ||
      idClean.includes('umar') ||
      idClean === '08130366258' ||
      idClean === 'musteegunners@gmail.com' ||
      idClean === 'admin';

    const isPasswordValid =
      passClean === 'Secretary@2026' ||
      passClean === 'secretary2026' ||
      passClean === '2026' ||
      passClean === 'Kulliyyat@2026' ||
      passClean === 'Newnew @2020' ||
      passClean === 'Newnew@2020' ||
      passClean === '1984';

    if (isIdentifierValid && isPasswordValid) {
      onLoginSuccess(defaultSecretaryUser, 'secretary_portal');
    } else {
      setSecretaryError(
        'Invalid secretary credentials. Use SEC-2026-001 and Secretary@2026 or tap Quick Fill below.'
      );
    }
  };

  // Handle Accountant / Bursar Login
  const handleAccountantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountantError(null);

    const idClean = accountantIdentifier.trim().toLowerCase();
    const passClean = accountantPassword.trim();

    const isIdentifierValid =
      idClean === 'bursar' ||
      idClean === 'accountant' ||
      idClean === 'bursar@kulliyyat-tatbiq.edu.ng' ||
      idClean === 'acc-2026-001' ||
      idClean === '08035551234' ||
      idClean.includes('usman') ||
      idClean.includes('bello') ||
      idClean === 'musteegunners@gmail.com' ||
      idClean === 'admin';

    const isPasswordValid =
      passClean === 'Bursar@2026' ||
      passClean === 'bursar2026' ||
      passClean === 'accountant2026' ||
      passClean === '2026' ||
      passClean === 'Newnew @2020' ||
      passClean === 'Newnew@2020' ||
      passClean === 'Kulliyyat@2026' ||
      passClean === '1984';

    if (isIdentifierValid && isPasswordValid) {
      const accountantUser: AuthUser = {
        id: 'acc_bursar_01',
        role: 'accountant',
        name: 'Mallam Usman Bello',
        arabicName: 'الأستاذ عثمان بيلو',
        title: 'School Bursar & Head of Accounts',
        email: 'bursar@kulliyyat-tatbiq.edu.ng',
        staffId: 'ACC-2026-001',
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(accountantUser);
    } else {
      setAccountantError(
        'Invalid bursary credentials. Please check your Staff ID/Email and password (e.g. ACC-2026-001 / Bursar@2026).'
      );
    }
  };

  // Find teacher in real-time for activation verification
  const matchedActivationTeacher = matchTeacherByPhone(teachers, activationPhoneInput);
  const activationTeacherClass = matchedActivationTeacher
    ? classes.find((c) => c.id === matchedActivationTeacher.assignedClassId)
    : undefined;

  // Real-time matched student for activation
  const matchedActivationStudent = students.find((s) => {
    const cleanInput = studentActivationReg.trim().toLowerCase();
    return (
      cleanInput &&
      (s.regNo.toLowerCase() === cleanInput ||
        s.id.toLowerCase() === cleanInput ||
        s.fullName.toLowerCase() === cleanInput)
    );
  });
  const activationStudentClass = matchedActivationStudent
    ? classes.find((c) => c.id === matchedActivationStudent.classId)
    : undefined;

  // Handle Super Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const idClean = adminIdentifier.trim().toLowerCase();
    const passClean = adminPassword.trim();

    // Check Developer / Super Admin account (Mustapha Danmari / musteegunners@gmail.com)
    const isDeveloperAdmin =
      idClean === 'musteegunners@gmail.com' ||
      idClean === 'mustapha danmari' ||
      idClean === 'mustapha' ||
      idClean === 'danmari' ||
      idClean === 'mustee' ||
      idClean === 'developer' ||
      idClean === 'superadmin';

    // Valid Mudir / Administrator Credentials
    const validIdentifiers = [
      'musteegunners@gmail.com',
      'mudir@kulliyyat.edu.ng',
      'principal@kulliyyat.edu.ng',
      'admin@kulliyyat-tatbiq.edu.ng',
      schoolProfile.email?.toLowerCase(),
      'admin',
      'principal',
      'abubakar',
      'mudir',
      'mustee',
      'mustapha',
      'danmari',
      'mustapha danmari',
      'developer',
    ].filter(Boolean);

    const isIdentifierValid =
      isDeveloperAdmin ||
      validIdentifiers.includes(idClean) ||
      idClean.includes('abubakar') ||
      idClean.includes('alhassan') ||
      idClean.includes('mustee') ||
      idClean.includes('danmari') ||
      idClean.includes('mustapha');

    const isPasswordValid =
      passClean === 'Newnew @2020' ||
      passClean === 'Newnew@2020' ||
      passClean === 'Kulliyyat@2026' ||
      passClean === '1984' ||
      passClean === '2026' ||
      passClean === 'admin2026' ||
      passClean === 'mudir2026';

    if (isIdentifierValid && isPasswordValid) {
      // Determine if logged in as Developer Super Admin or Mudir
      const isDevLogin =
        isDeveloperAdmin ||
        idClean === 'musteegunners@gmail.com' ||
        idClean.includes('danmari') ||
        idClean.includes('mustee');
      const superUser: AuthUser = isDevLogin
        ? {
            id: 'super_admin_developer',
            role: 'super_admin',
            name: 'Mustapha Danmari',
            arabicName: 'المشرف التقني ومطور النظام',
            title: 'Lead System Developer & Super Admin',
            email: 'musteegunners@gmail.com',
            campus: schoolProfile.address || 'Kasuwan Magani Campus',
          }
        : {
            id: 'super_admin_abubakar',
            role: 'super_admin',
            name: schoolProfile.mudirName || 'Principal Abubakar Alhassan',
            arabicName: 'المدير أبو بكر الحسن',
            title: 'Mudir / Head of College',
            email: schoolProfile.email || 'mudir@kulliyyat.edu.ng',
            campus: schoolProfile.address || 'Kasuwan Magani Campus',
          };
      onLoginSuccess(superUser);
    } else {
      setAdminError(
        'Invalid administrator credentials. Please check your username/email and master password.'
      );
    }
  };

  // Handle Teacher Sign In with Phone & Password
  const handleTeacherSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSignInError(null);
    setUnactivatedTeacher(null);

    if (teachers.length === 0) {
      setTeacherSignInError('No faculty accounts exist. Please contact Principal Abubakar Alhassan to register your profile.');
      return;
    }

    const teacher = matchTeacherByPhone(teachers, teacherPhoneInput);
    if (!teacher) {
      setTeacherSignInError(
        `No registered teacher found with phone "${teacherPhoneInput.trim()}". Please ensure the Mudir has enrolled your phone number.`
      );
      return;
    }

    // Check if teacher has not created a password yet
    const hasPassword = Boolean(teacher.password || (teacher.hasSetPassword && teacher.password));
    if (!hasPassword && !teacher.pin) {
      setUnactivatedTeacher(teacher);
      setTeacherSignInError(
        `Welcome, ${teacher.fullName}! You have not created your password yet. Click below to create your password using your phone.`
      );
      return;
    }

    const entered = teacherPasswordInput.trim();
    const isMasterPass =
      entered === 'Newnew @2020' ||
      entered === 'Newnew@2020' ||
      entered === 'Kulliyyat@2026' ||
      entered === '2026' ||
      entered === '1984';

    const isMatch =
      isMasterPass ||
      (teacher.password && entered === teacher.password) ||
      (teacher.pin && entered === teacher.pin);

    if (isMatch) {
      const teacherClass = classes.find((c) => c.id === teacher.assignedClassId);
      const authUser: AuthUser = {
        id: teacher.id,
        role: 'teacher',
        name: teacher.fullName,
        arabicName: teacher.arabicName,
        title: teacherClass ? `Form Teacher • ${teacherClass.name}` : 'Subject Instructor',
        email: teacher.email,
        staffId: teacher.staffId,
        assignedClassId: teacher.assignedClassId,
        assignedSubjectIds: teacher.assignedSubjectIds,
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(authUser);
    } else {
      setTeacherSignInError('Incorrect password. If you forgot your password, you can reset it via your phone below.');
    }
  };

  // Handle Teacher Account Activation / Create Password
  const handleTeacherCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    setActivationSuccess(null);

    const teacher = matchedActivationTeacher;
    if (!teacher) {
      setActivationError(
        'Please enter a valid registered phone number or Staff ID enrolled by the school.'
      );
      return;
    }

    if (newPassword.trim().length < 4) {
      setActivationError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setActivationError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Save newly created password
    const updatedTeacher: Teacher = {
      ...teacher,
      password: newPassword.trim(),
      hasSetPassword: true,
      passwordUpdatedAt: new Date().toISOString(),
    };

    if (onUpdateTeacher) {
      onUpdateTeacher(updatedTeacher);
    }

    setActivationSuccess(
      `Password successfully set for ${teacher.fullName}! Logging you into the Faculty Portal...`
    );

    // Auto-login teacher directly
    setTimeout(() => {
      const teacherClass = classes.find((c) => c.id === updatedTeacher.assignedClassId);
      const authUser: AuthUser = {
        id: updatedTeacher.id,
        role: 'teacher',
        name: updatedTeacher.fullName,
        arabicName: updatedTeacher.arabicName,
        title: teacherClass ? `Form Teacher • ${teacherClass.name}` : 'Subject Instructor',
        email: updatedTeacher.email,
        staffId: updatedTeacher.staffId,
        assignedClassId: updatedTeacher.assignedClassId,
        assignedSubjectIds: updatedTeacher.assignedSubjectIds,
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(authUser);
    }, 600);
  };

  // Handle Student Sign In
  const handleStudentSignIn = (
    e: React.FormEvent,
    targetDestination: 'student_portal' | 'exam_center' = 'exam_center'
  ) => {
    e.preventDefault();
    setStudentSignInError(null);
    setUnactivatedStudent(null);

    if (students.length === 0) {
      setStudentSignInError('No students currently registered in the database. Please register students first.');
      return;
    }

    const regClean = studentRegInput.trim().toLowerCase();
    const student = students.find((s) => {
      return (
        s.regNo.toLowerCase() === regClean ||
        s.id.toLowerCase() === regClean ||
        s.fullName.toLowerCase() === regClean
      );
    });

    if (!student) {
      setStudentSignInError(`No student record found matching "${studentRegInput.trim()}". Please enter your exact Admission / Registration Number.`);
      return;
    }

    // Check if student has set password
    const hasPassword = Boolean(student.password || (student.hasSetPassword && student.password));
    if (!hasPassword && !student.pin) {
      setUnactivatedStudent(student);
      setStudentSignInError(
        `Welcome, ${student.fullName}! You have not created a password yet. Click "Create Password" below to activate your portal.`
      );
      return;
    }

    // Validate password or master pass or pin
    const enteredPass = studentPasswordInput.trim();
    const isMasterPass =
      enteredPass === 'Newnew @2020' ||
      enteredPass === 'Newnew@2020' ||
      enteredPass === 'Kulliyyat@2026' ||
      enteredPass === '2026' ||
      enteredPass === '1984';

    const isMatch =
      isMasterPass ||
      (student.password && enteredPass === student.password) ||
      (student.pin && enteredPass === student.pin);

    if (!isMatch) {
      setStudentSignInError('Incorrect student password. If you forgot your password, you can re-activate it using your registration details below.');
      return;
    }

    // Login student!
    const sClass = classes.find((c) => c.id === student.classId);
    const authUser: AuthUser = {
      id: student.id,
      role: 'student',
      name: student.fullName,
      arabicName: student.arabicName,
      title: sClass ? `Student • ${sClass.name}` : 'Student',
      studentId: student.id,
      regNo: student.regNo,
      assignedClassId: student.classId,
      campus: schoolProfile.address || 'Kasuwan Magani Campus',
    };
    onLoginSuccess(authUser, targetDestination);
  };

  // Handle Student Activation / Password Setup
  const handleStudentActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentActivationError(null);
    setStudentActivationSuccess(null);

    const regClean = studentActivationReg.trim().toLowerCase();
    const phoneClean = studentActivationPhone.replace(/\D/g, '');

    const student = students.find((s) => {
      const matchReg =
        s.regNo.toLowerCase() === regClean ||
        s.id.toLowerCase() === regClean ||
        s.fullName.toLowerCase() === regClean;
      if (!matchReg) return false;

      // If guardian phone is provided, verify matching phone digits
      if (phoneClean.length >= 7) {
        const studentGuardianClean = (s.guardianPhone || '').replace(/\D/g, '');
        return (
          studentGuardianClean.includes(phoneClean) ||
          phoneClean.includes(studentGuardianClean) ||
          studentGuardianClean.endsWith(phoneClean.slice(-7)) ||
          phoneClean.endsWith(studentGuardianClean.slice(-7))
        );
      }
      return true;
    });

    if (!student) {
      setStudentActivationError(
        'Student Registration Number or Guardian Phone could not be verified. Please check your details or consult the school administrator.'
      );
      return;
    }

    if (studentNewPass.trim().length < 4) {
      setStudentActivationError('New password must be at least 4 characters long.');
      return;
    }

    if (studentNewPass !== studentConfirmPass) {
      setStudentActivationError('New password and confirmation do not match.');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      password: studentNewPass.trim(),
      hasSetPassword: true,
      passwordUpdatedAt: new Date().toISOString(),
    };

    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
    }

    setStudentActivationSuccess(`Password successfully set for ${student.fullName}! Accessing your Student Dashboard...`);

    setTimeout(() => {
      const sClass = classes.find((c) => c.id === updatedStudent.classId);
      const authUser: AuthUser = {
        id: updatedStudent.id,
        role: 'student',
        name: updatedStudent.fullName,
        arabicName: updatedStudent.arabicName,
        title: sClass ? `Student • ${sClass.name}` : 'Student',
        studentId: updatedStudent.id,
        regNo: updatedStudent.regNo,
        assignedClassId: updatedStudent.classId,
        campus: schoolProfile.address || 'Kasuwan Magani Campus',
      };
      onLoginSuccess(authUser);
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-3 sm:px-6 animate-fade-in w-full">
      {/* Brand & Security Header */}
      <div className="text-center max-w-xl mb-5 sm:mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-lg mb-3 ring-4 ring-emerald-100">
          <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {schoolProfile.name}
        </h1>
        <div className="text-sm sm:text-base font-semibold text-emerald-800 font-arabic mt-0.5" dir="rtl">
          {schoolProfile.arabicName}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
          <School className="w-3.5 h-3.5 text-emerald-700" />
          <span>{schoolProfile.address || 'Kasuwan Magani Campus'}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">Kaduna State</span>
        </div>
      </div>

      {/* 1-Click Quick Demo Sign In Bar */}
      <div className="w-full max-w-md mb-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 rounded-3xl border border-emerald-500/30 shadow-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>1-Click Quick Demo Portals</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-200 bg-emerald-800/80 px-2 py-0.5 rounded-full border border-emerald-600/40">
            Instant Access
          </span>
        </div>
        <p className="text-[11px] text-emerald-100/80 mb-3 leading-relaxed">
          Tap any account below to explore the academic system with pre-populated records:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('super_admin')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-400/40 text-left transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Principal / Mudir</span>
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">Principal Abubakar (Teacher Mandate)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('secretary')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-amber-600/30 border border-white/10 hover:border-amber-400/40 text-left transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <UserCheck className="w-3.5 h-3.5" />
              <span>School Secretary</span>
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">Malama Fatima (Student Reg. Mandate)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('teacher')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-400/40 text-left transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Faculty Teacher</span>
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">
              {teachers[0]?.fullName || 'Mustapha Danmari'} (I'dadi 1)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('accountant')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-400/40 text-left transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
              <Receipt className="w-3.5 h-3.5" />
              <span>School Bursar</span>
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">Mallam Usman (Accounts)</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('student')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-400/40 text-left transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">
              {students[0]?.fullName || 'Zuhriyya Nura'} (I'dadi 1)
            </div>
          </button>
        </div>

        {/* Dedicated Direct CBT Exam Center Quick Entry */}
        <div className="mt-2.5 pt-2 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={() => handleQuickLogin('student_cbt')}
            className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-emerald-600/20 hover:from-amber-500/30 hover:to-emerald-600/30 border border-amber-400/40 text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Award className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                  <span>Student CBT Exam Center</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase">
                    Take Exam
                  </span>
                </div>
                <div className="text-[10px] text-emerald-200/90 truncate">
                  1-Click Candidate Access: {students[0]?.fullName || 'Zuhriyya Nura'} ({students[0]?.regNo || 'KUL-2026-0001'})
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Role Selection Switcher */}
        <div className="grid grid-cols-5 p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            id="tab-btn-teacher"
            onClick={() => {
              setActiveTab('teacher');
              setTeacherSignInError(null);
            }}
            className={`py-2 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'teacher'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Teacher</span>
          </button>

          <button
            type="button"
            id="tab-btn-secretary"
            onClick={() => {
              setActiveTab('secretary');
              setSecretaryError(null);
            }}
            className={`py-2 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'secretary'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Secretary</span>
          </button>

          <button
            type="button"
            id="tab-btn-accountant"
            onClick={() => {
              setActiveTab('accountant');
              setAccountantError(null);
            }}
            className={`py-2 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'accountant'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Bursar</span>
          </button>

          <button
            type="button"
            id="tab-btn-student"
            onClick={() => {
              setActiveTab('student');
              setStudentSignInError(null);
            }}
            className={`py-2 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'student'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">Student</span>
          </button>

          <button
            type="button"
            id="tab-btn-super-admin"
            onClick={() => {
              setActiveTab('super_admin');
              setAdminError(null);
            }}
            className={`py-2 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'super_admin'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Principal</span>
          </button>
        </div>

        {/* Form Area */}
        <div className="p-5 sm:p-7">
          {activeTab === 'teacher' ? (
            /* Teacher Portal */
            <div>
              {teachers.length === 0 ? (
                /* No Teachers Registered State */
                <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-2xs">
                    <UserCheck className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Faculty Accounts Enrolled</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Faculty members have not yet been registered by the administration. Principal Abubakar Alhassan can enroll staff and their phone numbers under the <strong>Faculty Teachers</strong> tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('super_admin')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Sign in as Super User / Mudir</span>
                  </button>
                </div>
              ) : teacherMode === 'signin' ? (
                /* Mode A: Teacher Phone & Password Sign In */
                <div className="space-y-5">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-emerald-950">Teacher Mobile Access</h3>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        Sign in using your registered phone number and your personal password to enter student marks and attendance.
                      </p>
                    </div>
                  </div>

                  {teacherSignInError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2 animate-shake">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{teacherSignInError}</span>
                      </div>
                      {unactivatedTeacher && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivationPhoneInput(unactivatedTeacher.phone || teacherPhoneInput);
                            setTeacherMode('create_password');
                            setTeacherSignInError(null);
                          }}
                          className="mt-1 w-full py-2 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Create Password for {unactivatedTeacher.fullName}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleTeacherSignIn} className="space-y-4">
                    <div>
                      <label htmlFor={teacherPhoneId} className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Phone Number or Staff ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <input
                          id={teacherPhoneId}
                          type="tel"
                          inputMode="tel"
                          required
                          value={teacherPhoneInput}
                          onChange={(e) => setTeacherPhoneInput(e.target.value)}
                          placeholder="e.g. 0803 123 4567 or +234..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Use the phone number registered by the school administration.
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor={teacherPassId} className="block text-xs font-bold text-slate-700">
                          Your Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setActivationPhoneInput(teacherPhoneInput);
                            setTeacherMode('create_password');
                            setTeacherSignInError(null);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          Create or Reset Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id={teacherPassId}
                          type={showTeacherPassword ? 'text' : 'password'}
                          required
                          value={teacherPasswordInput}
                          onChange={(e) => setTeacherPasswordInput(e.target.value)}
                          placeholder="Enter your personal password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 text-[11px]">Demo Faculty:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const demoPhone = teachers[0]?.phone || '+2348130366258';
                          const demoPass = teachers[0]?.password || '2026';
                          setTeacherPhoneInput(demoPhone);
                          setTeacherPasswordInput(demoPass);
                        }}
                        className="text-[11px] font-bold text-emerald-800 hover:underline hover:text-emerald-950 cursor-pointer"
                      >
                        Autofill ({teachers[0]?.phone || '08130366258'} / {teachers[0]?.password || '2026'})
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        id="btn-teacher-signin"
                        className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-300" />
                        <span>Sign In to Teacher Portal</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>

                  {/* First Time / Phone Activation Switcher */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <p className="text-xs text-slate-600">
                      <strong>First time on your phone?</strong>
                    </p>
                    <button
                      type="button"
                      id="btn-switch-create-password"
                      onClick={() => {
                        setActivationPhoneInput(teacherPhoneInput);
                        setTeacherMode('create_password');
                        setTeacherSignInError(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Activate Account & Create Your Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode B: Teacher Account Activation & Create Password */
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherMode('signin');
                        setActivationError(null);
                        setActivationSuccess(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Step 2: Create Password
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                    <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Create Teacher Password via Phone</span>
                    </h3>
                    <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                      Enter the phone number registered for you by the school. Once verified, choose your personal secure password for future logins.
                    </p>
                  </div>

                  {activationError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  {activationSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{activationSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleTeacherCreatePassword} className="space-y-4">
                    <div>
                      <label htmlFor={activationPhoneId} className="block text-xs font-bold text-slate-700 mb-1">
                        Your Registered Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <input
                          id={activationPhoneId}
                          type="tel"
                          inputMode="tel"
                          required
                          value={activationPhoneInput}
                          onChange={(e) => setActivationPhoneInput(e.target.value)}
                          placeholder="e.g. 0803 123 4567 or +234..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Real-time Teacher Verification Card */}
                    {matchedActivationTeacher ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Faculty Profile Verified</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                            {matchedActivationTeacher.staffId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-800">
                          <div className="font-bold text-slate-900 text-sm">
                            {matchedActivationTeacher.fullName}
                          </div>
                          {matchedActivationTeacher.arabicName && (
                            <div className="font-arabic text-emerald-800 text-xs" dir="rtl">
                              {matchedActivationTeacher.arabicName}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-2">
                            <span>Form Class: <strong>{activationTeacherClass ? activationTeacherClass.name : 'General Faculty'}</strong></span>
                            <span>•</span>
                            <span>{matchedActivationTeacher.qualification}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      activationPhoneInput.trim().length > 3 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Searching registered faculty for phone: {activationPhoneInput}...</span>
                        </div>
                      )
                    )}

                    {/* New Password Fields */}
                    <div>
                      <label htmlFor={newPassId} className="block text-xs font-bold text-slate-700 mb-1">
                        Choose Your Personal Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id={newPassId}
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 4 characters"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor={confirmPassId} className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Your Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id={confirmPassId}
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type your password"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        id="btn-submit-activate-password"
                        disabled={!matchedActivationTeacher}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                          matchedActivationTeacher
                            ? 'bg-emerald-800 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.99] cursor-pointer'
                            : 'bg-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <KeyRound className="w-4 h-4 text-emerald-300" />
                        <span>Save Password & Enter Faculty Portal</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : activeTab === 'student' ? (
            /* Student Portal */
            <div>
              {students.length === 0 ? (
                /* No Students Registered State */
                <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-2xs">
                    <BookOpen className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Student Records Found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      No students have been enrolled in the database yet. The administration or form teachers can register student profiles under the <strong>Students</strong> tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('teacher')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-300" />
                    <span>Switch to Teacher Portal</span>
                  </button>
                </div>
              ) : studentMode === 'signin' ? (
                /* Mode A: Student Sign In */
                <div className="space-y-5">
                  <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-700 text-white shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-teal-950">Student Academic Portal</h3>
                      <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                        Sign in with your Admission / Registration Number (e.g. <strong>KT-2026-001</strong>) and password to check your scores, weekly assignments, and print terminal report cards.
                      </p>
                    </div>
                  </div>

                  {studentSignInError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div>{studentSignInError}</div>
                        {unactivatedStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentActivationReg(unactivatedStudent.regNo);
                              setStudentActivationPhone(unactivatedStudent.guardianPhone || '');
                              setStudentMode('activate');
                              setStudentSignInError(null);
                            }}
                            className="mt-2 text-xs font-bold text-teal-900 underline hover:text-teal-950 flex items-center gap-1"
                          >
                            <span>Click here to create password for {unactivatedStudent.fullName} &rarr;</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => handleStudentSignIn(e, 'exam_center')} className="space-y-4">
                    <div>
                      <label htmlFor={studentRegId} className="block text-xs font-bold text-slate-700 mb-1">
                        Admission / Registration Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id={studentRegId}
                          type="text"
                          value={studentRegInput}
                          onChange={(e) => setStudentRegInput(e.target.value)}
                          placeholder="e.g. KT-2026-001 or Student Full Name"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor={studentPassId} className="block text-xs font-bold text-slate-700">
                          Student Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentMode('activate');
                            setStudentSignInError(null);
                          }}
                          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                        >
                          New student / Create password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id={studentPassId}
                          type={showStudentPassword ? 'text' : 'password'}
                          value={studentPasswordInput}
                          onChange={(e) => setStudentPasswordInput(e.target.value)}
                          placeholder="Enter your student password"
                          required
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 text-[11px]">Demo Student:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const demoReg = students[0]?.regNo || 'KUL-2026-0001';
                          const demoPass = students[0]?.password || '2026';
                          setStudentRegInput(demoReg);
                          setStudentPasswordInput(demoPass);
                        }}
                        className="text-[11px] font-bold text-teal-800 hover:underline hover:text-teal-950 cursor-pointer"
                      >
                        Autofill ({students[0]?.regNo || 'KUL-2026-0001'} / {students[0]?.password || '2026'})
                      </button>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        id="btn-submit-student-cbt"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-[#4E2D17] to-emerald-800 hover:from-amber-500 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>Sign In to CBT Exam Center (Take Exam)</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>

                      <button
                        type="button"
                        id="btn-submit-student-login"
                        onClick={(e) => handleStudentSignIn(e, 'student_portal')}
                        className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                        <span>Check Scores & Report Cards</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Mode B: Student Password Activation */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('signin');
                        setStudentActivationError(null);
                        setStudentActivationSuccess(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Student Login</span>
                    </button>
                    <span className="text-[11px] font-semibold text-teal-800">Password Activation</span>
                  </div>

                  {studentActivationSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{studentActivationSuccess}</span>
                    </div>
                  )}

                  {studentActivationError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{studentActivationError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStudentActivation} className="space-y-3.5">
                    <div>
                      <label htmlFor={studentActRegId} className="block text-xs font-bold text-slate-700 mb-1">
                        Student Admission / Reg Number
                      </label>
                      <input
                        id={studentActRegId}
                        type="text"
                        value={studentActivationReg}
                        onChange={(e) => setStudentActivationReg(e.target.value)}
                        placeholder="e.g. KT-2026-001"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor={studentActPhoneId} className="block text-xs font-bold text-slate-700 mb-1">
                        Guardian Registered Phone (Verification)
                      </label>
                      <input
                        id={studentActPhoneId}
                        type="text"
                        value={studentActivationPhone}
                        onChange={(e) => setStudentActivationPhone(e.target.value)}
                        placeholder="Parent / Guardian phone number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Matched Student Preview */}
                    {matchedActivationStudent && (
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/80 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-teal-950 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Student Verified: {matchedActivationStudent.fullName}</span>
                        </div>
                        <div className="text-[11px] text-teal-800">
                          Class: <strong>{activationStudentClass?.name || 'Class assigned'}</strong> • Reg: <strong>{matchedActivationStudent.regNo}</strong>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Create Password
                        </label>
                        <input
                          type={showStudentNewPass ? 'text' : 'password'}
                          value={studentNewPass}
                          onChange={(e) => setStudentNewPass(e.target.value)}
                          placeholder="At least 4 chars"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type={showStudentNewPass ? 'text' : 'password'}
                          value={studentConfirmPass}
                          onChange={(e) => setStudentConfirmPass(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <KeyRound className="w-4 h-4 text-teal-200" />
                        <span>Save Password & Access Student Dashboard</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : activeTab === 'secretary' ? (
            /* School Secretary & Admissions Form */
            <div className="space-y-5">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-800 text-white shrink-0 mt-0.5 shadow-2xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-amber-950">
                      Office of the School Secretary
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                      Admissions Desk
                    </span>
                  </div>
                  <div className="text-xs text-amber-800 font-medium mt-0.5">
                    Secretary: <strong>Malama Fatima Umar</strong> • Staff ID: <strong>SEC-2026-001</strong>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Mandated statutory desk for new student registration, academic year admissions, parent PIN credentials dispatch, and broadcasting official school circulars.
                  </p>
                </div>
              </div>

              {secretaryError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{secretaryError}</span>
                </div>
              )}

              <form onSubmit={handleSecretarySubmit} className="space-y-4">
                <div>
                  <label htmlFor={secretaryUserInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Staff ID, Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id={secretaryUserInputId}
                      type="text"
                      value={secretaryIdentifier}
                      onChange={(e) => setSecretaryIdentifier(e.target.value)}
                      placeholder="e.g. SEC-2026-001 or secretary@kulliyyat-tatbiq.edu.ng"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={secretaryPassInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Secretary Access Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id={secretaryPassInputId}
                      type={showSecretaryPassword ? 'text' : 'password'}
                      value={secretaryPassword}
                      onChange={(e) => setSecretaryPassword(e.target.value)}
                      placeholder="Enter secretary password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretaryPassword(!showSecretaryPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showSecretaryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600 text-[11px]">Demo Secretary Credentials:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSecretaryIdentifier('SEC-2026-001');
                      setSecretaryPassword('Secretary@2026');
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline hover:text-amber-900 cursor-pointer"
                  >
                    Quick Fill (Secretary@2026)
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-secretary-login"
                    className="w-full py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-amber-200" />
                    <span>Sign In to Secretary Admissions Desk</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'accountant' ? (
            /* Bursar & Accounts Form */
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-800 text-white shrink-0 mt-0.5 shadow-2xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Bursary & Financial Accounts
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                      Accountant
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 font-medium mt-0.5">
                    Bursar: <strong>Mallam Usman Bello</strong> • Staff ID: <strong>ACC-2026-001</strong>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    Access student school fee ledgers, register bank transfers & cash payments, issue official receipts, grant fee waivers, and manage school operating expenses.
                  </p>
                </div>
              </div>

              {accountantError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{accountantError}</span>
                </div>
              )}

              <form onSubmit={handleAccountantSubmit} className="space-y-4">
                <div>
                  <label htmlFor={accountantUserInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Staff ID, Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id={accountantUserInputId}
                      type="text"
                      value={accountantIdentifier}
                      onChange={(e) => setAccountantIdentifier(e.target.value)}
                      placeholder="e.g. ACC-2026-001 or bursar@kulliyyat-tatbiq.edu.ng"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={accountantPassInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Bursar Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id={accountantPassInputId}
                      type={showAccountantPassword ? 'text' : 'password'}
                      value={accountantPassword}
                      onChange={(e) => setAccountantPassword(e.target.value)}
                      placeholder="Enter bursar password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountantPassword(!showAccountantPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showAccountantPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 text-[11px]">Demo Bursar Credentials:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountantIdentifier('ACC-2026-001');
                      setAccountantPassword('Bursar@2026');
                    }}
                    className="text-[11px] font-bold text-emerald-800 hover:underline hover:text-emerald-900 cursor-pointer"
                  >
                    Quick Fill (Bursar@2026)
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-accountant-login"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Receipt className="w-4 h-4 text-emerald-300" />
                    <span>Sign In to Bursary Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Super Admin / Mudir Form */
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Administrative & Developer Control
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900">
                      Super Admin
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 font-medium mt-0.5">
                    Mudir: <strong>{schoolProfile.mudirName || 'Principal Abubakar Alhassan'}</strong> • Lead Developer: <strong>Mustapha Danmari</strong>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    Mandated executive authority over Faculty Teacher Registration & Designation, academic class allocations, scoring algorithms, and terminal report card authorization.
                  </p>
                </div>
              </div>

              {adminError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label htmlFor={adminUserInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id={adminUserInputId}
                      type="text"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="musteegunners@gmail.com or admin"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={adminPassInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Master Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id={adminPassInputId}
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter master password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 text-[11px]">Demo Admin:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminIdentifier('admin');
                      setAdminPassword('Newnew@2020');
                    }}
                    className="text-[11px] font-bold text-emerald-800 hover:underline hover:text-emerald-950 cursor-pointer"
                  >
                    Autofill (admin / Newnew@2020)
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-admin-login"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Administration Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-0.5">
          <div>Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah • {schoolProfile.address || 'Kasuwan Magani Campus'}</div>
          <div className="text-[10px] text-slate-400 font-medium">Developed by <strong className="text-emerald-800">Mustapha Danmari</strong></div>
        </div>
      </div>
    </div>
  );
};
