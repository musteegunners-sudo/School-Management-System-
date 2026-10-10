import { ExamQuestion, ExamQuestionOption } from '../types';
import { CbtLanguage } from './cbtLanguage';

export interface LocalizedQuestionStatement {
  primary: string;
  secondary?: string;
  tertiary?: string;
  dir: 'ltr' | 'rtl';
  isTranslated: boolean;
}

export interface LocalizedOptionStatement {
  primary: string;
  secondary?: string;
  tertiary?: string;
  dir: 'ltr' | 'rtl';
}

// Built-in Question Statement Translations for Common Core CBT Questions
const STATEMENT_TRANSLATIONS: Record<string, { ar: string; ha: string }> = {
  // Primary 3 Maths
  'What is 45 + 38?': {
    ar: 'كم حاصل جمع ٤٥ + ٣٨؟',
    ha: 'Menene jimillar 45 + 38?',
  },
  'What is the place value of 7 in 752?': {
    ar: 'ما هي القيمة المكانية للرقم ٧ في العدد ٧٥٢؟',
    ha: 'Menene darajar matsayin lamba 7 a cikin 752?',
  },
  'Calculate: 6 × 4': {
    ar: 'احسب: ٦ × ٤',
    ha: 'Lissafa: 6 sau 4 (6 × 4)',
  },
  'How many sides does a triangle have?': {
    ar: 'كم عدد أضلاع المثلث؟',
    ha: 'Kusurwoyi ko bangarori nawa ne a jikin alwatika (triangle)?',
  },
  'Share 20 pencils equally among 4 pupils. How many does each pupil get?': {
    ar: 'قسم ٢٠ قلماً بالتساوي بين ٤ تلاميذ، كم يحصل كل تلميذ؟',
    ha: 'Raba fensir 20 daidai wa daida tsakanin dalibai 4. Nawa kowanne zai samu?',
  },

  // Primary 3 English
  'Identify the noun in: "The boy kicked the ball."': {
    ar: 'عين الاسم في الجملة: "The boy kicked the ball" (ركل الولد الكرة)',
    ha: 'Nemo suna (noun) a cikin wannan jumla: "The boy kicked the ball."',
  },
  'What is the plural of "Child"?': {
    ar: 'ما هو جمع كلمة "Child" (طفل) في اللغة الإنجليزية؟',
    ha: 'Menene jam\'in kalmar "Child" (yaro)?',
  },
  'Which word is the opposite of "Hot"?': {
    ar: 'ما هي الكلمة المضادة لكلمة "Hot" (حار)؟',
    ha: 'Wace kalma ce kishiyar "Hot" (zafi)?',
  },
  'Choose the correct verb: "She ____ to school every day."': {
    ar: 'اختر الفعل الصحيح: "She ____ to school every day"',
    ha: 'Zabi aikin da ya dace: "She ____ to school every day."',
  },
  'A person who treats sick people in a hospital is called a:': {
    ar: 'الشخص الذي يعالج المرضى في المستشفى يسمى:',
    ha: 'Mutumin da ke kula da marasa lafiya a asibiti ana kiransa:',
  },

  // Primary 3 Science
  'Which of the following is a living thing?': {
    ar: 'أي مما يلي يعتبر كائناً حياً؟',
    ha: 'Wanne ne a cikin wadannan yake da rai (mai rai)?',
  },
  'What organ in the human body is used for seeing?': {
    ar: 'ما هو العضو المستخدم للرؤية في جسم الإنسان؟',
    ha: 'Wane sashi ne na jikin mutum ake amfani da shi wajen gani?',
  },
  'Water in solid state is known as:': {
    ar: 'يُعرف الماء في حالته الصلبة باسم:',
    ha: 'Ruwa idan ya daskare ya zama kankara ana kiransa:',
  },
  'Which of these is a source of light in the daytime?': {
    ar: 'أي مما يلي هو المصدر الطبيعي للضوء في النهار؟',
    ha: 'Wanne ne babban tushen haske a lokacin rana?',
  },
  'Which sense organ is used to hear sounds?': {
    ar: 'أي حاسة تُستخدم لسماع الأصوات؟',
    ha: 'Wace gabar jiki ake amfani da ita don jin sauti?',
  },

  // Primary 4 Maths
  'Find the product of 15 and 6.': {
    ar: 'أوجد حاصل ضرب ١٥ في ٦.',
    ha: 'Nemo sakamakon ninka 15 sau 6 (15 × 6).',
  },
  'What is 1/2 of 100?': {
    ar: 'ما هو نصف (١/٢) العدد ١٠٠؟',
    ha: 'Menene rabin (1/2) 100?',
  },
  'Convert 350 kobo to Naira.': {
    ar: 'حول ٣٥٠ كوبو إلى عملة النايرا.',
    ha: 'Mayar da kobo 350 zuwa kudin Naira.',
  },
  'How many hours are there in 2 full days?': {
    ar: 'كم عدد الساعات في يومين كاملين؟',
    ha: 'Awoyi nawa ne a cikin cikakkun kwanaki 2?',
  },
  'A rectangle has length 8cm and width 5cm. What is its perimeter?': {
    ar: 'مستطيل طوله ٨ سم وعرضه ٥ سم، ما هو محيطه؟',
    ha: 'Wani dogon murabba\'i (rectangle) yana da tsawon 8cm da fadin 5cm. Menene kewaye (perimeter) dinsa?',
  },

  // Primary 4 English
  'Choose the correct pronoun: "Ali and ____ went to the market."': {
    ar: 'اختر الضمير المناسب: "Ali and ____ went to the market"',
    ha: 'Zabi wakilin suna da ya dace: "Ali and ____ went to the market."',
  },
  'What punctuation mark is used at the end of an interrogative question?': {
    ar: 'ما هي علامة الترقيم التي توضع في نهاية السؤال الاستفهامي؟',
    ha: 'Wace alamar rubutu ake sakawa a karshen tambaya?',
  },
  'What is the past tense of the verb "Go"?': {
    ar: 'ما هو التصريف الماضي للفعل "Go" (يذهب)؟',
    ha: 'Menene siffar da ta wuce (past tense) ta kalmar "Go"?',
  },
  'Identify the adjective in: "She bought a beautiful red dress."': {
    ar: 'عين الصفة في الجملة: "She bought a beautiful red dress"',
    ha: 'Nemo siffa (adjective) a cikin: "She bought a beautiful red dress."',
  },
  'Which of the following is a compound word?': {
    ar: 'أي من الكلمات التالية كلمة مركبة (Compound Word)؟',
    ha: 'Wace kalma ce a cikin wadannan take hadaddiyar kalma (compound word)?',
  },

  // Primary 5 Science
  'Which organ in the human body is responsible for pumping blood?': {
    ar: 'أي عضو في جسم الإنسان هو المسؤول عن ضخ الدم؟',
    ha: 'Wane sashi ne a jikin dan Adam yake aikin harba jini?',
  },
  'Plants make their food through a process called:': {
    ar: 'تصنع النباتات غذاءها من خلال عملية تسمى:',
    ha: 'Shuke-shuke suna hada abincinsu ta hanyar da ake kira:',
  },
  'Which of the following is an example of a renewable energy source?': {
    ar: 'أي مما يلي يعد مثالاً على مصدر طاقة متجددة؟',
    ha: 'Wanne ne misali na tushen makamashi mai sabunta kansa?',
  },
  'What gas do human beings inhale for respiration?': {
    ar: 'ما هو الغاز الذي يستنشقه الإنسان للتنفس؟',
    ha: 'Wane iska (gas) ne mutum yake shaka don rayuwa?',
  },
  'Which of the following is a non-metal?': {
    ar: 'أي مما يلي يصنف ضمن اللافلزات (Non-metal)؟',
    ha: 'Wanne ne a cikin wadannan ba karfe (non-metal) ba ne?',
  },

  // Primary 6 Social Studies
  'What is the capital city of Nigeria?': {
    ar: 'ما هي عاصمة جمهورية نيجيريا الفيدرالية؟',
    ha: 'Wane birni ne babban birnin tarayyar Najeriya?',
  },
  'How many geopolitical zones does Nigeria have?': {
    ar: 'كم عدد المناطق الجيوسياسية في نيجيريا؟',
    ha: 'Yankuna nawa ne (geopolitical zones) a Najeriya?',
  },
  'Which tier of government is closest to the rural grassroots citizens?': {
    ar: 'أي مستوى من مستويات الحكومة هو الأقرب للمواطنين في القرى والأحياء؟',
    ha: 'Wane mataki na gwamnati ne ya fi kusa da jama\'ar karkara?',
  },
  'What do the two white horses on the Nigerian Coat of Arms represent?': {
    ar: 'ماذا يمثل الحصانان الأبيضان في شعار نيجيريا الوطني؟',
    ha: 'Menene dawakai biyu farare a jikin tambarin Najeriya suke nufi?',
  },
  'Which of the following is a civic responsibility of a citizen?': {
    ar: 'أي مما يلي يعد من المسؤوليات والواجبات المدنية للمواطن؟',
    ha: 'Wanne ne a cikin wadannan yake wajibi ga dan kasa mai kishin kasa?',
  },

  // JSS 1 Mathematics
  'Evaluate: (-8) + (+15)': {
    ar: 'احسب قيمة: (-٨) + (+١٥)',
    ha: 'Lissafa: (-8) + (+15)',
  },
  'What is the Highest Common Factor (HCF) of 24 and 36?': {
    ar: 'ما هو العامل المشترك الأكبر (HCF) للعددين ٢٤ و ٣٦؟',
    ha: 'Menene babban rarrabe mai hadin gwiwa (HCF) na 24 da 36?',
  },
  'Convert 0.75 to a simple fraction in its lowest term.': {
    ar: 'حول الكسر العشري ٠٫٧٥ إلى كسر اعتيادي في أبسط صورة.',
    ha: 'Mayar da 0.75 zuwa kashi (fraction) mafi sauki.',
  },
  'Solve for x in the equation: 3x - 7 = 14': {
    ar: 'حل المعادلة لإيجاد قيمة x: ٣س - ٧ = ١٤',
    ha: 'Nemo darajar x a cikin wannan lissafi: 3x - 7 = 14',
  },
  'The sum of angles on a straight line is equal to:': {
    ar: 'مجموع الزوايا على الخط المستقيم يساوي:',
    ha: 'Jimillar kusurwoyi a kan mikeken layi daidai yake da:',
  },

  // SS 1 Biology
  'Which organelle is commonly referred to as the powerhouse of the eukaryotic cell?': {
    ar: 'أي عضية في الخلية حقيقية النواة تسمى بـ "محطة توليد الطاقة"؟',
    ha: 'Wace halitta ce a cikin kwayar halitta ake kira da matattarar makamashi (powerhouse)?',
  },
  'The movement of water molecules from a region of higher water potential to lower potential through a semi-permeable membrane is:': {
    ar: 'انتقال جزيئات الماء عبر غشاء شبه منفذ من منطقة التركيز الأعلى للماء إلى التركيز الأقل يسمى:',
    ha: 'Gudanar kwayoyin ruwa ta cikin kariya mai tace ruwa ana kiranta:',
  },
  'Which vitamin is essential for blood clotting in humans?': {
    ar: 'أي فيتامين يعد ضرورياً لتخثر وتجلط الدم عند الإنسان؟',
    ha: 'Wane sinadarin bitamin ne ke da matukar mahimmanci wajen daskare jini idan aka ji rauni?',
  },
  'What is the primary function of stomata in plant leaves?': {
    ar: 'ما هي الوظيفة الأساسية للثغور (Stomata) في أوراق النبات؟',
    ha: 'Menene babban aikin kofofin ganyen shuka (stomata)?',
  },
  'Which of the following organisms exhibits saprophytic nutrition?': {
    ar: 'أي من الكائنات التالية يتغذى تغذية رمية (Saprophytic)؟',
    ha: 'Wace kwayar halitta ce ke cin rubabbun abubuwa (saprophyte)?',
  },

  // SS 2 Physics
  'Which of the following is a derived physical quantity?': {
    ar: 'أي من الكميات الفيزيائية التالية كمية مشتقة؟',
    ha: 'Wace ma\'auni ce a cikin kimiya take ciro daga wasu (derived quantity)?',
  },
  'Calculate the work done when a force of 50N moves an object through 4m in the direction of the force.': {
    ar: 'احسب الشغل المبذول عندما تؤثر قوة ٥٠ نيوتن لتحريك جسم مسافة ٤ أمتار في اتجاه القوة.',
    ha: 'Lissafa aikin da aka yi (work done) idan karfi mai karfin 50N ya matsar da abu mita 4.',
  },
  'The rate of change of momentum is directly proportional to the applied force. This is stated by:': {
    ar: 'معدل التغير في كمية الحركة يتناسب طردياً مع القوة المؤثرة. هذا هو نص:',
    ha: 'Saurin canjin karfin tafiya yana tafiya daidai da karfin da aka yi amfani da shi. Wannan ita ce dokar:',
  },
  'What is the velocity of electromagnetic waves (light) in a vacuum?': {
    ar: 'كم تبلغ سرعة الموجات الكهرومغناطيسية (الضوء) في الفراغ؟',
    ha: 'Menene saurin haske a sararin samaniya (vacuum)?',
  },
  'An electric iron is rated 1000W, 220V. What electrical energy does it consume in 2 hours?': {
    ar: 'مكواة كهربائية قدرتها ١٠٠٠ واط وتعمل بجهد ٢٢٠ فولت، ما الطاقة الكهربائية المستهلكة في ساعتين؟',
    ha: 'Pasin wuta mai karfin 1000W, 220V. Wane adadin wutar lantarki zai cinye a cikin awoyi 2?',
  },

  // SS 2 Chemistry
  'What is the atomic number of Sodium (Na)?': {
    ar: 'ما هو العدد الذري لعنصر الصوديوم (Na)؟',
    ha: 'Menene lambar kwayar zarra (atomic number) ta sinadarin Sodium (Na)?',
  },
  'A solution with a pH value of 3 is classified as:': {
    ar: 'المحلول الذي تكون قيمة الرقم الهيدروجيني له pH = 3 يصنف بأنه:',
    ha: 'Ruwankwan sinadarin da pH dinsa yake 3 ana kiransa:',
  },
  'Which of the following gases is liberated when dilute hydrochloric acid reacts with calcium trioxocarbonate (IV)?': {
    ar: 'أي غاز يتصاعد عند تفاعل حمض الهيدروكلوريك المخفف مع كربونات الكالسيوم؟',
    ha: 'Wane iska (gas) ne ke fita idan acid ya hadu da kashin farar kasa (calcium trioxocarbonate)?',
  },
  'What type of bond exists between atoms in a molecule of water (H2O)?': {
    ar: 'ما نوع الرابطة الكيميائية بين الذرات في جزيء الماء (H2O)؟',
    ha: 'Wace irin alaka (bond) ce ke tsakanin zarroji a cikin kwayar ruwa (H2O)?',
  },
  'Which catalyst is used in the Haber process for the industrial manufacture of ammonia?': {
    ar: 'ما هو العامل الحفاز المستخدم في طريقة هابر لتصنيع غاز الأمونيا صناعياً؟',
    ha: 'Wane abu mai hanzarta aiki (catalyst) ake amfani da shi wajen sarrafa iskar ammonia?',
  },

  // SS 3 Mathematics
  'If log₁₀(2) = 0.3010, what is the value of log₁₀(8)?': {
    ar: 'إذا كان لوغاريتم ٢ للأساس ١٠ = ٠٫٣٠١٠، فما هي قيمة لوغاريتم ٨ للأساس ١٠؟',
    ha: 'Idan log₁₀(2) = 0.3010, menene darajar log₁₀(8)?',
  },
  'Solve the quadratic equation: x² - 5x + 6 = 0': {
    ar: 'حل المعادلة التربيعية: س² - ٥س + ٦ = ٠',
    ha: 'Warware wannan lissafin quadratic: x² - 5x + 6 = 0',
  },
  'Differentiate y = 3x⁴ - 5x² + 7 with respect to x.': {
    ar: 'أوجد المشتقة الأولى للدالة: ص = ٣س⁴ - ٥س² + ٧ بالنسبة إلى س.',
    ha: 'Yi banbancewa (differentiation) na y = 3x⁴ - 5x² + 7 dangane da x.',
  },
  'What is the probability of obtaining an odd number when rolling a fair six-sided die?': {
    ar: 'ما هو احتمال الحصول على عدد فردي عند رمي نرد عادل ذي ستة أوجه؟',
    ha: 'Menene damar samun lambar maraya (odd number) idan aka kada ludo mai gefe 6?',
  },
  'A circular sector has radius 7cm and an angle of 60° at the centre. Find the arc length (Take π = 22/7).': {
    ar: 'قطاع دائري نصف قطره ٧ سم وزاويته المركزية ٦٠ درجة. احسب طول القوس (استخدم ط = ٢٢/٧).',
    ha: 'Wani yanki na da\'ira yana da radius 7cm da kusurwa 60°. Nemo tsawon bakan (arc length) tare da amfani da π = 22/7.',
  },
};

