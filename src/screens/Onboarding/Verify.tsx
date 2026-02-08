import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import Button from '../../components/Button'

const Verify = ({navigation}: {navigation: any}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Verification Icon */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/images/verified.png')}
            style={styles.verifiedIcon}
            // resizeMode="contain"
          />
        </View>

        {/* Title and Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Let's prevent impersonation!</Text>
          <Text style={styles.description}>
            Please verify you're the owner of{'\n'}this account
          </Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image
            source={require('../../assets/images/profile.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Raheman Ali</Text>
        </View>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <Button 
            text="Verify it's me"
            onPress={() => navigation.navigate('VerifySuccess')}
            style={styles.verifyButton}
            textStyle={styles.buttonText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Verify

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 24,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  verifiedIcon: {
    width: 64,
    height: 64,
    // tintColor: '#007AFF',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
  },
  verifyButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})
