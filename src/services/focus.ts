import { apiClient } from './api';

export type FocusMode = 'pomodoro' | 'deep_work' | 'sprint';
export type FocusState = 'idle' | 'running' | 'paused' | 'break' | 'completed';

export interface FocusSession {
  id: string;
  user_id: string;
  mode: FocusMode;
  title: string;
  duration_minutes: number;
  elapsed_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
}

export interface FocusStats {
  today_minutes: number;
  week_sessions: number;
  current_streak: number;
  avg_session_min: number;
  total_sessions: number;
  total_hours: number;
}

export interface StartSessionPayload {
  mode: FocusMode;
  title?: string;
  duration_minutes: number;
}

export const focusService = {
  async startSession(payload: StartSessionPayload): Promise<FocusSession> {
    const { data } = await apiClient.post<FocusSession>('/focus/sessions', payload);
    return data;
  },

  async completeSession(id: string, elapsed_seconds: number): Promise<FocusSession> {
    const { data } = await apiClient.patch<FocusSession>(`/focus/sessions/${id}/complete`, {
      elapsed_seconds,
    });
    return data;
  },

  async abandonSession(id: string, elapsed_seconds: number): Promise<void> {
    await apiClient.patch(`/focus/sessions/${id}/abandon`, { elapsed_seconds });
  },

  async getStats(): Promise<FocusStats> {
    const { data } = await apiClient.get<FocusStats>('/focus/stats');
    return data;
  },

  async getHistory(limit = 20): Promise<FocusSession[]> {
    const { data } = await apiClient.get<FocusSession[]>(`/focus/sessions?limit=${limit}`);
    return data;
  },
};
