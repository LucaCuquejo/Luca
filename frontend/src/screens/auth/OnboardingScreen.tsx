import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '@/store';
import { updateProfile } from '@/store/slices/authSlice';
import { apiClient } from '@/services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { COUNTRIES, getCrisisResource } from '@/constants/crisisResources';
import MoodPicker from '@/components/common/MoodPicker';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const STRUGGLE_OPTIONS = [
  { id: 'relationship', label: 'Relationship / Breakup', emoji: '💔' },
  { id: 'family', label: 'Family Stress', emoji: '👨‍👧' },
  { id: 'career', label: 'Career / Job Loss', emoji: '💼' },
  { id: 'financial', label: 'Financial Pressure', emoji: '💰' },
  { id: 'loneliness', label: 'Loneliness', emoji: '🤝' },
  { id: 'addiction', label: 'Addiction Recovery', emoji: '🌱' },
  { id: 'health', label: 'Health Worries', emoji: '❤️' },
  { id: 'self_esteem', label: 'Self-Esteem', emoji: '🧠' },
  { id: 'purpose', label: 'Lack of Purpose', emoji: '🧭' },
  { id: 'other', label: 'Something Else', emoji: '💭' },
];

const TOTAL_STEPS = 6;

export default function OnboardingScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedStruggles, setSelectedStruggles] = useState<string[]>([]);
  const [initialMood, setInitialMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const toggleStruggle = (id: string) => {
    setSelectedStruggles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else submitOnboarding();
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/users/me/onboarding', {
        display_name: displayName,
        country_code: selectedCountry,
        active_struggles: selectedStruggles,
        initial_mood: initialMood,
        daily_feed_time: '08:00',
      });
      dispatch(
        updateProfile({
          displayName,
          countryCode: selectedCountry,
          activeStruggles: selectedStruggles,
          onboardingCompleted: true,
        })
      );
      navigation.replace('Main');
    } catch {
      setIsSubmitting(false);
    }
  };

  const crisisResource = selectedCountry ? getCrisisResource(selectedCountry) : null;

  const canProceed = () => {
    switch (step) {
      case 1: return displayName.trim().length >= 2;
      case 2: return selectedCountry !== '';
      case 3: return selectedStruggles.length >= 1;
      case 4: return initialMood !== null;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {step > 1 && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Name */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeadline}>What should we call you?</Text>
            <Text style={styles.stepSubtext}>
              This is how you'll appear in the app. It can be your real name or a nickname.
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your name..."
              placeholderTextColor={Colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              maxLength={30}
            />
          </View>
        )}

        {/* Step 2: Country */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeadline}>Where are you based?</Text>
            <Text style={styles.stepSubtext}>
              We use this to connect you with the right crisis resources if you ever need them.
            </Text>

            {crisisResource && (
              <View style={styles.crisisPreview}>
                <Text style={styles.crisisPreviewText}>
                  🛡️ {crisisResource.organization}: {crisisResource.hotlineDisplay} ({crisisResource.availableHours})
                </Text>
              </View>
            )}

            <TextInput
              style={styles.textInput}
              placeholder="Search country..."
              placeholderTextColor={Colors.textMuted}
              value={countrySearch}
              onChangeText={setCountrySearch}
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(c) => c.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry === item.code && styles.countryItemSelected,
                  ]}
                  onPress={() => setSelectedCountry(item.code)}
                >
                  <Text style={styles.countryName}>{item.name}</Text>
                  {selectedCountry === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Step 3: Struggles */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeadline}>What brings you here today?</Text>
            <Text style={styles.stepSubtext}>
              Select everything that feels relevant. There are no wrong answers.
            </Text>
            <View style={styles.strugglesGrid}>
              {STRUGGLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.struggleItem,
                    selectedStruggles.includes(option.id) && styles.struggleItemSelected,
                  ]}
                  onPress={() => toggleStruggle(option.id)}
                >
                  <Text style={styles.struggleEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.struggleLabel,
                      selectedStruggles.includes(option.id) && styles.struggleLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Initial Mood */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeadline}>How are you feeling right now?</Text>
            <Text style={styles.stepSubtext}>
              Be honest — there's no right or wrong answer here.
            </Text>
            <MoodPicker onSelect={setInitialMood} selectedScore={initialMood ?? undefined} />
          </View>
        )}

        {/* Step 5: Safety Commitment */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <Text style={styles.stepHeadline}>A note before we begin</Text>
            <View style={styles.safetyCard}>
              <Text style={styles.safetyText}>
                InnerBrother is a supportive wellbeing tool — not a therapist, and not a substitute for professional care.
              </Text>
              <Text style={styles.safetyText}>
                If you're ever in crisis, we will always connect you to real, human help — your local crisis line is one tap away, from every screen.
              </Text>
              <Text style={styles.safetyText}>
                This is a space to be honest, to reflect, and to take small steps forward.
              </Text>
            </View>
            {crisisResource && (
              <Text style={styles.crisisLineNote}>
                Your crisis line: {crisisResource.organization} — {crisisResource.hotlineDisplay}
              </Text>
            )}
          </View>
        )}

        {/* Step 6: Trial offer */}
        {step === 6 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeadline}>You're all set, {displayName}.</Text>
            <Text style={styles.stepSubtext}>
              Start with 14 days of Premium — free. Cancel anytime.
            </Text>
            <View style={styles.trialCard}>
              <Text style={styles.trialTitle}>Premium — Free for 14 days</Text>
              <View style={styles.trialFeatures}>
                {[
                  'Unlimited AI check-ins',
                  'AI-personalized daily content',
                  'Unlimited active goals',
                  'Advanced mood analytics',
                ].map((f) => (
                  <Text key={f} style={styles.trialFeature}>✓ {f}</Text>
                ))}
              </View>
              <Text style={styles.trialNote}>Then $9.99/month. Cancel anytime.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={goNext}
          disabled={!canProceed() || isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {step === TOTAL_STEPS
              ? isSubmitting
                ? 'Setting up...'
                : "Let's begin"
              : 'Continue'}
          </Text>
        </TouchableOpacity>
        {step === TOTAL_STEPS && (
          <TouchableOpacity onPress={submitOnboarding} style={styles.skipTrialButton}>
            <Text style={styles.skipTrialText}>Skip — start with free plan</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creamLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    paddingRight: Spacing.md,
  },
  backText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.full,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    minWidth: 30,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  stepContent: {
    paddingTop: Spacing.xl,
  },
  stepHeadline: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  stepSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  textInput: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  crisisPreview: {
    backgroundColor: 'rgba(74, 155, 142, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.tealSoft,
  },
  crisisPreviewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.tealSoft,
    textAlign: 'center',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(74, 155, 142, 0.08)',
  },
  countryName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  checkmark: {
    fontSize: Typography.fontSize.md,
    color: Colors.tealSoft,
    fontWeight: '700',
  },
  strugglesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  struggleItem: {
    width: '47%',
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  struggleItemSelected: {
    borderColor: Colors.tealSoft,
    backgroundColor: 'rgba(74, 155, 142, 0.06)',
  },
  struggleEmoji: {
    fontSize: 20,
  },
  struggleLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  struggleLabelSelected: {
    color: Colors.tealSoft,
    fontWeight: '600',
  },
  safetyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  safetyCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  safetyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  crisisLineNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.tealSoft,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  trialCard: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  trialTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textOnDark,
    marginBottom: Spacing.lg,
  },
  trialFeatures: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  trialFeature: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
  },
  trialNote: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  skipTrialButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipTrialText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
