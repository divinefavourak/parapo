import { FocusSession, FocusStats } from './types';

export const mockFocusSession: FocusSession = {
  id: '1',
  title: 'Q3 Strategic Review & Alignment',
  mode: 'deep_work',
  durationMinutes: 90,
  elapsedSeconds: 0,
  state: 'idle',
};

export const mockFocusStats: FocusStats = {
  todayMinutes: 165,
  weekSessions: 12,
  currentStreak: 5,
  avgSessionMin: 47,
};

export const FOCUS_MODES = [
  { key: 'pomodoro' as const, label: 'Pomodoro', duration: 25, description: '25m work, 5m rest' },
  { key: 'deep_work' as const, label: 'Deep Work', duration: 90, description: '90m uninterrupted' },
  { key: 'sprint' as const, label: 'Sprint', duration: 52, description: '52m work, 17m rest' },
];
