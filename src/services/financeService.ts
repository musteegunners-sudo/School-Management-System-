import {
  Student,
  SchoolClass,
  FeeItem,
  FeePayment,
  SchoolExpense,
  FeeWaiver,
  StudentAccountLedger,
} from '../types';

/**
 * Format number into Nigerian Naira currency representation (₦)
 */
export function formatNaira(amount: number = 0): string {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  return '₦' + rounded.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convert numerical amount to words with Naira and Kobo suffix
 */
export function numberToWordsNaira(amount: number = 0): string {
  const num = Math.floor(Math.abs(amount));
  const kobo = Math.round((Math.abs(amount) - num) * 100);

  if (num === 0 && kobo === 0) return 'Zero Naira Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + ' ';
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) str += ones[n % 10] + ' ';
    } else if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  if (millions > 0) {
    words += convertHundreds(millions) + ' Million ';
  }
  if (thousands > 0) {
    words += convertHundreds(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertHundreds(remainder) + ' ';
  }

  words = words.trim() + ' Naira';
  if (kobo > 0) {
    words += ' and ' + convertHundreds(kobo) + ' Kobo';
  }
  return words + ' Only';
}

/**
 * Generate sequential, unique official receipt number
 */
export function generateReceiptNumber(existingPayments: FeePayment[] = []): string {
  const year = new Date().getFullYear();
  const count = existingPayments.length + 1;
  const pad = String(count).padStart(4, '0');
  return `RCP-${year}-${pad}`;
}

/**
 * Generate sequential expense voucher number
 */
export function generateVoucherNumber(existingExpenses: SchoolExpense[] = []): string {
  const year = new Date().getFullYear();
  const count = existingExpenses.length + 1;
  const pad = String(count).padStart(3, '0');
  return `EXP-${year}-${pad}`;
}

/**
 * Determine which fee items apply to a student in a particular session and term
 */
export function getApplicableFeeItemsForStudent(
  student: Student,
  feeItems: FeeItem[],
  sessionId?: string,
  termId?: string
): FeeItem[] {
  return feeItems.filter((item) => {
    // Session match
    if (sessionId && item.sessionId !== 'all' && item.sessionId !== sessionId) {
      return false;
    }
    // Term match
    if (termId && item.termId !== 'all' && item.termId !== termId) {
      return false;
    }
    // Class match
    if (item.targetClassIds.includes('all')) return true;
    return item.targetClassIds.includes(student.classId);
  });
}

/**
 * Calculate individual student ledger: billed, paid, waivers, and net balance
 */
export function calculateStudentLedger(
  student: Student,
  classInfo: SchoolClass | undefined,
  feeItems: FeeItem[],
  payments: FeePayment[],
  waivers: FeeWaiver[],
  sessionId?: string,
  termId?: string
): StudentAccountLedger {
  const applicableFees = getApplicableFeeItemsForStudent(student, feeItems, sessionId, termId);
  const totalBilled = applicableFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Student specific payments for this session & term
  const studentPayments = payments.filter((p) => {
    if (p.studentId !== student.id) return false;
    if (sessionId && p.sessionId && p.sessionId !== sessionId) return false;
    if (termId && p.termId && p.termId !== termId) return false;
    return true;
  });
  const totalPaid = studentPayments.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

  // Student specific waivers
  const studentWaivers = waivers.filter((w) => {
    if (w.studentId !== student.id) return false;
    if (sessionId && w.sessionId && w.sessionId !== sessionId) return false;
    if (termId && w.termId && w.termId !== termId) return false;
    return true;
  });
  const totalWaivers = studentWaivers.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const balanceDue = totalBilled - (totalPaid + totalWaivers);

  let status: 'Fully Cleared' | 'Part Payment' | 'Defaulter' | 'Overpaid' = 'Defaulter';
  if (balanceDue <= 0 && totalBilled > 0) {
    status = balanceDue < 0 ? 'Overpaid' : 'Fully Cleared';
  } else if (totalPaid > 0 && balanceDue > 0) {
    status = 'Part Payment';
  } else if (totalBilled === 0) {
    status = 'Fully Cleared';
  }

  return {
    student,
    classInfo,
    totalBilled,
    totalPaid,
    totalWaivers,
    balanceDue,
    status,
    applicableFeeItems: applicableFees,
    payments: studentPayments,
    waivers: studentWaivers,
  };
}

/**
 * Calculate high-level school financial overview
 */
