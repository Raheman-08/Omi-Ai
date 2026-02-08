import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar, Animated, Easing, ViewStyle, Image, ActivityIndicator, Linking, Modal, Pressable } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { setAuthToken } from '../../api/authStore';
import { signInWithGoogle } from '../../services/googleSignIn';

const PRIVACY_POLICY_URL = 'https://example.com/privacy';
const TERMS_OF_SERVICE_URL = 'https://example.com/terms';

const NUM_DOTS = 8
const DOTS_SPACING = 45 // degrees
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const Signin = ({navigation}: {navigation: any}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDataPrivacySheet, setShowDataPrivacySheet] = useState(false)

  useEffect(() => {
    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      delay: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const navigateAfterSignIn = () => {
    navigation.navigate('Personalise');
  };

  /** Placeholder until Apple Sign-In is implemented. Uses dev token so API/UI flow works. */
  const handleSignInWithApple = () => {
    setError(null);
    const devToken = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEV_AUTH_TOKEN;
    setAuthToken(devToken ?? 'dev-token', Date.now() + TOKEN_EXPIRY_MS);
    navigateAfterSignIn();
  };

  /** Google Sign-In → Firebase → API token. Falls back to dev token if not configured or in Expo Go. */
  const performGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    setShowDataPrivacySheet(false);
    try {
      const success = await signInWithGoogle();
      if (success) {
        navigateAfterSignIn();
        return;
      }
      const devToken = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEV_AUTH_TOKEN;
      setAuthToken(devToken ?? 'dev-token', Date.now() + TOKEN_EXPIRY_MS);
    } catch (e) {
      console.log('Sign-in failed', e);
    } finally {
      setLoading(false);
    }
  };

  const openDataPrivacySheet = () => setShowDataPrivacySheet(true);
  const closeDataPrivacySheet = () => setShowDataPrivacySheet(false);

  const renderDots = () => {
    const dots = []
    for (let i = 0; i < NUM_DOTS; i++) {
      const dotStyle: ViewStyle = {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFF',
        transform: [
          { rotate: `${i * DOTS_SPACING}deg` },
          { translateY: -30 },
        ],
        opacity: rotateAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        }),
      }
      dots.push(
        <Animated.View key={i} style={dotStyle} />
      )
    }
    return dots
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Animated Dots */}
        <View style={styles.loaderContainer}>
          <Animated.View 
            style={[
              styles.dotsWrapper,
              { transform: [{ rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) }] }
            ]}
          >
            {renderDots()}
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>
            Your personal growth journey{'\n'}
            with AI that listens to your every
            word.
          </Text>
        </Animated.View>

        {/* Sign in Buttons */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          {error ? (
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleSignInWithApple}
            disabled={loading}
          >
            <Image source={require('../../assets/images/apple.png')} style={styles.appleIcon} />
            <Text style={styles.buttonText}>Sign in with Apple</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={openDataPrivacySheet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Image source={require('../../assets/images/google.png')} style={styles.googleIcon} />
            )}
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By Signing in, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>

      {/* Data & Privacy bottom sheet (before Google sign-in) */}
      <Modal
        visible={showDataPrivacySheet}
        transparent
        animationType="slide"
        onRequestClose={closeDataPrivacySheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeDataPrivacySheet} />
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Data & Privacy</Text>
            <View style={styles.sheetGoogleRow}>
              <Image source={require('../../assets/images/google.png')} style={styles.sheetGoogleIcon} />
              <Text style={styles.sheetGoogleLabel}>Sign in with Google</Text>
            </View>
            <Text style={styles.sheetBody}>
              By continuing, all data you share with this app (including your conversations, recordings, and personal information) will be securely stored on our servers to provide you with AI-powered insights and enable all app features.
            </Text>
            <Text style={styles.sheetPolicy}>
              Your data is protected and governed by our{' '}
              <Text style={styles.sheetLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={styles.sheetLink} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>Terms of Service</Text>.
            </Text>
            <TouchableOpacity
              style={styles.sheetContinueButton}
              onPress={performGoogleSignIn}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetContinueButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancelButton} onPress={closeDataPrivacySheet} activeOpacity={0.7}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Signin

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  buttonContainer: {
    gap: 16,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 100,
    gap: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.3,
  },
  appleIcon: {
    width: 22,
    height: 22,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    color: '#FFF',
    textDecorationLine: 'underline',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  sheetGoogleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sheetGoogleIcon: {
    width: 24,
    height: 24,
  },
  sheetGoogleLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFF',
  },
  sheetBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFF',
    marginBottom: 16,
    opacity: 0.95,
  },
  sheetPolicy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFF',
    marginBottom: 24,
    opacity: 0.9,
  },
  sheetLink: {
    textDecorationLine: 'underline',
    color: '#FFF',
  },
  sheetContinueButton: {
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sheetContinueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  sheetCancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetCancelText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
})
