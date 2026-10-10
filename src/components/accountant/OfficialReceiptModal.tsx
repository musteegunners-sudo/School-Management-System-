import React, { useRef } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Download,
  Building2,
  Calendar,
  CreditCard,
  User,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { FeePayment, SchoolProfile, SchoolClass, Student } from '../../types';
import { formatNaira, numberToWordsNaira } from '../../services/financeService';

interface OfficialReceiptModalProps {
  payment: FeePayment | null;
  student?: Student;
  classInfo?: SchoolClass;
  schoolProfile: SchoolProfile;
  sessionName?: string;
  termName?: string;
  balanceRemaining?: number;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  payment,
  student,
  classInfo,
  schoolProfile,
  sessionName,
  termName,
  balanceRemaining = 0,
  onClose,
}) => {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.date || payment.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="official-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:inset-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-0 print:rounded-none print:max-w-none print:w-full print:m-0">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 flex items-center justify-center border border-emerald-700/50">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Official Bursary Payment Receipt</h3>
              <p className="text-[11px] text-emerald-300/90 font-arabic" dir="rtl">
                سند قبض رسمي - كلية تطبيق التعاليم الإسلامية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div
          id="official-fee-receipt"
          ref={receiptPrintRef}
          className="p-6 sm:p-8 bg-white text-slate-800 relative print:p-4 print:text-black"
        >
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Building2 className="w-96 h-96 text-emerald-900" />
          </div>

          {/* Receipt Header */}
          <div className="text-center border-b-2 border-emerald-900/20 pb-5 mb-5 relative">
            <div className="text-xs sm:text-sm font-arabic font-bold text-emerald-900 mb-1" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase font-serif">
              {schoolProfile.name}
            </h1>
            <div className="text-sm sm:text-base font-bold text-emerald-800 font-arabic mt-0.5" dir="rtl">
              {schoolProfile.arabicName}
            </div>
            <p className="text-xs text-slate-600 font-medium italic mt-1">
              "{schoolProfile.motto}"
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2 font-mono">
              <span>{schoolProfile.address}</span>
              <span>•</span>
              <span>Tel: {schoolProfile.phone}</span>
              <span>•</span>
              <span>Email: {schoolProfile.email}</span>
            </div>

            {/* Receipt Title Banner */}
            <div className="mt-4 inline-flex flex-col items-center px-6 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-black tracking-wider uppercase text-emerald-900">
                OFFICIAL BURSARY RECEIPT / SANAD QABD
              </span>
              <span className="text-[11px] font-arabic font-bold text-emerald-800" dir="rtl">
                سَنَدُ قَبْضٍ مَالِيٍّ مُعْتَمَدْ
              </span>
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt No:</span>
              <span className="font-mono font-bold text-emerald-900 text-sm tracking-wide">
                {payment.receiptNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Issued:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Session:</span>
              <span className="font-semibold text-slate-800">{sessionName || payment.sessionId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Term / Semester:</span>
              <span className="font-semibold text-slate-800">{termName || payment.termId}</span>
            </div>
          </div>

          {/* Student & Payer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] pb-1 border-b border-slate-100">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Student Information / بيانات الطالب</span>
              </div>
              <div>
                <span className="text-slate-400">Full Name:</span>{' '}
                <strong className="text-slate-900 font-bold text-sm">{payment.studentName}</strong>
                {student?.arabicName && (
                  <span className="ml-1.5 text-xs font-arabic text-emerald-800" dir="rtl">
                    ({student.arabicName})
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>
                  <span className="text-slate-400">Reg No:</span>{' '}
                  <strong className="font-mono text-emerald-900">{payment.studentRegNo}</strong>
                </span>
                <span>
                  <span className="text-slate-400">Class:</span>{' '}
                  <strong className="text-slate-800">{classInfo?.name || 'Class Assigned'}</strong>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] pb-1 border-b border-slate-100">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>Payment & Depositor / تفاصيل السداد</span>
              </div>
              <div>
                <span className="text-slate-400">Paid By / Payer:</span>{' '}
                <strong className="text-slate-900 font-semibold">{payment.payerName}</strong>
                {payment.payerPhone && (
                  <span className="text-slate-500 text-[11px] ml-1">({payment.payerPhone})</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>
                  <span className="text-slate-400">Method:</span>{' '}
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 text-[11px]">
                    {payment.paymentMethod}
                  </span>
                </span>
                {payment.transactionRef && (
                  <span className="font-mono text-[11px] text-slate-600">
                    Ref: {payment.transactionRef}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description / Fee Head</th>
                  <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payment.allocatedFeeItems && payment.allocatedFeeItems.length > 0 ? (
                  payment.allocatedFeeItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{item.feeName}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatNaira(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-slate-400">1</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Term Tuition, Learning Materials & Campus Charges
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatNaira(payment.amountPaid)}
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-emerald-50/60 font-bold text-emerald-950 border-t-2 border-emerald-900/20">
                  <td colSpan={2} className="py-3 px-3 uppercase text-[11px]">
                    Total Amount Paid / المبلغ المدفوع
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base font-black text-emerald-900">
                    {formatNaira(payment.amountPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Amount in Words / المبلغ بالحروف:
            </span>
            <div className="font-semibold text-slate-800 italic font-serif">
              "{numberToWordsNaira(payment.amountPaid)}"
            </div>
          </div>

          {/* Status & Outstanding Ledger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-900 text-white mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">
                  Payment Status
                </span>
                <span className="text-xs font-bold text-white">
                  Payment Confirmed & Ledger Credited
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">
                Balance Due for Term
              </span>
              <span className="text-sm font-mono font-bold text-emerald-100">
                {balanceRemaining > 0 ? formatNaira(balanceRemaining) : '₦0.00 (Fully Cleared)'}
              </span>
            </div>
          </div>

          {/* Signatures & Stamp Section */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs break-inside-avoid print-avoid-break">
            <div>
              <div className="h-10 flex items-end justify-center font-serif text-slate-600 font-bold italic">
                {payment.receivedBy || 'Mallam Usman Bello'}
              </div>
              <div className="w-48 mx-auto border-t border-slate-400 pt-1">
                <span className="font-bold text-slate-800 block text-[11px]">Bursar / Accountant</span>
                <span className="text-[10px] text-slate-400 font-arabic" dir="rtl">
                  توقيع أمين الصندوق
                </span>
              </div>
            </div>

            <div>
              <div className="h-10 flex items-end justify-center font-serif text-slate-600 font-bold italic">
                {schoolProfile.mudirName || 'Principal Abubakar Alhassan'}
              </div>
              <div className="w-48 mx-auto border-t border-slate-400 pt-1">
                <span className="font-bold text-slate-800 block text-[11px]">Principal / Mudir Stamp</span>
                <span className="text-[10px] text-slate-400 font-arabic" dir="rtl">
                  اعتماد مدير الكلية
                </span>
              </div>
            </div>
          </div>

          {/* Security Notice Footer */}
          <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-100">
            This is a computer-generated official receipt issued by the Bursary Department of{' '}
            {schoolProfile.name}. Any alteration renders this voucher invalid.
          </div>
        </div>

        {/* Bottom Actions for Print/Close */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
