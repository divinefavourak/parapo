import { apiClient } from './api';
import { Course, Assignment, StudyGoal, AcademicData, SemesterStats } from '../features/academic/types';

export interface CreateCoursePayload {
  code: string;
  title: string;
  instructor: string;
  credits: number;
  color?: string;
}

export interface CreateAssignmentPayload {
  course_id: string;
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  percent_of_grade: number;
}

export interface UpdateStudyGoalPayload {
  label: string;
  target_hours: number;
  completed_hours?: number;
}

export const academicService = {
  async getData(): Promise<AcademicData> {
    const { data } = await apiClient.get<AcademicData>('/academic/overview');
    return data;
  },

  async getStats(): Promise<SemesterStats> {
    const { data } = await apiClient.get<SemesterStats>('/academic/stats');
    return data;
  },

  async getCourses(): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>('/academic/courses');
    return data;
  },

  async createCourse(payload: CreateCoursePayload): Promise<Course> {
    const { data } = await apiClient.post<Course>('/academic/courses', payload);
    return data;
  },

  async updateCourse(id: string, payload: Partial<CreateCoursePayload & { current_grade: string; grade_point: number; progress: number }>): Promise<Course> {
    const { data } = await apiClient.patch<Course>(`/academic/courses/${id}`, payload);
    return data;
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/academic/courses/${id}`);
  },

  async getAssignments(filters?: { status?: string; course_id?: string }): Promise<Assignment[]> {
    const params = new URLSearchParams(filters as Record<string, string>);
    const { data } = await apiClient.get<Assignment[]>(`/academic/assignments?${params}`);
    return data;
  },

  async createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>('/academic/assignments', payload);
    return data;
  },

  async updateAssignment(id: string, payload: Partial<{ status: string; title: string }>): Promise<Assignment> {
    const { data } = await apiClient.patch<Assignment>(`/academic/assignments/${id}`, payload);
    return data;
  },

  async submitAssignment(id: string): Promise<Assignment> {
    const { data } = await apiClient.patch<Assignment>(`/academic/assignments/${id}/submit`);
    return data;
  },

  async getStudyGoals(): Promise<StudyGoal[]> {
    const { data } = await apiClient.get<StudyGoal[]>('/academic/study-goals');
    return data;
  },

  async upsertStudyGoal(payload: UpdateStudyGoalPayload): Promise<StudyGoal> {
    const { data } = await apiClient.post<StudyGoal>('/academic/study-goals', payload);
    return data;
  },

  async logStudyHours(goal_id: string, hours: number): Promise<StudyGoal> {
    const { data } = await apiClient.post<StudyGoal>(`/academic/study-goals/${goal_id}/log`, { hours });
    return data;
  },
};
