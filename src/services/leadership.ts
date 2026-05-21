import { apiClient } from './api';
import { TeamMember, Meeting, DelegationItem } from '../features/leadership/types';

export interface CreateMeetingPayload {
  title: string;
  scheduled_time: string;
  location?: string;
  team_id?: string;
}

export interface MeetingNotes {
  id: string;
  meeting_id: string;
  content: string;
  ai_summary?: string;
  action_items: string[];
}

export interface CreateDelegationPayload {
  title: string;
  description: string;
  category: string;
  assigned_to?: string;
}

export const leadershipService = {
  async getTeamMembers(): Promise<TeamMember[]> {
    const { data } = await apiClient.get<TeamMember[]>('/leadership/team-members');
    return data;
  },

  async getMeetings(): Promise<Meeting[]> {
    const { data } = await apiClient.get<Meeting[]>('/leadership/meetings');
    return data;
  },

  async createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
    const { data } = await apiClient.post<Meeting>('/leadership/meetings', payload);
    return data;
  },

  async getMeetingNotes(meetingId: string): Promise<MeetingNotes> {
    const { data } = await apiClient.get<MeetingNotes>(`/leadership/meetings/${meetingId}/notes`);
    return data;
  },

  async saveMeetingNotes(meetingId: string, content: string): Promise<MeetingNotes> {
    const { data } = await apiClient.patch<MeetingNotes>(`/leadership/meetings/${meetingId}/notes`, { content });
    return data;
  },

  async getDelegations(): Promise<DelegationItem[]> {
    const { data } = await apiClient.get<DelegationItem[]>('/leadership/delegations');
    return data;
  },

  async createDelegation(payload: CreateDelegationPayload): Promise<DelegationItem> {
    const { data } = await apiClient.post<DelegationItem>('/leadership/delegations', payload);
    return data;
  },

  async updateDelegation(id: string, payload: Partial<{ status: string; progress: number }>): Promise<DelegationItem> {
    const { data } = await apiClient.patch<DelegationItem>(`/leadership/delegations/${id}`, payload);
    return data;
  },

  async joinMeeting(meetingId: string): Promise<void> {
    await apiClient.post(`/leadership/meetings/${meetingId}/join`);
  },
};