// Built-in Option Text Translations
const OPTION_TRANSLATIONS: Record<string, { ar: string; ha: string }> = {
  // Common Options
  'Units': { ar: 'الآحاد', ha: 'Daidai (Units)' },
  'Tens': { ar: 'العشرات', ha: 'Goman-goma (Tens)' },
  'Hundreds': { ar: 'المئات', ha: 'Darin-dari (Hundreds)' },
  'Thousands': { ar: 'الآلاف', ha: 'Dubbai (Thousands)' },
  '2 sides': { ar: 'ضلعان', ha: 'Bangarori 2' },
  '3 sides': { ar: '٣ أضلاع', ha: 'Bangarori 3' },
  '4 sides': { ar: '٤ أضلاع', ha: 'Bangarori 4' },
  '5 sides': { ar: '٥ أضلاع', ha: 'Bangarori 5' },
  '4 pencils': { ar: '٤ أقلام', ha: 'Fensir 4' },
  '5 pencils': { ar: '٥ أقلام', ha: 'Fensir 5' },
  '6 pencils': { ar: '٦ أقلام', ha: 'Fensir 6' },
  '8 pencils': { ar: '٨ أقلام', ha: 'Fensir 8' },
  'Stone': { ar: 'الحجر', ha: 'Dutse' },
  'Plant': { ar: 'النبات', ha: 'Shuka' },
  'Plastic cup': { ar: 'الكوب البلاستيكي', ha: 'Kofin roba' },
  'Book': { ar: 'الكتاب', ha: 'Littafi' },
  'Ear': { ar: 'الأذن', ha: 'Kunne' },
  'Eye': { ar: 'العين', ha: 'Ido' },
  'Nose': { ar: 'الأنف', ha: 'Hanci' },
  'Tongue': { ar: 'اللسان', ha: 'Harshe' },
  'Ice': { ar: 'الجليد / الثلج', ha: 'Kankara' },
  'Steam': { ar: 'بخار الماء', ha: 'Turi' },
  'Liquid water': { ar: 'الماء السائل', ha: 'Ruwa mai gudu' },
  'Smoke': { ar: 'الدخان', ha: 'Hayaƙi' },
  'The Moon': { ar: 'القمر', ha: 'Wata' },
  'The Sun': { ar: 'الشمس', ha: 'Rana' },
  'Candle': { ar: 'الشمعة', ha: 'Kyandir' },
  'Flashlight': { ar: 'المصباح اليدوي', ha: 'Fitila' },
  'Doctor': { ar: 'الطبيب', ha: 'Likita' },
  'Teacher': { ar: 'المعلم', ha: 'Malami' },
  'Farmer': { ar: 'المزارع', ha: 'Manomi' },
  'Carpenter': { ar: 'النجار', ha: 'Masassaƙi' },
  'Childs': { ar: 'Childs (خاطئ)', ha: 'Childs (ba daidai ba)' },
  'Children': { ar: 'Children (أطفال)', ha: 'Children (yara)' },
  'Childrens': { ar: 'Childrens (خاطئ)', ha: 'Childrens (kuskure)' },
  'Cold': { ar: 'بارد (Cold)', ha: 'Sanyi (Cold)' },
  'Warm': { ar: 'دافئ (Warm)', ha: 'Dumi (Warm)' },
  'Cool': { ar: 'معتدل (Cool)', ha: 'Mai dadi (Cool)' },
  'Boiling': { ar: 'مغلي (Boiling)', ha: 'Tafasasshe (Boiling)' },
  'goes': { ar: 'goes (يذهب)', ha: 'goes (yana zuwa)' },
  'go': { ar: 'go', ha: 'go' },
  'went': { ar: 'went', ha: 'went' },
  'gone': { ar: 'gone', ha: 'gone' },
  'Abuja': { ar: 'أبوجا (العاصمة الفيدرالية)', ha: 'Abuja (Babban Birni)' },
  'Lagos': { ar: 'لاغوس', ha: 'Legas' },
  'Kano': { ar: 'كانو', ha: 'Kano' },
  'Kaduna': { ar: 'كادونا', ha: 'Kaduna' },
  'Heart': { ar: 'القلب', ha: 'Zuciya' },
  'Lungs': { ar: 'الرئتان', ha: 'Huhu' },
  'Kidneys': { ar: 'الكليتان', ha: 'Koda' },
  'Liver': { ar: 'الكبد', ha: 'Hanta' },
  'Photosynthesis': { ar: 'البناء الضوئي (التمثيل الضوئي)', ha: 'Hada abinci ta hasken rana (Photosynthesis)' },
  'Respiration': { ar: 'التنفس الخلوي', ha: 'Numfashi (Respiration)' },
  'Transpiration': { ar: 'النتح', ha: 'Fitar ruwa ta ganye (Transpiration)' },
  'Digestion': { ar: 'الهضم', ha: 'Narkewar abinci (Digestion)' },
  'Mitochondria': { ar: 'الميتوكوندريا (محطة الطاقة)', ha: 'Mitochondria' },
  'Ribosome': { ar: 'الريبوسوم', ha: 'Ribosome' },
  'Nucleus': { ar: 'النواة', ha: 'Kwayar ciki (Nucleus)' },
  'Chloroplast': { ar: 'البلاستيدات الخضراء', ha: 'Chloroplast' },
  'Osmosis': { ar: 'الخاصية الأسموزية (التناضح)', ha: 'Shigar ruwa ta kariya (Osmosis)' },
  'Diffusion': { ar: 'الانتشار', ha: 'Yaduwa (Diffusion)' },
  'Active transport': { ar: 'النقل النشط', ha: 'Nisan aiki (Active transport)' },
  'Plasmolysis': { ar: 'البلزمة', ha: 'Plasmolysis' },
  'Strongly acidic': { ar: 'حمضي قوي', ha: 'Acid mai karfi' },
  'Weakly acidic': { ar: 'حمضي ضعيف', ha: 'Acid mai rauni' },
  'Neutral': { ar: 'متعادل (pH = 7)', ha: 'Daidai (ba acid ba)' },
  'Basic / Alkaline': { ar: 'قاعدي / قلوي', ha: 'Alkaline' },
  'Newton\'s first law': { ar: 'قانون نيوتن الأول', ha: 'Dokar Newton ta farko' },
  'Newton\'s second law': { ar: 'قانون نيوتن الثاني', ha: 'Dokar Newton ta biyu' },
  'Newton\'s third law': { ar: 'قانون نيوتن الثالث', ha: 'Dokar Newton ta uku' },
  'Law of conservation of energy': { ar: 'قانون بقاء الطاقة', ha: 'Dokar kiyaye makamashi' },
};

