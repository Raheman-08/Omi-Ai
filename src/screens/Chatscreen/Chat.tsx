import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useOmiDeviceContext } from '../../context/OmiDeviceContext';
import { hasValidToken } from '../../api/authStore';
import { getMessages, sendMessage as sendMessageApi } from '../../api/messages';
import type { ServerMessage } from '../../api/types';
import type { TabParamList } from '../../navigation/BottomNavigation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const FALLBACK_MESSAGES: Message[] = [
  { id: '1', text: 'what is omi.me', isUser: true, timestamp: '10:19 PM' },
  {
    id: '2',
    text: 'Omi.me is the official website for Omi, an open-source AI wearable device designed to capture, transcribe, and manage conversations seamlessly. The platform allows users to stay focused and productive by providing high-quality transcriptions of meetings, chats, and voice memos. The Omi device connects to a mobile app, enabling real-time insights and interaction with the captured audio data.\n\nFor more details, you can explore various guides and resources available on the website, including setup instructions, buying guides, and developer documentation.',
    isUser: false,
    timestamp: '10:19 PM',
  },
];

function formatTime(iso: string): string {
  if (iso == null || typeof iso !== 'string') return '';
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  } catch {
    return '';
  }
}

function serverToMessage(m: ServerMessage, index?: number): Message {
  const id = m.id != null && String(m.id).trim() ? String(m.id) : `msg-${index ?? 0}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    text: m.text ?? '',
    isUser: m.sender === 'human',
    timestamp: formatTime(m.created_at),
  };
}

const Chat = () => {
  const route = useRoute<RouteProp<TabParamList, 'Chat'>>();
  const conversationId = route.params?.conversationId ?? null;
  const { isConnected } = useOmiDeviceContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadMessages = useCallback(async () => {
    if (!hasValidToken()) return;
    setLoading(true);
    setApiError(null);
    try {
      const list = await getMessages(conversationId);
      const sorted = [...list].sort((a, b) => {
        const tA = new Date(a.created_at).getTime();
        const tB = new Date(b.created_at).getTime();
        return (Number.isNaN(tA) ? 0 : tA) - (Number.isNaN(tB) ? 0 : tB);
      });
      setMessages(sorted.length > 0 ? sorted.map((m, i) => serverToMessage(m, i)) : FALLBACK_MESSAGES);
    } catch {
      setApiError('Could not load messages');
      setMessages(FALLBACK_MESSAGES);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    if (!hasValidToken()) return;

    setSending(true);
    setApiError(null);
    try {
      await sendMessageApi({ text, appId: conversationId });
      await loadMessages();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      setTimeout(() => loadMessages(), 2500);
    } catch {
      setApiError('Send failed');
    } finally {
      setSending(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.loadingIcon}>
          <Feather name="loader" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Omi</Text>
        {isConnected && (
          <View style={styles.connectedBadge}>
            <Feather name="bluetooth" size={12} color="rgba(76,217,100,0.9)" />
            <Text style={styles.connectedBadgeText}>Device</Text>
          </View>
        )}
        <Feather name="chevron-down" size={20} color="#FFFFFF" style={styles.titleIcon} />
      </View>
      <TouchableOpacity style={styles.profileButton}>
        <View style={styles.profileIcon}>
          <Feather name="user" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderMessage = (message: Message, index: number) => (
    <View
      key={message.id || `msg-${index}`}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.botBubble,
      ]}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
      <Text style={[
        styles.timestamp,
        message.isUser ? styles.userTimestamp : styles.botTimestamp
      ]}>
        {message.timestamp || ' '}
      </Text>
    </View>
  );

  const renderInputBar = () => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !message.trim()}
          style={styles.sendButton}
        >
          <Feather name="send" size={20} color={message.trim() && !sending ? '#FFF' : 'rgba(255,255,255,0.4)'} />
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
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderHeader()}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              <Text style={styles.loadingText}>Loading messages…</Text>
            </View>
          ) : (
            <>
              {apiError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                  <TouchableOpacity onPress={loadMessages}>
                    <Text style={styles.errorBannerRetry}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {messages.map((msg, idx) => renderMessage(msg, idx))}
            </>
          )}
        </ScrollView>
        {renderInputBar()}
        {sending ? (
          <View style={styles.sendingBar}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            <Text style={styles.sendingText}>Omi is typing…</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 60,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,217,100,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  connectedBadgeText: {
    color: 'rgba(76,217,100,0.95)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  titleIcon: {
    marginLeft: 4,
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#1A1A1A',
  },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255,255,255,0.5)',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  botTimestamp: {
    textAlign: 'left',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 45,
    marginBottom: 60,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,107,0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  errorBannerRetry: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sendingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
});

export default Chat;