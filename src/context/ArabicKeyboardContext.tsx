import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ArabicKeyboard, insertTextIntoTarget } from '../components/ArabicKeyboard';
import { Keyboard, Languages, Sparkles } from 'lucide-react';

interface ArabicKeyboardContextType {
  isOpen: boolean;
  openKeyboard: (targetElementId?: string) => void;
  closeKeyboard: () => void;
  toggleKeyboard: () => void;
  insertDirectText: (text: string) => void;
}

const ArabicKeyboardContext = createContext<ArabicKeyboardContextType | undefined>(undefined);

export const ArabicKeyboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openKeyboard = useCallback((targetElementId?: string) => {
    setIsOpen(true);
    if (targetElementId) {
      setTimeout(() => {
        const el = document.getElementById(targetElementId);
        if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          el.focus();
        }
      }, 50);
    }
  }, []);
  const closeKeyboard = useCallback(() => setIsOpen(false), []);
  const toggleKeyboard = useCallback(() => setIsOpen((prev) => !prev), []);

  const insertDirectText = useCallback((text: string) => {
    const active = document.activeElement;
    if (
      active &&
      (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
    ) {
      insertTextIntoTarget(active, text);
    }
  }, []);

  // Global keyboard shortcut: Alt + A or Alt + K toggles Arabic keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A' || e.key === 'k' || e.key === 'K' || e.key === 'ش')) {
        e.preventDefault();
        toggleKeyboard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleKeyboard]);

  return (
    <ArabicKeyboardContext.Provider
      value={{
        isOpen,
        openKeyboard,
        closeKeyboard,
        toggleKeyboard,
        insertDirectText,
      }}
    >
      {children}
      {/* Mounted Arabic Keyboard Instance */}
      <ArabicKeyboard isOpen={isOpen} onClose={closeKeyboard} />
    </ArabicKeyboardContext.Provider>
  );
};

export const useArabicKeyboard = (): ArabicKeyboardContextType => {
  const context = useContext(ArabicKeyboardContext);
  if (!context) {
    throw new Error('useArabicKeyboard must be used within an ArabicKeyboardProvider');
  }
  return context;
};

/**
 * Floating Quick Toggle Button for Teacher Dashboard
 */
export const ArabicKeyboardFloatingToggle: React.FC<{
  className?: string;
  label?: string;
}> = ({ className = '', label = 'لوحة المفاتيح العربية' }) => {
  const { isOpen, toggleKeyboard } = useArabicKeyboard();

  return (
    <button
      type="button"
      id="btn-floating-arabic-keyboard"
      onClick={toggleKeyboard}
      className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-xl transition-all active:scale-95 group font-arabic ${
        isOpen
          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-400/50'
          : 'bg-emerald-900/90 hover:bg-emerald-800 text-white border border-emerald-700/80 backdrop-blur-md'
      } ${className}`}
      title="Toggle Arabic Virtual Keyboard (Alt + A) / لوحة المفاتيح العربية"
    >
      <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <Keyboard className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className="text-xs font-bold font-arabic">{label}</span>
        <span className="text-[10px] text-emerald-200/80 group-hover:text-white font-sans mt-0.5">
          {isOpen ? 'Close (إخفاء)' : 'Arabic Keyboard (عربي)'}
        </span>
      </div>
    </button>
  );
};
