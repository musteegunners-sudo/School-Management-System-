import React, { useState } from 'react';
import {
  Exam,
  ExamQuestion,
  ExamSubmission,
  Teacher,
  SchoolClass,
  Subject,
  Student,
  ScoreRecord,
  Term,
  AcademicSession,
  AuthUser,
  ObjOptionId,
} from '../../types';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  Search,
  Trash2,
  Edit,
  Eye,
  Send,
  FileText,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  GraduationCap,
  Save,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Scale,
  FileUp,
  Keyboard,
} from 'lucide-react';
import { useArabicKeyboard } from '../../context/ArabicKeyboardContext';

interface ExamCenterTeacherViewProps {
  currentUser: AuthUser | null;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  exams: Exam[];
  examSubmissions: ExamSubmission[];
  currentSession: AcademicSession;
  currentTerm: Term;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onSyncExamScoreToGradebook: (submission: ExamSubmission) => void;
}

export const ExamCenterTeacherView: React.FC<ExamCenterTeacherViewProps> = ({
  currentUser,
  teachers,
  classes,
  subjects,
  students,
  exams,
  examSubmissions,
  currentSession,
  currentTerm,
  onSaveExam,
  onDeleteExam,
  onSyncExamScoreToGradebook,
}) => {
  const { toggleKeyboard: toggleArabicKeyboard, isOpen: isArabicKeyboardOpen } = useArabicKeyboard();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const currentTeacher = teachers.find((t) => t.id === currentUser?.id || t.email === currentUser?.email);

  // Filter accessible subjects and classes for the teacher (with fallback to all school subjects/classes so teachers are never blocked)
  const rawAccessibleSubjects = isSuperAdmin
    ? subjects
    : subjects.filter((s) => currentTeacher?.assignedSubjectIds?.includes(s.id));
  const accessibleSubjects = rawAccessibleSubjects.length > 0 ? rawAccessibleSubjects : subjects;

  const rawAccessibleClasses = isSuperAdmin
    ? classes
    : classes.filter((c) => c.assignedTeacherId === currentTeacher?.id || c.id === currentTeacher?.assignedClassId);
  const accessibleClasses = rawAccessibleClasses.length > 0 ? rawAccessibleClasses : classes;

  // Filter state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'exams_list' | 'submissions'>('exams_list');
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<string | null>(null);

  // Exam Editor Modal state
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form Fields
  const [examTitle, setExamTitle] = useState('');
  const [examArabicTitle, setExamArabicTitle] = useState('');
  const [examLocalTitle, setExamLocalTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState<string>(accessibleSubjects[0]?.id || subjects[0]?.id || '');
  const [examClassId, setExamClassId] = useState<string>(accessibleClasses[0]?.id || classes[0]?.id || '');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [totalMarks, setTotalMarks] = useState<number>(60);
  const [instructions, setInstructions] = useState<string>(
    'Attempt all objective questions. Select the single best answer (A, B, C, or D).'
  );
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [syncStatusMap, setSyncStatusMap] = useState<Record<string, boolean>>({});
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

  // Filtered exams
  const filteredExams = exams.filter((e) => {
    if (!isSuperAdmin && currentTeacher) {
      // Teacher only sees exams they created or for their assigned subjects
      const isTheirExam = e.teacherId === currentTeacher.id || currentTeacher.assignedSubjectIds?.includes(e.subjectId);
      if (!isTheirExam) return false;
    }
    if (selectedSubjectFilter !== 'all' && e.subjectId !== selectedSubjectFilter) return false;
    if (selectedClassFilter !== 'all' && e.classId !== selectedClassFilter) return false;
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setExamTitle(`Third Term Examination - ${accessibleSubjects[0]?.name || 'Islamic Studies'}`);
    setExamArabicTitle('اختبار الفصل الثالث');
    setExamLocalTitle('Gwajin Zangon Karatu Na Uku');
    setExamSubjectId(accessibleSubjects[0]?.id || subjects[0]?.id || '');
    setExamClassId(accessibleClasses[0]?.id || classes[0]?.id || '');
    setExamDate(new Date().toISOString().split('T')[0]);
    setDurationMinutes(30);
    setTotalMarks(60);
    setInstructions('Attempt all objective questions. Select the single best answer (A, B, C, or D).');
    setIsPublished(true);
    setQuestions([
      {
        id: `q_${Date.now()}_1`,
        questionNumber: 1,
        text: 'What is the first pillar of Islam?',
        arabicText: 'ما هو الركن الأول من أركان الإسلام؟',
        options: [
          { id: 'A', text: 'Shahadah (Testimony of Faith)', arabicText: 'الشهادتان' },
          { id: 'B', text: 'Salah (Daily Prayer)', arabicText: 'إقام الصلاة' },
          { id: 'C', text: 'Zakah (Almsgiving)', arabicText: 'إيتاء الزكاة' },
          { id: 'D', text: 'Sawm (Fasting)', arabicText: 'صوم رمضان' },
        ],
        correctOptionId: 'A',
        marks: 10,
        explanation: 'The first and foundational pillar of Islam is the Shahadatayn.',
      },
    ]);
    setShowEditorModal(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title);
    setExamArabicTitle(exam.arabicTitle || '');
    setExamLocalTitle(exam.localTitle || '');
    setExamSubjectId(exam.subjectId);
    setExamClassId(exam.classId);
    setExamDate(exam.date);
    setDurationMinutes(exam.durationMinutes);
    setTotalMarks(exam.totalMarks || 60);
    setInstructions(exam.instructions || '');
    setIsPublished(exam.isPublished);
    setQuestions(exam.questions || []);
    setShowEditorModal(true);
  };

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: ExamQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: nextNum,
      text: '',
      arabicText: '',
      options: [
        { id: 'A', text: '', arabicText: '' },
        { id: 'B', text: '', arabicText: '' },
        { id: 'C', text: '', arabicText: '' },
        { id: 'D', text: '', arabicText: '' },
      ],
      correctOptionId: 'A',
      marks: Math.max(1, Math.floor(totalMarks / Math.max(1, nextNum))),
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Partial<ExamQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  const handleUpdateOption = (
    qIndex: number,
    optId: ObjOptionId,
    field: 'text' | 'arabicText' | 'localText',
    val: string
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      q.options = q.options.map((opt) => (opt.id === optId ? { ...opt, [field]: val } : opt));
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index).map((q, i) => ({ ...q, questionNumber: i + 1 })));
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    if (!target) return;
    const duplicated: ExamQuestion = {
      ...target,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: questions.length + 1,
      options: target.options.map((o) => ({ ...o })),
    };
    setQuestions((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    });
  };

  const handleAutoBalanceMarks = () => {
    if (questions.length === 0) return;
    const marksPerQ = Math.max(1, Math.floor(totalMarks / questions.length));
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        marks: marksPerQ,
      }))
    );
  };

  const handleParseAndImportBulkQuestions = () => {
    if (!bulkImportText.trim()) return;
    const rawBlocks = bulkImportText.split(/\n\s*\n/);
    const newQuestions: ExamQuestion[] = [];

    rawBlocks.forEach((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      let qText = '';
      const options: { id: ObjOptionId; text: string; arabicText?: string }[] = [];
      let correctId: ObjOptionId = 'A';

      lines.forEach((line) => {
        const optMatch = line.match(/^([A-Da-d])[\)\.\:\-\]]\s*(.*)$/);
        const ansMatch = line.match(/^(?:Answer|Correct|Ans|Key)[\:\s\-]+([A-Da-d])/i);
        const qMatch = line.match(/^(?:Q\d*[\.\:]?|\d+[\.\:]?|Question[\:\s\d]*)\s*(.*)$/i);

        if (ansMatch) {
          correctId = ansMatch[1].toUpperCase() as ObjOptionId;
        } else if (optMatch) {
          options.push({
            id: optMatch[1].toUpperCase() as ObjOptionId,
            text: optMatch[2].trim(),
          });
        } else if (!qText) {
          qText = qMatch ? qMatch[1].trim() : line;
        } else {
          qText += ' ' + line;
        }
      });

      // Ensure options A, B, C, D exist
      const defaultIds: ObjOptionId[] = ['A', 'B', 'C', 'D'];
      defaultIds.forEach((id) => {
        if (!options.some((o) => o.id === id)) {
          options.push({ id, text: `Option ${id}` });
        }
      });
      options.sort((a, b) => a.id.localeCompare(b.id));

      if (qText) {
        newQuestions.push({
          id: `q_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          questionNumber: questions.length + newQuestions.length + 1,
          text: qText,
          options,
          correctOptionId: correctId,
          marks: 10,
        });
      }
    });

    if (newQuestions.length > 0) {
      setQuestions((prev) => {
        const merged = [...prev, ...newQuestions];
        const marksPerQ = Math.max(1, Math.floor(totalMarks / Math.max(1, merged.length)));
        return merged.map((q, idx) => ({ ...q, questionNumber: idx + 1, marks: marksPerQ }));
      });
      setBulkImportText('');
      setShowBulkImportModal(false);
    } else {
      alert('Could not detect any valid objective questions. Please follow the format:\n1. Question text\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\nAnswer: B');
    }
  };

  const handleQuickLoadQuestions = (
    preset:
      | 'islamic_studies'
      | 'quran'
      | 'arabic'
      | 'hausa'
      | 'maths'
      | 'science'
      | 'english'
      | 'social_civic'
      | 'ict'
      | 'biology'
      | 'economics'
  ) => {
    if (preset === 'islamic_studies') {
      const isSub = accessibleSubjects.find((s) => s.category === 'Islamic Studies' || s.name.toLowerCase().includes('islam') || s.name.toLowerCase().includes('fiqh'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Islamic Studies & Fiqh`);
      setExamArabicTitle('اختبار الفصل الثالث - الدراسات الإسلامية');
      setQuestions([
        {
          id: `q_is_1`,
          questionNumber: 1,
          text: 'How many compulsory pillars of Islam are there?',
          arabicText: 'كم عدد أركان الإسلام؟',
          options: [
            { id: 'A', text: '3 Pillars', arabicText: '٣ أركان' },
            { id: 'B', text: '5 Pillars', arabicText: '٥ أركان' },
            { id: 'C', text: '6 Pillars', arabicText: '٦ أركان' },
            { id: 'D', text: '7 Pillars', arabicText: '٧ أركان' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Islam is built on five pillars: Shahadah, Salah, Zakat, Sawm, and Hajj.',
        },
        {
          id: `q_is_2`,
          questionNumber: 2,
          text: 'Which daily obligatory prayer is performed before sunrise?',
          arabicText: 'أي صلاة تؤدى قبل طلوع الشمس؟',
          options: [
            { id: 'A', text: 'Fajr (Subh)', arabicText: 'صلاة الفجر' },
            { id: 'B', text: 'Dhuhr', arabicText: 'صلاة الظهر' },
            { id: 'C', text: 'Asr', arabicText: 'صلاة العصر' },
            { id: 'D', text: 'Isha', arabicText: 'صلاة العشاء' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Salat al-Fajr is the dawn prayer performed before sunrise.',
        },
        {
          id: `q_is_3`,
          questionNumber: 3,
          text: 'In which holy month is compulsory fasting (Sawm) observed?',
          arabicText: 'في أي شهر يجب صيام الفريضة؟',
          options: [
            { id: 'A', text: 'Muharram', arabicText: 'المحرم' },
            { id: 'B', text: 'Rajab', arabicText: 'رجب' },
            { id: 'C', text: 'Ramadan', arabicText: 'رمضان' },
            { id: 'D', text: 'Dhul-Hijjah', arabicText: 'ذو الحجة' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: 'Fasting the entire month of Ramadan is the fourth pillar of Islam.',
        },
        {
          id: `q_is_4`,
          questionNumber: 4,
          text: 'What is the purification of wealth given to the poor and needy called?',
          arabicText: 'ما هو الحق الواجب في المال للفقراء والمساكين؟',
          options: [
            { id: 'A', text: 'Zakah', arabicText: 'الزكاة' },
            { id: 'B', text: 'Kafarah', arabicText: 'الكفارة' },
            { id: 'C', text: 'Fidyah', arabicText: 'الفدية' },
            { id: 'D', text: 'Qard Hasan', arabicText: 'القرض الحسن' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Zakah is the third pillar of Islam and purifies wealth.',
        },
        {
          id: `q_is_5`,
          questionNumber: 5,
          text: 'Who was the first Khalifah (Caliph) of Islam after Prophet Muhammad (SAW)?',
          arabicText: 'من هو أول الخلفاء الراشدين رضي الله عنهم؟',
          options: [
            { id: 'A', text: 'Umar ibn Al-Khattab', arabicText: 'عمر بن الخطاب' },
            { id: 'B', text: 'Abu Bakr As-Siddiq', arabicText: 'أبو بكر الصديق' },
            { id: 'C', text: 'Uthman ibn Affan', arabicText: 'عثمان بن عفان' },
            { id: 'D', text: 'Ali ibn Abi Talib', arabicText: 'علي بن أبي طالب' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Abu Bakr As-Siddiq (RA) was elected as the first successor and Khalifah.',
        },
      ]);
    } else if (preset === 'quran') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_quran' || s.name.toLowerCase().includes('qur'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Al-Qur'an & Tajweed`);
      setExamArabicTitle('اختبار الفصل الثالث - القرآن الكريم والتجويد');
      setQuestions([
        {
          id: `q_preset_1`,
          questionNumber: 1,
          text: 'What rule of Nun Sakinah applies when followed by the letter Ba (ب)?',
          arabicText: 'ما هو حكم النون الساكنة إذا جاء بعدها حرف الباء (ب)؟',
          options: [
            { id: 'A', text: 'Izhar Halqi', arabicText: 'إظهار حلقي' },
            { id: 'B', text: 'Iqlab', arabicText: 'إقلاب' },
            { id: 'C', text: 'Idgham with Ghunnah', arabicText: 'إدغام بغنة' },
            { id: 'D', text: 'Ikhfa', arabicText: 'إخفاء حقيقي' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Nun Sakinah or Tanween followed by Ba turns into Meem with Ghunnah (Iqlab).',
        },
        {
          id: `q_preset_2`,
          questionNumber: 2,
          text: 'How many letters form the rule of Qalqalah (قُطْبُ جَدّ)?',
          arabicText: 'كم عدد حروف القلقلة (قطب جد)؟',
          options: [
            { id: 'A', text: '4 letters', arabicText: '٤ أحرف' },
            { id: 'B', text: '5 letters (Qaf, Taa, Baa, Jeem, Dal)', arabicText: '٥ أحرف (ق، ط، ب، ج، د)' },
            { id: 'C', text: '6 letters', arabicText: '٦ أحرف' },
            { id: 'D', text: '7 letters', arabicText: '٧ أحرف' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'The five Qalqalah letters are Qaf, Taa, Baa, Jeem, and Dal.',
        },
        {
          id: `q_preset_3`,
          questionNumber: 3,
          text: 'What is the duration of Madd Tabi\'i (Natural Prolongation)?',
          arabicText: 'ما هو مقدار المد الطبيعي؟',
          options: [
            { id: 'A', text: '1 Harakah', arabicText: 'حركة واحدة' },
            { id: 'B', text: '2 Harakat (Two counts)', arabicText: 'حركتان' },
            { id: 'C', text: '4 Harakat', arabicText: '٤ حركات' },
            { id: 'D', text: '6 Harakat', arabicText: '٦ حركات' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Natural prolongation is read for the duration of two Harakat.',
        },
        {
          id: `q_preset_4`,
          questionNumber: 4,
          text: 'Which of the following is an Izhar Halqi letter?',
          arabicText: 'أي من الحروف الآتية هو من حروف الإظهار الحلقي؟',
          options: [
            { id: 'A', text: 'Letter Ayn (ع)', arabicText: 'حرف العين' },
            { id: 'B', text: 'Letter Seen (س)', arabicText: 'حرف السين' },
            { id: 'C', text: 'Letter Fa (ف)', arabicText: 'حرف الفاء' },
            { id: 'D', text: 'Letter Kaf (ك)', arabicText: 'حرف الكاف' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Ayn is one of the six throat letters of Izhar Halqi.',
        },
        {
          id: `q_preset_5`,
          questionNumber: 5,
          text: 'What is the meaning of Ghunnah in Tajweed?',
          arabicText: 'ما معنى الغنة في علم التجويد؟',
          options: [
            { id: 'A', text: 'A heavy throat sound', arabicText: 'صوت من الحلق' },
            { id: 'B', text: 'A pleasant nasal resonance from the Khaishum', arabicText: 'صوت رخيم يخرج من الخيشوم' },
            { id: 'C', text: 'Stopping between verses', arabicText: 'الوقف بين الآيات' },
            { id: 'D', text: 'Speeding up recitation', arabicText: 'الإسراع في القراءة' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Ghunnah is the resonant nasal sound produced from the Khaishum.',
        },
      ]);
    } else if (preset === 'arabic') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_arabic' || s.name.toLowerCase().includes('arab'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Arabic Language & Grammar`);
      setExamArabicTitle('اختبار الفصل الثالث - اللغة العربية والنحو');
      setQuestions([
        {
          id: `q_ar_1`,
          questionNumber: 1,
          text: 'What are the three parts of speech in the Arabic language?',
          arabicText: 'ما هي أقسام الكلمة في اللغة العربية؟',
          options: [
            { id: 'A', text: 'Ism, Fi\'l, Harf (Noun, Verb, Particle)', arabicText: 'اسم وفعل وحرف' },
            { id: 'B', text: 'Mubtada, Khabar, Sifah', arabicText: 'مبتدأ وخبر وصفة' },
            { id: 'C', text: 'Madhy, Mudhari\', Amr', arabicText: 'ماض ومضارع وأمر' },
            { id: 'D', text: 'Mufrad, Muthanna, Jam\'', arabicText: 'مفرد ومثنى وجمع' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Words in Arabic are divided into Ism (Noun), Fi\'l (Verb), and Harf (Particle).',
        },
        {
          id: `q_ar_2`,
          questionNumber: 2,
          text: 'What is the primary sign of Raf\' (رفع) in a singular noun?',
          arabicText: 'ما هي علامة الرفع الأصلية في الاسم المفرد؟',
          options: [
            { id: 'A', text: 'Dammah (الضمة)', arabicText: 'الضمة' },
            { id: 'B', text: 'Fathah (الفتحة)', arabicText: 'الفتحة' },
            { id: 'C', text: 'Kasrah (الكسرة)', arabicText: 'الكسرة' },
            { id: 'D', text: 'Sukoon (السكون)', arabicText: 'السكون' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'The primary sign of Raf\' is the Dammah.',
        },
        {
          id: `q_ar_3`,
          questionNumber: 3,
          text: 'Translate the word "Al-Kitab" (الكتاب) into English:',
          arabicText: 'ما معنى كلمة "الكتاب" باللغة الإنجليزية؟',
          options: [
            { id: 'A', text: 'The Pen', arabicText: 'القلم' },
            { id: 'B', text: 'The Book', arabicText: 'الكتاب' },
            { id: 'C', text: 'The School', arabicText: 'المدرسة' },
            { id: 'D', text: 'The Teacher', arabicText: 'المعلم' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Al-Kitab means The Book.',
        },
        {
          id: `q_ar_4`,
          questionNumber: 4,
          text: 'Which tense does the verb "يَكْتُبُ" (Yaktubu) represent?',
          arabicText: 'ما هو زمن الفعل "يكتب"؟',
          options: [
            { id: 'A', text: 'Fi\'l Madhy (Past Tense)', arabicText: 'فعل ماض' },
            { id: 'B', text: 'Fi\'l Mudhari\' (Present / Continuous)', arabicText: 'فعل مضارع' },
            { id: 'C', text: 'Fi\'l Amr (Imperative / Command)', arabicText: 'فعل أمر' },
            { id: 'D', text: 'Masdar (Verbal Noun)', arabicText: 'مصدر' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Yaktubu begins with the mudhara\'ah letter Yaa and indicates present tense.',
        },
        {
          id: `q_ar_5`,
          questionNumber: 5,
          text: 'What is the plural of "قَلَمٌ" (Qalam - Pen)?',
          arabicText: 'ما هو جمع كلمة "قلم"؟',
          options: [
            { id: 'A', text: 'أقلام (Aqlam)', arabicText: 'أقلام' },
            { id: 'B', text: 'قلمات (Qalamat)', arabicText: 'قلمات' },
            { id: 'C', text: 'مقالم (Maqalim)', arabicText: 'مقالم' },
            { id: 'D', text: 'قلمون (Qalamoon)', arabicText: 'قلمون' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'The broken plural of Qalam is Aqlam.',
        },
      ]);
    } else if (preset === 'maths') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_maths' || s.name.toLowerCase().includes('math'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - General Mathematics`);
      setExamArabicTitle('اختبار الفصل الثالث - الرياضيات');
      setQuestions([
        {
          id: `q_m_1`,
          questionNumber: 1,
          text: 'What is the value of 15 × 4?',
          options: [
            { id: 'A', text: '50' },
            { id: 'B', text: '60' },
            { id: 'C', text: '65' },
            { id: 'D', text: '70' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: '15 multiplied by 4 equals 60.',
        },
        {
          id: `q_m_2`,
          questionNumber: 2,
          text: 'Find the perimeter of a square with a side length of 8 cm:',
          options: [
            { id: 'A', text: '16 cm' },
            { id: 'B', text: '24 cm' },
            { id: 'C', text: '32 cm' },
            { id: 'D', text: '64 cm' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: 'Perimeter of a square = 4 × side = 4 × 8 = 32 cm.',
        },
        {
          id: `q_m_3`,
          questionNumber: 3,
          text: 'Which of the following is a prime number?',
          options: [
            { id: 'A', text: '9' },
            { id: 'B', text: '15' },
            { id: 'C', text: '17' },
            { id: 'D', text: '21' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: '17 is a prime number as it only has two divisors: 1 and itself.',
        },
        {
          id: `q_m_4`,
          questionNumber: 4,
          text: 'Simplify 3/4 + 1/4:',
          options: [
            { id: 'A', text: '1/2' },
            { id: 'B', text: '4/8' },
            { id: 'C', text: '1 (Whole)' },
            { id: 'D', text: '2' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: '3/4 + 1/4 = 4/4 = 1.',
        },
        {
          id: `q_m_5`,
          questionNumber: 5,
          text: 'If x + 7 = 19, find the value of x:',
          options: [
            { id: 'A', text: '10' },
            { id: 'B', text: '11' },
            { id: 'C', text: '12' },
            { id: 'D', text: '13' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: 'Subtracting 7 from both sides gives x = 19 - 7 = 12.',
        },
      ]);
    } else if (preset === 'science') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_science' || s.name.toLowerCase().includes('scien'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Basic Science & Technology`);
      setExamArabicTitle('اختبار الفصل الثالث - العلوم والتكنولوجيا');
      setQuestions([
        {
          id: `q_sc_1`,
          questionNumber: 1,
          text: 'Which of the following is a characteristic of living things?',
          options: [
            { id: 'A', text: 'Movement, Respiration, and Growth' },
            { id: 'B', text: 'Rusting in air' },
            { id: 'C', text: 'Evaporation in heat' },
            { id: 'D', text: 'Conducting electricity' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'MR NIGER D characterizes living organisms (Movement, Respiration, Growth, etc.).',
        },
        {
          id: `q_sc_2`,
          questionNumber: 2,
          text: 'What gas do green plants absorb from the atmosphere for photosynthesis?',
          options: [
            { id: 'A', text: 'Oxygen' },
            { id: 'B', text: 'Carbon dioxide' },
            { id: 'C', text: 'Nitrogen' },
            { id: 'D', text: 'Hydrogen' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Plants absorb carbon dioxide from air and release oxygen during photosynthesis.',
        },
        {
          id: `q_sc_3`,
          questionNumber: 3,
          text: 'How many planets are in our Solar System orbiting the Sun?',
          options: [
            { id: 'A', text: '7 planets' },
            { id: 'B', text: '8 planets' },
            { id: 'C', text: '9 planets' },
            { id: 'D', text: '10 planets' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'There are eight recognized major planets in the Solar System.',
        },
        {
          id: `q_sc_4`,
          questionNumber: 4,
          text: 'Water boils at what temperature at standard atmospheric pressure?',
          options: [
            { id: 'A', text: '50°C' },
            { id: 'B', text: '80°C' },
            { id: 'C', text: '100°C' },
            { id: 'D', text: '120°C' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: 'Pure water boils at 100 degrees Celsius (212 degrees Fahrenheit).',
        },
        {
          id: `q_sc_5`,
          questionNumber: 5,
          text: 'What form of energy comes directly from sunlight?',
          options: [
            { id: 'A', text: 'Solar Energy' },
            { id: 'B', text: 'Nuclear Energy' },
            { id: 'C', text: 'Geothermal Energy' },
            { id: 'D', text: 'Fossil Energy' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Solar energy is radiant light and heat from the Sun.',
        },
      ]);
    } else if (preset === 'english') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_english' || s.name.toLowerCase().includes('eng'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - English Language & Grammar`);
      setExamArabicTitle('اختبار الفصل الثالث - اللغة الإنجليزية');
      setQuestions([
        {
          id: `q_en_1`,
          questionNumber: 1,
          text: 'Identify the noun in the sentence: "The diligent student memorized the lesson."',
          options: [
            { id: 'A', text: 'Diligent' },
            { id: 'B', text: 'Student' },
            { id: 'C', text: 'Memorized' },
            { id: 'D', text: 'Quickly' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: '"Student" is a naming word (noun) denoting a person.',
        },
        {
          id: `q_en_2`,
          questionNumber: 2,
          text: 'What is the opposite (antonym) of the word "Courageous"?',
          options: [
            { id: 'A', text: 'Brave' },
            { id: 'B', text: 'Fearful / Cowardly' },
            { id: 'C', text: 'Honest' },
            { id: 'D', text: 'Patient' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'The antonym of courageous (brave) is cowardly or fearful.',
        },
        {
          id: `q_en_3`,
          questionNumber: 3,
          text: 'Choose the correct verb form: "He _____ to the college mosque every morning."',
          options: [
            { id: 'A', text: 'go' },
            { id: 'B', text: 'goes' },
            { id: 'C', text: 'going' },
            { id: 'D', text: 'gone' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Third person singular (He) in the simple present takes "goes".',
        },
        {
          id: `q_en_4`,
          questionNumber: 4,
          text: 'What type of word is "Beautifully" in: "She writes beautifully"?',
          options: [
            { id: 'A', text: 'Adjective' },
            { id: 'B', text: 'Adverb' },
            { id: 'C', text: 'Pronoun' },
            { id: 'D', text: 'Conjunction' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: '"Beautifully" modifies the verb "writes", so it is an adverb of manner.',
        },
        {
          id: `q_en_5`,
          questionNumber: 5,
          text: 'What punctuation mark should end an interrogative question?',
          options: [
            { id: 'A', text: 'Full stop (.)' },
            { id: 'B', text: 'Exclamation mark (!)' },
            { id: 'C', text: 'Question mark (?)' },
            { id: 'D', text: 'Comma (,)' },
          ],
          correctOptionId: 'C',
          marks: 12,
          explanation: 'Direct questions end with a question mark.',
        },
      ]);
    } else if (preset === 'social_civic') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_social_civic' || s.name.toLowerCase().includes('social') || s.name.toLowerCase().includes('civic'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Social Studies & Civic Education`);
      setExamArabicTitle('اختبار الفصل الثالث - الدراسات الاجتماعية والتربية المدنية');
      setQuestions([
        {
          id: `q_soc_1`,
          questionNumber: 1,
          text: 'Which organ of government interprets laws and punishes lawbreakers?',
          options: [
            { id: 'A', text: 'The Legislature' },
            { id: 'B', text: 'The Judiciary (Courts)' },
            { id: 'C', text: 'The Civil Service' },
            { id: 'D', text: 'The Police only' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'The Judiciary interprets laws and administers justice.',
        },
        {
          id: 'q_soc_2',
          questionNumber: 2,
          text: 'What is the highest law of the Federal Republic of Nigeria?',
          options: [
            { id: 'A', text: 'The National Policy on Education' },
            { id: 'B', text: 'The 1999 Constitution as amended' },
            { id: 'C', text: 'The Local Government By-law' },
            { id: 'D', text: 'The Police Act' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'The Constitution is the supreme law of the land.',
        },
        {
          id: 'q_soc_3',
          questionNumber: 3,
          text: 'What virtue promotes fairness, accountability, and incorruptibility?',
          options: [
            { id: 'A', text: 'Integrity and Honesty' },
            { id: 'B', text: 'Favoritism' },
            { id: 'C', text: 'Extravagance' },
            { id: 'D', text: 'Bribery' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Integrity ensures moral uprightness and transparency.',
        },
      ]);
    } else if (preset === 'ict') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_ict' || s.name.toLowerCase().includes('comp') || s.name.toLowerCase().includes('ict'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Computer Studies & ICT`);
      setExamArabicTitle('اختبار الفصل الثالث - الحاسوب وتكنولوجيا المعلومات');
      setQuestions([
        {
          id: `q_ict_1`,
          questionNumber: 1,
          text: 'Which computer component is known as the "Brain of the Computer"?',
          options: [
            { id: 'A', text: 'Hard Disk' },
            { id: 'B', text: 'Central Processing Unit (CPU)' },
            { id: 'C', text: 'RAM Memory' },
            { id: 'D', text: 'Monitor' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'The CPU processes instructions and coordinates computer hardware.',
        },
        {
          id: 'q_ict_2',
          questionNumber: 2,
          text: 'Which of the following is an example of an Operating System?',
          options: [
            { id: 'A', text: 'Microsoft Windows' },
            { id: 'B', text: 'Google Chrome' },
            { id: 'C', text: 'VLC Media Player' },
            { id: 'D', text: 'Microsoft Word' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'Windows, Linux, and macOS are system software operating systems.',
        },
        {
          id: 'q_ict_3',
          questionNumber: 3,
          text: 'What does the acronym "WWW" stand for in internet terminology?',
          options: [
            { id: 'A', text: 'World Wide Web' },
            { id: 'B', text: 'Wide Wireless Web' },
            { id: 'C', text: 'World Web Wireless' },
            { id: 'D', text: 'Wide World Windows' },
          ],
          correctOptionId: 'A',
          marks: 12,
          explanation: 'WWW stands for World Wide Web.',
        },
      ]);
    } else if (preset === 'biology') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_biology' || s.name.toLowerCase().includes('bio'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Biology (Senior Secondary)`);
      setExamArabicTitle('اختبار الفصل الثالث - علم الأحياء');
      setQuestions([
        {
          id: `q_bio_1`,
          questionNumber: 1,
          text: 'Which organelle is responsible for protein synthesis in living cells?',
          options: [
            { id: 'A', text: 'Mitochondrion' },
            { id: 'B', text: 'Ribosome' },
            { id: 'C', text: 'Vacuole' },
            { id: 'D', text: 'Lysosome' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Ribosomes translate mRNA into polypeptide protein chains.',
        },
        {
          id: 'q_bio_2',
          questionNumber: 2,
          text: 'What is the green photosynthetic pigment found inside plant chloroplasts?',
          options: [
            { id: 'A', text: 'Melanin' },
            { id: 'B', text: 'Chlorophyll' },
            { id: 'C', text: 'Hemoglobin' },
            { id: 'D', text: 'Carotene' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Chlorophyll traps photon energy for photosynthesis.',
        },
      ]);
    } else if (preset === 'economics') {
      const isSub = accessibleSubjects.find((s) => s.id === 'subj_economics' || s.name.toLowerCase().includes('econ'));
      if (isSub) setExamSubjectId(isSub.id);
      setExamTitle(`Third Term Examination - Economics (Senior Secondary)`);
      setExamArabicTitle('اختبار الفصل الثالث - علم الاقتصاد');
      setQuestions([
        {
          id: `q_eco_1`,
          questionNumber: 1,
          text: 'What is the fundamental basis of economics?',
          options: [
            { id: 'A', text: 'Unlimited wealth' },
            { id: 'B', text: 'Scarcity of resources and choice' },
            { id: 'C', text: 'Printing currency' },
            { id: 'D', text: 'Banking regulation' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Scarcity requires individuals and nations to make choices.',
        },
        {
          id: 'q_eco_2',
          questionNumber: 2,
          text: 'The value of the best alternative forgone when a choice is made is called:',
          options: [
            { id: 'A', text: 'Marginal Cost' },
            { id: 'B', text: 'Opportunity Cost' },
            { id: 'C', text: 'Variable Cost' },
            { id: 'D', text: 'Average Cost' },
          ],
          correctOptionId: 'B',
          marks: 12,
          explanation: 'Opportunity cost represents the forgone alternative.',
        },
      ]);
    }
  };

  const handleSaveExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      alert('Please add at least one question before saving the examination.');
      return;
    }

    const targetClass = classes.find((c) => c.id === examClassId);
    const targetSubject = subjects.find((s) => s.id === examSubjectId);

    const newOrUpdatedExam: Exam = {
      id: editingExamId || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: examTitle.trim() || `Examination - ${targetSubject?.name || 'Subject'}`,
      arabicTitle: examArabicTitle.trim() || undefined,
      localTitle: examLocalTitle.trim() || undefined,
      subjectId: examSubjectId,
      subjectName: targetSubject?.name || 'Subject',
      classId: examClassId,
      className: targetClass?.name || 'Class',
      teacherId: currentTeacher?.id || currentUser?.id || 'admin',
      teacherName: currentTeacher?.fullName || currentUser?.name || 'Authorized Faculty Teacher',
      sessionId: currentSession.id,
      termId: currentTerm.id,
      date: examDate,
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks: Number(totalMarks) || 60,
      instructions: instructions.trim(),
      isPublished,
      questions,
      createdAt: editingExamId ? exams.find((e) => e.id === editingExamId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExam(newOrUpdatedExam);
    setShowEditorModal(false);
  };

  const handleTogglePublish = (exam: Exam) => {
    onSaveExam({
      ...exam,
      isPublished: !exam.isPublished,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSyncToGradebook = (sub: ExamSubmission) => {
    onSyncExamScoreToGradebook(sub);
    setSyncStatusMap((prev) => ({ ...prev, [sub.id]: true }));
    setTimeout(() => {
      setSyncStatusMap((prev) => ({ ...prev, [sub.id]: false }));
    }, 4000);
  };

  // Submissions for currently selected exam (or all if none selected)
  const displayedSubmissions = examSubmissions.filter((sub) => {
    if (selectedExamForSubmissions && sub.examId !== selectedExamForSubmissions) return false;
    if (selectedSubjectFilter !== 'all' && sub.subjectId !== selectedSubjectFilter) return false;
    if (selectedClassFilter !== 'all' && sub.classId !== selectedClassFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-[#4E2D17] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#6B3F20] text-amber-200 flex items-center justify-center font-bold shadow-xs shrink-0">
            <BookOpen className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Teacher CBT Examination Center</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                Authorized Faculty
              </span>
            </div>
            <p className="text-xs text-[#debca3] mt-0.5">
              Set easy, curriculum-aligned objective (OBJ) questions, schedule durations, and auto-grade student examinations.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-create-exam"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Objective Exam</span>
        </button>
      </div>

      {/* Navigation & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('exams_list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'exams_list'
                ? 'bg-[#4E2D17] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Scheduled Exams ({filteredExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-[#4E2D17] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Student Submissions ({displayedSubmissions.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Scheduled Exams */}
      {activeTab === 'exams_list' && (
        <div className="space-y-4">
          {filteredExams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700">No scheduled exams found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Set New Objective Exam" to create objective questions for your assigned subject and class.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Exam</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const subCount = examSubmissions.filter((s) => s.examId === exam.id).length;

                return (
                  <div
                    key={exam.id}
                    className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                          {exam.subjectName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(exam)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer ${
                            exam.isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                          title="Toggle active status for students"
                        >
                          {exam.isPublished ? 'Published (Live)' : 'Draft (Hidden)'}
                        </button>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {exam.title}
                      </h3>

                      {exam.arabicTitle && (
                        <p dir="rtl" className="text-xs font-serif text-emerald-900 font-medium">
                          {exam.arabicTitle}
                        </p>
                      )}

                      <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Class: <strong>{exam.className}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Date: <strong>{exam.date}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Duration: <strong>{exam.durationMinutes} mins</strong> • Marks: <strong>{exam.totalMarks}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Questions: <strong>{exam.questions?.length || 0} OBJ items</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamForSubmissions(exam.id);
                          setActiveTab('submissions');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Submissions ({subCount})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(exam)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#4E2D17] hover:bg-slate-50 transition-colors"
                          title="Edit Exam"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${exam.title}"?`)) {
                              onDeleteExam(exam.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Submissions & Auto-Graded Results */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Student Examination Submissions & CBT Auto-Grading
              </h3>
              <p className="text-xs text-slate-500">
                Review scores, time taken, and transfer examination scores directly into the school's continuous assessment terminal register.
              </p>
            </div>
            {selectedExamForSubmissions && (
              <button
                type="button"
                onClick={() => setSelectedExamForSubmissions(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Clear Exam Filter
              </button>
            )}
          </div>

          {displayedSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No student submissions recorded yet for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Reg No</th>
                    <th className="py-2.5 px-3">Exam / Subject</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3">Time Spent</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                    <th className="py-2.5 px-3 text-right">Terminal Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {sub.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-800 font-semibold">
                        {sub.studentRegNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{sub.subjectName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{sub.examTitle}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{sub.className}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                        {sub.totalScore} / {sub.maxScore} ({sub.percentage}%)
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            sub.percentage >= 60
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.percentage >= 45
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Grade {sub.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400">
                        {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSyncToGradebook(sub)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                            syncStatusMap[sub.id]
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900'
                          }`}
                          title="Transfer this score to student's Terminal Report Card exam component"
                        >
                          {syncStatusMap[sub.id] ? 'Synced to Gradebook!' : 'Sync to Terminal Report'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <header className="bg-[#4E2D17] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingExamId ? 'Edit Objective Examination' : 'Author New Objective Examination'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleArabicKeyboard}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isArabicKeyboardOpen
                      ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                  title="Toggle Arabic Virtual Keyboard for authoring questions and options"
                >
                  <Keyboard className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-arabic">لوحة المفاتيح</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="p-1.5 rounded-lg text-[#debca3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <form onSubmit={handleSaveExamSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Exam General Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={examSubjectId}
                    onChange={(e) => setExamSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  >
                    {accessibleSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.arabicName ? `(${s.arabicName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Class</label>
                  <select
                    value={examClassId}
                    onChange={(e) => setExamClassId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  >
                    {accessibleClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Examination Title</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. Third Term CBT Examination - Al-Qur'an & Tajweed"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Arabic Title (Optional)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={examArabicTitle}
                    onChange={(e) => setExamArabicTitle(e.target.value)}
                    placeholder="اختبار الفصل الثالث..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-serif text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-1">Local / Hausa Title (Optional)</label>
                  <input
                    type="text"
                    value={examLocalTitle}
                    onChange={(e) => setExamLocalTitle(e.target.value)}
                    placeholder="Gwajin Jarabawa / Harshen Hausa..."
                    className="w-full p-2.5 rounded-lg border border-amber-300 bg-amber-50/40 text-amber-950 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Time Limit (Minutes)</label>
                    <div className="flex items-center gap-1">
                      {[15, 20, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            durationMinutes === mins
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Examination Marks</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Instructions for Students</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700">Publish Immediately for Students</span>
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isPublished ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPublished ? 'Published (Live for Students)' : 'Draft (Saved Privately)'}
                  </button>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">
                      Objective Questions ({questions.length})
                    </h4>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Total Allocated: {questions.reduce((sum, q) => sum + (q.marks || 0), 0)} / {totalMarks} Marks
                    </span>
                  </div>

                  {/* Presets and Bulk Tools */}
                  <div className="flex items-center gap-2 flex-wrap justify-between w-full pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Quick OBJ Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('islamic_studies')}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Islamic Studies (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('quran')}
                        className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Al-Qur'an & Tajweed (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('arabic')}
                        className="px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Arabic Language (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('maths')}
                        className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Mathematics (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('science')}
                        className="px-2 py-1 rounded bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Basic Science (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('english')}
                        className="px-2 py-1 rounded bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        English (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('social_civic')}
                        className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Social & Civic (3)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('ict')}
                        className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Computer / ICT (3)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('biology')}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Biology (SS)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLoadQuestions('economics')}
                        className="px-2 py-1 rounded bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Economics (SS)
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoBalanceMarks}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                        title="Distribute total marks evenly among all questions"
                      >
                        <Scale className="w-3.5 h-3.5 text-slate-500" />
                        <span>Balance Marks Evenly</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowBulkImportModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF4ED] border border-[#E8D7C6] hover:bg-[#F3E8DC] text-[#4E2D17] font-bold text-[10px] transition-colors cursor-pointer"
                        title="Paste questions in bulk"
                      >
                        <FileUp className="w-3.5 h-3.5 text-[#4E2D17]" />
                        <span>Paste / Bulk Import OBJ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-stone-200 bg-[#FAF7F2] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#4E2D17] text-white flex items-center justify-center font-bold text-xs">
                          {qIdx + 1}
                        </span>
                        <span className="font-bold text-slate-800">Question {qIdx + 1}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500 font-bold">Marks:</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.marks}
                            onChange={(e) => handleUpdateQuestion(qIdx, { marks: Number(e.target.value) })}
                            className="w-14 p-1 rounded border border-slate-300 bg-white font-bold text-center text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'up')}
                          disabled={qIdx === 0}
                          className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Question Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'down')}
                          disabled={qIdx === questions.length - 1}
                          className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Question Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(qIdx)}
                          className="p-1 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Duplicate Question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(qIdx, { text: e.target.value })}
                        placeholder="Enter Question statement in English..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        dir="rtl"
                        value={q.arabicText || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { arabicText: e.target.value })}
                        placeholder="نص السؤال بالعربية (اختياري)..."
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-serif text-slate-800"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.localText || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { localText: e.target.value })}
                        placeholder="Tambaya a Harshen Hausa / Local Language (na zabi)..."
                        className="w-full p-2 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-amber-950 font-medium placeholder-amber-800/40"
                      />
                    </div>

                    {/* Options A, B, C, D */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        Options & Correct Answer Selection:
                      </span>
                      {q.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <label
                            className="flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Set as correct answer"
                          >
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correctOptionId === opt.id}
                              onChange={() => handleUpdateQuestion(qIdx, { correctOptionId: opt.id })}
                              className="w-4 h-4 text-emerald-600 cursor-pointer"
                            />
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                                q.correctOptionId === opt.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(qIdx, opt.id, 'text', e.target.value)}
                            placeholder={`Option ${opt.id} in English...`}
                            className={`flex-1 min-w-[140px] p-2 rounded-lg border text-xs bg-white ${
                              q.correctOptionId === opt.id
                                ? 'border-emerald-500 ring-1 ring-emerald-500'
                                : 'border-slate-300'
                            }`}
                            required
                          />

                          <input
                            type="text"
                            dir="rtl"
                            value={opt.arabicText || ''}
                            onChange={(e) => handleUpdateOption(qIdx, opt.id, 'arabicText', e.target.value)}
                            placeholder="بالعربية..."
                            className="w-24 sm:w-32 p-2 rounded-lg border border-slate-300 text-xs bg-white font-serif"
                          />

                          <input
                            type="text"
                            value={opt.localText || ''}
                            onChange={(e) => handleUpdateOption(qIdx, opt.id, 'localText', e.target.value)}
                            placeholder="A Hausa..."
                            className="w-24 sm:w-32 p-2 rounded-lg border border-amber-200 text-xs bg-amber-50/40 text-amber-950 placeholder-amber-800/40"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                        placeholder="Explanation for student review (optional)..."
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white/80 text-[11px] text-slate-600"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Objective Question</span>
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Schedule Examination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Questions Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <header className="bg-[#4E2D17] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm sm:text-base">Paste & Bulk Import Objective Questions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="p-1 rounded-lg text-[#debca3] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Paste your multiple choice questions below. You can paste 5, 10, or 20 questions at once:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                1. What is the third pillar of Islam?<br />
                A) Salah<br />
                B) Zakah<br />
                C) Sawm<br />
                D) Hajj<br />
                Answer: B
              </div>

              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="Paste questions here following the format above..."
                rows={9}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkImportText(
                      `1. What is the Holy Book of Islam?\nA) Injil\nB) Tawrat\nC) Al-Qur'an\nD) Zabur\nAnswer: C\n\n2. In which city was Prophet Muhammad (SAW) born?\nA) Madinah\nB) Makkah\nC) Ta'if\nD) Jerusalem\nAnswer: B`
                    );
                  }}
                  className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  Insert Sample Text
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleParseAndImportBulkQuestions}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs active:scale-95 cursor-pointer"
                  >
                    Convert & Add Questions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
