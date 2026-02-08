import { SafeAreaView, StyleSheet, Text, View, Image, Dimensions, StatusBar } from 'react-native'
import React from 'react'
import Button from '../../components/Button'
const { width, height } = Dimensions.get('window')

const Onboard = ({navigation}: {navigation: any}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../assets/images/onboard.png')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      
      <SafeAreaView style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Get Started with Omi AI</Text>
          
          <View style={styles.buttonContainer}>
            <Button text="Get Started" onPress={() => navigation.navigate('Signin')} textStyle={styles.getStartedText} style={styles.signInButton} /> 
            
            <Button text="Sign In" onPress={() => navigation.navigate('Signin')} textStyle={styles.signInText} /> 
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

export default Onboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    height: height * 0.65,
    width: width,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  signInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signInText: {
    color: '#FFFFFF',
  },
  getStartedText: {
    color: '#FFFFFF',
  },
})