import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar, Animated, Easing, ViewStyle, Image } from 'react-native'
import React, { useEffect, useRef } from 'react'
import LinearGradient from 'react-native-linear-gradient'

const NUM_DOTS = 8
const DOTS_SPACING = 45 // degrees

const Signin = ({navigation}: {navigation: any}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

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
          <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Personalise')}>
              <Image source={require('../../assets/images/apple.png')} style={styles.appleIcon} />
            <Text style={styles.buttonText}>Sign in with Apple</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Personalise')}>
            <Image source={require('../../assets/images/google.png')} style={styles.googleIcon} />
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
})
