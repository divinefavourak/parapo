import { create } from 'zustand';
import { authService, AuthUser, LoginPayload, SignupPayload } from '../services/auth';
import { storage } from '../utils/storage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  // Actions
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
  setOnboarded: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',
  error: null,

  initialize: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ status: 'unauthenticated' });
        return;
      }
      const user = await authService.getMe();
      set({ user, status: 'authenticated' });
    } catch {
      await storage.clearTokens();
      set({ status: 'unauthenticated' });
    }
  },

  login: async (payload) => {
    set({ error: null });
    try {
      const response = await authService.login(payload);
      set({ user: response.user, status: 'authenticated', error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      set({ error: msg });
      throw err;
    }
  },

  signup: async (payload) => {
    set({ error: null });
    try {
      const response = await authService.signup(payload);
      set({ user: response.user, status: 'authenticated', error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      set({ error: msg });
      throw err;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) set({ user: { ...user, ...updates } });
  },

  clearError: () => set({ error: null }),

  setOnboarded: async () => {
    try {
      await authService.markOnboarded();
      get().updateUser({ is_onboarded: true });
    } catch {
      get().updateUser({ is_onboarded: true });
    }
  },
}));
