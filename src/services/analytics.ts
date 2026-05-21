import { apiClient } from './api';

export interface ProductivityAnalytics {
  score: number;
  delta: string;
  tasks_completed_week: number;
  focus_hours_week: number;
  assignments_submitted_week: number;
  streak_days: number;
  weekly_breakdown: { day: string; score: number }[];
}

export interface FocusAnalytics {
  total_sessions: number;
  total_minutes: number;
  streak: number;
  avg_session_min: number;
  by_mode: { mode: string; count: number; total_min: number }[];
  daily: { date: string; minutes: number }[];
}

export interface AcademicAnalytics {
  current_gpa: number;
  gpa_trend: { semester: string; gpa: number }[];
  assignments_on_time_pct: number;
  study_hours_week: number;
  at_risk_courses: { code: string; grade: string }[];
}

export const analyticsService = {
  async getProductivity(): Promise<ProductivityAnalytics> {
    const { data } = await apiClient.get<ProductivityAnalytics>('/analytics/productivity');
    return data;
  },

  async getFocus(): Promise<FocusAnalytics> {
    const { data } = await apiClient.get<FocusAnalytics>('/analytics/focus');
    return data;
  },

  async getAcademic(): Promise<AcademicAnalytics> {
    const { data } = await apiClient.get<AcademicAnalytics>('/analytics/academic');
    return data;
  },

  async getWeeklySummary(): Promise<{
    summary: string;
    highlights: string[];
    areas_to_improve: string[];
  }> {
    const { data } = await apiClient.get('/analytics/weekly-summary');
    return data;
  },
};
