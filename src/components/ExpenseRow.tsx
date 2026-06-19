import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Category, Expense, HouseholdMember } from '../types/models';
import { formatDate, formatMoney } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';

export function ExpenseRow({
  expense,
  category,
  member,
  onPress,
}: {
  expense: Expense;
  category?: Category;
  member?: HouseholdMember;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: `${category?.color ?? '#777E7B'}22` }]}>
        <Ionicons
          color={category?.color ?? colors.muted}
          name={(category?.icon as keyof typeof Ionicons.glyphMap) ?? 'receipt-outline'}
          size={21}
        />
      </View>
      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.description}>
          {expense.description || category?.name || 'Gasto'}
        </Text>
        <Text style={styles.meta}>
          {category?.name ?? 'Categoría eliminada'} · {formatDate(expense.date)}
        </Text>
        <Text style={styles.meta}>Pagado por {member?.displayName ?? 'Miembro desconocido'}</Text>
      </View>
      <Text style={styles.amount}>{formatMoney(expense.amount, expense.currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { opacity: 0.72 },
  icon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  details: { flex: 1, gap: 2 },
  description: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12 },
  amount: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
