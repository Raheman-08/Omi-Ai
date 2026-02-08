# Omi API (React Native)

This folder mirrors the **Omi Flutter app** `backend/http/api` and provides the same endpoints for the React Native app.

## Setup

1. **Base URL**  
   Set in `.env` as `EXPO_PUBLIC_API_BASE_URL` or `API_BASE_URL` (e.g. `https://api.omiapi.com/`).  
   If unset, defaults to `https://api.omiapi.com/`.

2. **Auth token**  
   After sign-in (e.g. Firebase Auth), call:
   ```ts
   import { setAuthToken } from './api';
   setAuthToken(idToken, expirationTimeMs); // expirationTimeMs optional
   ```
   On sign-out call `clearAuth()`.

3. **Token refresh (optional)**  
   If your backend returns 401 and you refresh the token in-app:
   ```ts
   import { setOnRefreshToken } from './api';
   setOnRefreshToken(async () => {
     const token = await getNewIdToken();
     if (token) setAuthToken(token, expiry);
     return token;
   });
   ```

## Modules

- **client** – `apiCall`, `apiCallWithAuthRefresh`, request timeouts, auth headers.
- **users** – onboarding, language, delete account, etc.
- **conversations** – list, get by id, create, delete, search, action items.
- **messages** – get messages, send message, clear chat, upload files, report.
- **device** – firmware version.

## Usage

```ts
import { getConversations, getMessages, sendMessage, setAuthToken } from './api';

// After sign-in
setAuthToken(firebaseIdToken);

// Fetch conversations (used by Home)
const list = await getConversations({ limit: 50, offset: 0 });

// Chat: get messages, send message
const messages = await getMessages();
await sendMessage({ text: 'Hello', appId: null });
```

## Reference

Backend reference: `backend/http/api/*.dart` and `backend/http/shared.dart` in this repo.
