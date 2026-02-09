import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { hasValidToken } from '../../api/authStore';
import { getMessages, sendMessage as sendMessageApi } from '../../api/messages';
import type { ServerMessage } from '../../api/types';

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
  const route = useRoute();
  const conversationId = (route.params as { conversationId?: string } | undefined)?.conversationId ?? null;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const attachmentSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const attachmentSnapPoints = useMemo(() => ['28%'], []);

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
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <Feather name="sun" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.titleRow} activeOpacity={0.8}>
        <Text style={styles.titleText}>Omi</Text>
        <Feather name="chevron-down" size={18} color="#FFFFFF" style={styles.titleChevron} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <Feather name="user" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderMessage = (message: Message, index: number) => (
    <View
      key={message.id || `msg-${index}`}
      style={[styles.messageWrap, message.isUser ? styles.messageWrapUser : styles.messageWrapBot]}
    >
      <View style={[styles.bubble, message.isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={styles.bubbleText}>{message.text}</Text>
      </View>
      <Text style={[styles.bubbleTime, message.isUser ? styles.bubbleTimeUser : styles.bubbleTimeBot]}>
        {message.timestamp || ' '}
      </Text>
    </View>
  );

  const openAttachmentSheet = useCallback(() => {
    attachmentSheetRef.current?.present();
  }, []);

  const closeAttachmentSheet = useCallback(() => {
    attachmentSheetRef.current?.dismiss();
  }, []);

  const handleTakePhoto = () => {
    closeAttachmentSheet();
    // TODO: launch camera (e.g. expo-image-picker launchCameraAsync)
  };

  const handlePhotoLibrary = () => {
    closeAttachmentSheet();
    // TODO: open photo library (e.g. expo-image-picker launchImageLibraryAsync)
  };

  const handleChooseFile = () => {
    closeAttachmentSheet();
    // TODO: open document picker (e.g. expo-document-picker getDocumentAsync)
  };

  const renderInputBar = () => (
    <View style={styles.inputBar}>
      <TouchableOpacity onPress={openAttachmentSheet} style={styles.plusBtn} activeOpacity={0.7}>
        <Feather name="plus" size={24} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
      <TextInput
        style={styles.inputField}
        placeholder="Message"
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={message}
        onChangeText={setMessage}
        onSubmitEditing={handleSend}
        multiline
        maxLength={1000}
        editable={!sending}
      />
      <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
        <Feather name="mic" size={22} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleSend}
        disabled={sending || !message.trim()}
        style={styles.sendBtn}
        activeOpacity={0.7}
      >
        <View style={styles.sendBtnCircle}>
          <Feather name="send" size={20} color={message.trim() && !sending ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderAttachmentSheet = () => (
    <BottomSheetModal
      ref={attachmentSheetRef}
      snapPoints={attachmentSnapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandleIndicator}
    >
      <BottomSheetView style={styles.sheetContent}>
        <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto} activeOpacity={0.7}>
          <Feather name="camera" size={22} color="#FFFFFF" />
          <Text style={styles.sheetOptionText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetOption} onPress={handlePhotoLibrary} activeOpacity={0.7}>
          <Feather name="image" size={22} color="#FFFFFF" />
          <Text style={styles.sheetOptionText}>Photo library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetOption} onPress={handleChooseFile} activeOpacity={0.7}>
          <Feather name="file" size={22} color="#FFFFFF" />
          <Text style={styles.sheetOptionText}>Choose file</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerBg} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderHeader()}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              <Text style={styles.loadingLabel}>Loading messages…</Text>
            </View>
          ) : (
            <>
              {apiError ? (
                <View style={styles.errorWrap}>
                  <Text style={styles.errorText}>{apiError}</Text>
                  <TouchableOpacity onPress={loadMessages}>
                    <Text style={styles.errorRetry}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {messages.map((msg, idx) => renderMessage(msg, idx))}
            </>
          )}
        </ScrollView>
        <View style={[styles.inputBarWrap, { paddingBottom: insets.bottom || 12 }]}>
          {renderInputBar()}
        </View>
        {sending ? (
          <View style={styles.sendingWrap}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            <Text style={styles.sendingLabel}>Omi is typing…</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {renderAttachmentSheet()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
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
    paddingVertical: 14,
    minHeight: 52,
    backgroundColor: '#000000',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  titleChevron: {
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  messageWrap: {
    marginBottom: 20,
    maxWidth: '82%',
  },
  messageWrapUser: {
    alignSelf: 'flex-end',
  },
  messageWrapBot: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: 'rgba(38,38,38,1)',
  },
  bubbleBot: {
    backgroundColor: 'rgba(38,38,38,1)',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTime: {
    fontSize: 12,
    marginTop: 6,
    color: 'rgba(255,255,255,0.45)',
  },
  bubbleTimeUser: {
    textAlign: 'right',
  },
  bubbleTimeBot: {
    textAlign: 'left',
  },
  inputBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 14,
    backgroundColor: 'rgba(36,36,36,1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50,50,50,1)',
    borderRadius: 22,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 6,
    minHeight: 48,
  },
  plusBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 12,
  },
  micBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 10,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,107,0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  errorRetry: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sendingLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  sheetBackground: {
    backgroundColor: 'rgba(36,36,36,1)',
  },
  sheetHandleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  sheetOptionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default Chat;