/**
 * Omi API – mirrors backend from Omi Flutter app.
 * Set auth token after sign-in via setAuthToken(); use api modules for requests.
 */
export { API_CONFIG, isApiUrl } from './config';
export { setAuthToken, getAuthToken, clearAuth, hasValidToken, getTokenExpirationTime } from './authStore';
export {
  apiCall,
  apiCallWithAuthRefresh,
  setOnRefreshToken,
  type ApiResponse,
  type RequestOptions,
} from './client';
export * from './users';
export * from './conversations';
export * from './messages';
export * from './device';
export * from './apps';
export * from './goals';
export * from './dailyScore';
export * from './folders';
export * from './tasks';
export * from './memories';
export type { GetConversationsParams } from './conversations';
export type { SendMessageParams } from './messages';
export type { FirmwareVersionParams } from './device';
export * from './types';
