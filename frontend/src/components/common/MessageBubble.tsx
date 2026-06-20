import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export default function MessageBubble({ content, role, createdAt }: MessageBubbleProps) {
  const isUser = role === 'user';
  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && <Text style={styles.aiIcon}>🤖</Text>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.content, isUser ? styles.userContent : styles.assistantContent]}>
          {content}
        </Text>
        <Text style={[styles.time, isUser ? styles.userTime : styles.assistantTime]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  aiIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  userBubble: {
    backgroundColor: Colors.tealSoft,
    borderBottomRightRadius: BorderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: Colors.cardWhite,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    fontSize: Typography.fontSize.md,
    lineHeight: 22,
  },
  userContent: {
    color: Colors.textOnDark,
  },
  assistantContent: {
    color: Colors.textPrimary,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  userTime: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
  assistantTime: {
    color: Colors.textMuted,
  },
});
