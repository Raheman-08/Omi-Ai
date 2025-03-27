import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../../components/Button';
const {width} = Dimensions.get('window');

const Cloning = ({navigation}: {navigation: any}) => {
  const [handle, setHandle] = useState('');
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Minimal Robot Icon */}
        <Animated.View
          style={[styles.iconContainer, {transform: [{scale: pulseAnim}]}]}>
          {/* <View style={styles.robotIcon}>
            <View style={styles.robotEye} />
            <View style={styles.robotEye} />
          </View> */}
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.robotIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title and Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Let's train your clone!</Text>
          <Text style={styles.subtitle}>What's your X handle?</Text>
          <Text style={styles.description}>
            We will pre-train your Omi clone based on{'\n'}
            your account's activity
          </Text>
        </View>

        {/* X Handle Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.xIcon}>𝕏</Text>
          <TextInput
            style={styles.input}
            placeholder="@username"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.inputLine} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button text="Next" onPress={() => navigation.navigate('Verify')} style={styles.nextButton} textStyle={styles.buttonText} />

          <Button text="Clone from omi device" onPress={() => navigation.navigate('Verify')} style={styles.cloneButton} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Cloning;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    // marginTop: 60,
    marginBottom: 40,
  },
  robotIcon: {
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
    // borderWidth: 2,
    // borderColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    // transform: [{rotate: '45deg'}],
  },
  robotEye: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    opacity: 0.9,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  xIcon: {
    position: 'absolute',
    left: 0,
    top: 12,
    fontSize: 18,
    color: '#FFF',
    opacity: 0.8,
  },
  input: {
    color: '#FFF',
    fontSize: 16,
    height: 48,
    paddingLeft: 32,
    paddingBottom: 8,
  },
  inputLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  buttonContainer: {
    gap: 20,
  },
  nextButton: {
    // height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cloneButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cloneButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
});
