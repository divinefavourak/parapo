import { apiClient } from './api';
import { storage } from '../utils/storage';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization: string;
  avatar_url: string | null;
  is_onboarded: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  organization?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    await storage.setAccessToken(data.access_token);
    await storage.setRefreshToken(data.refresh_token);
    await storage.setUserId(data.user.id);
    return data;
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload);
    await storage.setAccessToken(data.access_token);
    await storage.setRefreshToken(data.refresh_token);
    await storage.setUserId(data.user.id);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Clear tokens regardless of server response
    } finally {
      await storage.clearTokens();
    }
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>('/users/me');
    return data;
  },

  async updateProfile(updates: Partial<Pick<AuthUser, 'full_name' | 'role' | 'organization'>>): Promise<AuthUser> {
    const { data } = await apiClient.patch<AuthUser>('/users/me', updates);
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async markOnboarded(): Promise<void> {
    await apiClient.post('/users/me/onboarded');
  },
};
