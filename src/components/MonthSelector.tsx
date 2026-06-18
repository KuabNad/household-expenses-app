import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthLabel } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';

export function MonthSelector({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const move = (offset: number) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    onChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <View style={styles.container}>
      <Pressable hitSlop={10} onPress={() => move(-1)}>
        <Ionicons color={colors.primary} name="chevron-back" size={24} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(month)}</Text>
      <Pressable hitSlop={10} onPress={() => move(1)}>
        <Ionicons color={colors.primary} name="chevron-forward" size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { color: colors.text, fontSize: 15, fontWeight: '700', minWidth: 130, textAlign: 'center' },
});
