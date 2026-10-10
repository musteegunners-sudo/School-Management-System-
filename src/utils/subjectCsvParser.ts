import { Subject } from '../types';

export interface ParsedSubjectResult {
  validSubjects: Subject[];
  newSubjects: Subject[];
  existingDuplicates: { imported: Subject; existing: Subject }[];
  errors: string[];
}

/**
 * Standard category normalization
 */
export function normalizeCategory(val?: string, name?: string): Subject['category'] {
  const text = ((val || '') + ' ' + (name || '')).toLowerCase();
  
  if (text.includes('early') || text.includes('nursery') || text.includes('kg') || text.includes('kindergarten') || text.includes('playgroup') || text.includes('pre-primary')) {
    return 'Early Childhood';
  }
  if (text.includes('arabic') || text.includes('nahw') || text.includes('sarf') || text.includes('adab') || text.includes('balagha') || text.includes('insha') || text.includes('english') || text.includes('french') || text.includes('hausa') || text.includes('language') || text.includes('linguistics')) {
    return 'Arabic & Language';
  }
  if (text.includes('math') || text.includes('science') || text.includes('physics') || text.includes('chem') || text.includes('bio') || text.includes('computer') || text.includes('ict') || text.includes('tech') || text.includes('arithmetic') || text.includes('geometry') || text.includes('algebra')) {
    return 'General Sciences';
  }
  if (text.includes('qur') || text.includes('tajweed') || text.includes('hifz') || text.includes('hadith') || text.includes('sunnah') || text.includes('fiqh') || text.includes('aqeed') || text.includes('tawhid') || text.includes('sirah') || text.includes('islam') || text.includes('tarikh') || text.includes('deen') || text.includes('tahfeez')) {
    return 'Islamic Studies';
  }
  if (text.includes('vocation') || text.includes('art') || text.includes('craft') || text.includes('social') || text.includes('civic') || text.includes('geography') || text.includes('history') || text.includes('agric') || text.includes('business') || text.includes('home econ')) {
    return 'Vocational & Arts';
  }

  // Check direct matches
  if (val === 'Islamic Studies' || val === 'Arabic & Language' || val === 'General Sciences' || val === 'Early Childhood' || val === 'Vocational & Arts') {
    return val;
  }

  return 'Islamic Studies';
}

/**
 * Parses raw CSV line handling quoted values with embedded commas
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Generates an automated course code if none was provided in CSV
 */
export function generateAutoSubjectCode(name: string, index: number): string {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  let prefix = '';
  if (words.length >= 3) {
    prefix = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    prefix = (words[0].slice(0, 2) + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 3).toUpperCase();
  } else {
    prefix = 'SUB';
  }
  const num = 100 + (index % 899);
  return `${prefix}${num}`;
}

/**
 * Parses CSV text to Subject records, detecting duplicates and validating columns
 */
