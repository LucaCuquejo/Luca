import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const MOOD_EMOJIS = [
  { score: 1, emoji: '😔', label: 'Very low' },
  { score: 3, emoji: '😕', label: 'Low' },
  { score: 5, emoji: '😐', label: 'Okay' },
  { score: 7, emoji: '🙂', label: 'Good' },
  { score: 9, emoji: '😊', label: 'Great' },
];

interface MoodPickerProps {
  onSelect: (score: number) => void;
  selectedScore?: number;
}

export default function MoodPicker({ onSelect, selectedScore }: MoodPickerProps) {
  const [selected, setSelected] = useState<number | undefined>(selectedScore);

  const handleSelect = (score: number) => {
    Haptics.selectionAsync();
    setSelected(score);
    onSelect(score);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>How are you feeling right now?</Text>
      <View style={styles.row}>
        {MOOD_EMOJIS.map((item) => (
          <TouchableOpacity
            key={item.score}
            style={[
              styles.moodItem,
              selected === item.score && styles.moodItemSelected,
            ]}
            onPress={() => handleSelect(item.score)}
            accessibilityLabel={`${item.label} mood, score ${item.score}`}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text
              style={[
                styles.score,
                selected === item.score && styles.scoreSelected,
              ]}
            >
              {item.score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  question: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  moodItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginHorizontal: 2,
  },
  moodItemSelected: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.tealSoft,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  score: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  scoreSelected: {
    color: Colors.tealSoft,
    fontWeight: '600',
  },
});
