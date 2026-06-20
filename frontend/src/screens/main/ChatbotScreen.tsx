import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  startConversation,
  sendMessage,
  addUserMessage,
} from '@/store/slices/chatSlice';
import { activateCrisisProtocol } from '@/services/crisis';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import MessageBubble from '@/components/common/MessageBubble';
import EmergencyButton from '@/components/common/EmergencyButton';

export default function ChatbotScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { currentConversationId, messages, isLoading, isSending } = useAppSelector(
    (state) => state.chat
  );
  const crisisResource = useAppSelector((state) => state.auth.user?.crisisResource);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    dispatch(startConversation());
  }, [dispatch]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentConversationId || isSending) return;

    setInputText('');
    dispatch(addUserMessage(text));

    const result = await dispatch(
      sendMessage({ conversationId: currentConversationId, content: text })
    );

    if (sendMessage.fulfilled.match(result) && result.payload.crisis_detected) {
      if (crisisResource) {
        activateCrisisProtocol(
          result.payload.crisis_severity ?? 'high',
          'chatbot',
          result.payload.crisis_event_id
        );
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-In</Text>
          <EmergencyButton />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tealSoft} />
          <Text style={styles.loadingText}>Starting your check-in...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-In</Text>
        <EmergencyButton />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              content={item.content}
              role={item.role}
              createdAt={item.createdAt}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isSending ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>...</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>↗</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            InnerBrother is a support tool, not a therapist.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creamLight,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.cardWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Typography.fontSize.md,
    color: Colors.tealSoft,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  messageList: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  typingIndicator: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  typingText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textMuted,
    marginLeft: Spacing['3xl'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textOnDark,
    fontWeight: '700',
  },
  disclaimer: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    paddingBottom: Spacing.sm,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
});
