import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'parcela_access_token';
const REFRESH_TOKEN_KEY = 'parcela_refresh_token';

/**
 * Saves both access and refresh tokens securely.
 */
export const saveTokens = async (accessToken, refreshToken) => {
  try {
    if (Platform.OS === 'web') {
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }

    if (accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('[authStorage] Failed to save tokens:', error);
  }
};

/**
 * Retrieves the access token from secure storage.
 */
export const getAccessToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('[authStorage] Failed to get access token:', error);
    return null;
  }
};

/**
 * Retrieves the refresh token from secure storage.
 */
export const getRefreshToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[authStorage] Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Removes both tokens from secure storage (used on logout).
 */
export const clearTokens = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[authStorage] Failed to clear tokens:', error);
  }
};
