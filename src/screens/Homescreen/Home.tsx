import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { getFolders, createFolder } from '../../api/folders';
import { getAllGoals, createGoal } from '../../api/goals';
import { getDailyScoreBreakdown, type DailyScoreBreakdown } from '../../api/dailyScore';
import { formatDuration } from '../../hooks/useConversations';
import type { OmiDevice } from '@omiai/omi-react-native';
import { mapCodecToName } from '@omiai/omi-react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

const SEARCH_DEBOUNCE_MS = 400;

const FOLDER_ICONS: (keyof typeof Feather.glyphMap)[] = [
  'folder',
  'briefcase',
  'home',
  'file-text',
  'users',
  'heart',
  'link',
  'send',
];
const FOLDER_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#22C55E',
  '#A855F7',
  '#F97316',
  '#06B6D4',
  '#EC4899',
  '#1E40AF',
];

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

  const [conversationFilter, setConversationFilter] = useState<'all' | 'starred' | string>('all');
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [dailyScore, setDailyScore] = useState(100);
  const [scoreBreakdown, setScoreBreakdown] = useState<DailyScoreBreakdown | null>(null);
  const [scoreBreakdownLoading, setScoreBreakdownLoading] = useState(false);
  const scoreBreakdownSheetRef = useRef<BottomSheetModal>(null);
  const scoreBreakdownSnapPoints = useMemo(() => ['50%'], []);
  const newFolderSheetRef = useRef<BottomSheetModal>(null);
  const newFolderSnapPoints = useMemo(() => ['65%'], []);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderIconIndex, setNewFolderIconIndex] = useState(0);
  const [newFolderColorIndex, setNewFolderColorIndex] = useState(0);
  const [newFolderCreating, setNewFolderCreating] = useState(false);
  const addGoalSheetRef = useRef<BottomSheetModal>(null);
  const addGoalSnapPoints = useMemo(() => ['45%'], []);
  const [addGoalTitle, setAddGoalTitle] = useState('');
  const [addGoalCurrent, setAddGoalCurrent] = useState('0');
  const [addGoalTarget, setAddGoalTarget] = useState('100');
  const [addGoalCreating, setAddGoalCreating] = useState(false);

  const { items: apiConversations, loading: conversationsLoading, error: conversationsError, refresh: refreshConversations, search: apiSearch } = useConversations({
    limit: 50,
    starred: conversationFilter === 'starred' ? true : undefined,
    folderId: conversationFilter !== 'all' && conversationFilter !== 'starred' ? conversationFilter : undefined,
  });
  const conversations = hasValidToken() ? apiConversations : [];

  useEffect(() => {
    let cancelled = false;
    if (!hasValidToken()) return;
    getUserOnboardingState().then((state) => {
      if (!cancelled && state?.display_name?.trim()) setDisplayName(state.display_name.trim());
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasValidToken()) return;
    getFolders().then((list) => {
      if (!cancelled) setFolders(list.map((f) => ({ id: f.id, name: f.name })));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasValidToken()) return;
    getAllGoals().then((list) => {
      if (!cancelled && list.length > 0) {
        const total = list.reduce((acc, g) => acc + (g.current_value / (g.target_value || 1)) * 100, 0);
        setDailyScore(Math.round(total / list.length));
      }
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
        <Feather name="smartphone" size={16} color="rgba(255,255,255,0.7)" style={styles.deviceIcon} />
        <Text style={styles.deviceStatusText}>Connect Device</Text>
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
    (navigation.getParent() as any)?.navigate('Chat', { conversationId });
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

  const groupByDate = (items: ConversationItem[]): { label: string; items: ConversationItem[] }[] => {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();
    const groups: Record<string, ConversationItem[]> = {};
    items.forEach((item) => {
      const key = new Date(item.created_at).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    const order = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return order.map((key) => ({
      label: key === today ? 'Today' : key === yesterday ? 'Yesterday' : new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      items: groups[key],
    }));
  };

  const filteredForList = searchQuery.trim() && searchResults !== null ? searchResults : conversations;
  const grouped = groupByDate(filteredForList);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {renderDeviceStatus()}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearchFocused(true)}>
          <Feather name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={refreshConversations}>
          <Feather name="refresh-cw" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="settings" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const gaugeFillRotation = (1 - Math.min(100, Math.max(0, dailyScore)) / 100) * 180;

  const openScoreBreakdown = useCallback(() => {
    scoreBreakdownSheetRef.current?.present();
    setScoreBreakdownLoading(true);
    setScoreBreakdown(null);
    getDailyScoreBreakdown()
      .then((data) => {
        setScoreBreakdown(data);
      })
      .finally(() => {
        setScoreBreakdownLoading(false);
      });
  }, []);

  const closeScoreBreakdown = useCallback(() => {
    scoreBreakdownSheetRef.current?.dismiss();
  }, []);

  const openNewFolderSheet = useCallback(() => {
    setNewFolderName('');
    setNewFolderDescription('');
    setNewFolderIconIndex(0);
    setNewFolderColorIndex(0);
    newFolderSheetRef.current?.present();
  }, []);

  const closeNewFolderSheet = useCallback(() => {
    newFolderSheetRef.current?.dismiss();
  }, []);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setNewFolderCreating(true);
    try {
      const folder = await createFolder({
        name,
        description: newFolderDescription.trim() || undefined,
        icon: FOLDER_ICONS[newFolderIconIndex],
        color: FOLDER_COLORS[newFolderColorIndex],
      });
      if (folder) {
        closeNewFolderSheet();
        const list = await getFolders();
        setFolders(list.map((f) => ({ id: f.id, name: f.name })));
      }
    } finally {
      setNewFolderCreating(false);
    }
  }, [newFolderName, newFolderDescription, newFolderIconIndex, newFolderColorIndex, closeNewFolderSheet]);

  const openAddGoalSheet = useCallback(() => {
    setAddGoalTitle('');
    setAddGoalCurrent('0');
    setAddGoalTarget('100');
    addGoalSheetRef.current?.present();
  }, []);

  const closeAddGoalSheet = useCallback(() => {
    addGoalSheetRef.current?.dismiss();
  }, []);

  const handleAddGoal = useCallback(async () => {
    const title = addGoalTitle.trim();
    if (!title) return;
    const current = parseInt(addGoalCurrent, 10);
    const target = parseInt(addGoalTarget, 10);
    if (Number.isNaN(current) || Number.isNaN(target) || target < 0) return;
    setAddGoalCreating(true);
    try {
      const goal = await createGoal({
        title,
        current_value: current,
        target_value: target,
      });
      if (goal) {
        closeAddGoalSheet();
        const list = await getAllGoals();
        if (list.length > 0) {
          const total = list.reduce((acc, g) => acc + (g.current_value / (g.target_value || 1)) * 100, 0);
          setDailyScore(Math.round(total / list.length));
        }
      }
    } finally {
      setAddGoalCreating(false);
    }
  }, [addGoalTitle, addGoalCurrent, addGoalTarget, closeAddGoalSheet]);

  const renderDailyScore = () => (
    <View style={styles.dailyScoreCard}>
      <View style={styles.dailyScoreLeft}>
        <View style={styles.dailyScoreHeader}>
          <Text style={styles.dailyScoreTitle}>DAILY SCORE</Text>
        </View>
        <Text style={styles.dailyScoreDesc}>A score to help you better focus on execution.</Text>
        <TouchableOpacity style={styles.addGoalButton} activeOpacity={0.8} onPress={openAddGoalSheet}>
          <Text style={styles.addGoalText}>Add Goal &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dailyScoreGaugeWrap}>
        <TouchableOpacity style={styles.dailyScoreGaugeHelp} activeOpacity={0.7} onPress={openScoreBreakdown}>
          <Feather name="help-circle" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.dailyScoreGaugeArc}>
          <View
            style={[
              styles.dailyScoreGaugeArcFillWrap,
              { transform: [{ rotate: `${gaugeFillRotation}deg` }] },
            ]}
          >
            <View style={styles.dailyScoreGaugeArcFill} />
            <View style={styles.dailyScoreGaugeArcFillMask} />
          </View>
          <View style={styles.dailyScoreGaugeArcOutline} pointerEvents="none" />
        </View>
        <Text style={styles.dailyScoreValue}>{dailyScore}</Text>
      </View>
    </View>
  );

  const filterPills = [
    { key: 'starred' as const, label: 'Starred', icon: 'star' as const },
    ...folders.slice(0, 4).map((f) => ({ key: f.id, label: f.name, icon: 'briefcase' as const })),
  ];

  const renderConversationRow = (item: ConversationItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.conversationRow}
      activeOpacity={0.7}
      onPress={() => openConversation(item.id)}
    >
      <View style={styles.conversationRowIcon}>
        <MaterialCommunityIcons name={(item.icon || 'message-text') as any} size={22} color="#FFFFFF" />
      </View>
      <View style={styles.conversationRowContent}>
        <Text style={styles.conversationRowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.conversationRowMeta}>
          {item.timestamp}
          {item.durationSeconds != null ? ` • ${formatDuration(item.durationSeconds)}` : ''}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#111111']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {renderHeader()}
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
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
          {renderDailyScore()}
          <Text style={styles.sectionTitle}>Conversations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll} contentContainerStyle={styles.filterPillsContent}>
            <TouchableOpacity
              style={[styles.filterPill, conversationFilter === 'all' && styles.filterPillActive]}
              onPress={() => setConversationFilter('all')}
            >
              <Feather name="layers" size={14} color="#FFFFFF" />
              <Text style={styles.filterPillText}>All</Text>
            </TouchableOpacity>
            {filterPills.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.filterPill, conversationFilter === p.key && styles.filterPillActive]}
                onPress={() => setConversationFilter(p.key)}
              >
                <Feather name={p.icon} size={14} color="#FFFFFF" />
                <Text style={styles.filterPillText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.filterPillAdd} onPress={openNewFolderSheet}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>
          {conversationsError && searchResults === null ? (
            <View style={styles.apiErrorContainer}>
              <Text style={styles.apiErrorText}>{conversationsError}</Text>
              <TouchableOpacity onPress={refreshConversations}>
                <Text style={styles.apiErrorRetry}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {grouped.length === 0 && !conversationsLoading ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No conversations</Text>
            </View>
          ) : (
            grouped.map(({ label, items: groupItems }) => (
              <View key={label} style={styles.dateGroup}>
                <Text style={styles.dateGroupLabel}>{label}</Text>
                {groupItems.map(renderConversationRow)}
              </View>
            ))
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabAskOmi}
            activeOpacity={0.8}
            onPress={() => (navigation.getParent() as any)?.navigate('Chat', {})}
          >
            <Feather name="message-circle" size={18} color="#FFFFFF" />
            <Text style={styles.fabAskOmiText}>Ask Omi</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      {renderDeviceModal()}
      <BottomSheetModal
        ref={scoreBreakdownSheetRef}
        snapPoints={scoreBreakdownSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.scoreBreakdownSheetBg}
        handleIndicatorStyle={styles.scoreBreakdownSheetHandle}
      >
        <BottomSheetView style={styles.scoreBreakdownSheetContent}>
          <Text style={styles.scoreBreakdownTitle}>Daily Score Breakdown</Text>
          {scoreBreakdownLoading ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={styles.scoreBreakdownLoader} />
          ) : (
            <>
              <View style={styles.scoreBreakdownRow}>
                <Text style={styles.scoreBreakdownLabel}>Today's Score</Text>
                <Text style={styles.scoreBreakdownValue}>{scoreBreakdown?.todayScore ?? 0}</Text>
              </View>
              <View style={styles.scoreBreakdownRow}>
                <Text style={styles.scoreBreakdownLabel}>Tasks Completed</Text>
                <Text style={styles.scoreBreakdownValue}>
                  {scoreBreakdown != null ? `${scoreBreakdown.tasksCompleted}/${scoreBreakdown.tasksTotal}` : '0/0'}
                </Text>
              </View>
              <View style={styles.scoreBreakdownRow}>
                <Text style={styles.scoreBreakdownLabel}>Completion Rate</Text>
                <Text style={styles.scoreBreakdownValue}>
                  {scoreBreakdown?.completionRate != null ? `${scoreBreakdown.completionRate}%` : 'N/A'}
                </Text>
              </View>
            </>
          )}
          <View style={styles.scoreBreakdownHowItWorks}>
            <Text style={styles.scoreBreakdownHowTitle}>How it works</Text>
            <Text style={styles.scoreBreakdownHowText}>
              Your daily score is based on task completion. Complete your tasks to improve your score!
            </Text>
          </View>
          <TouchableOpacity style={styles.scoreBreakdownGotIt} activeOpacity={0.8} onPress={closeScoreBreakdown}>
            <Text style={styles.scoreBreakdownGotItText}>Got it</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={newFolderSheetRef}
        snapPoints={newFolderSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.newFolderSheetBg}
        handleIndicatorStyle={styles.newFolderSheetHandle}
      >
        <BottomSheetView style={styles.newFolderSheetContent}>
          <View style={styles.newFolderSheetHeader}>
            <Text style={styles.newFolderSheetTitle}>New Folder</Text>
            <TouchableOpacity
              onPress={handleCreateFolder}
              disabled={!newFolderName.trim() || newFolderCreating}
              style={styles.newFolderCreateBtn}
            >
              <Text
                style={[
                  styles.newFolderCreateBtnText,
                  (!newFolderName.trim() || newFolderCreating) && styles.newFolderCreateBtnTextDisabled,
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.newFolderInput}
            placeholder="Folder name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <TextInput
            style={[styles.newFolderInput, styles.newFolderInputSecond]}
            placeholder="Description (optional)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={newFolderDescription}
            onChangeText={setNewFolderDescription}
          />
          <Text style={styles.newFolderSectionLabel}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newFolderIconsScroll} contentContainerStyle={styles.newFolderIconsContent}>
            {FOLDER_ICONS.map((iconName, idx) => (
              <TouchableOpacity
                key={iconName}
                style={[styles.newFolderIconBtn, newFolderIconIndex === idx && styles.newFolderIconBtnSelected]}
                onPress={() => setNewFolderIconIndex(idx)}
              >
                <Feather name={iconName} size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.newFolderSectionLabel}>Color</Text>
          <View style={styles.newFolderColorsRow}>
            {FOLDER_COLORS.map((hex, idx) => (
              <TouchableOpacity
                key={hex}
                style={[styles.newFolderColorBtn, { backgroundColor: hex }]}
                onPress={() => setNewFolderColorIndex(idx)}
              >
                {newFolderColorIndex === idx ? (
                  <Feather name="check" size={18} color="#FFFFFF" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={addGoalSheetRef}
        snapPoints={addGoalSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.addGoalSheetBg}
        handleIndicatorStyle={styles.addGoalSheetHandle}
      >
        <BottomSheetView style={styles.addGoalSheetContent}>
          <Text style={styles.addGoalSheetTitle}>Add Goal</Text>
          <TextInput
            style={styles.addGoalInput}
            placeholder="Goal title"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={addGoalTitle}
            onChangeText={setAddGoalTitle}
          />
          <View style={styles.addGoalRow}>
            <View style={styles.addGoalFieldWrap}>
              <Text style={styles.addGoalLabel}>Current</Text>
              <TextInput
                style={styles.addGoalInputSmall}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={addGoalCurrent}
                onChangeText={setAddGoalCurrent}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.addGoalFieldWrap}>
              <Text style={styles.addGoalLabel}>Target</Text>
              <TextInput
                style={styles.addGoalInputSmall}
                placeholder="100"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={addGoalTarget}
                onChangeText={setAddGoalTarget}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.addGoalSubmitBtn}
            activeOpacity={0.8}
            onPress={handleAddGoal}
            disabled={!addGoalTitle.trim() || addGoalCreating}
          >
            {addGoalCreating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addGoalSubmitBtnText}>Add Goal</Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
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
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyScoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(44,44,44,1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  dailyScoreLeft: {
    flex: 1,
  },
  dailyScoreHeader: {
    marginBottom: 6,
  },
  dailyScoreTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  dailyScoreDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 14,
    width: '80%',
  },
  addGoalButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addGoalText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  dailyScoreGaugeWrap: {
    width: 120,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyScoreGaugeHelp: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dailyScoreGaugeArc: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 100,
    height: 50,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  dailyScoreGaugeArcOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
  },
  dailyScoreGaugeArcFillWrap: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dailyScoreGaugeArcFill: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dailyScoreGaugeArcFillMask: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 100,
    height: 50,
    backgroundColor: 'rgba(44,44,44,1)',
  },
  dailyScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  filterPillsScroll: {
    marginBottom: 16,
  },
  filterPillsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: 'rgba(124,58,237,0.4)',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterPillAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  conversationRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationRowContent: {
    flex: 1,
  },
  conversationRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  conversationRowMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    // paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  bottomSpacer: {
    height: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabAskOmi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  fabAskOmiText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabMic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMicActive: {
    backgroundColor: 'rgba(255,58,58,0.9)',
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
  scoreBreakdownSheetBg: {
    backgroundColor: 'rgba(36,36,36,1)',
  },
  scoreBreakdownSheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  scoreBreakdownSheetContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  scoreBreakdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  scoreBreakdownLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  scoreBreakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreBreakdownLoader: {
    marginVertical: 16,
  },
  scoreBreakdownHowItWorks: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  scoreBreakdownHowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scoreBreakdownHowText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  scoreBreakdownGotIt: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  scoreBreakdownGotItText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newFolderSheetBg: {
    backgroundColor: 'rgba(36,36,36,1)',
  },
  newFolderSheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  newFolderSheetContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  newFolderSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newFolderSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newFolderCreateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  newFolderCreateBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A855F7',
  },
  newFolderCreateBtnTextDisabled: {
    color: 'rgba(168,85,247,0.5)',
  },
  newFolderInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  newFolderInputSecond: {
    marginBottom: 24,
  },
  newFolderSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  newFolderIconsScroll: {
    marginBottom: 20,
  },
  newFolderIconsContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 24,
  },
  newFolderIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newFolderIconBtnSelected: {
    backgroundColor: 'rgba(59,130,246,0.6)',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  newFolderColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  newFolderColorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addGoalSheetBg: {
    backgroundColor: 'rgba(36,36,36,1)',
  },
  addGoalSheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  addGoalSheetContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  addGoalSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  addGoalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  addGoalRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  addGoalFieldWrap: {
    flex: 1,
  },
  addGoalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  addGoalInputSmall: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  addGoalSubmitBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  addGoalSubmitBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Home;