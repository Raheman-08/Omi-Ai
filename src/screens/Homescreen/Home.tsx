import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ScrollView,
  Keyboard,
  Animated,
  Easing,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOmiDeviceContext } from '../../context/OmiDeviceContext';
import { BLE_UNAVAILABLE_MESSAGE } from '../../hooks/useOmiDevice';
import { useConversations, type ConversationItem } from '../../hooks/useConversations';
import { hasValidToken } from '../../api/authStore';
import { getUserOnboardingState } from '../../api/users';
import type { OmiDevice } from '@omiai/omi-react-native';
import { mapCodecToName } from '@omiai/omi-react-native';

const SEARCH_DEBOUNCE_MS = 400;

const Home = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ConversationItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { items: apiConversations, loading: conversationsLoading, error: conversationsError, refresh: refreshConversations, search: apiSearch } = useConversations({ limit: 50 });
  const conversations = hasValidToken() ? apiConversations : [];

  // Greeting: load display name from onboarding
  useEffect(() => {
    let cancelled = false;
    if (!hasValidToken()) return;
    getUserOnboardingState().then((state) => {
      if (!cancelled && state?.display_name?.trim()) setDisplayName(state.display_name.trim());
    });
    return () => { cancelled = true; };
  }, []);

  // Debounced API search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    if (!hasValidToken()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await apiSearch(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, apiSearch]);

  const {
    devices,
    isScanning,
    isConnected,
    connectedDeviceName,
    batteryLevel,
    audioCodec,
    error,
    isConnecting,
    isStreamingAudio,
    bleUnavailable,
    startScan,
    stopScan,
    connect,
    disconnect,
    refreshBattery,
    clearError,
    startAudioListener,
    stopAudioListener,
  } = useOmiDeviceContext();

  // Animation values
  const micScale = useRef(new Animated.Value(1)).current;
  const wave1Scale = useRef(new Animated.Value(1)).current;
  const wave2Scale = useRef(new Animated.Value(1)).current;
  const wave1Opacity = useRef(new Animated.Value(0)).current;
  const wave2Opacity = useRef(new Animated.Value(0)).current;

  // Animation for mic pulse
  const pulseMic = () => {
    Animated.sequence([
      Animated.timing(micScale, {
        toValue: 1.2,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(micScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isListening) pulseMic();
    });
  };

  // Animation for waves
  const animateWaves = () => {
    // Wave 1
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(wave1Scale, {
            toValue: 2,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave1Opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(wave1Scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Opacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Wave 2 (delayed start)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(wave2Scale, {
              toValue: 2,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(wave2Opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(wave2Scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(wave2Opacity, {
              toValue: 0.3,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, 1000);
  };

  // Start/stop animations based on listening state
  useEffect(() => {
    if (isListening) {
      wave1Opacity.setValue(0.3);
      wave2Opacity.setValue(0.3);
      pulseMic();
      animateWaves();
    } else {
      micScale.setValue(1);
      wave1Scale.setValue(1);
      wave2Scale.setValue(1);
      wave1Opacity.setValue(0);
      wave2Opacity.setValue(0);
    }
  }, [isListening]);

  const toggleListening = async () => {
    if (isListening) {
      if (isConnected && isStreamingAudio) {
        await stopAudioListener();
      }
      setIsListening(false);
    } else {
      if (isConnected) {
        await startAudioListener();
      }
      setIsListening(true);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return conversations;
    if (searchResults !== null) return searchResults;
    const searchTerms = q.toLowerCase().split(' ');
    return conversations.filter(conversation => {
      const searchableText = `${conversation.title} ${conversation.description} ${conversation.type}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [searchQuery, conversations, searchResults]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleDevicePress = () => {
    if (isConnected) return;
    if (isScanning) {
      stopScan();
      setDeviceModalVisible(false);
      return;
    }
    setDeviceModalVisible(true);
    clearError();
    startScan();
  };

  const handleConnectDevice = (device: OmiDevice) => {
    connect(device.id, device.name);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Omi',
      `Disconnect ${connectedDeviceName ?? 'device'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
      ]
    );
  };

  useEffect(() => {
    if (isConnected) {
      setDeviceModalVisible(false);
      stopScan();
      refreshBattery();
    }
  }, [isConnected, refreshBattery, stopScan]);

  const renderDeviceStatus = () => {
    if (isConnected) {
      const parts = [
        connectedDeviceName ?? 'Omi',
        batteryLevel != null ? `${batteryLevel}%` : '',
        audioCodec != null ? mapCodecToName(audioCodec) : '',
      ].filter(Boolean);
      const label = parts.join(' • ');
      return (
        <TouchableOpacity
          style={[styles.deviceStatusContainer, styles.deviceStatusConnected]}
          onPress={handleDisconnect}
          activeOpacity={0.7}
        >
          <Feather name="bluetooth" size={16} color="rgba(76,217,100,0.9)" style={styles.deviceIcon} />
          <Text style={styles.deviceStatusText}>{label}</Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" style={styles.chevronIcon} />
        </TouchableOpacity>
      );
    }
    if (isConnecting) {
      return (
        <View style={styles.deviceStatusContainer}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={styles.deviceIcon} />
          <Text style={styles.deviceStatusText}>Connecting...</Text>
        </View>
      );
    }
    if (isScanning) {
      return (
        <TouchableOpacity
          style={styles.deviceStatusContainer}
          onPress={() => { stopScan(); setDeviceModalVisible(false); }}
          activeOpacity={0.7}
        >
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={styles.deviceIcon} />
          <Text style={styles.deviceStatusText}>Scanning...</Text>
          <Feather name="x" size={16} color="rgba(255,255,255,0.5)" style={styles.chevronIcon} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.deviceStatusContainer}
        onPress={handleDevicePress}
        activeOpacity={0.7}
      >
        <Feather name="bluetooth" size={16} color="rgba(255,255,255,0.5)" style={styles.deviceIcon} />
        <Text style={styles.deviceStatusText}>Tap to find device</Text>
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  };

  const renderDeviceModal = () => (
    <Modal
      visible={deviceModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => { stopScan(); setDeviceModalVisible(false); }}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => { stopScan(); setDeviceModalVisible(false); }}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Omi devices</Text>
            <TouchableOpacity onPress={() => { stopScan(); setDeviceModalVisible(false); }}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {error && !bleUnavailable ? (
            <Text style={styles.modalError}>{error}</Text>
          ) : null}
          {bleUnavailable ? (
            <Text style={styles.modalEmpty}>{BLE_UNAVAILABLE_MESSAGE}</Text>
          ) : isScanning && devices.length === 0 ? (
            <View style={styles.modalScanning}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.modalScanningText}>Searching for Omi devices...</Text>
            </View>
          ) : !bleUnavailable && devices.length === 0 ? (
            <Text style={styles.modalEmpty}>No devices found. Make sure your Omi is on and in range.</Text>
          ) : !bleUnavailable ? (
            <ScrollView style={styles.modalDeviceList}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.modalDeviceRow}
                  onPress={() => handleConnectDevice(device)}
                  disabled={isConnecting}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.modalDeviceName}>{device.name || 'Omi'}</Text>
                    <Text style={styles.modalDeviceRssi}>RSSI: {device.rssi}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          {!bleUnavailable && isScanning && devices.length > 0 ? (
            <TouchableOpacity style={styles.modalStopButton} onPress={stopScan}>
              <Text style={styles.modalStopButtonText}>Stop scanning</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getMicButtonLabel = () => {
    if (isListening) return isConnected ? 'Listening via Omi' : 'Tap to stop';
    return isConnected ? 'Use Omi' : 'Try With Phone Mic';
  };

  const renderMicButton = () => (
    <TouchableOpacity 
      style={[styles.micButton, isListening && styles.micButtonListening]}
      activeOpacity={0.7}
      onPress={toggleListening}
    >
      <View style={styles.micAnimationContainer}>
        {isListening && (
          <>
            <Animated.View 
              style={[
                styles.wave,
                {
                  transform: [{ scale: wave1Scale }],
                  opacity: wave1Opacity,
                },
              ]} 
            />
            <Animated.View 
              style={[
                styles.wave,
                {
                  transform: [{ scale: wave2Scale }],
                  opacity: wave2Opacity,
                },
              ]} 
            />
          </>
        )}
        <Animated.View 
          style={[
            styles.micIconContainer,
            {
              transform: [{ scale: micScale }],
            },
          ]}
        >
          <Feather 
            name={isListening ? "stop-circle" : "mic"} 
            size={20} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </View>
      <Text style={styles.micButtonText}>
        {getMicButtonLabel()}
      </Text>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchInputContainer,
        isSearchFocused && styles.searchInputContainerFocused
      ]}>
        <Feather name="search" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Conversations"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={styles.filterButton}
        activeOpacity={0.7}
      >
        <Feather name="filter" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyStateContainer}>
      <Feather name="search" size={40} color="rgba(255,255,255,0.2)" />
      <Text style={styles.emptyStateText}>No conversations found</Text>
      <Text style={styles.emptyStateSubtext}>Try different search terms</Text>
    </View>
  );

  const renderConversationCard = (conversation: ConversationItem) => (
    <TouchableOpacity 
      key={conversation.id}
      style={styles.conversationCard}
      activeOpacity={0.7}
      onPress={() => openConversation(conversation.id)}
    >
      <View style={styles.conversationIconContainer}>
        <MaterialCommunityIcons name={conversation.icon as any} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationType}>{conversation.type}</Text>
          <Text style={styles.conversationTimestamp}>{conversation.timestamp}</Text>
        </View>
        <Text style={styles.conversationTitle}>{conversation.title}</Text>
        <Text style={styles.conversationDescription} numberOfLines={2}>
          {conversation.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const openConversation = (conversationId: string) => {
    (navigation as any).navigate('Chat', { conversationId });
  };

  const renderConversations = () => (
    <ScrollView
      style={styles.conversationsContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        hasValidToken() && searchResults === null ? (
          <RefreshControl
            refreshing={conversationsLoading && !searchLoading}
            onRefresh={refreshConversations}
            tintColor="rgba(255,255,255,0.7)"
          />
        ) : undefined
      }
    >
      {searchLoading ? (
        <View style={styles.apiErrorContainer}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
          <Text style={styles.apiErrorText}>Searching...</Text>
        </View>
      ) : null}
      {conversationsError && searchResults === null ? (
        <View style={styles.apiErrorContainer}>
          <Text style={styles.apiErrorText}>{conversationsError}</Text>
          <TouchableOpacity onPress={refreshConversations}>
            <Text style={styles.apiErrorRetry}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {filteredConversations.length > 0 ? (
        filteredConversations.map(renderConversationCard)
      ) : (
        renderEmptySearch()
      )}
    </ScrollView>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {displayName ? (
          <Text style={styles.greetingText}>Hi, {displayName}</Text>
        ) : null}
        {renderDeviceStatus()}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.languageButton}
          activeOpacity={0.7}
        >
          <Feather name="globe" size={18} color="#FFFFFF" />
          <Text style={styles.languageText}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <Feather name="user" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {renderHeader()}
        {renderMicButton()}
        {renderSearchBar()}
        {renderConversations()}
      </View>
      {renderDeviceModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  deviceStatusConnected: {
    backgroundColor: 'rgba(76,217,100,0.15)',
  },
  deviceIcon: {
    marginRight: 8,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  deviceStatusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalError: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
  },
  modalScanning: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalScanningText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  modalEmpty: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalDeviceList: {
    maxHeight: 280,
  },
  modalDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalDeviceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeviceRssi: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  modalStopButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalStopButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 100,
    marginBottom: 16,
  },
  micButtonListening: {
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  micAnimationContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.4)',
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    padding: 0,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  conversationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationType: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  conversationTimestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  conversationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  searchInputContainerFocused: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  apiErrorContainer: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: 12,
  },
  apiErrorText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  apiErrorRetry: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginTop: 8,
  },
});

export default Home;