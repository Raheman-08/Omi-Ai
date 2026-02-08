/**
 * Device ID hash for API requests – matches Flutter shared.dart X-Device-Id-Hash.
 * Persisted in AsyncStorage so the same device sends the same hash across sessions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'deviceIdHash';

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

/** Persisted device hash for this app install (used when backend expects device-scoped data). */
export async function getDeviceIdHash(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      cached = stored;
      return cached;
    }
    const id = randomId();
    const hash = simpleHash(id);
    await AsyncStorage.setItem(STORAGE_KEY, hash);
    cached = hash;
    return hash;
  } catch {
    const fallback = simpleHash(randomId());
    cached = fallback;
    return fallback;
  }
}

/**
 * Value to send as X-Device-Id-Hash. Returns null to omit the header so the backend
 * returns all conversations for the user (no device filter). Set to getDeviceIdHash
 * if the API starts requiring device-scoped responses.
 */
export async function getDeviceIdHashForApi(): Promise<string | null> {
  return null;
}
