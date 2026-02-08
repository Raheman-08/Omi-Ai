/**
 * Get device push token (FCM on Android, APNs on iOS) and register with backend.
 * Call after notification permission is granted.
 * Uses dynamic import so expo-notifications is not loaded until this runs (avoids crash when native module not linked).
 */
import { Platform } from 'react-native';
import { registerDevicePushToken } from '../api/users';

export async function getAndRegisterDevicePushToken(): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    const pushToken = await Notifications.getDevicePushTokenAsync();
    const token = typeof pushToken.data === 'string' ? pushToken.data : (pushToken.data as { token?: string })?.token ?? '';
    if (!token) return false;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    return await registerDevicePushToken({ token, platform });
  } catch {
    return false;
  }
}
