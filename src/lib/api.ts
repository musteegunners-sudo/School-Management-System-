export type ApiError = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = T | ApiError;

export const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error ?? 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kulliyyat_auth_token');
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem('kulliyyat_auth_token');
    return;
  }
  localStorage.setItem('kulliyyat_auth_token', token);
}
