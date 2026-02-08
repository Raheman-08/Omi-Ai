# Firebase (Expo)

Same Firebase project as the Flutter app: **based-hardware-dev** (from `firebase.dart`).

## Setup

- **Config:** `src/config/firebase.ts` – web app credentials so the Firebase JS SDK Auth works.
- **Init:** Firebase is initialized in `App.tsx`; `getFirebaseAuth()` is used for Auth.
- **API token:** After sign-in, call `setAuthToken(await getIdToken())` from `src/api/authStore`. On 401, the app calls `getIdToken(true)` and retries (see `App.tsx`).

## Google Sign-In (implemented)

- **Service:** `src/services/googleSignIn.ts` – configures `@react-native-google-signin/google-signin`, gets `idToken`, signs in to Firebase with `signInWithCredential(GoogleAuthProvider.credential(idToken))`, then sets API token via `setAuthToken(await getIdToken())`.
- **UI:** Sign-in screen “Sign in with Google” calls `signInWithGoogle()`; on success navigates to Personalise. Loading and error states are shown. If native module or Web Client ID is missing (e.g. Expo Go), the app falls back to dev token so the flow still works.
- **Web Client ID (required for real Google sign-in):** Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` to your **Web application** OAuth 2.0 client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (type “Web application”, same project as Firebase). Without it, `idToken` is null and the app uses the dev-token fallback.
- **Dev build:** `@react-native-google-signin/google-signin` requires a dev build (no Expo Go). You already have `android/google-services.json` and `ios/GoogleService-Info.plist`.

## Adding Apple sign-in

1. **Apple**
   - Use `expo-apple-authentication` to get identity token, then:
     ```ts
     import { OAuthProvider, signInWithCredential } from 'firebase/auth';
     const provider = new OAuthProvider('apple.com');
     const credential = provider.credential({ idToken: appleIdentityToken, rawNonce });
     await signInWithCredential(getFirebaseAuth(), credential);
     const token = await getIdToken();
     if (token) setAuthToken(token, ...);
     ```

2. **Sign out**
   - Call `signOut()` from `src/services/firebaseAuth` (clears Firebase and API auth).

## Packages

- `firebase` (JS SDK) – Auth, Firestore, Storage, etc. Works in Expo Go.

For Analytics/Crashlytics/Dynamic Links you’d need React Native Firebase and a dev build.
