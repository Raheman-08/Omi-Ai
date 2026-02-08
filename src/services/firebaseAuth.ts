/**
 * Firebase Auth helpers for API token and sign-out.
 * Wire Sign-in to Firebase (Google/Apple) then use setAuthToken(await getIdToken()).
 */
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { setAuthToken, clearAuth } from '../api/authStore';

let currentUser: User | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

/** Get ID token for the current user (for API Bearer token). Returns null if not signed in. */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/** Sign out from Firebase and clear local API auth. */
export async function signOut(): Promise<void> {
  clearAuth();
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch {
    // ignore
  }
  currentUser = null;
}

/** Subscribe to auth state. Call once at app start (e.g. in App.tsx or auth context). */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
  return unsubscribe;
}
