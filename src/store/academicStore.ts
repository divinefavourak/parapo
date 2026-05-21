import { create } from 'zustand';
import { AcademicData } from '../features/academic/types';
import { academicService } from '../services/academic';
import { mockAcademicData } from '../features/academic/mockData';

interface AcademicState {
  data: AcademicData;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  submitAssignment: (id: string) => Promise<void>;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  data: mockAcademicData,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const data = await academicService.getData();
      set({ data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  submitAssignment: async (id: string) => {
    try {
      await academicService.submitAssignment(id);
      set((state) => ({
        data: {
          ...state.data,
          assignments: state.data.assignments.map((a) =>
            a.id === id ? { ...a, status: 'submitted' as const } : a
          ),
        },
      }));
    } catch {}
  },
}));
