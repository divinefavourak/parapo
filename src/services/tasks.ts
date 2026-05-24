import { apiClient } from './api';
import { Task, TaskColumn, TaskCategory } from '../features/tasks/types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  category: TaskCategory;
  column: TaskColumn;
  priority?: 'high' | 'medium' | 'low';
  assignee_name?: string;
  assignee_initials?: string;
  due_date?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  progress?: number;
  is_completed?: boolean;
}

export interface TaskFilters {
  column?: TaskColumn;
  category?: TaskCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export const tasksService = {
  async list(filters: TaskFilters = {}): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters.column) params.set('column', filters.column);
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit ?? 50));
    const { data } = await apiClient.get<Task[]>(`/tasks?${params}`);
    return data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await apiClient.post<Task>('/tasks', payload);
    return data;
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },

  async move(id: string, column: TaskColumn): Promise<Task> {
    const { data } = await apiClient.post<Task>(`/tasks/${id}/move`, { column });
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async complete(id: string): Promise<Task> {
    const { data } = await apiClient.post<Task>(`/tasks/${id}/complete`);
    return data;
  },

  async getAISuggestions(): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>('/tasks/ai-suggestions');
    return data;
  },
};
