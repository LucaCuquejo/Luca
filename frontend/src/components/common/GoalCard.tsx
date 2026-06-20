import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Goal } from '@/store/slices/goalsSlice';

const CATEGORY_ICONS: Record<string, string> = {
  smoking: '🚭',
  exercise: '🚶',
  social: '🤝',
  mental_wellbeing: '📝',
  nutrition: '🥗',
  sleep: '😴',
  alcohol: '🚫',
  custom: '🎯',
};

interface GoalCardProps {
  goal: Goal;
  onComplete: (goalId: string) => void;
  isCompleting?: boolean;
}

export default function GoalCard({ goal, onComplete, isCompleting }: GoalCardProps) {
  const icon = CATEGORY_ICONS[goal.category] ?? '🎯';
  const progressPercent = (goal.currentLevel / goal.targetLevel) * 100;
  const completedToday =
    goal.lastCompletedAt &&
    new Date(goal.lastCompletedAt).toDateString() === new Date().toDateString();

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(goal.id);
  };

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.titleArea}>
          <Text style={styles.category}>
            {goal.category.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.title}>{goal.title}</Text>
        </View>
        {goal.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {goal.currentStreak}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.levelText}>
          Level {goal.currentLevel}/{goal.targetLevel}
        </Text>
      </View>

      {completedToday ? (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Completed today!</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={isCompleting}
          accessibilityLabel={`Mark ${goal.title} as complete`}
        >
          <Text style={styles.completeButtonText}>
            {isCompleting ? 'Saving...' : 'Mark Complete ✓'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  titleArea: {
    flex: 1,
  },
  category: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  streakBadge: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  streakText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.amberGentle,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    minWidth: 65,
  },
  completeButton: {
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textOnDark,
  },
  completedBadge: {
    backgroundColor: 'rgba(107, 158, 124, 0.12)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.greenMuted,
  },
  completedText: {
    fontSize: Typography.fontSize.md,
    color: Colors.greenMuted,
    fontWeight: '600',
  },
});
