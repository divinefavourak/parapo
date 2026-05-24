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
    const [r0, r1, r2] = await Promise.allSettled([
      leadershipService.getTeamMembers(),
      leadershipService.getMeetings(),
      leadershipService.getDelegations(),
    ]);
    set({
      ...(r0.status === 'fulfilled' ? { teamMembers: r0.value } : {}),
      ...(r1.status === 'fulfilled' ? { meetings: r1.value } : {}),
      ...(r2.status === 'fulfilled' ? { delegations: r2.value } : {}),
      isLoading: false,
    });
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
