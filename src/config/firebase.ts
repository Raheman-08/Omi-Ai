/**
 * Firebase config for React Native (Expo).
 * Mirrors firebase.dart – same project: based-hardware-dev.
 * Uses web app credentials so Auth works with the JS SDK.
 * Auth state is persisted with AsyncStorage so it survives app restarts.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Same project as Flutter (firebase.dart) – web config for JS SDK
const firebaseConfig = {
  apiKey: 'AIzaSyC1U6S-hp8x_utpVDHtZwwBDxobhzRZI1w',
  authDomain: 'based-hardware-dev.firebaseapp.com',
  projectId: 'based-hardware-dev',
  storageBucket: 'based-hardware-dev.firebasestorage.app',
  messagingSenderId: '1031333818730',
  appId: '1:1031333818730:web:e1b83d713c04245cafb513',
};

let app: FirebaseApp;
let auth: Auth;

function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0] as FirebaseApp;
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
  return auth;
}

export { getFirebaseApp, getFirebaseAuth };
export type { Auth };
