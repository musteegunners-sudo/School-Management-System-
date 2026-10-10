import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Keyboard,
  X,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Delete,
  CornerDownLeft,
  ArrowRight,
  Bookmark,
  Type,
  HelpCircle,
  Layers,
  Settings2,
} from 'lucide-react';

export interface ArabicKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  defaultDocked?: boolean;
}

// Standard Arabic 101 Keyboard Layout Rows
export interface KeyDef {
  key: string;
  shiftKey?: string;
  label?: string;
  shiftLabel?: string;
  width?: string; // Tailwind width class
  isAction?: boolean;
  altText?: string;
}

// Arabic Tashkeel / Harakat Bar
export const ARABIC_TASHKEEL = [
  { char: '\u064E', name: 'فَتْحَة', translit: 'Fatha', example: 'ـَ' },
  { char: '\u064B', name: 'تَنْوِين فَتْح', translit: 'Tanwin Fath', example: 'ـً' },
  { char: '\u064F', name: 'ضَمَّة', translit: 'Damma', example: 'ـُ' },
  { char: '\u064C', name: 'تَنْوِين ضَمّ', translit: 'Tanwin Damm', example: 'ـٌ' },
  { char: '\u0650', name: 'كَسْرَة', translit: 'Kasra', example: 'ـِ' },
  { char: '\u064D', name: 'تَنْوِين كَسْر', translit: 'Tanwin Kasr', example: 'ـٍ' },
  { char: '\u0652', name: 'سُكُون', translit: 'Sukun', example: 'ـْ' },
  { char: '\u0651', name: 'شَدَّة', translit: 'Shadda', example: 'ـّ' },
  { char: '\u0640', name: 'تَطْوِيل', translit: 'Tatweel', example: 'ـ' },
  { char: 'آ', name: 'أَلِف مَدَّة', translit: 'Alif Maddah', example: 'آ' },
  { char: 'أ', name: 'أَلِف هَمْزَة', translit: 'Alif Hamza Above', example: 'أ' },
  { char: 'إ', name: 'هَمْزَة تَحْت', translit: 'Alif Hamza Below', example: 'إ' },
  { char: 'ء', name: 'هَمْزَة مُنْفَرِدَة', translit: 'Hamza', example: 'ء' },
  { char: 'ٱ', name: 'هَمْزَة وَصْل', translit: 'Hamzat Wasl', example: 'ٱ' },
];

// Eastern vs Western Arabic Digits
export const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const WESTERN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Common Educational & Islamic Phrases for Teachers
export interface QuickPhraseCategory {
  categoryName: string;
  categoryArabic: string;
  phrases: { text: string; label: string; meaning: string }[];
}

