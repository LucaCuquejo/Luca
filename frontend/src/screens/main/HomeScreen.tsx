import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { logMood } from '@/store/slices/moodSlice';
import { loadGoals } from '@/store/slices/goalsSlice';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import EmergencyButton from '@/components/common/EmergencyButton';
import MoodPicker from '@/components/common/MoodPicker';
import { apiClient } from '@/services/api';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isPremium: boolean;
}

export default function HomeScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const goals = useAppSelector((state) => state.goals.goals);
  const todayScore = useAppSelector((state) => state.mood.todayScore);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.profile?.displayName ?? 'there';
  const activeGoals = goals.filter((g) => g.isActive).slice(0, 2);

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const loadFeed = async () => {
    try {
      const response = await apiClient.get('/feed/today');
      setFeedItems(response.data.items);
    } catch {
      // Use placeholder content if API fails
      setFeedItems([
        {
          id: '1',
          type: 'morning_message',
          title: 'Today's Thought',
          body: 'Every step forward, no matter how small, is still progress.',
          isPremium: false,
        },
        {
          id: '2',
          type: 'reflection',
          title: 'Reflection Prompt',
          body: 'What's one thing you can control today?',
          isPremium: false,
        },
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFeed(), dispatch(loadGoals())]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadFeed();
    dispatch(loadGoals());
  }, [dispatch]);

  const handleMoodSelect = (score: number) => {
    dispatch(logMood({ score, source: 'home_checkin' }));
  };

  const feedTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      morning_message: '🌅',
      reflection: '💭',
      exercise: '🧘',
      reach_out: '🤝',
      victory: '🏆',
    };
    return icons[type] ?? '✨';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getDayGreeting()}, {displayName}</Text>
          <Text style={styles.date}>{getDayName()}</Text>
        </View>
        <EmergencyButton />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Check */}
        {!todayScore && (
          <View style={[styles.card, Shadows.sm]}>
            <MoodPicker onSelect={handleMoodSelect} />
          </View>
        )}
        {todayScore && (
          <View style={[styles.moodCompletedCard, Shadows.sm]}>
            <Text style={styles.moodCompletedText}>
              Today's mood logged: {todayScore}/10
            </Text>
          </View>
        )}

        {/* Daily Feed */}
        <Text style={styles.sectionTitle}>TODAY FOR YOU</Text>
        {feedItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.feedCard, Shadows.sm]}
            onPress={() => apiClient.post(`/feed/${item.id}/open`).catch(() => {})}
            activeOpacity={0.8}
          >
            <Text style={styles.feedIcon}>{feedTypeIcon(item.type)}</Text>
            <View style={styles.feedContent}>
              <Text style={styles.feedTitle}>{item.title}</Text>
              <Text style={styles.feedBody} numberOfLines={3}>
                {item.body}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TODAY'S GOALS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {activeGoals.map((goal) => {
              const completedToday =
                goal.lastCompletedAt &&
                new Date(goal.lastCompletedAt).toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalMini, Shadows.sm, completedToday && styles.goalMiniDone]}
                  onPress={() => navigation.navigate('Goals')}
                >
                  <View style={styles.goalMiniLeft}>
                    <Text style={styles.goalMiniTitle}>{goal.title}</Text>
                    {goal.currentStreak > 0 && (
                      <Text style={styles.goalMiniStreak}>🔥 {goal.currentStreak}-day streak</Text>
                    )}
                  </View>
                  <Text style={styles.goalMiniCheck}>
                    {completedToday ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Chat CTA */}
        <TouchableOpacity
          style={[styles.chatCTA, Shadows.md]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.chatCTAIcon}>💬</Text>
          <View style={styles.chatCTAText}>
            <Text style={styles.chatCTATitle}>Start your daily check-in</Text>
            <Text style={styles.chatCTASubtext}>Talk about what's on your mind</Text>
          </View>
          <Text style={styles.chatCTAArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.navyDeep,
    paddingTop: Spacing['3xl'],
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  moodCompletedCard: {
    backgroundColor: 'rgba(74, 155, 142, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.tealSoft,
    alignItems: 'center',
  },
  moodCompletedText: {
    fontSize: Typography.fontSize.md,
    color: Colors.tealSoft,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    color: Colors.tealSoft,
  },
  feedCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  feedIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  feedContent: {
    flex: 1,
  },
  feedTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  feedBody: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  goalMini: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalMiniDone: {
    backgroundColor: 'rgba(107, 158, 124, 0.08)',
  },
  goalMiniLeft: {
    flex: 1,
  },
  goalMiniTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalMiniStreak: {
    fontSize: Typography.fontSize.sm,
    color: Colors.amberGentle,
    marginTop: 2,
  },
  goalMiniCheck: {
    fontSize: Typography.fontSize.xl,
    color: Colors.greenMuted,
    fontWeight: '700',
  },
  chatCTA: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  chatCTAIcon: {
    fontSize: 28,
  },
  chatCTAText: {
    flex: 1,
  },
  chatCTATitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  chatCTASubtext: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  chatCTAArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.tealSoft,
    fontWeight: '700',
  },
});
