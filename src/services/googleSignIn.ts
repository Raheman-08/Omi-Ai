/**
 * Google Sign-In → Firebase Auth → API token.
 * Requires @react-native-google-signin/google-signin and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
 * In Expo Go the native module is not available – signInWithGoogle returns false and UI uses dev token.
 */
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { setAuthToken } from '../api/authStore';
import { getIdToken } from './firebaseAuth';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getWebClientId(): string | undefined {
  return typeof process !== 'undefined'
    ? (process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string) || undefined
    : undefined;
}

/** True when running inside Expo Go (no custom native modules). Skip native Google Sign-In to avoid crash. */
function isExpoGo(): boolean {
  try {
    const Constants = require('expo-constants').default;
    return Constants.appOwnership === 'expo';
  } catch {
    return true;
  }
}

/**
 * Performs Google Sign-In, then signs in to Firebase and sets the API auth token.
 * @returns true if sign-in succeeded; false if Expo Go, native module missing, no webClientId, or user cancelled.
 * @throws on other errors (network, invalid credential, etc.)
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (isExpoGo()) {
    return false;
  }

  const webClientId = getWebClientId();
  if (!webClientId) {
    return false;
  }

  let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin;
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch {
    return false;
  }

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn({});
    if (response.type !== 'success' || !response.data?.idToken) {
      return false;
    }
    const idToken = response.data.idToken;

    const auth = getFirebaseAuth();
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);

    const token = await getIdToken(true);
    if (token) {
      setAuthToken(token, Date.now() + TOKEN_EXPIRY_MS);
      return true;
    }
    return false;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('cancel') || message.includes('12501') || message.includes('sign_in_canceled')) {
      return false;
    }
    if (message.includes('TurboModuleRegistry') || message.includes('RNGoogleSignin') || message.includes('could not be found')) {
      return false;
    }
    throw err;
  }
}
