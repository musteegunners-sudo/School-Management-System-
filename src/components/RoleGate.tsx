import type { AuthUser } from '../types';
import { canAccess } from '../services/authService';

export interface RoleGateProps {
  user: AuthUser | null;
  allowed: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ user, allowed, fallback = <div>Access denied.</div>, children }: RoleGateProps) {
  if (!user) return <>{fallback}</>;

  const allowedTabs = allowed.filter(Boolean);
  const isAllowed = allowedTabs.some((tab) => canAccess(user, tab));

  if (!isAllowed) return <>{fallback}</>;

  return <>{children}</>;
}
