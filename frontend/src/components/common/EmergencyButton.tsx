import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { triggerManualSOS, initiateHotlineCall } from '@/services/crisis';
import { useAppSelector } from '@/store';

export default function EmergencyButton() {
  const crisisResource = useAppSelector((state) => state.auth.user?.crisisResource);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    triggerManualSOS();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            `📞 Call ${crisisResource?.hotlineDisplay ?? 'Crisis Line'}`,
            '🆘 Open Crisis Resources',
            'Cancel',
          ],
          cancelButtonIndex: 2,
          destructiveButtonIndex: 0,
          title: 'Quick Crisis Access',
        },
        (buttonIndex) => {
          if (buttonIndex === 0 && crisisResource) {
            initiateHotlineCall('manual', crisisResource.hotlineNumber);
          } else if (buttonIndex === 1) {
            triggerManualSOS();
          }
        }
      );
    } else {
      Alert.alert('Crisis Support', 'Get help right now', [
        {
          text: `📞 Call ${crisisResource?.hotlineDisplay ?? 'Crisis Line'}`,
          onPress: () => {
            if (crisisResource) {
              initiateHotlineCall('manual', crisisResource.hotlineNumber);
            }
          },
        },
        {
          text: '🆘 Open Crisis Resources',
          onPress: triggerManualSOS,
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      accessibilityLabel="Emergency support button. Tap for crisis resources. Long press for quick call options."
      accessibilityRole="button"
    >
      <Text style={styles.icon}>🆘</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(192, 57, 43, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 57, 43, 0.25)',
  },
  icon: {
    fontSize: 18,
  },
});
