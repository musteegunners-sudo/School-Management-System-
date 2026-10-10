import React, { useState, useId } from 'react';
import {
  X,
  CreditCard,
  Check,
  User,
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  FeeItem,
  FeePayment,
  PaymentMethod,
  FeeWaiver,
} from '../../types';
import {
  formatNaira,
  generateReceiptNumber,
  calculateStudentLedger,
} from '../../services/financeService';

interface RecordPaymentModalProps {
  students: Student[];
  classes: SchoolClass[];
  feeItems: FeeItem[];
  payments: FeePayment[];
  waivers: FeeWaiver[];
  selectedStudentId?: string;
  currentSessionId: string;
  currentTermId: string;
  accountantName: string;
  accountantStaffId?: string;
  onSavePayment: (payment: FeePayment) => void;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  students,
  classes,
  feeItems,
  payments,
  waivers,
  selectedStudentId,
  currentSessionId,
  currentTermId,
  accountantName,
  accountantStaffId,
  onSavePayment,
  onClose,
}) => {
  const [studentId, setStudentId] = useState<string>(selectedStudentId || (students[0]?.id ?? ''));
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [bankName, setBankName] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [payerName, setPayerName] = useState<string>('');
  const [payerPhone, setPayerPhone] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // IDs for accessibility
  const studentSelectId = useId();
  const amountInputId = useId();
  const methodSelectId = useId();
  const dateInputId = useId();
  const payerNameId = useId();
  const payerPhoneId = useId();
  const bankNameId = useId();
  const refId = useId();

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedClass = selectedStudent ? classes.find((c) => c.id === selectedStudent.classId) : undefined;

  // Compute ledger for selected student
  const ledger = selectedStudent
    ? calculateStudentLedger(
        selectedStudent,
        selectedClass,
        feeItems,
        payments,
        waivers,
        currentSessionId,
        currentTermId
      )
    : null;

  // Auto-fill payer details when student changes if not manually edited
  const handleStudentChange = (newStudentId: string) => {
    setStudentId(newStudentId);
    const s = students.find((item) => item.id === newStudentId);
    if (s) {
      setPayerName(s.guardianName || s.fullName);
      setPayerPhone(s.guardianPhone || '');
    }
  };

  // Initial fill
  React.useEffect(() => {
    if (selectedStudent && !payerName) {
      setPayerName(selectedStudent.guardianName || selectedStudent.fullName);
      setPayerPhone(selectedStudent.guardianPhone || '');
    }
  }, [selectedStudent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudent) {
      setFormError('Please select an enrolled student.');
      return;
    }

    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive payment amount (₦).');
      return;
    }

    const newReceiptNo = generateReceiptNumber(payments);

    const newPayment: FeePayment = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      receiptNumber: newReceiptNo,
      studentId: selectedStudent.id,
      studentRegNo: selectedStudent.regNo,
      studentName: selectedStudent.fullName,
      classId: selectedStudent.classId,
      sessionId: currentSessionId,
      termId: currentTermId,
      amountPaid: numAmount,
      paymentMethod,
      bankName: bankName.trim() || undefined,
      transactionRef: transactionRef.trim() || undefined,
      payerName: payerName.trim() || selectedStudent.guardianName || selectedStudent.fullName,
      payerPhone: payerPhone.trim() || undefined,
      receivedBy: accountantName || 'School Bursar',
      receivedByStaffId: accountantStaffId,
      date,
      remarks: remarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSavePayment(newPayment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <CreditCard className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Record Fee Payment (سند قبض)</h3>
              <p className="text-[11px] text-emerald-300 font-arabic" dir="rtl">
                تسجيل استلام الرسوم وإصدار سند القبض
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label htmlFor={studentSelectId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Enrolled Student *
            </label>
            <select
              id={studentSelectId}
              required
              value={studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            >
              {students.length === 0 && <option value="">No registered students found</option>}
              {students.map((s) => {
                const c = classes.find((item) => item.id === s.classId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.regNo} — {s.fullName} ({c?.name || 'Class'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Student Ledger Quick Summary Card */}
          {ledger && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/60 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 text-sm">{ledger.student.fullName}</span>
                  <span className="text-slate-500 ml-2 font-mono text-[11px]">{ledger.student.regNo}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                    ledger.status === 'Fully Cleared' || ledger.status === 'Overpaid'
                      ? 'bg-emerald-100 text-emerald-900'
                      : ledger.status === 'Part Payment'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {ledger.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Term Total Bill</span>
                  <strong className="font-mono text-slate-900 text-xs">{formatNaira(ledger.totalBilled)}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Total Paid So Far</span>
                  <strong className="font-mono text-emerald-700 text-xs">{formatNaira(ledger.totalPaid)}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Balance Remaining</span>
                  <strong className="font-mono text-rose-700 text-xs font-bold">
                    {formatNaira(Math.max(0, ledger.balanceDue))}
                  </strong>
                </div>
              </div>

              {ledger.balanceDue > 0 && (
                <div className="flex items-center gap-2 mt-3 text-[11px]">
                  <span className="text-slate-500">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => setAmountInput(String(ledger.balanceDue))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all shadow-2xs"
                  >
                    Pay Full Balance ({formatNaira(ledger.balanceDue)})
                  </button>
                  {ledger.balanceDue > 10000 && (
                    <button
                      type="button"
                      onClick={() => setAmountInput(String(Math.round(ledger.balanceDue / 2)))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold hover:bg-emerald-100"
                    >
                      Pay 50%
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Amount Paid & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={amountInputId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Amount to Collect (₦) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400">
                  ₦
                </span>
                <input
                  id={amountInputId}
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="e.g. 35000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor={dateInputId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Date *
              </label>
              <input
                id={dateInputId}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Method & Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={methodSelectId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Method *
              </label>
              <select
                id={methodSelectId}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                <option value="Bank Transfer">Bank Transfer (تحويل مصرفي)</option>
                <option value="Cash">Cash at Bursary (نقداً)</option>
                <option value="POS">POS Terminal (نقطة البيع)</option>
                <option value="Bank Deposit / Teller">Bank Deposit / Teller (إيداع بنكي)</option>
                <option value="Cheque">Cheque (شيك مصرفي)</option>
              </select>
            </div>

            <div>
              <label htmlFor={refId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Bank / Reference / Teller No
              </label>
              <input
                id={refId}
                type="text"
                placeholder="e.g. Stanbic / TRF-839210"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={payerNameId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Payer / Depositor Full Name *
              </label>
              <input
                id={payerNameId}
                type="text"
                required
                placeholder="e.g. Alhaji Ibrahim Danmari (Father)"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor={payerPhoneId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Payer Phone Number
              </label>
              <input
                id={payerPhoneId}
                type="tel"
                placeholder="e.g. 0803 123 4567"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Remarks / Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in full for 3rd term tuition & books"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Record & Generate Official Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
