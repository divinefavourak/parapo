import { apiClient } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIBriefingResponse {
  summary: string;
  tags: { label: string; type: 'warning' | 'success' | 'info' }[];
  productivity_tip: string;
  priority_focus: string;
}

export interface MeetingSummaryResponse {
  summary: string;
  action_items: { task: string; assignee?: string; due?: string }[];
  key_decisions: string[];
}

export interface WorkloadAnalysis {
  score: number;
  level: 'light' | 'moderate' | 'heavy' | 'critical';
  recommendation: string;
  breakdown: { area: string; load: number }[];
}

export const aiService = {
  async chat(messages: ChatMessage[], context?: string): Promise<{ reply: string; usage?: { tokens: number } }> {
    const { data } = await apiClient.post('/ai/chat', { messages, context });
    return data;
  },

  async getDailyBriefing(): Promise<AIBriefingResponse> {
    const { data } = await apiClient.get<AIBriefingResponse>('/ai/briefing');
    return data;
  },

  async summarizeMeeting(notes: string, meeting_id?: string): Promise<MeetingSummaryResponse> {
    const { data } = await apiClient.post<MeetingSummaryResponse>('/ai/summarize-meeting', {
      notes,
      meeting_id,
    });
    return data;
  },

  async extractTasksFromText(text: string): Promise<{ title: string; description: string; category: string }[]> {
    const { data } = await apiClient.post('/ai/extract-tasks', { text });
    return data.tasks;
  },

  async analyzeWorkload(): Promise<WorkloadAnalysis> {
    const { data } = await apiClient.get<WorkloadAnalysis>('/ai/workload');
    return data;
  },

  async getStudyRecommendations(): Promise<string[]> {
    const { data } = await apiClient.get<{ recommendations: string[] }>('/ai/study-recommendations');
    return data.recommendations;
  },

  async getProductivityInsight(): Promise<string> {
    const { data } = await apiClient.get<{ insight: string }>('/ai/productivity-insight');
    return data.insight;
  },
};