export const TEACHER_ARABIC_PHRASES: QuickPhraseCategory[] = [
  {
    categoryName: 'Honorifics & Sacred Symbols',
    categoryArabic: 'الرموز والصلوات',
    phrases: [
      { text: 'ﷺ', label: 'ﷺ', meaning: 'Sallallahu Alayhi Wa Sallam' },
      { text: 'ﷻ', label: 'ﷻ', meaning: 'Jalla Jalaluhu' },
      { text: '﷽', label: '﷽', meaning: 'Bismillahir Rahmanir Rahim' },
      { text: 'رضي الله عنه', label: 'رضي الله عنه', meaning: 'May Allah be pleased with him' },
      { text: 'رضي الله عنها', label: 'رضي الله عنها', meaning: 'May Allah be pleased with her' },
      { text: 'رضي الله عنهم', label: 'رضي الله عنهم', meaning: 'May Allah be pleased with them' },
      { text: 'رحمه الله', label: 'رحمه الله', meaning: 'May Allah have mercy upon him' },
      { text: 'حفظه الله', label: 'حفظه الله', meaning: 'May Allah preserve him' },
    ],
  },
  {
    categoryName: 'Greetings & Duas',
    categoryArabic: 'التحيات والدعاء',
    phrases: [
      { text: 'السلام عليكم ورحمة الله وبركاته', label: 'السلام عليكم', meaning: 'Peace and blessings upon you' },
      { text: 'بارك الله فيك', label: 'بارك الله فيك', meaning: 'May Allah bless you' },
      { text: 'جزاكم الله خيراً', label: 'جزاكم الله خيراً', meaning: 'May Allah reward you with goodness' },
      { text: 'ما شاء الله تبارك الله', label: 'ما شاء الله', meaning: 'As Allah willed, blessed is Allah' },
      { text: 'وفقك الله وسدد خطاك', label: 'وفقك الله', meaning: 'May Allah grant you success' },
      { text: 'الحمد لله رب العالمين', label: 'الحمد لله', meaning: 'Praise be to Allah, Lord of the worlds' },
    ],
  },
  {
    categoryName: 'Academic Remarks & Evaluation',
    categoryArabic: 'عبارات التقييم والملاحظات',
    phrases: [
      { text: 'ممتاز وجيد جداً، أداء متألق', label: 'ممتاز وأداء متألق', meaning: 'Excellent, shining performance' },
      { text: 'أحسنت واصل الاجتهاد والتميز', label: 'أحسنت واصل الاجتهاد', meaning: 'Well done, maintain high diligence' },
      { text: 'حفظ متقن وتلاوة صحيحة ما شاء الله', label: 'حفظ متقن وتلاوة صحيحة', meaning: 'Accurate memorization & tajweed' },
      { text: 'مستوى جيد مع إمكانية التحسن والتقدم', label: 'مستوى جيد مع تحسن', meaning: 'Good level with room for growth' },
      { text: 'يحتاج إلى مزيد من التركيز والمراجعة المستمرة', label: 'يحتاج إلى مزيد من التركيز', meaning: 'Needs more focus and continuous revision' },
      { text: 'ملاحظة: تكرار الغياب أثر سلباً على المستوى', label: 'ملاحظة الغياب', meaning: 'Attendance note: absence affected scores' },
      { text: 'الواجب المنزلي: مراجعة وحفظ المقرر بدقة', label: 'الواجب المنزلي: مراجعة', meaning: 'Homework: review and memorize assigned lesson' },
    ],
  },
  {
    categoryName: 'Curriculum & Subjects Vocabulary',
    categoryArabic: 'المصطلحات الدراسية والدروس',
    phrases: [
      { text: 'سورة ', label: 'سورة', meaning: 'Surah' },
      { text: 'الآية: ', label: 'الآية', meaning: 'Ayah' },
      { text: 'حديث شريف: ', label: 'حديث شريف', meaning: 'Noble Hadith' },
      { text: 'الدرس: ', label: 'الدرس', meaning: 'Lesson' },
      { text: 'الباب: ', label: 'الباب', meaning: 'Chapter' },
      { text: 'الفصل الدراسي: ', label: 'الفصل الدراسي', meaning: 'Academic Term' },
      { text: 'كتاب النحو الواضح', label: 'النحو الواضح', meaning: 'An-Nahw Al-Wadih textbook' },
      { text: 'صحيح البخاري', label: 'صحيح البخاري', meaning: 'Sahih Al-Bukhari' },
      { text: 'رياض الصالحين', label: 'رياض الصالحين', meaning: 'Riyadh As-Salihin' },
    ],
  },
];