export function calculateSchoolFinancialOverview(
  students: Student[],
  classes: SchoolClass[],
  feeItems: FeeItem[],
  payments: FeePayment[],
  expenses: SchoolExpense[],
  waivers: FeeWaiver[],
  sessionId?: string,
  termId?: string
) {
  const ledgers = students.map((student) => {
    const classInfo = classes.find((c) => c.id === student.classId);
    return calculateStudentLedger(student, classInfo, feeItems, payments, waivers, sessionId, termId);
  });

  const totalExpectedRevenue = ledgers.reduce((acc, l) => acc + l.totalBilled, 0);
  const totalCollectedRevenue = ledgers.reduce((acc, l) => acc + l.totalPaid, 0);
  const totalWaivers = ledgers.reduce((acc, l) => acc + l.totalWaivers, 0);
  const totalOutstandingReceivables = ledgers.reduce(
    (acc, l) => (l.balanceDue > 0 ? acc + l.balanceDue : acc),
    0
  );

  // Filter expenses by session/term if date/matching applies, or sum total
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netSurplus = totalCollectedRevenue - totalOperatingExpenses;

  const collectionRate =
    totalExpectedRevenue > 0
      ? Math.min(100, Math.round(((totalCollectedRevenue + totalWaivers) / totalExpectedRevenue) * 100))
      : 100;

  const fullyClearedCount = ledgers.filter((l) => l.status === 'Fully Cleared' || l.status === 'Overpaid').length;
  const partPaymentCount = ledgers.filter((l) => l.status === 'Part Payment').length;
  const defaultersCount = ledgers.filter((l) => l.status === 'Defaulter').length;

  return {
    ledgers,
    totalExpectedRevenue,
    totalCollectedRevenue,
    totalWaivers,
    totalOutstandingReceivables,
    totalOperatingExpenses,
    netSurplus,
    collectionRate,
    fullyClearedCount,
    partPaymentCount,
    defaultersCount,
    totalStudents: students.length,
  };
}

/**
 * Default Seed Fee Schedule for Kulliyyat Taṭbīq
 */
export const defaultFeeItems: FeeItem[] = [
  {
    id: 'fee_tuition_term',
    name: 'School Tuition / Masareef Dirasiyyah',
    arabicName: 'المصاريف الدراسية الفصلية',
    amount: 35000,
    targetClassIds: ['all'],
    sessionId: 'all',
    termId: 'all',
    category: 'Tuition',
    isMandatory: true,
    description: 'General tuition covering Islamic, Arabic, and Western academic curricula',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'fee_dev_levy',
    name: 'Campus Development & Facility Levy',
    arabicName: 'رسوم تطوير وصيانة الكلية',
    amount: 5000,
    targetClassIds: ['all'],
    sessionId: 'all',
    termId: 'all',
    category: 'Development',
    isMandatory: true,
    description: 'Maintenance of classrooms, water boreholes, generator diesel, and prayer hall',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'fee_books_materials',
    name: 'Qur\'an, Arabic Texts & Exercise Books',
    arabicName: 'رسوم المصاحف والكتب والكراريس',
    amount: 10000,
    targetClassIds: ['all'],
    sessionId: 'all',
    termId: 'term_1', // first term / annual package
    category: 'Materials',
    isMandatory: true,
    description: 'Al-Qur\'an al-Kareem, Tajweed charts, Arabic grammar booklets, notebook bundle',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'fee_exam_levy',
    name: 'Continuous Assessment & Examination Levy',
    arabicName: 'رسوم الاختبارات والامتحانات الفصلية',
    amount: 4000,
    targetClassIds: ['all'],
    sessionId: 'all',
    termId: 'all',
    category: 'Exam',
    isMandatory: true,
    description: '12-Week unit assessment printouts, midterm CA tests, and terminal examination sheets',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'fee_pta_health',
    name: 'PTA & Student First Aid Levy',
    arabicName: 'رسوم مجلس الآباء والرعاية الأولية',
    amount: 2000,
    targetClassIds: ['all'],
    sessionId: 'all',
    termId: 'all',
    category: 'PTA',
    isMandatory: true,
    description: 'Parents Teachers Association welfare and campus dispensary supplies',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

/**
 * Default Seed Expenses
 */
export const defaultSchoolExpenses: SchoolExpense[] = [
  {
    id: 'exp_diesel_01',
    voucherNumber: 'EXP-2026-001',
    category: 'Generator Fuel & Diesel',
    description: 'Purchased 200 Litres Diesel for Campus 30KVA Generator & Water Pumping Station',
    amount: 195000,
    paymentMethod: 'Bank Transfer',
    paidTo: 'Al-Barkah Petroleum Services Kasuwan Magani',
    authorizedBy: 'Principal Abubakar Alhassan',
    recordedBy: 'Mallam Usman Bello (Bursar)',
    date: '2026-09-05',
    invoiceRef: 'INV-PETRO-8821',
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'exp_stationery_02',
    voucherNumber: 'EXP-2026-002',
    category: 'Printing, Books & Examination Materials',
    description: 'Bulk printing of 12-Week Unit Assessment sheets and Student Arabic Term Records',
    amount: 48000,
    paymentMethod: 'Cash',
    paidTo: 'Kaduna Digital Press & Graphics',
    authorizedBy: 'Principal Abubakar Alhassan',
    recordedBy: 'Mallam Usman Bello (Bursar)',
    date: '2026-09-10',
    invoiceRef: 'RCP-KDP-441',
    createdAt: '2026-09-10T14:30:00.000Z',
  },
  {
    id: 'exp_maintenance_03',
    voucherNumber: 'EXP-2026-003',
    category: 'Facility Maintenance & Repairs',
    description: 'Classroom desk welding, classroom ceiling fan repairs, and ablution taps replacement',
    amount: 32500,
    paymentMethod: 'Cash',
    paidTo: 'Ustadh Jibril Maintenance Works',
    authorizedBy: 'Principal Abubakar Alhassan',
    recordedBy: 'Mallam Usman Bello (Bursar)',
    date: '2026-09-12',
    createdAt: '2026-09-12T11:15:00.000Z',
  },
];
