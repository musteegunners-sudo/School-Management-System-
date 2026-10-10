import type {
  AttendanceRecord,
  AuthUser,
  SchoolClass,
  SchoolProfile,
  ScoreRecord,
  Student,
  Subject,
  Teacher,
} from '../types';

export type AppTab =
  | 'dashboard'
  | 'secretary_portal'
  | 'teacher_classes'
  | 'student_portal'
  | 'exam_center'
  | 'bursary'
  | 'registration'
  | 'teachers'
  | 'grades'
  | 'positions'
  | 'attendance'
  | 'reports'
  | 'database'
  | 'setup';

export interface AppState {
  currentUser: AuthUser | null;
  activeTab: AppTab;
  schoolProfile: SchoolProfile | null;
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
}

export const defaultAppState: AppState = {
  currentUser: null,
  activeTab: 'dashboard',
  schoolProfile: null,
  students: [],
  teachers: [],
  classes: [],
  subjects: [],
  scores: [],
  attendance: [],
};

export type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: AuthUser | null }
  | { type: 'SET_ACTIVE_TAB'; payload: AppTab }
  | { type: 'SET_SCHOOL_PROFILE'; payload: SchoolProfile }
  | { type: 'SET_STUDENTS'; payload: Student[] }
  | { type: 'SET_TEACHERS'; payload: Teacher[] }
  | { type: 'SET_CLASSES'; payload: SchoolClass[] }
  | { type: 'SET_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_SCORES'; payload: ScoreRecord[] }
  | { type: 'SET_ATTENDANCE'; payload: AttendanceRecord[] }
  | { type: 'RESET'; payload?: Partial<AppState> };

export function createAppStore(initialState: Partial<AppState> = {}) {
  let state: AppState = { ...defaultAppState, ...initialState };
  const listeners = new Set<(next: AppState) => void>();

  const emit = () => {
    listeners.forEach((listener) => listener(state));
  };

  const getState = () => state;

  const dispatch = (action: AppAction) => {
    switch (action.type) {
      case 'SET_CURRENT_USER':
        state = { ...state, currentUser: action.payload };
        break;
      case 'SET_ACTIVE_TAB':
        state = { ...state, activeTab: action.payload };
        break;
      case 'SET_SCHOOL_PROFILE':
        state = { ...state, schoolProfile: action.payload };
        break;
      case 'SET_STUDENTS':
        state = { ...state, students: action.payload };
        break;
      case 'SET_TEACHERS':
        state = { ...state, teachers: action.payload };
        break;
      case 'SET_CLASSES':
        state = { ...state, classes: action.payload };
        break;
      case 'SET_SUBJECTS':
        state = { ...state, subjects: action.payload };
        break;
      case 'SET_SCORES':
        state = { ...state, scores: action.payload };
        break;
      case 'SET_ATTENDANCE':
        state = { ...state, attendance: action.payload };
        break;
      case 'RESET':
        state = { ...defaultAppState, ...action.payload };
        break;
      default:
        break;
    }

    emit();
  };

  const subscribe = (listener: (next: AppState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setState = (updater: Partial<AppState> | ((current: AppState) => Partial<AppState>)) => {
    const nextState = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...nextState };
    emit();
  };

  const reset = (nextState: Partial<AppState> = {}) => {
    state = { ...defaultAppState, ...nextState };
    emit();
  };

  return {
    getState,
    setState,
    subscribe,
    dispatch,
    reset,
  };
}

export const appStore = createAppStore();