// Physical Latin Keyboard to Arabic 101 Keyboard Keycode Map
export const PHYSICAL_KEY_MAP: Record<string, { normal: string; shift?: string }> = {
  Backquote: { normal: 'ذ', shift: 'ّ' },
  Digit1: { normal: '1', shift: '!' },
  Digit2: { normal: '2', shift: '@' },
  Digit3: { normal: '3', shift: '#' },
  Digit4: { normal: '4', shift: '$' },
  Digit5: { normal: '5', shift: '%' },
  Digit6: { normal: '6', shift: '^' },
  Digit7: { normal: '7', shift: '&' },
  Digit8: { normal: '8', shift: '*' },
  Digit9: { normal: '9', shift: ')' },
  Digit0: { normal: '0', shift: '(' },
  Minus: { normal: '-', shift: '_' },
  Equal: { normal: '=', shift: '+' },

  KeyQ: { normal: 'ض', shift: '\u064E' }, // Fatha
  KeyW: { normal: 'ص', shift: '\u064B' }, // Tanwin Fath
  KeyE: { normal: 'ث', shift: '\u064F' }, // Damma
  KeyR: { normal: 'ق', shift: '\u064C' }, // Tanwin Damm
  KeyT: { normal: 'ف', shift: 'لإ' },
  KeyY: { normal: 'غ', shift: 'إ' },
  KeyU: { normal: 'ع', shift: '‘' },
  KeyI: { normal: 'ه', shift: '÷' },
  KeyO: { normal: 'خ', shift: '×' },
  KeyP: { normal: 'ح', shift: '؛' },
  BracketLeft: { normal: 'ج', shift: '<' },
  BracketRight: { normal: 'د', shift: '>' },

  KeyA: { normal: 'ش', shift: '\u0650' }, // Kasra
  KeyS: { normal: 'س', shift: '\u064D' }, // Tanwin Kasr
  KeyD: { normal: 'ي', shift: ']' },
  KeyF: { normal: 'ب', shift: '[' },
  KeyG: { normal: 'ل', shift: 'لأ' },
  KeyH: { normal: 'ا', shift: 'أ' },
  KeyJ: { normal: 'ت', shift: '\u0640' }, // Tatweel
  KeyK: { normal: 'ن', shift: '،' },
  KeyL: { normal: 'م', shift: '/' },
  Semicolon: { normal: 'ك', shift: ':' },
  Quote: { normal: 'ط', shift: '"' },

  KeyZ: { normal: 'ئ', shift: '~' },
  KeyX: { normal: 'ء', shift: '\u0652' }, // Sukun
  KeyC: { normal: 'ؤ', shift: '}' },
  KeyV: { normal: 'ر', shift: '{' },
  KeyB: { normal: 'لا', shift: 'لآ' },
  KeyN: { normal: 'ى', shift: 'آ' },
  KeyM: { normal: 'ة', shift: '\'' },
  Comma: { normal: 'و', shift: ',' },
  Period: { normal: 'ز', shift: '.' },
  Slash: { normal: 'ظ', shift: '؟' },
};

/**
 * Inserts text into the currently active or targeted HTMLInputElement / HTMLTextAreaElement.
 * Dispatches standard synthetic input/change events for full React state synchronization.
 */
export function insertTextIntoTarget(
  target: HTMLInputElement | HTMLTextAreaElement,
  text: string
): void {
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const original = target.value;
  const newValue = original.substring(0, start) + text + original.substring(end);

  // Use native prototype property descriptor to trigger React's controlled input listeners
  const proto =
    target instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (nativeSetter) {
    nativeSetter.call(target, newValue);
  } else {
    target.value = newValue;
  }

  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));

  const newPos = start + text.length;
  try {
    target.setSelectionRange(newPos, newPos);
    target.focus();
  } catch (e) {
    // some input types don't support setSelectionRange
  }
}

/**
 * Handles Backspace on targeted input/textarea
 */
export function backspaceOnTarget(target: HTMLInputElement | HTMLTextAreaElement): void {
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const original = target.value;
  if (start === 0 && end === 0) return;

  let newValue = '';
  let newPos = start;

  if (start === end) {
    newValue = original.substring(0, start - 1) + original.substring(end);
    newPos = Math.max(0, start - 1);
  } else {
    newValue = original.substring(0, start) + original.substring(end);
    newPos = start;
  }

  const proto =
    target instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (nativeSetter) {
    nativeSetter.call(target, newValue);
  } else {
    target.value = newValue;
  }

  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));

  try {
    target.setSelectionRange(newPos, newPos);
    target.focus();
  } catch (e) {}
}

