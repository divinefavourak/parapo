import { apiClient } from './api';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotePayload {
  title: string;
  content?: string;
  tags?: string[];
  folder?: string;
  is_pinned?: boolean;
}

export const notesService = {
  async list(search?: string, folder?: string): Promise<Note[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (folder) params.set('folder', folder);
    const { data } = await apiClient.get<Note[]>(`/notes?${params}`);
    return data;
  },

  async get(id: string): Promise<Note> {
    const { data } = await apiClient.get<Note>(`/notes/${id}`);
    return data;
  },

  async create(payload: CreateNotePayload): Promise<Note> {
    const { data } = await apiClient.post<Note>('/notes', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateNotePayload & { content: string }>): Promise<Note> {
    const { data } = await apiClient.patch<Note>(`/notes/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notes/${id}`);
  },

  async pin(id: string): Promise<Note> {
    const { data } = await apiClient.patch<Note>(`/notes/${id}/pin`);
    return data;
  },

  async summarize(id: string): Promise<{ summary: string; action_items: string[] }> {
    const { data } = await apiClient.post(`/notes/${id}/summarize`);
    return data;
  },
};
