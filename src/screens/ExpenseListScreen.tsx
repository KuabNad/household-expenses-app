import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ExpenseFilterPicker } from '../components/ExpenseFilterPicker';
import { ExpenseRow } from '../components/ExpenseRow';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { ExpensesStackParamList } from '../types/navigation';
import {
  defaultExpenseFilters,
  expenseDateRange,
  filterExpenses,
  type ExpenseFilters,
} from '../utils/expenseFilters';
import { sortExpenses } from '../utils/expenseSort';
import { formatMoney } from '../utils/format';
import { totalsByCurrency } from '../utils/summary';
import { colors, radius, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'ExpenseList'>;

const PERIOD_LABELS = {
  month: 'Mes',
  year: 'Año',
  all: 'Todo el historial',
  custom: 'Fechas',
} as const;

export function ExpenseListScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { household, categories, expenses, syncError } = useHousehold();
  const [filters, setFilters] = useState<ExpenseFilters>(() => defaultExpenseFilters());
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const params = route.params;
    if (!params) return;
    setFilters((current) => ({
      ...current,
      categoryId: params.categoryId ?? null,
      userId: params.userId ?? null,
      period: params.period ?? current.period,
      month: params.month ?? current.month,
      year: params.year ?? current.year,
      startDate: params.startDate ?? current.startDate,
      endDate: params.endDate ?? current.endDate,
    }));
  }, [route.params]);

  const filtered = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters), 'newest'),
    [expenses, filters],
  );
  const totals = useMemo(() => totalsByCurrency(filtered), [filtered]);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const selectedCategory = filters.categoryId
    ? categoryMap.get(filters.categoryId)
    : undefined;
  const selectedMember = filters.userId
    ? household?.members[filters.userId]
    : undefined;
  const range = expenseDateRange(filters);

  const periodLabel =
    filters.period === 'month'
      ? filters.month
      : filters.period === 'year'
        ? String(filters.year)
        : filters.period === 'custom'
          ? `${range.startDate} → ${range.endDate}`
          : PERIOD_LABELS.all;

  return (
    <Screen
      right={
        <Pressable
          accessibilityLabel="Abrir filtros de gastos"
          onPress={() => setFilterOpen(true)}
          style={styles.filterButton}
        >
          <Ionicons color={colors.primary} name="options-outline" size={20} />
          <Text style={styles.filterButtonText}>Filtros</Text>
        </Pressable>
      }
      subtitle="Filtra por categoría, persona y fechas. Pulsa un gasto para editarlo."
      title="Gastos"
    >
      {syncError ? <Notice message={syncError} /> : null}

      <View style={styles.filterSummary}>
        <View style={styles.filterHeading}>
          <View style={styles.filterHeadingText}>
            <Text style={styles.filterTitle}>{filtered.length} gastos encontrados</Text>
            <Text style={styles.filterSubtitle}>
              {selectedCategory?.name ?? 'Todas las categorías'} ·{' '}
              {selectedMember?.displayName ?? 'Todas las personas'} · {periodLabel}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Cambiar filtros"
            onPress={() => setFilterOpen(true)}
            style={styles.changeButton}
          >
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </Pressable>
        </View>
        {Object.entries(totals).length ? (
          <View style={styles.totalRow}>
            {Object.entries(totals).map(([currency, amount]) => (
              <Text key={currency} style={styles.total}>
                {formatMoney(amount ?? 0, currency)}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.chips}>
          {selectedCategory ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedCategory.name}</Text>
            </View>
          ) : null}
          {selectedMember ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedMember.displayName}</Text>
            </View>
          ) : null}
          <View style={styles.chip}>
            <Text style={styles.chipText}>{PERIOD_LABELS[filters.period]}</Text>
          </View>
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          message="Prueba a ampliar las fechas o quitar algún filtro."
          title="No hay gastos con estos filtros"
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((expense) => (
            <ExpenseRow
              category={categoryMap.get(expense.categoryId)}
              expense={expense}
              key={expense.id}
              member={household?.members[expense.paidByUserId]}
              onPress={
                expense.createdBy === user?.uid && !expense.isProjected
                  ? () => navigation.navigate('EditExpense', { expense })
                  : undefined
              }
            />
          ))}
        </View>
      )}

      <ExpenseFilterPicker
        categories={categories}
        filters={filters}
        members={household?.members ?? {}}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
        open={filterOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  filterSummary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  filterHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  filterHeadingText: { flex: 1, gap: 3 },
  filterTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  filterSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  changeButton: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  changeButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  total: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  list: { gap: spacing.sm },
});
