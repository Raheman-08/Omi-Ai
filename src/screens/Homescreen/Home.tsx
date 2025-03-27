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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ConversationType = 'Other' | 'Chat' | 'Notes';

interface Conversation {
  id: string;
  type: ConversationType;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

// Sample conversation data
const conversations: Conversation[] = [
  {
    id: '1',
    type: 'Other',
    icon: 'brain',
    title: 'Random Thoughts',
    description: 'The conversation is very brief and seems to be a random utterance mentioning names like',
    timestamp: 'Dec 29, 1:58 AM',
  },
  {
    id: '2',
    type: 'Other',
    icon: 'brain',
    title: 'Brief Exchange and Monkey Locator',
    description: 'The conversation primarily consists of a brief exchange between the speakers with repeated',
    timestamp: 'Dec 29, 1:57 AM',
  },
  {
    id: '3',
    type: 'Chat',
    icon: 'chat-outline',
    title: 'Project Discussion',
    description: 'We talked about the timeline for the new app and agreed on the major milestones',
    timestamp: 'Dec 28, 10:24 PM',
  },
  {
    id: '4',
    type: 'Notes',
    icon: 'file-document-outline',
    title: 'Meeting Notes',
    description: 'Key points from today\'s team meeting: 1. Launch date confirmed for March 15th',
    timestamp: 'Dec 28, 4:15 PM',
  },
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const searchTerms = searchQuery.toLowerCase().trim().split(' ');
    
    return conversations.filter(conversation => {
      const searchableText = `${conversation.title} ${conversation.description} ${conversation.type}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [searchQuery]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleDeviceConnect = () => {
    // Handle device connection
    console.log('Attempting to connect device...');
  };

  const renderDeviceStatus = () => (
    <TouchableOpacity 
      style={styles.deviceStatusContainer}
      onPress={handleDeviceConnect}
      activeOpacity={0.7}
    >
      <Icon name="bluetooth" size={16} color="rgba(255,255,255,0.5)" style={styles.deviceIcon} />
      <Text style={styles.deviceStatusText}>No device found</Text>
      <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.3)" style={styles.chevronIcon} />
    </TouchableOpacity>
  );

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
          <Icon 
            name={isListening ? "stop-circle" : "mic"} 
            size={20} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </View>
      <Text style={styles.micButtonText}>
        {isListening ? "Tap to stop" : "Try With Phone Mic"}
      </Text>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchInputContainer,
        isSearchFocused && styles.searchInputContainerFocused
      ]}>
        <Icon name="search" size={20} color="rgba(255,255,255,0.5)" />
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
            <Icon name="x" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={styles.filterButton}
        activeOpacity={0.7}
      >
        <Icon name="filter" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="search" size={40} color="rgba(255,255,255,0.2)" />
      <Text style={styles.emptyStateText}>No conversations found</Text>
      <Text style={styles.emptyStateSubtext}>Try different search terms</Text>
    </View>
  );

  const renderConversationCard = (conversation: Conversation) => (
    <TouchableOpacity 
      key={conversation.id}
      style={styles.conversationCard}
      activeOpacity={0.7}
    >
      <View style={styles.conversationIconContainer}>
        <MaterialCommunityIcons name={conversation.icon} size={20} color="#FFFFFF" />
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

  const renderConversations = () => (
    <ScrollView 
      style={styles.conversationsContainer}
      showsVerticalScrollIndicator={false}
    >
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
        {renderDeviceStatus()}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.languageButton}
          activeOpacity={0.7}
        >
          <Icon name="globe" size={18} color="#FFFFFF" />
          <Text style={styles.languageText}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <Icon name="user" size={20} color="#FFFFFF" />
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