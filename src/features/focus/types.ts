export type FocusMode = 'pomodoro' | 'deep_work' | 'sprint';
export type FocusState = 'idle' | 'running' | 'paused' | 'break';

export interface FocusSession {
  id: string;
  title: string;
  mode: FocusMode;
  durationMinutes: number;
  elapsedSeconds: number;
  state: FocusState;
}

export interface FocusStats {
  todayMinutes: number;
  weekSessions: number;
  currentStreak: number;
  avgSessionMin: number;
}
