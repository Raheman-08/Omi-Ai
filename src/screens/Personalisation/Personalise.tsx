import { StyleSheet, Text, View, SafeAreaView, StatusBar, TextInput, TouchableOpacity, Animated, Switch } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Button from '../../components/Button'

const NUM_STEPS = 5
const STEP_INDICATOR_WIDTH = 8

const Personalise = ({navigation}: {navigation: any}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState('')
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    // Rotate animation for loader
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const animateTransition = (nextStep: number) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const newDirection = nextStep > currentStep ? 1 : -1
    setDirection(newDirection)

    // Start from the correct position
    slideAnim.setValue(newDirection * 20)

    Animated.parallel([
      // Fade out current content
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      // Slide out current content
      Animated.timing(slideAnim, {
        toValue: -newDirection * 20,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentStep(nextStep)
      
      // Reset position for next content
      slideAnim.setValue(newDirection * 20)
      
      // Animate in new content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsAnimating(false)
      })
    })
  }

  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicators}>
        {Array(NUM_STEPS).fill(0).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index <= currentStep ? styles.stepDotActive : null
            ]}
          />
        ))}
      </View>
    )
  }

  const renderStepContent = () => {
    const content = () => {
      switch(currentStep) {
        case 0:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.question}>How should Omi call you?</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Button
                text="Continue"
                onPress={() => animateTransition(1)}
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )
        
        case 1:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  Enable background location for the full experience
                </Text>
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: '#333', true: '#7C3AED' }}
                  thumbColor={locationEnabled ? '#fff' : '#fff'}
                />
              </View>
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  Enable notifications to stay informed
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#333', true: '#7C3AED' }}
                  thumbColor={notificationsEnabled ? '#fff' : '#fff'}
                />
              </View>
              <Button
                text="Continue"
                onPress={() => animateTransition(2)}
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )
        
        case 2:
          return (
            <View style={styles.stepContainer}>
              <Button
                text="Connect My Omi"
                onPress={() => navigation.navigate('Bottom')}
                style={[styles.continueButton, styles.connectButton]}
                textStyle={[styles.buttonText, styles.connectButtonText]}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )
      }
    }

    return (
      <Animated.View 
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {content()}
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => currentStep > 0 ? animateTransition(currentStep - 1) : navigation.goBack()}
            disabled={isAnimating}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          {currentStep < 3 && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => animateTransition(2)}
              disabled={isAnimating}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step Indicators */}
        {renderStepIndicators()}

        {/* Loader Animation */}
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
            {Array(8).fill(0).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    transform: [
                      { rotate: `${i * 45}deg` },
                      { translateY: -30 },
                    ]
                  }
                ]}
              />
            ))}
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Your personal growth journey{'\n'}
          with AI that listens to your every
          word.
        </Text>

        {/* Step Content */}
        <View style={styles.stepsWrapper}>
          {renderStepContent()}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Personalise

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  stepDot: {
    width: STEP_INDICATOR_WIDTH,
    height: STEP_INDICATOR_WIDTH,
    borderRadius: STEP_INDICATOR_WIDTH / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: {
    backgroundColor: '#7C3AED',
  },
  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dotsWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 32,
    marginBottom: 40,
  },
  stepsWrapper: {
    flex: 1,
    position: 'relative',
  },
  stepContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 24,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    color: '#FFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  permissionContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    marginRight: 16,
  },
  connectButtonText: {
    color: '#FFF',
  },
})