import { StyleSheet, Text, View, SafeAreaView, StatusBar, TextInput, TouchableOpacity, Animated, Switch, ActivityIndicator, Modal, Pressable, ScrollView, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import Button from '../../components/Button'
import {
  getUserOnboardingState,
  getUserPrimaryLanguage,
  updateUserOnboardingState,
  setUserPrimaryLanguage,
} from '../../api/users'
import { PRIMARY_LANGUAGES, ACQUISITION_SOURCES } from '../../api/types'
import type { AcquisitionSource } from '../../api/types'

const NUM_STEPS = 5
const STEP_INDICATOR_WIDTH = 8

const ACQUISITION_LABELS: Record<AcquisitionSource, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X (Twitter)',
}

const Personalise = ({navigation}: {navigation: any}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('en')
  const [acquisitionSource, setAcquisitionSource] = useState<AcquisitionSource | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const [direction, setDirection] = useState(0)

  // Prefill from API on mount (re-login)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [onboarding, language] = await Promise.all([
          getUserOnboardingState(),
          getUserPrimaryLanguage(),
        ])
        if (cancelled) return
        if (onboarding?.display_name != null) setName(String(onboarding.display_name))
        if (onboarding?.acquisition_source && ACQUISITION_SOURCES.includes(onboarding.acquisition_source as AcquisitionSource)) {
          setAcquisitionSource(onboarding.acquisition_source as AcquisitionSource)
        }
        if (language) setPrimaryLanguage(language)
      } catch {
        // ignore; keep defaults
      } finally {
        if (!cancelled) setIsLoadingPrefill(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
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
    setSaveError(null) // clear so next step doesn't show previous error
    const newDirection = nextStep > currentStep ? 1 : -1
    setDirection(newDirection)
    slideAnim.setValue(newDirection * 20)

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -newDirection * 20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep)
      slideAnim.setValue(newDirection * 20)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setIsAnimating(false))
    })
  }

  const saveAndNext = async (nextStep: number, save: () => Promise<boolean>) => {
    if (isAnimating) return
    setSaveError(null)
    const ok = await save()
    if (!ok) {
      setSaveError('Could not save. You can try again later.')
      // Still allow proceeding so user is not stuck.
    }
    animateTransition(nextStep)
    animateTransition(nextStep)
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
      switch (currentStep) {
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
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <Button
                text="Continue"
                onPress={() => saveAndNext(1, () => updateUserOnboardingState({ display_name: name || null }))}
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )

        case 1: {
          const selectedLabel = PRIMARY_LANGUAGES.find((l) => l.value === primaryLanguage)?.label ?? 'English'
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.question}>What's your primary language?</Text>
              <TouchableOpacity
                style={styles.languageInputTouchable}
                onPress={() => setShowLanguageSheet(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.languageInputText}>{selectedLabel}</Text>
                <Text style={styles.languageInputChevron}>▼</Text>
              </TouchableOpacity>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <Button
                text="Continue"
                onPress={() => saveAndNext(2, () => setUserPrimaryLanguage(primaryLanguage))}
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>

              <Modal
                visible={showLanguageSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLanguageSheet(false)}
              >
                <Pressable style={styles.sheetOverlay} onPress={() => setShowLanguageSheet(false)} />
                <View style={styles.sheetContainer} pointerEvents="box-none">
                  <Pressable style={styles.languageSheetContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Select language</Text>
                    <ScrollView style={styles.languageSheetScroll} showsVerticalScrollIndicator={false}>
                      {PRIMARY_LANGUAGES.map(({ value, label }) => (
                        <TouchableOpacity
                          key={value}
                          style={[styles.languageSheetOption, primaryLanguage === value && styles.languageSheetOptionActive]}
                          onPress={() => {
                            setPrimaryLanguage(value)
                            setShowLanguageSheet(false)
                          }}
                        >
                          <Text style={[styles.languageSheetOptionLabel, primaryLanguage === value && styles.optionLabelActive]}>
                            {label}
                          </Text>
                          {primaryLanguage === value ? <Text style={styles.optionCheck}>✓</Text> : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Pressable>
                </View>
              </Modal>
            </View>
          )
        }

        case 2:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.question}>How did you find us?</Text>
              <View style={styles.acquisitionRow}>
                {ACQUISITION_SOURCES.map((src) => (
                  <TouchableOpacity
                    key={src}
                    style={[styles.acquisitionButton, acquisitionSource === src && styles.acquisitionButtonActive]}
                    onPress={() => setAcquisitionSource(src)}
                  >
                    <Text style={[styles.acquisitionLabel, acquisitionSource === src && styles.optionLabelActive]}>
                      {ACQUISITION_LABELS[src]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <Button
                text="Continue"
                onPress={() =>
                  saveAndNext(3, () =>
                    updateUserOnboardingState({ acquisition_source: acquisitionSource ?? undefined })
                  )
                }
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )

        case 3:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  Enable background location for the full experience
                </Text>
                <Switch
                  value={locationEnabled}
                  onValueChange={async (value) => {
                    if (value) {
                      try {
                        const Location = await import('expo-location')
                        const { status: foreground } = await Location.requestForegroundPermissionsAsync()
                        const granted = foreground === 'granted'
                        if (granted && Platform.OS === 'ios') {
                          await Location.requestBackgroundPermissionsAsync()
                        }
                        setLocationEnabled(granted)
                      } catch {
                        setLocationEnabled(false)
                      }
                    } else {
                      setLocationEnabled(false)
                    }
                  }}
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
                  onValueChange={async (value) => {
                    if (value) {
                      try {
                        const Notifications = await import('expo-notifications')
                        const { status } = await Notifications.requestPermissionsAsync()
                        const granted = status === 'granted'
                        setNotificationsEnabled(granted)
                        if (granted) {
                          const { getAndRegisterDevicePushToken } = await import('../../services/pushToken')
                          await getAndRegisterDevicePushToken()
                        }
                      } catch {
                        setNotificationsEnabled(false)
                      }
                    } else {
                      setNotificationsEnabled(false)
                    }
                  }}
                  trackColor={{ false: '#333', true: '#7C3AED' }}
                  thumbColor={notificationsEnabled ? '#fff' : '#fff'}
                />
              </View>
              <Button
                text="Continue"
                onPress={() => animateTransition(4)}
                style={styles.continueButton}
                textStyle={styles.buttonText}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )

        case 4:
          return (
            <View style={styles.stepContainer}>
              <Button
                text="Connect My Omi"
                onPress={async () => {
                  await updateUserOnboardingState({ completed: true });
                  navigation.navigate('Bottom');
                }}
                style={[styles.continueButton, styles.connectButton]}
                textStyle={[styles.buttonText, styles.connectButtonText]}
              />
              <TouchableOpacity>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )

        default:
          return null
      }
    }

    return (
      <Animated.View
        style={[
          styles.stepContent,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
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
          
          {currentStep < 4 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => animateTransition(4)}
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
          {isLoadingPrefill ? (
            <View style={styles.stepContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading your preferences…</Text>
            </View>
          ) : (
            renderStepContent()
          )}
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
  languageInputTouchable: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageInputText: {
    color: '#FFF',
    fontSize: 16,
  },
  languageInputChevron: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  languageSheetContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  languageSheetScroll: {
    maxHeight: 320,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  languageSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageSheetOptionActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  languageSheetOptionLabel: {
    fontSize: 16,
    color: '#FFF',
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
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  optionsList: {
    width: '100%',
    marginBottom: 24,
    maxHeight: 240,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(124,58,237,0.4)',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  optionLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  optionLabelActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '700',
  },
  acquisitionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
  },
  acquisitionButton: {
    minWidth: '45%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  acquisitionButtonActive: {
    backgroundColor: 'rgba(124,58,237,0.4)',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  acquisitionLabel: {
    fontSize: 15,
    color: '#FFF',
  },
})