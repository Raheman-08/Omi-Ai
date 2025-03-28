import { SafeAreaView, StyleSheet, Text, View, Image } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';

const Splash = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' as never }],
      });
    }, 2000);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />

    </SafeAreaView>
  )
}

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