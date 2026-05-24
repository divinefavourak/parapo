import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original = error.config;
      const isAuthRoute = original?.url?.startsWith('/auth/');
      if (error.response?.status !== 401 || original._retry || isAuthRoute) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        await storage.setAccessToken(data.access_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return client(original);
      } catch (err) {
        processQueue(err, null);
        await storage.clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
}

export const apiClient = createApiClient();

export type ApiError = {
  message: string;
  status: number;
  detail?: string;
};

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.detail ?? error.message,
      status: error.response?.status ?? 0,
      detail: error.response?.data?.detail,
    };
  }
  return { message: String(error), status: 0 };
}
