import { create } from 'zustand';
import { FocusMode, FocusState } from '../features/focus/types';
import { FOCUS_MODES } from '../features/focus/mockData';
import { focusService, FocusSession } from '../services/focus';
import { notificationService } from '../services/notifications';

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
  // Actions
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

  setMode: (mode) => {
    if (get().state !== 'idle') return;
    const found = FOCUS_MODES.find((m) => m.key === mode);
    set({ mode, elapsedSeconds: 0, state: 'idle', totalSeconds: (found?.duration ?? 25) * 60 });
  },

  setSessionTitle: (title) => set({ sessionTitle: title }),

  start: async () => {
    const { mode, sessionTitle, totalSeconds } = get();
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
      const found = FOCUS_MODES.find((m) => m.key === mode);
      const session = await focusService.startSession({
        mode,
        title: sessionTitle || 'Focus Session',
        duration_minutes: found?.duration ?? 25,
      });
      set({ activeSessionId: session.id });
    } catch {
      // Continue locally even if backend fails
    }
  },

  pause: () => {
    set({ state: 'paused' });
    // Cancel scheduled notification since session is paused
    const { pendingNotificationId } = get();
    if (pendingNotificationId) {
      notificationService.cancelNotification(pendingNotificationId).catch(() => {});
      set({ pendingNotificationId: null });
    }
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
    set({ state: 'idle', elapsedSeconds: 0, activeSessionId: null, pendingNotificationId: null });
  },

  tick: () => {
    const { state, elapsedSeconds, totalSeconds } = get();
    if (state !== 'running') return;
    if (elapsedSeconds >= totalSeconds) {
      get().onSessionComplete();
    } else {
      set({ elapsedSeconds: elapsedSeconds + 1 });
    }
  },

  onSessionComplete: async () => {
    const { activeSessionId, totalSeconds } = get();
    set({ state: 'break', elapsedSeconds: totalSeconds });

    if (activeSessionId) {
      try {
        await focusService.completeSession(activeSessionId, totalSeconds);
      } catch {}
    }

    // Refresh stats after completion
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
