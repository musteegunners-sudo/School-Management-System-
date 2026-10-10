import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Plus,
  Filter,
  CreditCard,
  FileText,
  DollarSign,
  Download,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Award,
  Sparkles,
  ChevronRight,
  Trash2,
  Eye,
  Check,
  X,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  FeeItem,
  FeePayment,
  SchoolExpense,
  FeeWaiver,
  SchoolProfile,
  AcademicSession,
  Term,
  AuthUser,
  StudentAccountLedger,
  FeeCategory,
} from '../types';
import {
  formatNaira,
  calculateStudentLedger,
  calculateSchoolFinancialOverview,
  defaultFeeItems,
  defaultSchoolExpenses,
} from '../services/financeService';
import { OfficialReceiptModal } from './accountant/OfficialReceiptModal';
import { RecordPaymentModal } from './accountant/RecordPaymentModal';
import { RecordExpenseModal } from './accountant/RecordExpenseModal';
import { DebtReminderModal } from './accountant/DebtReminderModal';

interface AccountantDashboardViewProps {
  currentUser: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  sessions: AcademicSession[];
  terms: Term[];
  schoolProfile: SchoolProfile;
  feeItems: FeeItem[];
  feePayments: FeePayment[];
  schoolExpenses: SchoolExpense[];
  feeWaivers: FeeWaiver[];
  onSavePayment: (payment: FeePayment) => void;
  onDeletePayment?: (paymentId: string) => void;
  onSaveExpense: (expense: SchoolExpense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onSaveFeeItem: (item: FeeItem) => void;
  onDeleteFeeItem?: (itemId: string) => void;
  onSaveWaiver: (waiver: FeeWaiver) => void;
  onDeleteWaiver?: (waiverId: string) => void;
}

export const AccountantDashboardView: React.FC<AccountantDashboardViewProps> = ({
  currentUser,
  students,
  classes,
  sessions,
  terms,
  schoolProfile,
  feeItems,
  feePayments,
  schoolExpenses,
  feeWaivers,
  onSavePayment,
  onDeletePayment,
  onSaveExpense,
  onDeleteExpense,
  onSaveFeeItem,
  onDeleteFeeItem,
  onSaveWaiver,
  onDeleteWaiver,
}) => {
  // Navigation tabs within the Accountant Suite
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'ledgers' | 'receipts' | 'expenses' | 'fee_setup' | 'waivers' | 'statement'
  >('overview');

  // Term / Session selection
  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];
  const [selectedSessionId, setSelectedSessionId] = useState(currentSession?.id || '');
  const [selectedTermId, setSelectedTermId] = useState(currentTerm?.id || '');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Fully Cleared' | 'Part Payment' | 'Defaulter'>('all');