export function parseSubjectCsv(csvText: string, existingSubjects: Subject[] = []): ParsedSubjectResult {
  // Strip UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const rawLines = cleanText.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const validSubjects: Subject[] = [];
  const newSubjects: Subject[] = [];
  const existingDuplicates: { imported: Subject; existing: Subject }[] = [];

  if (rawLines.length === 0) {
    errors.push('The provided CSV file is empty.');
    return { validSubjects, newSubjects, existingDuplicates, errors };
  }

  // Parse header line to determine column positions
  const headerTokens = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));
  
  let nameCol = headerTokens.findIndex((h) => h === 'name' || h === 'subject' || h === 'subjectname' || h === 'title');
  let arabicCol = headerTokens.findIndex((h) => h.includes('arabic') || h === 'namear' || h === 'alism' || h === 'ar');
  let codeCol = headerTokens.findIndex((h) => h === 'code' || h === 'subjectcode' || h === 'coursecode');
  let categoryCol = headerTokens.findIndex((h) => h === 'category' || h === 'dept' || h === 'department' || h === 'group');

  // Fallback defaults if header tokens weren't standard
  if (nameCol === -1) {
    // If first column isn't header named, check if line 0 is header or data
    if (headerTokens[0] && isNaN(Number(headerTokens[0]))) {
      nameCol = 0;
    }
  }

  const startLineIdx = (nameCol !== -1 && (headerTokens.includes('name') || headerTokens.includes('subject') || headerTokens.includes('code'))) ? 1 : 0;

  for (let i = startLineIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;
    
    const cols = parseCsvLine(line);
    const rawName = cols[nameCol !== -1 ? nameCol : 0] || '';
    if (!rawName) {
      continue; // Skip lines with blank subject name
    }

    const rawArabic = arabicCol !== -1 ? cols[arabicCol] : undefined;
    let rawCode = codeCol !== -1 ? cols[codeCol] : '';
    if (!rawCode) {
      rawCode = generateAutoSubjectCode(rawName, i);
    } else {
      rawCode = rawCode.toUpperCase().replace(/\s+/g, '');
    }

    const rawCategory = categoryCol !== -1 ? cols[categoryCol] : undefined;
    const resolvedCategory = normalizeCategory(rawCategory, rawName);

    const subjectItem: Subject = {
      id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
      name: rawName,
      arabicName: rawArabic || undefined,
      code: rawCode,
      category: resolvedCategory,
    };

    validSubjects.push(subjectItem);

    // Check duplicate against existing curriculum
    const matchedExisting = existingSubjects.find(
      (ex) =>
        ex.code.toLowerCase() === subjectItem.code.toLowerCase() ||
        ex.name.toLowerCase() === subjectItem.name.toLowerCase()
    );

    if (matchedExisting) {
      existingDuplicates.push({ imported: subjectItem, existing: matchedExisting });
    } else {
      newSubjects.push(subjectItem);
    }
  }

  if (validSubjects.length === 0) {
    errors.push('Could not find any valid subject rows in the uploaded CSV.');
  }

  return {
    validSubjects,
    newSubjects,
    existingDuplicates,
    errors,
  };
}

/**
 * Generates ready-to-fill sample CSV template with UTF-8 BOM for Excel support
 */
export function generateSubjectCsvTemplate(): string {
  const rows = [
    'name,arabicName,code,category',
    'Al-Qur\'an & Tajweed,القرآن الكريم والتجويد,QRN101,Islamic Studies',
    'Hadith & Sunnah,الحديث الشريف والسنة,HDT102,Islamic Studies',
    'Fiqh & Mu\'amalat,الفقه والمعاملات,FQH103,Islamic Studies',
    'Tawheed & Aqeedah,التوحيد والعقيدة,TWD104,Islamic Studies',
    'Arabic Grammar (Nahw & Sarf),النحو والصرف,ARB105,Arabic & Language',
    'Arabic Literature & Composition,الأدب العربي والإنشاء,ARB106,Arabic & Language',
    'English Language & Phonics,اللغة الإنجليزية,ENG107,Arabic & Language',
    'Mathematics & Quantitative Reasoning,الرياضيات,MTH108,General Sciences',
    'Basic Science & Technology,العلوم العامة والتكنولوجيا,SCI109,General Sciences',
    'Social & Islamic Civic Education,الدراسات الاجتماعية والمدنية,SOC110,Vocational & Arts',
    'Vocational & Creative Crafts,الحرف والمهارات الإبداعية,VOC111,Vocational & Arts',
    'Nursery Rhymes & Islamic Manners,أناشيد الروضة والآداب,NUR112,Early Childhood',
  ];

  // \uFEFF ensures UTF-8 BOM so Arabic letters render without question marks in Excel
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Exports current registered subjects as a CSV file
 */
export function exportSubjectsToCsv(subjects: Subject[], schoolName: string): void {
  const header = ['name', 'arabicName', 'code', 'category'];
  const lines = subjects.map((s) => {
    const cleanName = `"${(s.name || '').replace(/"/g, '""')}"`;
    const cleanArabic = s.arabicName ? `"${s.arabicName.replace(/"/g, '""')}"` : '';
    const cleanCode = `"${(s.code || '').replace(/"/g, '""')}"`;
    const cleanCategory = `"${(s.category || '').replace(/"/g, '""')}"`;
    return [cleanName, cleanArabic, cleanCode, cleanCategory].join(',');
  });

  const csvContent = '\uFEFF' + [header.join(','), ...lines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = (schoolName || 'Kulliyyat').replace(/[^a-zA-Z0-9_-]/g, '_');
  anchor.href = url;
  anchor.download = `${safeName}_Curriculum_Subjects_${dateStr}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
