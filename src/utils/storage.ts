import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'parapo_access_token',
  REFRESH_TOKEN: 'parapo_refresh_token',
  USER_ID: 'parapo_user_id',
} as const;

export const storage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async setAccessToken(token: string) {
    return SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string) {
    return SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER_ID);
  },
  async setUserId(id: string) {
    return SecureStore.setItemAsync(KEYS.USER_ID, id);
  },
  async getUserId() {
    return SecureStore.getItemAsync(KEYS.USER_ID);
  },
};
