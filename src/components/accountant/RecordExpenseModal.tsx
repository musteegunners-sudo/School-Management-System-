import React, { useState, useId } from 'react';
import {
  X,
  PlusCircle,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  SchoolExpense,
  ExpenseCategory,
  PaymentMethod,
} from '../../types';
import { generateVoucherNumber } from '../../services/financeService';

interface RecordExpenseModalProps {
  expenses: SchoolExpense[];
  accountantName: string;
  mudirName: string;
  onSaveExpense: (expense: SchoolExpense) => void;
  onClose: () => void;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  expenses,
  accountantName,
  mudirName,
  onSaveExpense,
  onClose,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('Generator Fuel & Diesel');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paidTo, setPaidTo] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState(mudirName || 'Principal Abubakar Alhassan');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [error, setError] = useState<string | null>(null);

  const descId = useId();
  const amountId = useId();
  const catId = useId();
  const paidToId = useId();
  const methodId = useId();
  const authById = useId();
  const dateId = useId();
  const refId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount in Naira (₦).');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a clear description of the expenditure.');
      return;
    }

    if (!paidTo.trim()) {
      setError('Please provide the payee / vendor / staff recipient name.');
      return;
    }

    const voucherNumber = generateVoucherNumber(expenses);

    const newExpense: SchoolExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      voucherNumber,
      category,
      description: description.trim(),
      amount: numAmount,
      paymentMethod,
      paidTo: paidTo.trim(),
      authorizedBy: authorizedBy.trim(),
      recordedBy: accountantName || 'School Bursar',
      date,
      invoiceRef: invoiceRef.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <FileText className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Record Operating Expenditure (سند صرف)</h3>
              <p className="text-[11px] text-emerald-300/90 font-arabic" dir="rtl">
                تسجيل مصروفات وتشغيل الكلية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={catId} className="block text-xs font-bold text-slate-700 mb-1">
                Expense Category *
              </label>
              <select
                id={catId}
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                <option value="Generator Fuel & Diesel">Generator Fuel & Diesel</option>
                <option value="Staff Salaries & Honorarium">Staff Salaries & Honorarium</option>
                <option value="Facility Maintenance & Repairs">Facility Maintenance & Repairs</option>
                <option value="Printing, Books & Examination Materials">
                  Printing, Books & Examination Materials
                </option>
                <option value="Utilities, Water & Electricity">Utilities, Water & Electricity</option>
                <option value="Islamic Events & Tahfiz Prizes">Islamic Events & Tahfiz Prizes</option>
                <option value="Administrative & Logistics">Administrative & Logistics</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor={amountId} className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₦) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400">
                  ₦
                </span>
                <input
                  id={amountId}
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="e.g. 45000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={descId} className="block text-xs font-bold text-slate-700 mb-1">
              Purpose / Description *
            </label>
            <textarea
              id={descId}
              rows={2}
              required
              placeholder="e.g. Purchased 150L diesel for school generator and borehole water pumping station"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={paidToId} className="block text-xs font-bold text-slate-700 mb-1">
                Paid To (Payee / Vendor / Contractor) *
              </label>
              <input
                id={paidToId}
                type="text"
                required
                placeholder="e.g. Al-Noor Electricals Kasuwan Magani"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor={methodId} className="block text-xs font-bold text-slate-700 mb-1">
                Payment Channel *
              </label>
              <select
                id={methodId}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                <option value="Cash">Cash (نقداً)</option>
                <option value="Bank Transfer">Bank Transfer (تحويل)</option>
                <option value="POS">POS Card (نقطة بيع)</option>
                <option value="Cheque">Cheque (شيك)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor={dateId} className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Date *
              </label>
              <input
                id={dateId}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor={authById} className="block text-xs font-bold text-slate-700 mb-1">
                Authorized By *
              </label>
              <input
                id={authById}
                type="text"
                required
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor={refId} className="block text-xs font-bold text-slate-700 mb-1">
                Invoice / Ref Number
              </label>
              <input
                id={refId}
                type="text"
                placeholder="e.g. INV-9921"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Expense Voucher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
