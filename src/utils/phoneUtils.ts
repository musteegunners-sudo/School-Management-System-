import { Teacher } from '../types';

/**
 * Normalizes phone numbers for reliable comparison across Nigerian and international formats.
 * E.g.:
 *  - "+234 813 036 6258" -> "08130366258"
 *  - "2348130366258"     -> "08130366258"
 *  - "0813-036-6258"     -> "08130366258"
 *  - "8130366258"        -> "08130366258"
 *  - "08130366258"       -> "08130366258"
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 13) {
    return '0' + digits.slice(3);
  }
  if (digits.length === 10 && !digits.startsWith('0')) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Matches a teacher record based on user input (Phone number, Full Name, Staff ID, or Email).
 * Tolerant of spaces, dashes, leading zero, or +234 prefixes.
 */
export function matchTeacherByPhone(teachers: Teacher[], query: string): Teacher | undefined {
  const clean = query.trim();
  if (!clean) return undefined;

  const queryDigits = normalizePhoneNumber(clean);
  const cleanLower = clean.toLowerCase();

  return teachers.find((t) => {
    // 1. Match by phone number digits
    if (t.phone) {
      const teacherDigits = normalizePhoneNumber(t.phone);
      if (
        (queryDigits && teacherDigits && queryDigits === teacherDigits) ||
        (queryDigits.length >= 7 && teacherDigits.endsWith(queryDigits)) ||
        (teacherDigits.length >= 7 && queryDigits.endsWith(teacherDigits))
      ) {
        return true;
      }
    }

    // 2. Match by full name or part of name
    if (t.fullName) {
      const nameLower = t.fullName.toLowerCase();
      if (
        nameLower === cleanLower ||
        nameLower.includes(cleanLower) ||
        cleanLower.includes(nameLower) ||
        cleanLower.split(' ').some((word) => word.length >= 3 && nameLower.includes(word))
      ) {
        return true;
      }
    }

    // 3. Match by Staff ID (e.g. TCH-2026-001)
    if (t.staffId && t.staffId.trim().toLowerCase() === cleanLower) {
      return true;
    }

    // 4. Match by Email
    if (t.email && t.email.trim().toLowerCase() === cleanLower) {
      return true;
    }

    // 5. Match by ID
    if (t.id && t.id.trim().toLowerCase() === cleanLower) {
      return true;
    }

    return false;
  });
}