export const getLocalizedQuestionStatement = (
  q: ExamQuestion,
  lang: CbtLanguage
): LocalizedQuestionStatement => {
  const customAr = q.arabicText?.trim();
  const customHa = q.localText?.trim();
  const enText = q.text.trim();

  const dictMatch = STATEMENT_TRANSLATIONS[enText];
  const arText = customAr || dictMatch?.ar;
  const haText = customHa || dictMatch?.ha;

  if (lang === 'arabic') {
    return {
      primary: arText || enText,
      secondary: arText ? enText : undefined,
      dir: arText ? 'rtl' : 'ltr',
      isTranslated: Boolean(arText),
    };
  }

  if (lang === 'hausa') {
    return {
      primary: haText || enText,
      secondary: haText ? enText : undefined,
      dir: 'ltr',
      isTranslated: Boolean(haText),
    };
  }

  if (lang === 'multilingual') {
    return {
      primary: enText,
      secondary: arText,
      tertiary: haText,
      dir: 'ltr',
      isTranslated: true,
    };
  }

  return {
    primary: enText,
    dir: 'ltr',
    isTranslated: false,
  };
};

export const getLocalizedOptionStatement = (
  opt: ExamQuestionOption,
  lang: CbtLanguage
): LocalizedOptionStatement => {
  const customAr = opt.arabicText?.trim();
  const customHa = opt.localText?.trim();
  const enText = opt.text.trim();

  const dictMatch = OPTION_TRANSLATIONS[enText];
  const arText = customAr || dictMatch?.ar;
  const haText = customHa || dictMatch?.ha;

  if (lang === 'arabic') {
    return {
      primary: arText || enText,
      secondary: arText ? enText : undefined,
      dir: arText ? 'rtl' : 'ltr',
    };
  }

  if (lang === 'hausa') {
    return {
      primary: haText || enText,
      secondary: haText ? enText : undefined,
      dir: 'ltr',
    };
  }

  if (lang === 'multilingual') {
    return {
      primary: enText,
      secondary: arText,
      tertiary: haText,
      dir: 'ltr',
    };
  }

  return {
    primary: enText,
    dir: 'ltr',
  };
};
