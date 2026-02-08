/**
 * Users API – mirrors backend/http/api/users.dart
 */
import { apiCallWithAuthRefresh } from './client';
import type { OnboardingState } from './types';

export async function getUserOnboardingState(): Promise<OnboardingState | null> {
  const res = await apiCallWithAuthRefresh<OnboardingState>('v1/users/onboarding', { method: 'GET' });
  return res.ok ? res.data : null;
}

export async function updateUserOnboardingState(params: {
  completed?: boolean;
  acquisition_source?: string;
  display_name?: string | null;
  primary_language?: string | null;
}): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/users/onboarding', {
    method: 'PATCH',
    body: params,
  });
  return res.ok && res.status >= 200 && res.status < 300;
}

export async function getUserPrimaryLanguage(): Promise<string | null> {
  const res = await apiCallWithAuthRefresh<{ language?: string | null }>('v1/users/language', {
    method: 'GET',
  });
  if (!res.ok || !res.data) return null;
  const lang = res.data.language;
  return lang ?? null;
}

export async function setUserPrimaryLanguage(languageCode: string): Promise<boolean> {
  const res = await apiCallWithAuthRefresh('v1/users/language', {
    method: 'PATCH',
    body: { language: languageCode },
  });
  return res.ok && res.status >= 200 && res.status < 300;
}

export async function deleteAccount(): Promise<boolean> {
  const res = await apiCallWithAuthRefresh('v1/users/delete-account', { method: 'DELETE' });
  return res.ok && res.status >= 200 && res.status < 300;
}

/** Register FCM / device push token with backend for push notifications. */
export async function registerDevicePushToken(params: {
  token: string;
  platform: 'ios' | 'android';
}): Promise<boolean> {
  const res = await apiCallWithAuthRefresh<unknown>('v1/users/push-token', {
    method: 'PATCH',
    body: params,
  });
  return res.ok && res.status >= 200 && res.status < 300;
}
