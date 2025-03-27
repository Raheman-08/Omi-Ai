import { SafeAreaView, StyleSheet, Text, View, Image, StatusBar, TouchableOpacity, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Button from '../../components/Button'

const Verified = ({navigation}: {navigation: any}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animate check mark
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()

    // Fade in content
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.textContainer, { opacity: opacityAnim }]}>
          <Text style={styles.title}>Your Omi clone is{'\n'}verified and live!</Text>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View style={[styles.profileContainer, { opacity: opacityAnim }]}>
          <View style={styles.profileWrapper}>
            <Image
              source={require('../../assets/images/profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.profileName}>Raheman Ali</Text>
            <Image 
              source={require('../../assets/images/verify.png')}
              style={styles.verifiedBadge}
            />
          </View>
        </Animated.View>

        {/* Sample Message */}
        <Animated.View style={[styles.messageContainer, { opacity: opacityAnim }]}>
          <Text style={styles.message}>Got free money tips, wanna get rich?</Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, { opacity: opacityAnim }]}>
          <Button 
            text="Start chatting!"
            onPress={() => {}}
            style={styles.chatButton}
            textStyle={styles.buttonText}
          />
          
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share public link</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

export default Verified

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00D26A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 36,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00D26A',
    borderWidth: 2,
    borderColor: '#000',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    tintColor: '#007AFF',
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  message: {
    color: '#FFF',
    fontSize: 15,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 16,
  },
  chatButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  shareButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
})