export const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({
  isOpen,
  onClose,
  className = '',
  defaultDocked = true,
}) => {
  // Mode & view states
  const [isShift, setIsShift] = useState(false);
  const [useEasternDigits, setUseEasternDigits] = useState(true);
  const [activeTab, setActiveTab] = useState<'keyboard' | 'phrases' | 'scratchpad'>('keyboard');
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [physicalInterception, setPhysicalInterception] = useState(false);

  // Scratchpad state
  const [scratchpadText, setScratchpadText] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Target element tracking
  const [targetElement, setTargetElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>('Scratchpad (المسودة)');

  const scratchpadRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Soft mechanical key click sound generator using Web Audio API
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      }
    } catch (e) {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  // Track focused input elements across the page
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;

      // Ignore inputs inside the keyboard itself, except the scratchpad
      const isInsideKeyboard = el.closest('.arabic-keyboard-container');
      if (isInsideKeyboard && el !== scratchpadRef.current) {
        return;
      }

      if (
        (el instanceof HTMLInputElement &&
          !['checkbox', 'radio', 'file', 'submit', 'button', 'color', 'range'].includes(el.type)) ||
        el instanceof HTMLTextAreaElement
      ) {
        setTargetElement(el);

        // Derive user-friendly label
        let label = el.placeholder || el.getAttribute('aria-label') || el.name || el.id || '';
        if (!label) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            label = parentLabel.textContent?.slice(0, 30) || '';
          }
        }
        if (el === scratchpadRef.current) {
          label = 'Scratchpad (لوحة المسودة)';
        }
        setTargetLabel(label ? `Input: ${label}` : 'Focused Input Field');
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  // Physical keyboard interception listener (optional Arabic transliteration/IME)
  useEffect(() => {
    if (!isOpen || !physicalInterception) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if ctrl/meta/alt is pressed (allow shortcuts like Ctrl+C, Ctrl+V)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const mapping = PHYSICAL_KEY_MAP[e.code];
      if (mapping) {
        const char = e.shiftKey && mapping.shift ? mapping.shift : mapping.normal;
        if (char) {
          e.preventDefault();
          playClickSound();
          handleInsert(char);
        }
      } else if (e.key === 'Backspace') {
        // Let normal backspace work
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, physicalInterception, playClickSound, targetElement]);

  // Insert character or string into current target or scratchpad
  const handleInsert = (text: string) => {
    playClickSound();
    if (targetElement && targetElement !== scratchpadRef.current && document.body.contains(targetElement)) {
      insertTextIntoTarget(targetElement, text);
    } else {
      // Insert into scratchpad
      if (scratchpadRef.current) {
        insertTextIntoTarget(scratchpadRef.current, text);
      } else {
        setScratchpadText((prev) => prev + text);
      }
    }
  };

  // Backspace on target or scratchpad
  const handleBackspace = () => {
    playClickSound();
    if (targetElement && targetElement !== scratchpadRef.current && document.body.contains(targetElement)) {
      backspaceOnTarget(targetElement);
    } else if (scratchpadRef.current) {
      backspaceOnTarget(scratchpadRef.current);
    } else {
      setScratchpadText((prev) => prev.slice(0, -1));
    }
  };

  // Clear current target or scratchpad
  const handleClear = () => {
    if (targetElement && targetElement !== scratchpadRef.current && document.body.contains(targetElement)) {
      const proto =
        targetElement instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(targetElement, '');
      } else {
        targetElement.value = '';
      }
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      setScratchpadText('');
      if (scratchpadRef.current) {
        scratchpadRef.current.value = '';
      }
    }
  };

  // Copy scratchpad or target text to clipboard
  const handleCopyScratchpad = () => {
    const textToCopy =
      targetElement && targetElement !== scratchpadRef.current
        ? targetElement.value
        : scratchpadText || (scratchpadRef.current?.value || '');

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    });
  };

  // Strip diacritics / tashkeel from text
  const handleStripTashkeel = () => {
    const stripRegex = /[\u064B-\u0652\u0670\u0640]/g;
    if (targetElement && targetElement !== scratchpadRef.current && document.body.contains(targetElement)) {
      const cleaned = targetElement.value.replace(stripRegex, '');
      const proto =
        targetElement instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(targetElement, cleaned);
      else targetElement.value = cleaned;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      const current = scratchpadRef.current?.value || scratchpadText;
      const cleaned = current.replace(stripRegex, '');
      setScratchpadText(cleaned);
      if (scratchpadRef.current) {
        scratchpadRef.current.value = cleaned;
      }
    }
  };

  if (!isOpen) return null;

  // Build Arabic Keyboard Layout rows
  const digitsRow = useEasternDigits ? EASTERN_ARABIC_DIGITS : WESTERN_DIGITS;

  const row1Keys: KeyDef[] = [
    { key: 'ذ', shiftKey: 'ّ' },
    ...digitsRow.map((d, idx) => ({
      key: d,
      shiftKey: ['!', '@', '#', '$', '%', '^', '&', '*', ')', '('][idx] || d,
    })),
    { key: '-', shiftKey: '_' },
    { key: '=', shiftKey: '+' },
  ];

  const row2Keys: KeyDef[] = [
    { key: 'ض', shiftKey: '\u064E' }, // Fatha
    { key: 'ص', shiftKey: '\u064B' }, // Tanwin Fath
    { key: 'ث', shiftKey: '\u064F' }, // Damma
    { key: 'ق', shiftKey: '\u064C' }, // Tanwin Damm
    { key: 'ف', shiftKey: 'لإ' },
    { key: 'غ', shiftKey: 'إ' },
    { key: 'ع', shiftKey: '‘' },
    { key: 'ه', shiftKey: '÷' },
    { key: 'خ', shiftKey: '×' },
    { key: 'ح', shiftKey: '؛' },
    { key: 'ج', shiftKey: '<' },
    { key: 'د', shiftKey: '>' },
    { key: '\\', shiftKey: '|' },
  ];

  const row3Keys: KeyDef[] = [
    { key: 'ش', shiftKey: '\u0650' }, // Kasra
    { key: 'س', shiftKey: '\u064D' }, // Tanwin Kasr
    { key: 'ي', shiftKey: ']' },
    { key: 'ب', shiftKey: '[' },
    { key: 'ل', shiftKey: 'لأ' },
    { key: 'ا', shiftKey: 'أ' },
    { key: 'ت', shiftKey: '\u0640' }, // Tatweel
    { key: 'ن', shiftKey: '،' },
    { key: 'م', shiftKey: '/' },
    { key: 'ك', shiftKey: ':' },
    { key: 'ط', shiftKey: '"' },
  ];

  const row4Keys: KeyDef[] = [
    { key: 'ئ', shiftKey: '~' },
    { key: 'ء', shiftKey: '\u0652' }, // Sukun
    { key: 'ؤ', shiftKey: '}' },
    { key: 'ر', shiftKey: '{' },
    { key: 'لا', shiftKey: 'لآ' },
    { key: 'ى', shiftKey: 'آ' },
    { key: 'ة', shiftKey: '\'' },
    { key: 'و', shiftKey: ',' },
    { key: 'ز', shiftKey: '.' },
    { key: 'ظ', shiftKey: '؟' },
  ];

  return (
    <div
      className={`arabic-keyboard-container fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out select-none shadow-2xl ${className}`}
      dir="rtl"
    >
      {/* Keyboard Container Card */}
      <div className="bg-slate-900/95 backdrop-blur-md text-slate-100 border-t-2 border-emerald-500 shadow-2xl max-w-5xl mx-auto rounded-t-3xl overflow-hidden">
        {/* Top Control Bar & Status Header */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Keyboard className="w-4 h-4" />
              <span>لوحة المفاتيح العربية</span>
              <span className="text-[11px] font-normal text-slate-400 font-sans" dir="ltr">
                (Arabic Keyboard)
              </span>
            </div>

            {/* Target Input Status Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-300 truncate max-w-xs font-sans"
              dir="ltr"
              title={targetLabel}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">{targetLabel}</span>
            </div>
          </div>

          {/* Navigation Sub-Tabs & Actions */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-0.5 bg-slate-800 rounded-xl">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('keyboard')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'keyboard'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                الأزرار (Keys)
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('phrases')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'phrases'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                العبارات (Phrases)
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('scratchpad')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'scratchpad'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                المسودة (Editor)
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-all ${
                soundEnabled
                  ? 'border-emerald-700/60 text-emerald-400 bg-emerald-950/40'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Click sound enabled' : 'Sound muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Physical Keyboard IME Toggle */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPhysicalInterception((prev) => !prev)}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                physicalInterception
                  ? 'border-amber-600/70 bg-amber-950/60 text-amber-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="When enabled, typing on your physical English keyboard will output Arabic letters directly"
            >
              <span>{physicalInterception ? '⌨️ Physical IME: ON' : '⌨️ Physical IME'}</span>
            </button>

            {/* Minimize / Maximize */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMinimized ? 'Expand keyboard' : 'Minimize keyboard'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Close Arabic Keyboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Hidden if Minimized */}
        {!isMinimized && (
          <div className="p-3 sm:p-4 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* Permanent Quick Tashkeel / Harakat Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
              <span className="text-[11px] font-bold text-amber-400 shrink-0 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-900/50">
                الحركات:
              </span>
              {ARABIC_TASHKEEL.map((tash) => (
                <button
                  key={tash.char}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsert(tash.char)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-emerald-700 hover:text-white text-slate-200 border border-slate-700/80 font-arabic text-base sm:text-lg min-w-9 flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 shadow-2xs"
                  title={`${tash.name} (${tash.translit})`}
                >
                  <span className="relative">{tash.example}</span>
                </button>
              ))}

              <div className="h-5 w-px bg-slate-800 shrink-0 mx-1"></div>

              {/* Number format toggle */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setUseEasternDigits((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors shrink-0"
              >
                الأرقام: {useEasternDigits ? '١ ٢ ٣ (عربي)' : '1 2 3 (إنجليزي)'}
              </button>

              {/* Strip Tashkeel utility */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleStripTashkeel}
                className="px-2 py-1 rounded-xl bg-slate-800/60 text-[11px] font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-700 border border-slate-700/60 transition-colors shrink-0"
                title="Remove all Harakat and diacritics from text"
              >
                حذف التشكيل
              </button>
            </div>

            {/* TAB 1: FULL VIRTUAL KEYBOARD LAYOUT */}
            {activeTab === 'keyboard' && (
              <div className="space-y-1.5 select-none" dir="rtl">
                {/* Row 1: Digits & Top Symbols */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                  {row1Keys.map((item, idx) => {
                    const displayChar = isShift && item.shiftKey ? item.shiftKey : item.key;
                    return (
                      <button
                        key={`r1-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsert(displayChar)}
                        className="flex-1 min-w-7 sm:min-w-10 h-10 sm:h-11 rounded-xl bg-slate-800/90 hover:bg-emerald-700 hover:text-white border border-slate-700/80 text-sm sm:text-base font-medium flex flex-col items-center justify-center transition-all active:scale-95 active:bg-emerald-600 shadow-2xs group"
                      >
                        <span className="font-arabic font-semibold">{displayChar}</span>
                        {item.shiftKey && item.shiftKey !== item.key && (
                          <span className="text-[9px] text-slate-500 group-hover:text-emerald-200 opacity-60 leading-none">
                            {isShift ? item.key : item.shiftKey}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {/* Backspace Key */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleBackspace}
                    className="min-w-12 sm:min-w-16 h-10 sm:h-11 px-2 rounded-xl bg-slate-800/90 hover:bg-rose-700 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 active:bg-rose-600 text-rose-300 shadow-2xs"
                    title="Backspace (مسح)"
                  >
                    <Delete className="w-4 h-4" />
                    <span className="hidden sm:inline">مسح</span>
                  </button>
                </div>

                {/* Row 2: Letters ض ص ث ق ف غ ع ه خ ح ج د */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                  {row2Keys.map((item, idx) => {
                    const displayChar = isShift && item.shiftKey ? item.shiftKey : item.key;
                    return (
                      <button
                        key={`r2-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsert(displayChar)}
                        className="flex-1 min-w-7 sm:min-w-10 h-10 sm:h-12 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white border border-slate-700 text-base sm:text-lg font-semibold flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 shadow-2xs font-arabic"
                      >
                        <span>{displayChar}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: Letters ش س ي ب ل ا ت ن م ك ط */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                  {row3Keys.map((item, idx) => {
                    const displayChar = isShift && item.shiftKey ? item.shiftKey : item.key;
                    return (
                      <button
                        key={`r3-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsert(displayChar)}
                        className="flex-1 min-w-7 sm:min-w-10 h-10 sm:h-12 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white border border-slate-700 text-base sm:text-lg font-semibold flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 shadow-2xs font-arabic"
                      >
                        <span>{displayChar}</span>
                      </button>
                    );
                  })}
                  {/* Enter Key */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert('\n')}
                    className="min-w-12 sm:min-w-16 h-10 sm:h-12 px-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 active:bg-emerald-600 shadow-2xs"
                    title="New line (سطر جديد)"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">إدخال</span>
                  </button>
                </div>

                {/* Row 4: Shift + Letters ئ ء ؤ ر لا ى ة و ز ظ + Shift */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                  {/* Shift Left */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsShift((prev) => !prev)}
                    className={`min-w-12 sm:min-w-16 h-10 sm:h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs ${
                      isShift
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold ring-2 ring-amber-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    <span>⇧ عالي</span>
                  </button>

                  {row4Keys.map((item, idx) => {
                    const displayChar = isShift && item.shiftKey ? item.shiftKey : item.key;
                    return (
                      <button
                        key={`r4-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsert(displayChar)}
                        className="flex-1 min-w-7 sm:min-w-10 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white border border-slate-700 text-base sm:text-lg font-semibold flex items-center justify-center transition-all active:scale-95 active:bg-emerald-600 shadow-2xs font-arabic"
                      >
                        <span>{displayChar}</span>
                      </button>
                    );
                  })}

                  {/* Shift Right */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsShift((prev) => !prev)}
                    className={`min-w-12 sm:min-w-16 h-10 sm:h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs ${
                      isShift
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold ring-2 ring-amber-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    <span>⇧ Shift</span>
                  </button>
                </div>

                {/* Row 5: Action bar (Space, Clear, Copy, Quotes) */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {/* Common Arabic punctuation & quotes */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert('«')}
                    className="h-10 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold font-arabic"
                    title="Open quotation («)"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert('»')}
                    className="h-10 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold font-arabic"
                    title="Close quotation (»)"
                  >
                    »
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert('،')}
                    className="h-10 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-base font-bold font-arabic"
                    title="Arabic comma (،)"
                  >
                    ،
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert('؛')}
                    className="h-10 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-base font-bold font-arabic"
                    title="Arabic semicolon (؛)"
                  >
                    ؛
                  </button>

                  {/* SPACE BAR */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert(' ')}
                    className="flex-1 max-w-md h-10 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white border border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-all active:scale-98 active:bg-emerald-600 shadow-2xs"
                  >
                    <span>مسافة (Space Bar)</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCopyScratchpad}
                    className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Copy current text"
                  >
                    {copiedNotification ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">نسخ</span>
                      </>
                    )}
                  </button>

                  {/* Clear Button */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    className="h-10 px-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700/80 text-xs flex items-center gap-1 transition-colors"
                    title="Clear current text"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">مسح الكل</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: COMMON TEACHER PHRASES & ISLAMIC VOCABULARY */}
            {activeTab === 'phrases' && (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                <div className="text-xs text-slate-400">
                  انقر على أي عبارة لإدراجها مباشرة في الحقل المحدد أو المسودة:
                </div>
                {TEACHER_ARABIC_PHRASES.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-xs text-amber-300">{group.categoryArabic}</span>
                      <span className="text-[11px] text-slate-500 font-sans" dir="ltr">
                        ({group.categoryName})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {group.phrases.map((phrase, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsert(phrase.text + ' ')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-700 hover:text-white border border-slate-700 text-xs font-arabic transition-all active:scale-95 text-slate-200 shadow-2xs group flex items-center gap-2"
                          title={phrase.meaning}
                        >
                          <span className="font-semibold text-sm">{phrase.label}</span>
                          <span className="text-[10px] text-slate-500 group-hover:text-emerald-200 font-sans" dir="ltr">
                            {phrase.meaning.slice(0, 24)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SCRATCHPAD & ADVANCED COMPOSER */}
            {activeTab === 'scratchpad' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>لوحة كتابة المسودات والدروس والملاحظات (Scratchpad):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-400">
                      {(scratchpadRef.current?.value || scratchpadText).length} حرف
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScratchpad}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                    >
                      {copiedNotification ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNotification ? 'تم النسخ!' : 'نسخ المسودة'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  ref={scratchpadRef}
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  dir="rtl"
                  rows={4}
                  placeholder="اكتب أو ركّب مسودتك هنا باستخدام لوحة المفاتيح، ثم انسخها أو أدرجها في أي حقل أو تقرير..."
                  className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder:text-slate-500 font-arabic text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInsert('\n')}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-xs hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      سطر جديد ↵
                    </button>
                    <button
                      type="button"
                      onClick={handleStripTashkeel}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-xs hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      تجريد الحركات
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-xs hover:bg-rose-900/40 border border-slate-700 text-rose-300"
                    >
                      مسح المسودة
                    </button>
                  </div>

                  {targetElement && targetElement !== scratchpadRef.current && (
                    <button
                      type="button"
                      onClick={() => {
                        if (scratchpadRef.current?.value || scratchpadText) {
                          insertTextIntoTarget(
                            targetElement,
                            scratchpadRef.current?.value || scratchpadText
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all"
                    >
                      <span>إدراج في الحقل المحدد</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Helper Banner */}
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>نصيحة:</strong> انقر داخل أي حقل إدخال (مثل البحث، أو موضوع الحصة، أو ملاحظات التقويم) ثم اكتب بالضغط على الأزرار مباشرة.
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-slate-500 font-sans" dir="ltr">
                <span>Shortcut: Press [Alt + A] or toggle docked</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
