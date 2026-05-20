import { create } from 'zustand';

interface UserState {
  name: string;
  role: string;
  initials: string;
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: 'Commander',
  role: 'Student Council President',
  initials: 'SC',
  isOnboarded: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
}));
