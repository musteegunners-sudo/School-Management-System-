import crypto from 'crypto';

export type AppRole = 'super_admin' | 'secretary' | 'teacher' | 'student' | 'accountant';

export type AuthenticatedUser = {
  id: string;
  role: AppRole;
  name: string;
  arabicName?: string;
  title: string;
  email?: string;
  phone?: string;
  staffId?: string;
  studentId?: string;
  regNo?: string;
  assignedClassId?: string;
  assignedSubjectIds?: string[];
  campus?: string;
};

export const ROLE_PRIORITY: Record<AppRole, number> = {
  super_admin: 5,
  secretary: 4,
  teacher: 3,
  accountant: 3,
  student: 2,
};

export function hashSecret(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function canAccessRole(userRole: AppRole, requiredRole: AppRole | AppRole[]): boolean {
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const userPriority = ROLE_PRIORITY[userRole] ?? 0;
  return allowed.some((role) => {
    const permissionPriority = ROLE_PRIORITY[role] ?? 0;
    return userPriority >= permissionPriority;
  });
}

export function sanitizeUser(user: AuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    arabicName: user.arabicName,
    title: user.title,
    email: user.email,
    phone: user.phone,
    staffId: user.staffId,
    studentId: user.studentId,
    regNo: user.regNo,
    assignedClassId: user.assignedClassId,
    assignedSubjectIds: user.assignedSubjectIds,
    campus: user.campus,
  };
}
