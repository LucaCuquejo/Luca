import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadGoals, completeGoal, clearLastCompletion, addGoal, loadTemplates } from '@/store/slices/goalsSlice';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import EmergencyButton from '@/components/common/EmergencyButton';
import GoalCard from '@/components/common/GoalCard';

const CATEGORIES = [
  { id: 'exercise', label: 'Exercise', emoji: '🚶' },
  { id: 'smoking', label: 'Quit Smoking', emoji: '🚭' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'mental_wellbeing', label: 'Mental Wellbeing', emoji: '📝' },
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'custom', label: 'Custom', emoji: '🎯' },
];

export default function GoalsScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { goals, templates, isLoading, lastCompletion } = useAppSelector((s) => s.goals);
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeGoals = goals.filter((g) => g.isActive);

  useEffect(() => {
    dispatch(loadGoals());
  }, [dispatch]);

  useEffect(() => {
    if (lastCompletion) {
      Alert.alert(
        lastCompletion.levelUp ? '🎉 Level Up!' : '✓ Goal Complete!',
        `${lastCompletion.celebrationMessage}\n\n+${lastCompletion.xpEarned} XP earned`,
        [{ text: 'Amazing!', onPress: () => dispatch(clearLastCompletion()) }]
      );
    }
  }, [lastCompletion, dispatch]);

  const handleComplete = async (goalId: string) => {
    setCompletingGoalId(goalId);
    await dispatch(completeGoal({ goalId }));
    setCompletingGoalId(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    dispatch(loadTemplates(categoryId));
  };

  const handleAddFromTemplate = (templateId: string, title: string, category: string) => {
    dispatch(addGoal({ templateId, title, category }));
    setAddModalVisible(false);
    setSelectedCategory(null);
  };

  const totalCompletionsThisWeek = activeGoals.filter((g) => {
    if (!g.lastCompletedAt) return false;
    const lastDate = new Date(g.lastCompletedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastDate >= weekAgo;
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <EmergencyButton />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Weekly summary */}
        <View style={[styles.summaryCard, Shadows.sm]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalCompletionsThisWeek}</Text>
              <Text style={styles.summaryLabel}>Completions this week</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{activeGoals.length}</Text>
              <Text style={styles.summaryLabel}>Active goals</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.max(...activeGoals.map((g) => g.currentStreak), 0)}
              </Text>
              <Text style={styles.summaryLabel}>Best streak</Text>
            </View>
          </View>
        </View>

        {/* Active Goals */}
        <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>

        {activeGoals.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Add your first micro-goal and start building confidence through small wins.
            </Text>
          </View>
        )}

        {activeGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onComplete={handleComplete}
            isCompleting={completingGoalId === goal.id}
          />
        ))}

        <TouchableOpacity
          style={[styles.addButton, Shadows.sm]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Goal</Text>
        </TouchableOpacity>

        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            💙 Small steps, every day. That's how mountains are climbed.
          </Text>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setAddModalVisible(false); setSelectedCategory(null); }}>
              <Text style={styles.modalClose}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add a Goal</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {!selectedCategory ? (
              <>
                <Text style={styles.modalSubtitle}>Choose a category to get started</Text>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryOption}
                    onPress={() => handleCategorySelect(cat.id)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={styles.categoryArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  style={styles.backLink}
                >
                  <Text style={styles.backLinkText}>← Back to categories</Text>
                </TouchableOpacity>
                <Text style={styles.modalSubtitle}>Select a starting goal</Text>
                <Text style={styles.levelNote}>
                  Start at Level 1 and level up as you build the habit.
                </Text>
                {templates
                  .filter((t) => t.category === selectedCategory)
                  .map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateOption}
                      onPress={() =>
                        handleAddFromTemplate(template.id, template.title, template.category)
                      }
                    >
                      <View style={styles.templateLeft}>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>L{template.level}</Text>
                        </View>
                        <View>
                          <Text style={styles.templateTitle}>{template.title}</Text>
                          <Text style={styles.templateDesc}>{template.description}</Text>
                        </View>
                      </View>
                      <Text style={styles.xpBadge}>+{template.xpReward} XP</Text>
                    </TouchableOpacity>
                  ))}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creamLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.navyDeep,
    paddingTop: Spacing['3xl'],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  summaryCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.navyDeep,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.lg,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.tealSoft,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  addButtonIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.tealSoft,
    fontWeight: '700',
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.tealSoft,
    fontWeight: '600',
  },
  encouragement: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  encouragementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.creamLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardWhite,
  },
  modalClose: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: Spacing.xl,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  categoryArrow: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textMuted,
  },
  backLink: {
    marginBottom: Spacing.xl,
  },
  backLinkText: {
    fontSize: Typography.fontSize.md,
    color: Colors.tealSoft,
  },
  levelNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  templateLeft: {
    flexDirection: 'row',
    gap: Spacing.md,
    flex: 1,
    alignItems: 'flex-start',
  },
  levelBadge: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.sm,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.tealSoft,
  },
  templateTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  templateDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    fontSize: Typography.fontSize.sm,
    color: Colors.amberGentle,
    fontWeight: '600',
  },
});
