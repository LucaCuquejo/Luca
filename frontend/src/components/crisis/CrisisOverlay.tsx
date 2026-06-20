import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAppSelector } from '@/store';
import {
  initiateHotlineCall,
  notifyEmergencyContact,
  dismissCrisisOverlay,
} from '@/services/crisis';

export default function CrisisOverlay() {
  const { isActive, eventId, resource, contactNotified } = useAppSelector(
    (state) => state.crisis
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Breathing pulse animation on call button
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, pulseAnim]);

  if (!isActive || !resource || !eventId) return null;

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    initiateHotlineCall(eventId, resource.hotlineNumber);
  };

  const handleContactAlert = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    notifyEmergencyContact(eventId);
  };

  const handleDismiss = () => {
    dismissCrisisOverlay(eventId);
  };

  return (
    <Modal
      visible={isActive}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}} // Prevent hardware back button dismissal
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heartIcon}>♥</Text>

          <Text style={styles.headline}>We're right here with you.</Text>

          <Text style={styles.body}>
            It sounds like things are really hard right now.{'\n'}
            That matters. Real support is available — right now, for you.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.resourceLabel}>{resource.organization}</Text>
          <Text style={styles.hours}>{resource.availableHours} • Free • Confidential</Text>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.85}>
              <Text style={styles.callIcon}>📞</Text>
              <View>
                <Text style={styles.callNumber}>{resource.hotlineDisplay}</Text>
                <Text style={styles.callSubtext}>TAP TO CALL NOW</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.callNote}>
            You don't have to explain everything.{'\n'}
            Just say "I need someone to talk to."
          </Text>

          <View style={styles.divider} />

          {!contactNotified && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContactAlert}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>🔔  Let my emergency contact know</Text>
            </TouchableOpacity>
          )}

          {contactNotified && (
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>✓ Your contact has been notified</Text>
            </View>
          )}

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss} activeOpacity={0.6}>
            <Text style={styles.dismissText}>I'm okay right now — return to app</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            InnerBrother will check in with you soon.{'\n'}You are not alone.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navyDeep,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
  },
  heartIcon: {
    fontSize: 48,
    marginBottom: Spacing.xl,
    color: Colors.tealSoft,
  },
  headline: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.textOnDark,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  body: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: Spacing.xl,
  },
  resourceLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textOnDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  hours: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tealSoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.lg,
    minWidth: 260,
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 28,
  },
  callNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.textOnDark,
  },
  callSubtext: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  callNote: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnDark,
    textAlign: 'center',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(107, 158, 124, 0.3)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  confirmedText: {
    fontSize: Typography.fontSize.md,
    color: Colors.greenMuted,
    textAlign: 'center',
  },
  spacer: {
    height: Spacing['3xl'],
  },
  dismissButton: {
    paddingVertical: Spacing.md,
  },
  dismissText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 20,
  },
});