  // Modal states
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isNewFeeItemOpen, setIsNewFeeItemOpen] = useState(false);
  const [isNewWaiverOpen, setIsNewWaiverOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<FeePayment | null>(null);
  const [selectedLedgerForReminder, setSelectedLedgerForReminder] = useState<StudentAccountLedger | null>(null);
  const [preselectedStudentIdForPayment, setPreselectedStudentIdForPayment] = useState<string | undefined>(undefined);

  // New Fee Item form state
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeArabicName, setNewFeeArabicName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [newFeeCategory, setNewFeeCategory] = useState<FeeCategory>('Tuition');
  const [newFeeTargetClass, setNewFeeTargetClass] = useState('all');
  const [newFeeIsMandatory, setNewFeeIsMandatory] = useState(true);

  // New Waiver form state
  const [waiverStudentId, setWaiverStudentId] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState<any>('Tahfiz Scholarship (Hifz)');
  const [waiverNotes, setWaiverNotes] = useState('');

  // Financial calculations
  const overview = useMemo(() => {
    return calculateSchoolFinancialOverview(
      students,
      classes,
      feeItems,
      feePayments,
      schoolExpenses,
      feeWaivers,
      selectedSessionId,
      selectedTermId
    );
  }, [students, classes, feeItems, feePayments, schoolExpenses, feeWaivers, selectedSessionId, selectedTermId]);

  // Filtered student ledgers
  const filteredLedgers = useMemo(() => {
    return overview.ledgers.filter((ledger) => {
      // Class filter
      if (classFilter !== 'all' && ledger.student.classId !== classFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && ledger.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ledger.student.fullName.toLowerCase().includes(query);
        const matchesReg = ledger.student.regNo.toLowerCase().includes(query);
        const matchesGuardian = ledger.student.guardianName?.toLowerCase().includes(query);
        return matchesName || matchesReg || matchesGuardian;
      }
      return true;
    });
  }, [overview.ledgers, classFilter, statusFilter, searchQuery]);

  // Handle new fee item submit
  const handleCreateFeeItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newFeeAmount);
    if (!newFeeName.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const item: FeeItem = {
      id: 'fee_' + Date.now(),
      name: newFeeName.trim(),
      arabicName: newFeeArabicName.trim() || undefined,
      amount: amountNum,
      targetClassIds: newFeeTargetClass === 'all' ? ['all'] : [newFeeTargetClass],
      sessionId: 'all',
      termId: 'all',
      category: newFeeCategory,
      isMandatory: newFeeIsMandatory,
      createdAt: new Date().toISOString(),
    };

    onSaveFeeItem(item);
    setNewFeeName('');
    setNewFeeArabicName('');
    setNewFeeAmount('');
    setIsNewFeeItemOpen(false);
  };

  // Handle new waiver submit
  const handleCreateWaiver = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(waiverAmount);
    if (!waiverStudentId || isNaN(amountNum) || amountNum <= 0) return;

    const waiver: FeeWaiver = {
      id: 'waiver_' + Date.now(),
      studentId: waiverStudentId,
      sessionId: selectedSessionId,
      termId: selectedTermId,
      amount: amountNum,
      reason: waiverReason,
      notes: waiverNotes.trim() || undefined,
      approvedBy: schoolProfile.mudirName || 'Principal Abubakar Alhassan',
      createdAt: new Date().toISOString(),
    };

    onSaveWaiver(waiver);
    setWaiverStudentId('');
    setWaiverAmount('');
    setWaiverNotes('');
    setIsNewWaiverOpen(false);
  };

  const handleOpenPaymentForStudent = (studentId: string) => {
    setPreselectedStudentIdForPayment(studentId);
    setIsRecordPaymentOpen(true);
  };

  const handlePaymentSuccess = (payment: FeePayment) => {
    onSavePayment(payment);
    setIsRecordPaymentOpen(false);
    setSelectedPaymentForReceipt(payment); // Instant receipt preview & print
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Bursary Identity & Executive Action Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <Wallet className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700/60 text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bursary & Financial Accounts Directorate</span>
              <span className="text-emerald-400">•</span>
              <span className="font-arabic" dir="rtl">إدارة الشؤون المالية والحسابات</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
              School Accountant Portal
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
              Real-time tuition fee tracking, Sanad Qabd receipt vouchers, student ledger balances, operating
              expenditure reconciliation, and official financial reporting for {schoolProfile.name}.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-emerald-200/80 font-mono">
              <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-700/50">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accountant: <strong>{currentUser.name}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-700/50">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Session: <strong>{currentSession?.name || '2026/2027'}</strong></span>
                <span>•</span>
                <span>Term: <strong>{currentTerm?.name || '3rd Term'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="btn-quick-record-payment"
              onClick={() => {
                setPreselectedStudentIdForPayment(undefined);
                setIsRecordPaymentOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Fee Payment</span>
            </button>

            <button
              type="button"
              id="btn-quick-record-expense"
              onClick={() => setIsRecordExpenseOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Record Expense</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('statement')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold transition-all border border-emerald-700/60 active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Financial Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Key Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Expected Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase text-[11px] tracking-wider">Expected Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {formatNaira(overview.totalExpectedRevenue)}
          </div>
          <div className="text-[11px] text-slate-400">
            From {overview.totalStudents} enrolled students
          </div>
        </div>

        {/* Metric 2: Collected Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-200/80 shadow-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span className="uppercase text-[11px] tracking-wider">Collected Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-800">
            {formatNaira(overview.totalCollectedRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
            <span>{overview.collectionRate}% collection rate</span>
            <span className="text-slate-300">•</span>
            <span className="font-normal text-slate-500">{overview.fullyClearedCount} cleared</span>
          </div>
        </div>

        {/* Metric 3: Outstanding Receivables */}
        <div className="p-5 rounded-3xl bg-white border border-rose-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span className="uppercase text-[11px] tracking-wider">Outstanding Debt</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-800">
            {formatNaira(overview.totalOutstandingReceivables)}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">
            {overview.defaultersCount} students with arrears
          </div>
        </div>

        {/* Metric 4: Operating Expenses */}
        <div className="p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
            <span className="uppercase text-[11px] tracking-wider">Operating Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-amber-900">
            {formatNaira(overview.totalOperatingExpenses)}
          </div>
          <div className="text-[11px] text-slate-500">
            {schoolExpenses.length} disbursements logged
          </div>
        </div>

        {/* Metric 5: Net Operating Surplus */}
        <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
            <span className="uppercase text-[11px] tracking-wider">Net Cash Surplus</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-900 text-emerald-300 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-xl font-black font-mono ${
              overview.netSurplus >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {formatNaira(overview.netSurplus)}
          </div>
          <div className="text-[11px] text-emerald-200/70">
            Revenue minus operating costs
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Financial Overview</span>
        </button>

        <button
          type="button"
          id="tab-btn-ledgers"
          onClick={() => setActiveSubTab('ledgers')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'ledgers'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Fee Ledgers</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
            {overview.ledgers.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-receipts"
          onClick={() => setActiveSubTab('receipts')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'receipts'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Receipts & Transactions</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
            {feePayments.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-expenses"
          onClick={() => setActiveSubTab('expenses')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'expenses'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Expenses & Vouchers</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
            {schoolExpenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('fee_setup')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'fee_setup'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Fee Schedules & Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('waivers')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'waivers'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Scholarships & Waivers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('statement')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'statement'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Financial Statement</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-VIEW 1: OVERVIEW & ANALYTICS
         ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Collection Progress Meter */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Term Revenue Realization</h3>
                  <p className="text-xs text-slate-500">Collected vs. Outstanding Fee Receivables</p>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {overview.collectionRate}% Recovered
                </span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${overview.collectionRate}%` }}
                  className="h-full bg-emerald-600 transition-all duration-500"
                  title="Collected Fees"
                />
                <div
                  style={{ width: `${100 - overview.collectionRate}%` }}
                  className="h-full bg-rose-400 transition-all duration-500"
                  title="Outstanding Arrears"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-slate-500 block text-[11px]">Collected</span>
                  <strong className="font-mono text-emerald-900 font-bold text-sm">
                    {formatNaira(overview.totalCollectedRevenue)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <span className="text-slate-500 block text-[11px]">Outstanding</span>
                  <strong className="font-mono text-rose-900 font-bold text-sm">
                    {formatNaira(overview.totalOutstandingReceivables)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <span className="text-slate-500 block text-[11px]">Waivers Granted</span>
                  <strong className="font-mono text-teal-900 font-bold text-sm">
                    {formatNaira(overview.totalWaivers)}
                  </strong>
                </div>
              </div>

              {/* Class by Class Collection Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400">Class Recovery Breakdown</h4>
                <div className="space-y-2">
                  {classes.map((c) => {
                    const classStudents = students.filter((s) => s.classId === c.id);
                    const classLedgers = overview.ledgers.filter((l) => l.student.classId === c.id);
                    const classExpected = classLedgers.reduce((acc, l) => acc + l.totalBilled, 0);
                    const classPaid = classLedgers.reduce((acc, l) => acc + l.totalPaid, 0);
                    const classPct = classExpected > 0 ? Math.round((classPaid / classExpected) * 100) : 100;

                    return (
                      <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-1/3">
                          <strong className="text-slate-800 font-semibold">{c.name}</strong>
                          <span className="text-slate-400 text-[11px] block">{classStudents.length} students</span>
                        </div>
                        <div className="w-1/3 px-3">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, classPct)}%` }}
                              className="h-full bg-emerald-700 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="w-1/3 text-right font-mono">
                          <span className="font-bold text-slate-900">{formatNaira(classPaid)}</span>
                          <span className="text-slate-400 text-[11px] block">/ {formatNaira(classExpected)} ({classPct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Bursary Operations Ticker */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h3>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('receipts')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  View All
                </button>
              </div>

              {feePayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No payment vouchers recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {feePayments.slice(-5).reverse().map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPaymentForReceipt(pay)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{pay.studentName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({pay.receiptNumber})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {pay.paymentMethod} • {pay.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700 text-xs block">
                          +{formatNaira(pay.amountPaid)}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-semibold hover:underline">
                          Print Receipt
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Operating Expenses Quick Peek */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900">Recent Disbursements</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('expenses')}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {schoolExpenses.slice(-3).reverse().map((exp) => (
                  <div key={exp.id} className="py-2 border-b border-slate-100 last:border-0 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <span className="text-slate-800 font-medium block truncate">{exp.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{exp.voucherNumber} • {exp.category}</span>
                    </div>
                    <span className="font-mono font-bold text-rose-700 shrink-0">
                      -{formatNaira(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 2: STUDENT FEE LEDGERS & COLLECTIONS
         ========================================================================= */}
      {activeSubTab === 'ledgers' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Fee Ledgers & Accounts</h3>
              <p className="text-xs text-slate-500">Track individual tuition dues, payments, and outstanding balances</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or RegNo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 w-48 sm:w-64"
                />
              </div>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Fully Cleared">Fully Cleared (خالص)</option>
                <option value="Part Payment">Part Payment (جزئي)</option>
                <option value="Defaulter">Defaulters / Arrears (متأخر)</option>
              </select>
            </div>
          </div>

          {/* Student Ledgers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Student & Reg No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3 text-right">Total Billed</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Waivers</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No student accounts found matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredLedgers.map((l) => (
                    <tr key={l.student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block font-semibold">{l.student.fullName}</strong>
                        <span className="font-mono text-[11px] text-slate-400">{l.student.regNo}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {l.classInfo?.name || 'Assigned Class'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {formatNaira(l.totalBilled)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {formatNaira(l.totalPaid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-700">
                        {l.totalWaivers > 0 ? formatNaira(l.totalWaivers) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={l.balanceDue > 0 ? 'text-rose-700' : 'text-slate-500'}>
                          {formatNaira(Math.max(0, l.balanceDue))}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            l.status === 'Fully Cleared' || l.status === 'Overpaid'
                              ? 'bg-emerald-100 text-emerald-900'
                              : l.status === 'Part Payment'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentForStudent(l.student.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                        >
                          Collect
                        </button>
                        {l.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerForReminder(l)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[11px]"
                          >
                            Reminder
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 3: PAYMENT RECEIPTS & TRANSACTIONS
         ========================================================================= */}
      {activeSubTab === 'receipts' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bursary Receipts Registry (سندات القبض)</h3>
              <p className="text-xs text-slate-500">Official transaction logs and printable Sanad Qabd vouchers</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreselectedStudentIdForPayment(undefined);
                setIsRecordPaymentOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Payer / Depositor</th>
                  <th className="py-3 px-3">Method & Ref</th>
                  <th className="py-3 px-3 text-right">Amount Paid</th>
                  <th className="py-3 px-3 text-center">Receipt Voucher</th>
                  {currentUser.role === 'super_admin' && <th className="py-3 px-3 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feePayments.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'super_admin' ? 8 : 7} className="py-8 text-center text-slate-400">
                      No fee payments recorded yet. Click "Record New Payment" to issue the first receipt.
                    </td>
                  </tr>
                ) : (
                  feePayments.slice().reverse().map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-900">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {pay.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div>{pay.studentName}</div>
                        <span className="font-mono text-[10px] text-slate-400">{pay.studentRegNo}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {pay.payerName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-800 text-[11px]">
                          {pay.paymentMethod}
                        </span>
                        {pay.transactionRef && (
                          <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                            {pay.transactionRef}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                        {formatNaira(pay.amountPaid)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForReceipt(pay)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Sanad Qabd</span>
                        </button>
                      </td>
                      {currentUser.role === 'super_admin' && (
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeletePayment?.(pay.id)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 4: OPERATING EXPENSES & VOUCHERS
         ========================================================================= */}
      {activeSubTab === 'expenses' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Operating Expenditures (سجل المصروفات)</h3>
              <p className="text-xs text-slate-500">Generator fuel, staff allowances, repairs, and examination printing</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRecordExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Voucher #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description & Payee</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  {currentUser.role === 'super_admin' && <th className="py-3 px-3 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'super_admin' ? 7 : 6} className="py-8 text-center text-slate-400">
                      No operating expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  schoolExpenses.slice().reverse().map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-900">
                        {exp.voucherNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {exp.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {exp.category}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-900 block">{exp.description}</span>
                        <span className="text-[11px] text-slate-400">Paid to: {exp.paidTo}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 text-[11px]">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-800 text-sm">
                        {formatNaira(exp.amount)}
                      </td>
                      {currentUser.role === 'super_admin' && (
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteExpense?.(exp.id)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 5: FEE SCHEDULE & SETTING
         ========================================================================= */}
      {activeSubTab === 'fee_setup' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Schedules & Billing Heads (هيكل الرسوم)</h3>
              <p className="text-xs text-slate-500">Configure termly fee items per class or campus-wide</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewFeeItemOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fee Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    {item.arabicName && (
                      <span className="text-xs font-arabic text-emerald-800" dir="rtl">
                        {item.arabicName}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-black text-emerald-900">
                    {formatNaira(item.amount)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.description || 'Applicable term charge'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                    {item.category}
                  </span>
                  <span className="text-slate-500">
                    Target: {item.targetClassIds.includes('all') ? 'All Classes' : `${item.targetClassIds.length} Classes`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Fee Item Modal */}
          {isNewFeeItemOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-sm font-bold text-slate-900">Add New Fee Component</h3>
                  <button onClick={() => setIsNewFeeItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateFeeItem} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fee Name (English) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Laboratory Levy"
                      value={newFeeName}
                      onChange={(e) => setNewFeeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Arabic Title (Optional)</label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="رسوم مختبر العلوم"
                      value={newFeeArabicName}
                      onChange={(e) => setNewFeeArabicName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-arabic"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount in Naira (₦) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 5000"
                      value={newFeeAmount}
                      onChange={(e) => setNewFeeAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newFeeCategory}
                      onChange={(e) => setNewFeeCategory(e.target.value as FeeCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="Tuition">Tuition</option>
                      <option value="Development">Development</option>
                      <option value="Materials">Materials & Books</option>
                      <option value="Uniform">Uniform</option>
                      <option value="Exam">Exam & Assessment</option>
                      <option value="PTA">PTA</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Applicable Class</label>
                    <select
                      value={newFeeTargetClass}
                      onChange={(e) => setNewFeeTargetClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="all">All School Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsNewFeeItemOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-700"
                    >
                      Save Fee Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 6: SCHOLARSHIPS & WAIVERS
         ========================================================================= */}
      {activeSubTab === 'waivers' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scholarships & Fee Concessions (الإعفاءات والمنح)</h3>
              <p className="text-xs text-slate-500">Tahfiz Quran awards, orphan support, staff child discounts</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewWaiverOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Grant Scholarship / Waiver</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Concession Reason</th>
                  <th className="py-3 px-3">Approved By</th>
                  <th className="py-3 px-3 text-right">Waiver Amount</th>
                  {currentUser.role === 'super_admin' && <th className="py-3 px-3 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeWaivers.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'super_admin' ? 5 : 4} className="py-8 text-center text-slate-400">
                      No scholarships or waivers logged.
                    </td>
                  </tr>
                ) : (
                  feeWaivers.map((w) => {
                    const st = students.find((s) => s.id === w.studentId);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {st?.fullName || 'Student'}
                          <span className="font-mono text-[10px] text-slate-400 block">{st?.regNo}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-900 block">{w.reason}</span>
                          {w.notes && <span className="text-slate-400 text-[11px]">{w.notes}</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {w.approvedBy}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-teal-800 text-sm">
                          {formatNaira(w.amount)}
                        </td>
                        {currentUser.role === 'super_admin' && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteWaiver?.(w.id)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* New Waiver Modal */}
          {isNewWaiverOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-sm font-bold text-slate-900">Grant Fee Waiver / Scholarship</h3>
                  <button onClick={() => setIsNewWaiverOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateWaiver} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                    <select
                      required
                      value={waiverStudentId}
                      onChange={(e) => setWaiverStudentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="">Choose a student...</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.regNo} - {s.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Waiver Category *</label>
                    <select
                      value={waiverReason}
                      onChange={(e) => setWaiverReason(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    >
                      <option value="Tahfiz Scholarship (Hifz)">Tahfiz Scholarship (Hifz)</option>
                      <option value="Orphan Support (Kafalat Yateem)">Orphan Support (Kafalat Yateem)</option>
                      <option value="Staff Child Concession">Staff Child Concession</option>
                      <option value="Indigent / Needy Hardship Relief">Indigent / Needy Hardship Relief</option>
                      <option value="Academic Merit Award">Academic Merit Award</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount to Waive (₦) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 15000"
                      value={waiverAmount}
                      onChange={(e) => setWaiverAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notes / Authority Approval</label>
                    <input
                      type="text"
                      placeholder="e.g. Approved by Mudir on grounds of complete Quran memorization"
                      value={waiverNotes}
                      onChange={(e) => setWaiverNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsNewWaiverOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-700"
                    >
                      Apply Waiver
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 7: PRINTABLE FINANCIAL STATEMENT
         ========================================================================= */}
      {activeSubTab === 'statement' && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Termly Financial Statement & Audit Account</h3>
              <p className="text-xs text-slate-500">Official statement ready to print or present to school governing board</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Statement</span>
            </button>
          </div>

          {/* Printable Statement Sheet */}
          <div className="space-y-6">
            <div className="text-center border-b pb-4 border-slate-200">
              <div className="text-xs font-arabic font-bold text-emerald-900 mb-1" dir="rtl">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase font-serif tracking-tight">
                {schoolProfile.name}
              </h1>
              <div className="text-sm font-bold text-emerald-800 font-arabic" dir="rtl">
                {schoolProfile.arabicName}
              </div>
              <div className="mt-3 inline-block px-4 py-1 rounded-lg bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider">
                STATEMENT OF INCOME & OPERATING EXPENDITURE — {currentTerm?.name || '3rd Term'} ({currentSession?.name || '2026/2027'})
              </div>
            </div>

            {/* Incomes & Expenditures Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              {/* Left Column: Revenues */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-emerald-950 uppercase text-xs pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>1. INCOMES & FEE RECEIPTS</span>
                  <span className="text-emerald-800 font-arabic text-[11px]" dir="rtl">الإيرادات المحصلة</span>
                </h4>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Total Tuition & Materials Collected:</span>
                    <strong className="text-slate-900">{formatNaira(overview.totalCollectedRevenue)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Number of Payment Vouchers:</span>
                    <strong className="text-slate-900">{feePayments.length} transactions</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Recovery Rate:</span>
                    <strong className="text-emerald-800">{overview.collectionRate}%</strong>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-sm text-emerald-900 border-t border-slate-300">
                    <span className="font-sans">TOTAL INFLOW:</span>
                    <span>{formatNaira(overview.totalCollectedRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Outflows */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-amber-950 uppercase text-xs pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>2. OPERATING EXPENDITURES</span>
                  <span className="text-amber-800 font-arabic text-[11px]" dir="rtl">المصروفات التشغيلية</span>
                </h4>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Operating Expenses Disbursed:</span>
                    <strong className="text-slate-900">{formatNaira(overview.totalOperatingExpenses)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Number of Vouchers Issued:</span>
                    <strong className="text-slate-900">{schoolExpenses.length} vouchers</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-sans">
                    <span className="text-slate-600">Waivers/Scholarships Absorbed:</span>
                    <strong className="text-teal-800">{formatNaira(overview.totalWaivers)}</strong>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-sm text-rose-900 border-t border-slate-300">
                    <span className="font-sans">TOTAL OUTFLOW:</span>
                    <span>{formatNaira(overview.totalOperatingExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Surplus Summary Banner */}
            <div className="p-4 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">
                  Net Operating Balance / Cash Surplus (الفائض المالي)
                </span>
                <span className="text-xl font-black font-mono text-white">
                  {formatNaira(overview.netSurplus)}
                </span>
              </div>
              <div className="text-right text-xs text-emerald-200">
                Outstanding Uncollected Debt: <strong className="text-rose-300 font-mono">{formatNaira(overview.totalOutstandingReceivables)}</strong>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center italic text-slate-700 font-serif">
                  {currentUser.name}
                </div>
                <div className="w-48 mx-auto border-t border-slate-400 pt-1">
                  <span className="font-bold text-[11px] block">Prepared by: School Bursar</span>
                  <span className="text-[10px] text-slate-400">توقيع أمين الصندوق والمحاسب</span>
                </div>
              </div>

              <div>
                <div className="h-10 flex items-end justify-center italic text-slate-700 font-serif">
                  {schoolProfile.mudirName}
                </div>
                <div className="w-48 mx-auto border-t border-slate-400 pt-1">
                  <span className="font-bold text-[11px] block">Audited & Approved by: Mudir</span>
                  <span className="text-[10px] text-slate-400">اعتماد مدير الكلية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          students={students}
          classes={classes}
          feeItems={feeItems}
          payments={feePayments}
          waivers={feeWaivers}
          selectedStudentId={preselectedStudentIdForPayment}
          currentSessionId={selectedSessionId}
          currentTermId={selectedTermId}
          accountantName={currentUser.name}
          accountantStaffId={currentUser.staffId}
          onSavePayment={handlePaymentSuccess}
          onClose={() => setIsRecordPaymentOpen(false)}
        />
      )}

      {isRecordExpenseOpen && (
        <RecordExpenseModal
          expenses={schoolExpenses}
          accountantName={currentUser.name}
          mudirName={schoolProfile.mudirName}
          onSaveExpense={(exp) => {
            onSaveExpense(exp);
            setIsRecordExpenseOpen(false);
          }}
          onClose={() => setIsRecordExpenseOpen(false)}
        />
      )}

      {selectedPaymentForReceipt && (
        <OfficialReceiptModal
          payment={selectedPaymentForReceipt}
          student={students.find((s) => s.id === selectedPaymentForReceipt.studentId)}
          classInfo={classes.find((c) => c.id === selectedPaymentForReceipt.classId)}
          schoolProfile={schoolProfile}
          sessionName={sessions.find((s) => s.id === selectedPaymentForReceipt.sessionId)?.name}
          termName={terms.find((t) => t.id === selectedPaymentForReceipt.termId)?.name}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}

      {selectedLedgerForReminder && (
        <DebtReminderModal
          ledger={selectedLedgerForReminder}
          schoolProfile={schoolProfile}
          sessionName={sessions.find((s) => s.id === selectedSessionId)?.name}
          termName={terms.find((t) => t.id === selectedTermId)?.name}
          onClose={() => setSelectedLedgerForReminder(null)}
        />
      )}
    </div>
  );
};
