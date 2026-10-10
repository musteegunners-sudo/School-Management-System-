import type { AuthUser } from '../types';
import { appStore } from '../store/appStore';

export function TabSwitcher({ role }: { role: string }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'secretary_portal', label: 'Secretary' },
    { key: 'teacher_classes', label: 'Classes' },
    { key: 'student_portal', label: 'Student Portal' },
    { key: 'exam_center', label: 'Exam Center' },
    { key: 'bursary', label: 'Bursary' },
    { key: 'registration', label: 'Registration' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'grades', label: 'Grades' },
    { key: 'positions', label: 'Positions' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'reports', label: 'Reports' },
    { key: 'database', label: 'Database' },
    { key: 'setup', label: 'Setup' },
  ] as const;

  const visibleTabs = tabs.filter((tab) => {
    if (role === 'super_admin') return true;
    if (role === 'secretary') return ['secretary_portal', 'registration', 'reports', 'student_portal'].includes(tab.key);
    if (role === 'teacher') return ['teacher_classes', 'grades', 'attendance', 'reports', 'exam_center'].includes(tab.key);
    if (role === 'student') return ['student_portal', 'exam_center', 'reports'].includes(tab.key);
    if (role === 'accountant') return ['bursary', 'reports'].includes(tab.key);
    return false;
  });

  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {visibleTabs.map((tab) => {
        const state = appStore.getState();
        const active = state.activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => appStore.dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: active ? '1px solid #0f172a' : '1px solid #d1d5db',
              background: active ? '#0f172a' : '#fff',
              color: active ? '#fff' : '#111827',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
