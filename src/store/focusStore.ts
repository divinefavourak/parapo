import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { FocusMode, FocusState } from '../features/focus/types';
import { FOCUS_MODES } from '../features/focus/mockData';
import { focusService, FocusSession } from '../services/focus';
import { notificationService, showFocusTimerNotification, dismissFocusTimerNotification } from '../services/notifications';

interface FocusPrefs {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
  autoStartBreak: boolean;
  keepScreenOn: boolean;
}

const DEFAULT_PREFS: FocusPrefs = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  autoStartBreak: false,
  keepScreenOn: true,
};

interface FocusStats {
  todayMinutes: number;
  weekSessions: number;
  currentStreak: number;
  avgSessionMin: number;
}

interface FocusStoreState {
  mode: FocusMode;
  state: FocusState;
  elapsedSeconds: number;
  sessionTitle: string;
  totalSeconds: number;
  activeSessionId: string | null;
  pendingNotificationId: string | null;
  stats: FocusStats;
  isLoadingStats: boolean;
  prefs: FocusPrefs;
  // Actions
  loadPrefs: () => Promise<void>;
  setMode: (mode: FocusMode) => void;
  setSessionTitle: (title: string) => void;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  onSessionComplete: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

const DEFAULT_STATS: FocusStats = {
  todayMinutes: 0,
  weekSessions: 0,
  currentStreak: 0,
  avgSessionMin: 0,
};

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  mode: 'deep_work',
  state: 'idle',
  elapsedSeconds: 0,
  sessionTitle: '',
  totalSeconds: 90 * 60,
  activeSessionId: null,
  pendingNotificationId: null,
  stats: DEFAULT_STATS,
  isLoadingStats: false,
  prefs: DEFAULT_PREFS,

  loadPrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem('focus_prefs');
      if (!raw) return;
      const saved: Partial<FocusPrefs> = JSON.parse(raw);
      const prefs = { ...DEFAULT_PREFS, ...saved };
      set({ prefs });
      // Re-apply duration for the current mode in case it's pomodoro
      const { mode, state } = get();
      if (state === 'idle' && mode === 'pomodoro') {
        set({ totalSeconds: prefs.workMinutes * 60 });
      }
    } catch {}
  },

  setMode: (mode) => {
    if (get().state !== 'idle') return;
    const { prefs } = get();
    const found = FOCUS_MODES.find((m) => m.key === mode);
    const baseDuration = found?.duration ?? 25;
    const duration = mode === 'pomodoro' ? prefs.workMinutes : baseDuration;
    set({ mode, elapsedSeconds: 0, state: 'idle', totalSeconds: duration * 60 });
  },

  setSessionTitle: (title) => set({ sessionTitle: title }),

  start: async () => {
    const { mode, sessionTitle, totalSeconds, prefs } = get();
    set({ state: 'running' });

    // Schedule completion notification
    try {
      const notifId = await notificationService.scheduleFocusComplete(
        'pending',
        totalSeconds
      );
      set({ pendingNotificationId: notifId });
    } catch {}

    // Create session on backend
    try {
      const durationMinutes = mode === 'pomodoro'
        ? prefs.workMinutes
        : (FOCUS_MODES.find((m) => m.key === mode)?.duration ?? 25);
      const session = await focusService.startSession({
        mode,
        title: sessionTitle || 'Focus Session',
        duration_minutes: durationMinutes,
      });
      set({ activeSessionId: session.id });
      showFocusTimerNotification(sessionTitle || 'Focus Session', totalSeconds, true).catch(() => {});
    } catch {
      showFocusTimerNotification(sessionTitle || 'Focus Session', totalSeconds, true).catch(() => {});
    }
  },

  pause: () => {
    set({ state: 'paused' });
    const { pendingNotificationId } = get();
    if (pendingNotificationId) {
      notificationService.cancelNotification(pendingNotificationId).catch(() => {});
      set({ pendingNotificationId: null });
    }
    dismissFocusTimerNotification().catch(() => {});
    notificationService.notify('⏸ Focus Paused', 'Session paused. Resume when ready.').catch(() => {});
  },

  resume: () => {
    set({ state: 'running' });
    // Re-schedule completion notification for remaining time
    const { totalSeconds, elapsedSeconds } = get();
    const remaining = totalSeconds - elapsedSeconds;
    if (remaining > 0) {
      notificationService.scheduleFocusComplete('resumed', remaining)
        .then((id) => set({ pendingNotificationId: id }))
        .catch(() => {});
    }
  },

  reset: () => {
    const { pendingNotificationId, activeSessionId, elapsedSeconds } = get();
    if (pendingNotificationId) {
      notificationService.cancelNotification(pendingNotificationId).catch(() => {});
    }
    if (activeSessionId && elapsedSeconds > 30) {
      focusService.abandonSession(activeSessionId, elapsedSeconds).catch(() => {});
    }
    dismissFocusTimerNotification().catch(() => {});
    set({ state: 'idle', elapsedSeconds: 0, activeSessionId: null, pendingNotificationId: null });
  },

  tick: () => {
    const { state, elapsedSeconds, totalSeconds, sessionTitle } = get();
    if (state !== 'running') return;
    if (elapsedSeconds >= totalSeconds) {
      get().onSessionComplete();
    } else {
      const next = elapsedSeconds + 1;
      set({ elapsedSeconds: next });
      // Silently update the notification every 60 s — no banner, no sound
      if (next % 60 === 0) {
        const remaining = totalSeconds - next;
        showFocusTimerNotification(sessionTitle || 'Focus Session', remaining, false).catch(() => {});
      }
    }
  },

  onSessionComplete: async () => {
    const { activeSessionId, totalSeconds, sessionTitle } = get();
    set({ state: 'break', elapsedSeconds: totalSeconds });

    dismissFocusTimerNotification().catch(() => {});

    if (activeSessionId) {
      try {
        await focusService.completeSession(activeSessionId, totalSeconds);
      } catch {}
    }

    get().fetchStats();
    set({ activeSessionId: null, pendingNotificationId: null });
  },

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      const s = await focusService.getStats();
      set({
        stats: {
          todayMinutes: s.today_minutes,
          weekSessions: s.week_sessions,
          currentStreak: s.current_streak,
          avgSessionMin: s.avg_session_min,
        },
        isLoadingStats: false,
      });
    } catch {
      set({ isLoadingStats: false });
    }
  },
}));
