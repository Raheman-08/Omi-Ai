import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Apps = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Apps</Text>
    <Text style={styles.subtitle}>Coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default Apps;
