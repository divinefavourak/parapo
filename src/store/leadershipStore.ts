import { create } from 'zustand';
import { TeamMember, Meeting, DelegationItem } from '../features/leadership/types';
import { leadershipService } from '../services/leadership';
import { mockTeamMembers, mockMeetings, mockDelegations } from '../features/leadership/mockData';

interface LeadershipState {
  teamMembers: TeamMember[];
  meetings: Meeting[];
  delegations: DelegationItem[];
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  updateDelegation: (id: string, updates: Partial<{ status: string; progress: number }>) => Promise<void>;
}

export const useLeadershipStore = create<LeadershipState>((set, get) => ({
  teamMembers: mockTeamMembers,
  meetings: mockMeetings,
  delegations: mockDelegations,
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [teamMembers, meetings, delegations] = await Promise.all([
        leadershipService.getTeamMembers(),
        leadershipService.getMeetings(),
        leadershipService.getDelegations(),
      ]);
      set({ teamMembers, meetings, delegations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateDelegation: async (id, updates) => {
    set((state) => ({
      delegations: state.delegations.map((d) =>
        d.id === id ? { ...d, ...(updates as Partial<DelegationItem>) } : d
      ),
    }));
    try {
      await leadershipService.updateDelegation(id, updates);
    } catch {}
  },
}));
