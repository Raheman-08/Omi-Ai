import { SafeAreaView, StyleSheet, View, Image } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getFirebaseAuth } from '../../config/firebase';
import { getIdToken } from '../../services/firebaseAuth';
import { setAuthToken } from '../../api/authStore';
import { getUserOnboardingState } from '../../api/users';

/** Min splash time so Firebase can restore persisted auth. */
const SPLASH_MIN_MS = 2000;
/** Max wait before treating as not logged in. */
const AUTH_WAIT_MS = 3500;

const Splash = () => {
  const navigation = useNavigation();
  const resolved = useRef(false);

  const goTo = (route: 'Onboarding' | 'Personalise' | 'Bottom') => {
    if (resolved.current) return;
    resolved.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: route as never }],
    });
  };

  useEffect(() => {
    const fallback = setTimeout(() => {
      if (resolved.current) return;
      goTo('Onboarding');
    }, AUTH_WAIT_MS);

    const run = async () => {
      await new Promise((r) => setTimeout(r, SPLASH_MIN_MS));
      if (resolved.current) return;
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        goTo('Onboarding');
        return;
      }
      try {
        const token = await getIdToken(false);
        if (!token) {
          goTo('Onboarding');
          return;
        }
        setAuthToken(token, Date.now() + 60 * 60 * 1000);
        const onboarding = await getUserOnboardingState();
        if (onboarding?.completed) {
          goTo('Bottom');
        } else {
          goTo('Personalise');
        }
      } catch {
        goTo('Onboarding');
      }
    };
    run();

    return () => clearTimeout(fallback);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
    </SafeAreaView>
  );
};

export default Splash

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
})