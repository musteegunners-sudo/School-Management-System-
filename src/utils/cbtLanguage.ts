import { Exam, ExamQuestion, ExamQuestionOption } from '../types';

export type CbtLanguage = 'multilingual' | 'english' | 'arabic' | 'hausa';

export interface CbtLanguageOption {
  id: CbtLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const CBT_LANGUAGES: CbtLanguageOption[] = [
  { id: 'multilingual', label: 'Trilingual (All 3)', nativeLabel: 'Haɗin Yaruka / الثلاثية', flag: '🌐', dir: 'ltr' },
  { id: 'english', label: 'English', nativeLabel: 'English', flag: '🇬🇧', dir: 'ltr' },
  { id: 'arabic', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { id: 'hausa', label: 'Hausa (Local)', nativeLabel: 'Harshen Hausa', flag: '🇳🇬', dir: 'ltr' },
];

export interface CbtUiDictionary {
  portalTitle: string;
  portalSubtitle: string;
  officialBadge: string;
  candidateLabel: string;
  verifiedBadge: string;
  guidelinesTitle: string;
  guideline1: string;
  guideline2: string;
  guideline3: string;
  availableExamsTitle: string;
  availableExamsSubtitle: string;
  classLevelLabel: string;
  allSubjects: string;
  searchPlaceholder: string;
  noExamsFound: string;
  noExamsHint: string;
  startExamBtn: string;
  reviewResultBtn: string;
  retakePracticeBtn: string;
  questionsCount: string;
  durationLabel: string;
  totalMarksLabel: string;
  statusCompleted: string;
  statusAvailable: string;
  statusPractice: string;
  timeRemaining: string;
  questionOf: string;
  answeredCount: string;
  flagQuestion: string;
  flaggedNotice: string;
  clearChoice: string;
  questionNavigator: string;
  prevBtn: string;
  nextBtn: string;
  submitExamBtn: string;
  finishAndSubmitBtn: string;
  confirmTitle: string;
  confirmDesc: string;
  totalQuestions: string;
  answeredQuestions: string;
  unansweredQuestions: string;
  unansweredNotice: string;
  continueBtn: string;
  yesSubmitBtn: string;
  examCompletedTitle: string;
  examCompletedDesc: string;
  scoreCardTitle: string;
  percentageLabel: string;
  gradeLabel: string;
  timeSpentLabel: string;
  reviewTitle: string;
  yourAnswer: string;
  correctAnswer: string;
  explanationLabel: string;
  returnDashboardBtn: string;
  languageSelectLabel: string;
  marksUnit: string;
}

export const CBT_UI_STRINGS: Record<CbtLanguage, CbtUiDictionary> = {
  english: {
    portalTitle: 'Student CBT Examination Center',
    portalSubtitle: 'Official Computer-Based Assessment and Testing Portal',
    officialBadge: 'Official Portal',
    candidateLabel: 'Candidate',
    verifiedBadge: 'School Approved Registration Credentials Verified',
    guidelinesTitle: 'Examination Guidelines for Students:',
    guideline1: '1. All questions are Multiple Choice (OBJ). Select the single best option (A, B, C, or D).',
    guideline2: '2. Once you start an examination, your countdown timer begins. When time expires, your exam submits automatically.',
    guideline3: '3. You can review, flag, and modify your selected options before clicking "Submit Exam".',
    availableExamsTitle: 'CBT Examinations',
    availableExamsSubtitle: 'Select class level (Primary 3 to SS 3) and subject to take or practice examinations.',
    classLevelLabel: 'Class Level:',
    allSubjects: 'All Subjects',
    searchPlaceholder: 'Search exam title, subject, or code...',
    noExamsFound: 'No examinations match your filter',
    noExamsHint: 'Try selecting another class or choosing "All Subjects".',
    startExamBtn: 'Take CBT Exam',
    reviewResultBtn: 'View Graded Results',
    retakePracticeBtn: 'Retake for Practice',
    questionsCount: 'Questions',
    durationLabel: 'Mins',
    totalMarksLabel: 'Marks',
    statusCompleted: 'Completed',
    statusAvailable: 'Scheduled & Ready',
    statusPractice: 'Practice Mode',
    timeRemaining: 'Time Remaining',
    questionOf: 'Question',
    answeredCount: 'Answered',
    flagQuestion: 'Flag',
    flaggedNotice: 'Flagged for Review',
    clearChoice: 'Clear Choice',
    questionNavigator: 'Question Navigator',
    prevBtn: 'Previous',
    nextBtn: 'Next',
    submitExamBtn: 'Submit Exam',
    finishAndSubmitBtn: 'Finish & Submit',
    confirmTitle: 'Confirm Exam Submission',
    confirmDesc: 'Are you sure you want to finish and submit your answers?',
    totalQuestions: 'Total Questions:',
    answeredQuestions: 'Questions Answered:',
    unansweredQuestions: 'Unanswered Questions:',
    unansweredNotice: 'Notice: You still have unanswered questions. You can go back and answer them before submitting.',
    continueBtn: 'Continue Answering',
    yesSubmitBtn: 'Yes, Submit My Exam',
    examCompletedTitle: 'Examination Completed!',
    examCompletedDesc: 'Alhamdulillah! Your answers have been recorded and auto-graded for your continuous assessment report card.',
    scoreCardTitle: 'Official Performance Score Card',
    percentageLabel: 'Percentage',
    gradeLabel: 'Grade Scale',
    timeSpentLabel: 'Time Spent',
    reviewTitle: 'Question Review & Answer Key',
    yourAnswer: 'Your Answer:',
    correctAnswer: 'Correct Answer:',
    explanationLabel: 'Explanation:',
    returnDashboardBtn: 'Return to Student Dashboard',
    languageSelectLabel: 'Language Options:',
    marksUnit: 'Marks',
  },
  arabic: {
    portalTitle: 'مركز اختبارات الحاسوب الآلي (CBT)',
    portalSubtitle: 'البوابة الرسمية للاختبارات والتقييم المحوسب للطلاب',
    officialBadge: 'البوابة الرسمية',
    candidateLabel: 'اسم الطالب المرشح',
    verifiedBadge: 'تم التحقق من بيانات التسجيل الرسمية للطالب',
    guidelinesTitle: 'إرشادات الاختبار للطلاب:',
    guideline1: '١. جميع الأسئلة من نوع الاختيار من متعدد (OBJ). اختر الإجابة الأنسب (أ، ب، ج، أو د).',
    guideline2: '٢. يبدأ العد التنازلي للوقت فور بدء الاختبار. وعند نفاد الوقت، سيتم تسليم الاختبار تلقائياً.',
    guideline3: '٣. يمكنك مراجعة الأسئلة وتعديل الإجابات وتمييز الأسئلة قبل الضغط على "تسليم الاختبار".',
    availableExamsTitle: 'الاختبارات الإلكترونية المقررة',
    availableExamsSubtitle: 'اختر الصف الدراسي (من الابتدائي ٣ إلى الثانوي ٣) والمادة لأداء الاختبار.',
    classLevelLabel: 'الصف الدراسي:',
    allSubjects: 'جميع المواد',
    searchPlaceholder: 'ابحث عن اسم الاختبار أو المادة...',
    noExamsFound: 'لا توجد اختبارات متطابقة مع البحث',
    noExamsHint: 'يرجى اختيار صف آخر أو اختيار "جميع المواد".',
    startExamBtn: 'بدء الاختبار الآن',
    reviewResultBtn: 'عرض النتيجة والدرجات',
    retakePracticeBtn: 'إعادة الاختبار للتدريب',
    questionsCount: 'سؤالاً',
    durationLabel: 'دقيقة',
    totalMarksLabel: 'درجة',
    statusCompleted: 'تم الإنجاز بنجاح',
    statusAvailable: 'جاهز للاختبار',
    statusPractice: 'وضع التدريب',
    timeRemaining: 'الوقت المتبقي',
    questionOf: 'السؤال',
    answeredCount: 'تمت الإجابة',
    flagQuestion: 'تمييز السؤال',
    flaggedNotice: 'مميز للمراجعة',
    clearChoice: 'مسح الاختيار',
    questionNavigator: 'لوحة التنقل بين الأسئلة',
    prevBtn: 'السابق',
    nextBtn: 'التالي',
    submitExamBtn: 'تسليم الاختبار',
    finishAndSubmitBtn: 'إنهاء وتسليم الاختبار',
    confirmTitle: 'تأكيد تسليم الاختبار',
    confirmDesc: 'هل أنت متأكد من رغبتك في تسليم إجاباتك الآن؟',
    totalQuestions: 'إجمالي الأسئلة:',
    answeredQuestions: 'الأسئلة المجاب عنها:',
    unansweredQuestions: 'أسئلة بدون إجابة:',
    unansweredNotice: 'تنبيه: ما زال لديك أسئلة لم تجب عليها. يمكنك العودة وإكمالها قبل التسليم النهائي.',
    continueBtn: 'الاستمرار في الإجابة',
    yesSubmitBtn: 'نعم، تسليم الاختبار',
    examCompletedTitle: 'تم إكمال الاختبار بنجاح!',
    examCompletedDesc: 'الحمد لله! تم تسجيل إجاباتك وتصحيحها آلياً لاعتمادها في كشف الدرجات.',
    scoreCardTitle: 'بطاقة النتيجة والدرجات المعتمدة',
    percentageLabel: 'النسبة المئوية',
    gradeLabel: 'التقدير العام',
    timeSpentLabel: 'الوقت المستغرق',
    reviewTitle: 'مراجعة الأسئلة ونموذج الإجابة الصحيحة',
    yourAnswer: 'إجابتك:',
    correctAnswer: 'الإجابة الصحيحة:',
    explanationLabel: 'الشرح والتوضيح:',
    returnDashboardBtn: 'العودة إلى لوحة تحكم الطالب',
    languageSelectLabel: 'خيارات لغة الاختبار:',
    marksUnit: 'درجات',
  },
  hausa: {
    portalTitle: 'Dakin Jarabawar Na\'ura (CBT)',
    portalSubtitle: 'Tabbatacciyar Tashar Gwajin Dalibai ta Na\'urar Kwamfuta',
    officialBadge: 'Tashar Hukuma',
    candidateLabel: 'Sunan Dalibi',
    verifiedBadge: 'An Tantance Rajistar Dalibi a Hukumance',
    guidelinesTitle: 'Ka\'idojin Yin Jarabawa ga Dalibai:',
    guideline1: '1. Dukkan tambayoyi zabi ne (A, B, C, ko D). Zabi amsa daya mafi dacewa.',
    guideline2: '2. Da zarar ka fara jarabawa, agogon lokaci zai fara lissafi. Idan lokaci ya cika, za a mika jarabawar kai-tsaye.',
    guideline3: '3. Kana iya sake duba amsoshinka, sa alama kan tambaya, ko canza zabi kafin danna "Mika Jarabawa".',
    availableExamsTitle: 'Jarabawowin CBT da Aka Shirya',
    availableExamsSubtitle: 'Zabi aji (daga Firamare 3 zuwa SS 3) da darasin da kake son yi.',
    classLevelLabel: 'Ajin Karatu:',
    allSubjects: 'Dukkan Darussa',
    searchPlaceholder: 'Nemi sunan jarabawa ko darasi...',
    noExamsFound: 'Babu jarabawar da ta dace da abin da ka zaba',
    noExamsHint: 'Gwada zaban wani ajin daban ko zabar "Dukkan Darussa".',
    startExamBtn: 'Fara Jarabawar CBT',
    reviewResultBtn: 'Duba Sakamakon Maki',
    retakePracticeBtn: 'Sake Yi don Horarwa',
    questionsCount: 'Tambayoyi',
    durationLabel: 'Minti',
    totalMarksLabel: 'Maki',
    statusCompleted: 'An Kammala',
    statusAvailable: 'A Shirye Yake',
    statusPractice: 'Horon Gwaji',
    timeRemaining: 'Lokacin da ya Rage',
    questionOf: 'Tambaya',
    answeredCount: 'Wadanda Aka Amsa',
    flagQuestion: 'Sa Alama',
    flaggedNotice: 'An sa alama don dubawa',
    clearChoice: 'Goge Zabi',
    questionNavigator: 'Masarrafar Lambobin Tambaya',
    prevBtn: 'Na Baya',
    nextBtn: 'Na Gaba',
    submitExamBtn: 'Mika Jarabawa',
    finishAndSubmitBtn: 'Kammala & Mika Jarabawa',
    confirmTitle: 'Tabbatar da Mika Jarabawa',
    confirmDesc: 'Shin ka tabbata kana son mika amsoshinka yanzu?',
    totalQuestions: 'Jimillar Tambayoyi:',
    answeredQuestions: 'Tambayoyin da Aka Amsa:',
    unansweredQuestions: 'Tambayoyin da Ba a Amsa ba:',
    unansweredNotice: 'Sanarwa: Har yanzu akwai tambayoyin da ba ka amsa ba. Zaka iya komawa ka amsa su kafin mika jarabawa.',
    continueBtn: 'Ci gaba da Amsawa',
    yesSubmitBtn: 'I, Mika Jarabawata',
    examCompletedTitle: 'An Kammala Jarabawa Cikin Nasara!',
    examCompletedDesc: 'Alhamdulillah! An karbi amsoshinka kuma an lissafa makinka don sanyawa cikin katin sakamako.',
    scoreCardTitle: 'Katin Sakamakon Jarabawa',
    percentageLabel: 'Kashi dari (%)',
    gradeLabel: 'Matsayin Maki (Daraja)',
    timeSpentLabel: 'Lokacin da aka Dauka',
    reviewTitle: 'Duba Tambayoyi da Cikakkun Amsoshi',
    yourAnswer: 'Amsarka:',
    correctAnswer: 'Amsa Madaidaiciya:',
    explanationLabel: 'Bayanin Karfafawa:',
    returnDashboardBtn: 'Koma Babban Shafin Dalibi',
    languageSelectLabel: 'Harshen da Kake So:',
    marksUnit: 'Maki',
  },
  multilingual: {
    portalTitle: 'Student CBT Examination Center • مركز اختبارات الحاسوب • Dakin Jarabawar CBT',
    portalSubtitle: 'Trilingual Assessment Portal • البوابة الموحدة • Tashar Gwaji ta Harsuna Uku',
    officialBadge: 'Trilingual Portal / رسمي',
    candidateLabel: 'Candidate / الطالب / Dalibi',
    verifiedBadge: 'Registration Verified • معتمد • An Tantance',
    guidelinesTitle: 'Examination Guidelines • إرشادات الاختبار • Ka\'idojin Jarabawa:',
    guideline1: '1. Select the best option (A, B, C, or D) • اختر الإجابة الأنسب • Zabi amsa mafi dacewa.',
    guideline2: '2. Countdown timer runs until auto-submission • ينتهي الوقت تلقائياً • Agogo yana tafiya har lokaci ya cika.',
    guideline3: '3. Flag, review, and modify before final submission • راجع إجاباتك بحرية • Kana iya sake dubawa.',
    availableExamsTitle: 'CBT Examinations • الاختبارات المقررة • Jarabawowin da Aka Shirya',
    availableExamsSubtitle: 'Primary 3 to SS 3 • من الابتدائي ٣ إلى الثانوي ٣ • Daga Firamare 3 zuwa SS 3',
    classLevelLabel: 'Class / الصف / Aji:',
    allSubjects: 'All Subjects • جميع المواد • Dukkan Darussa',
    searchPlaceholder: 'Search exam, darasi, mada...',
    noExamsFound: 'No examinations match your filter • لا توجد نتائج • Babu sakamako',
    noExamsHint: 'Try another class level or subject • اختر صفاً آخر • Zabi wani ajin.',
    startExamBtn: 'Take CBT Exam • بدء الاختبار • Fara Jarabawa',
    reviewResultBtn: 'View Graded Results • عرض النتيجة • Duba Sakamako',
    retakePracticeBtn: 'Retake for Practice • إعادة التدريب • Sake Yi don Horarwa',
    questionsCount: 'Questions • أسئلة • Tambayoyi',
    durationLabel: 'Mins • دقيقة • Minti',
    totalMarksLabel: 'Marks • درجات • Maki',
    statusCompleted: 'Completed • منجز • An Kammala',
    statusAvailable: 'Scheduled • جاهز • A Shirye',
    statusPractice: 'Practice • تدريب • Horon Gwaji',
    timeRemaining: 'Time Left • الوقت المتبقي • Lokacin da ya Rage',
    questionOf: 'Question • السؤال • Tambaya',
    answeredCount: 'Answered • تم الإجابة • Wadanda Aka Amsa',
    flagQuestion: 'Flag • تمييز • Sa Alama',
    flaggedNotice: 'Flagged for Review • مميز للمراجعة • An sa alama',
    clearChoice: 'Clear Choice • مسح • Goge Zabi',
    questionNavigator: 'Question Navigator • لوحة التنقل • Masarrafar Tambaya',
    prevBtn: 'Previous • السابق • Na Baya',
    nextBtn: 'Next • التالي • Na Gaba',
    submitExamBtn: 'Submit Exam • تسليم الاختبار • Mika Jarabawa',
    finishAndSubmitBtn: 'Finish & Submit • إنهاء وتسليم • Kammala & Mika',
    confirmTitle: 'Confirm Submission • تأكيد التسليم • Tabbatar da Mika',
    confirmDesc: 'Ready to submit answers? • هل أنت متأكد؟ • Ka tabbata kana son mikawa?',
    totalQuestions: 'Total Questions • إجمالي الأسئلة • Jimillar Tambayoyi:',
    answeredQuestions: 'Answered • المجاب عنها • Wadanda Aka Amsa:',
    unansweredQuestions: 'Unanswered • بدون إجابة • Ba a Amsa ba:',
    unansweredNotice: 'You still have unanswered questions • ما زال لديك أسئلة لم تجب عليها • Kana da tambayoyin da ba ka amsa ba.',
    continueBtn: 'Continue • متابعة • Ci gaba',
    yesSubmitBtn: 'Yes, Submit • نعم، تسليم • I, Mika Jarabawa',
    examCompletedTitle: 'Examination Completed! • تم إكمال الاختبار • An Kammala!',
    examCompletedDesc: 'Alhamdulillah! Results have been recorded • الحمد لله! تم تسجيل النتيجة • Alhamdulillah! An karbi sakamakon.',
    scoreCardTitle: 'Performance Score Card • بطاقة الدرجات • Katin Sakamako',
    percentageLabel: 'Percentage • النسبة • Kashi dari',
    gradeLabel: 'Grade • التقدير • Daraja',
    timeSpentLabel: 'Time Spent • الوقت المستغرق • Lokaci',
    reviewTitle: 'Question Review • مراجعة الأسئلة • Duba Tambayoyi',
    yourAnswer: 'Your Answer • إجابتك • Amsarka:',
    correctAnswer: 'Correct Answer • الإجابة الصحيحة • Amsa Madaidaiciya:',
    explanationLabel: 'Explanation • التوضيح • Bayani:',
    returnDashboardBtn: 'Return to Dashboard • العودة للرئيسية • Koma Shafin Farko',
    languageSelectLabel: 'Language / اللغة / Harshe:',
    marksUnit: 'Marks • درجات • Maki',
  },
};

// Subject Names in 3 Languages
export const SUBJECT_NAMES: Record<string, { en: string; ar: string; ha: string }> = {
  subj_maths: { en: 'Mathematics', ar: 'الرياضيات', ha: 'Lissafi' },
  subj_english: { en: 'English Language', ar: 'اللغة الإنجليزية', ha: 'Harshen Turanci' },
  subj_quran: { en: "Al-Qur'an & Tajweed", ar: 'القرآن الكريم والتجويد', ha: "Alkur'ani da Tajwidi" },
  subj_hadith: { en: 'Al-Hadith & Mustalah', ar: 'الحديث الشريف ومصطلحه', ha: 'Hadisi da Iliminsa' },
  subj_fiqh: { en: 'Fiqh & Islamic Jurisprudence', ar: 'الفقه الإسلامي', ha: 'Fikihu da Hukunce-hukuncen Musulunci' },
  subj_tawhid: { en: 'At-Tawhid & Aqeedah', ar: 'التوحيد والعقيدة الإسلامية', ha: 'Tauhidi da Akidar Musulunci' },
  subj_islamic_studies: { en: 'Islamic Studies', ar: 'الدراسات الإسلامية', ha: 'Ilimin Addinin Musulunci' },
  subj_arabic: { en: 'Arabic Language & Literature', ar: 'اللغة العربية وآدابها', ha: 'Harshen Larabci da Adabi' },
  subj_hausa: { en: 'Hausa Language (Harshen Hausa)', ar: 'اللغة الهوساوية', ha: 'Harshen Hausa' },
  subj_science: { en: 'Basic Science & Technology', ar: 'العلوم والتقنية العامة', ha: 'Kimiyya ta Asali da Fasaha' },
  subj_social_studies: { en: 'Social Studies & Civic Education', ar: 'الدراسات الاجتماعية والتربية الوطنية', ha: 'Ilimin Zamantakewa da Kasa' },
  subj_computer: { en: 'Computer Studies & ICT', ar: 'دراسات الحاسوب وتقنية المعلومات', ha: "Na'ura mai Kwakwalwa (Kwamfuta)" },
  subj_agricultural_science: { en: 'Agricultural Science', ar: 'العلوم الزراعية', ha: 'Ilimin Noma da Kiwo' },
  subj_biology: { en: 'Biology', ar: 'علم الأحياء', ha: 'Ilimin Halittu masu Rai' },
  subj_chemistry: { en: 'Chemistry', ar: 'الكيمياء', ha: 'Ilimin Sinadarai' },
  subj_physics: { en: 'Physics', ar: 'الفيزياء', ha: 'Ilimin Makamashi da Kimiya' },
  subj_economics: { en: 'Economics', ar: 'علم الاقتصاد', ha: 'Ilimin Tattalin Arziki' },
  subj_literature: { en: 'Literature in English', ar: 'الأدب الإنجليزي', ha: 'Adabin Turanci' },
  subj_government: { en: 'Government', ar: 'العلوم السياسية والحكومة', ha: 'Ilimin Hukuma da Siyasa' },
  subj_civic_education: { en: 'Civic Education', ar: 'التربية الوطنية والمدنية', ha: 'Ilimin Kasa da Dan Kasa' },
};

// Class Names in 3 Languages
export const CLASS_NAMES: Record<string, { en: string; ar: string; ha: string }> = {
  cls_primary_3: { en: 'Primary 3 (Basic 3)', ar: 'المستوى الابتدائي الثالث', ha: 'Firamare 3 (Asali 3)' },
  cls_primary_4: { en: 'Primary 4 (Basic 4)', ar: 'المستوى الابتدائي الرابع', ha: 'Firamare 4 (Asali 4)' },
  cls_primary_5: { en: 'Primary 5 (Basic 5)', ar: 'المستوى الابتدائي الخامس', ha: 'Firamare 5 (Asali 5)' },
  cls_primary_6: { en: 'Primary 6 (Basic 6)', ar: 'المستوى الابتدائي السادس', ha: 'Firamare 6 (Asali 6)' },
  cls_idadi_1: { en: "I'dadi 1 (JSS 1)", ar: 'الصف الإعدادي الأول', ha: "Karamin Sakandare 1 (I'dadi 1)" },
  cls_idadi_2: { en: "I'dadi 2 (JSS 2)", ar: 'الصف الإعدادي الثاني', ha: "Karamin Sakandare 2 (I'dadi 2)" },
  cls_idadi_3: { en: "I'dadi 3 (JSS 3)", ar: 'الصف الإعدادي الثالث', ha: "Karamin Sakandare 3 (I'dadi 3)" },
  cls_thanawi_1: { en: 'Thanawi 1 (SS 1)', ar: 'الصف الثانوي الأول', ha: 'Babban Sakandare 1 (Thanawi 1)' },
  cls_thanawi_2: { en: 'Thanawi 2 (SS 2)', ar: 'الصف الثانوي الثاني', ha: 'Babban Sakandare 2 (Thanawi 2)' },
  cls_thanawi_3: { en: 'Thanawi 3 (SS 3)', ar: 'الصف الثانوي الثالث', ha: 'Babban Sakandare 3 (Thanawi 3)' },
};

export const getLocalizedSubjectName = (subjectId: string, fallback: string, lang: CbtLanguage): string => {
  const match = SUBJECT_NAMES[subjectId];
  if (!match) return fallback;
  if (lang === 'arabic') return match.ar;
  if (lang === 'hausa') return match.ha;
  if (lang === 'multilingual') return `${match.en} (${match.ar} • ${match.ha})`;
  return match.en;
};

export const getLocalizedClassName = (classId: string, fallback: string, lang: CbtLanguage): string => {
  const match = CLASS_NAMES[classId];
  if (!match) return fallback;
  if (lang === 'arabic') return match.ar;
  if (lang === 'hausa') return match.ha;
  if (lang === 'multilingual') return `${match.en} • ${match.ar}`;
  return match.en;
};

export const getLocalizedExamTitle = (exam: Exam, lang: CbtLanguage): string => {
  if (lang === 'arabic' && exam.arabicTitle) return exam.arabicTitle;
  if (lang === 'hausa' && exam.localTitle) return exam.localTitle;
  if (lang === 'multilingual') {
    if (exam.arabicTitle && exam.localTitle) {
      return `${exam.title} / ${exam.arabicTitle}`;
    }
  }
  return exam.title;
};

export const getLocalizedInstructions = (exam: Exam, lang: CbtLanguage): string => {
  if (lang === 'arabic' && exam.arabicInstructions) return exam.arabicInstructions;
  if (lang === 'hausa' && exam.localInstructions) return exam.localInstructions;
  return exam.instructions || 'Answer all objective questions by selecting the best option.';
};
