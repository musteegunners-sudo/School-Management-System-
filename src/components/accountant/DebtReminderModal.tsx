import React from 'react';
import { X, Printer, AlertTriangle, Building2 } from 'lucide-react';
import { StudentAccountLedger, SchoolProfile } from '../../types';
import { formatNaira } from '../../services/financeService';

interface DebtReminderModalProps {
  ledger: StudentAccountLedger;
  schoolProfile: SchoolProfile;
  sessionName?: string;
  termName?: string;
  onClose: () => void;
}

export const DebtReminderModal: React.FC<DebtReminderModalProps> = ({
  ledger,
  schoolProfile,
  sessionName,
  termName,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-amber-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-bold">School Fee Reminder Notice (إشعار متابعة الرسوم)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Notice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-amber-200 hover:text-white hover:bg-amber-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Notice Canvas */}
        <div className="p-8 bg-white text-slate-800 space-y-6">
          <div className="text-center border-b pb-4 border-slate-200">
            <div className="text-xs font-arabic font-bold text-emerald-900 mb-1" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="text-lg font-black text-slate-900 uppercase font-serif tracking-tight">
              {schoolProfile.name}
            </h1>
            <div className="text-xs font-bold text-emerald-800 font-arabic" dir="rtl">
              {schoolProfile.arabicName}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Bursary & Accounts Department • {schoolProfile.address} • Tel: {schoolProfile.phone}
            </p>
          </div>

          <div className="flex justify-between items-start text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">TO:</span>
              <strong className="text-sm text-slate-900 font-bold block">
                The Respected Parent / Guardian of:
              </strong>
              <div className="mt-1 text-slate-800 font-semibold">
                {ledger.student.fullName} ({ledger.student.regNo})
              </div>
              <div className="text-slate-500">
                Class: <strong>{ledger.classInfo?.name || 'Class'}</strong>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div>Date: {todayStr}</div>
              <div>Session: {sessionName}</div>
              <div>Term: {termName}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-black uppercase text-amber-950 block">
              URGENT NOTICE: OUTSTANDING SCHOOL FEES & LEVIES
            </span>
            <span className="text-[11px] text-amber-800 font-arabic font-bold" dir="rtl">
              إشعار سداد الرسوم الدراسية المتأخرة
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-700">
            Assalamu Alaykum Warahmatullah Wabarakatuh. We express our sincere gratitude for partnering with
            us in the sound Islamic, Arabic, and academic upbringing of your ward at{' '}
            <strong>{schoolProfile.name}</strong>.
          </p>

          <p className="text-xs leading-relaxed text-slate-700">
            Our records indicate that the school fees for the current academic term remain outstanding as
            detailed below:
          </p>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans">Total Billed for Term</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatNaira(ledger.totalBilled)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-emerald-800">Less Amount Paid So Far</td>
                  <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                    - {formatNaira(ledger.totalPaid)}
                  </td>
                </tr>
                {ledger.totalWaivers > 0 && (
                  <tr>
                    <td className="py-2 px-3 font-sans text-teal-800">Less Approved Scholarship / Waiver</td>
                    <td className="py-2 px-3 text-right text-teal-700 font-semibold">
                      - {formatNaira(ledger.totalWaivers)}
                    </td>
                  </tr>
                )}
                <tr className="bg-amber-100/60 font-bold text-amber-950">
                  <td className="py-2.5 px-3 uppercase text-[11px] font-sans">Total Outstanding Balance Due</td>
                  <td className="py-2.5 px-3 text-right text-sm font-black text-rose-700">
                    {formatNaira(ledger.balanceDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-slate-700">
            We kindly appeal for the prompt settlement of this outstanding balance to enable us maintain
            smooth academic operations, uninterrupted electricity diesel supply, teacher welfare, and instructional
            learning materials.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-900 block mb-1">Official School Bank Account:</span>
            <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
              <div>Bank: <strong>Jaiz Bank Plc / Stanbic IBTC</strong></div>
              <div>Account Name: <strong>Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah</strong></div>
              <div>Account Number: <strong>0012345678</strong></div>
              <div className="text-[10px] text-slate-500 italic mt-1">
                * Please indicate student's Admission No ({ledger.student.regNo}) in transfer narration.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
            <div>
              <div className="h-8 flex items-end justify-center italic text-slate-600 font-serif">
                Mallam Usman Bello
              </div>
              <div className="w-40 mx-auto border-t border-slate-400 pt-1">
                <span className="font-bold text-[11px] block">School Bursar</span>
              </div>
            </div>
            <div>
              <div className="h-8 flex items-end justify-center italic text-slate-600 font-serif">
                {schoolProfile.mudirName}
              </div>
              <div className="w-40 mx-auto border-t border-slate-400 pt-1">
                <span className="font-bold text-[11px] block">Principal / Mudir</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Reminder Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
