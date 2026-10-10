// Safe localStorage wrapper with in-memory fallback for sandboxed iframes and private browsing modes
const memoryStore: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Sandboxed iframes can throw SecurityError / DOMException when accessing localStorage
  }
  return memoryStore[key] || null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to in-memory store
  }
  memoryStore[key] = value;
}

export function safeClear(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  } catch {
    // Fallback
  }
  for (const key of Object.keys(memoryStore)) {
    delete memoryStore[key];
  }
}
