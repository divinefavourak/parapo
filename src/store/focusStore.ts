import { create } from 'zustand';
import { FocusMode, FocusState } from '../features/focus/types';
import { FOCUS_MODES } from '../features/focus/mockData';

interface FocusStoreState {
  mode: FocusMode;
  state: FocusState;
  elapsedSeconds: number;
  sessionTitle: string;
  totalSeconds: number;
  setMode: (mode: FocusMode) => void;
  setSessionTitle: (title: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  mode: 'deep_work',
  state: 'idle',
  elapsedSeconds: 0,
  sessionTitle: 'Focus Session',
  totalSeconds: 90 * 60,
  setMode: (mode) => {
    const found = FOCUS_MODES.find((m) => m.key === mode);
    set({ mode, elapsedSeconds: 0, state: 'idle', totalSeconds: (found?.duration ?? 25) * 60 });
  },
  setSessionTitle: (title) => set({ sessionTitle: title }),
  start: () => set({ state: 'running' }),
  pause: () => set({ state: 'paused' }),
  reset: () => set({ state: 'idle', elapsedSeconds: 0 }),
  tick: () => {
    const { state, elapsedSeconds, totalSeconds } = get();
    if (state !== 'running') return;
    if (elapsedSeconds >= totalSeconds) {
      set({ state: 'break', elapsedSeconds: totalSeconds });
    } else {
      set({ elapsedSeconds: elapsedSeconds + 1 });
    }
  },
}));
