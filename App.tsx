import React from 'react';
import { View } from 'react-native';
import StackNavigation from './src/navigation/StackNavigation';
import { OmiDeviceProvider } from './src/context/OmiDeviceContext';
import { getFirebaseAuth } from './src/config/firebase';
import { setOnRefreshToken } from './src/api/client';
import { getIdToken } from './src/services/firebaseAuth';

// Initialize Firebase (same project as Flutter – based-hardware-dev)
getFirebaseAuth();

// API 401 retry: refresh token from Firebase
setOnRefreshToken(async () => {
  const token = await getIdToken(true);
  if (token) (await import('./src/api/authStore')).setAuthToken(token, Date.now() + 60 * 60 * 1000);
  return token;
});

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <OmiDeviceProvider>
        <StackNavigation />
      </OmiDeviceProvider>
    </View>
  );
}
