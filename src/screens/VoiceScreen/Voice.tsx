import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOmiDeviceContext } from '../../context/OmiDeviceContext';

const Voice = () => {
  const { isConnected, isStreamingAudio, startAudioListener, stopAudioListener } = useOmiDeviceContext();
  const [isListening, setIsListening] = useState(false);

  const toggleListening = async () => {
    if (isListening) {
      if (isConnected && isStreamingAudio) await stopAudioListener();
      setIsListening(false);
    } else {
      if (isConnected) await startAudioListener();
      setIsListening(true);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.micButton, isListening && styles.micButtonActive]}
        onPress={toggleListening}
        activeOpacity={0.8}
      >
        <Feather name={isListening ? 'stop-circle' : 'mic'} size={40} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.hint}>{isListening ? 'Listening...' : 'Tap to talk'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: 'rgba(255,58,58,0.9)',
  },
  hint: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default Voice;
