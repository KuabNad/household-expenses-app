import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ExpenseRow } from '../components/ExpenseRow';
import { MonthSelector } from '../components/MonthSelector';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { SummaryBars } from '../components/SummaryBars';
import { useHousehold } from '../hooks/useHousehold';
import { formatMoney, monthKey } from '../utils/format';
import {
  expensesForMonth,
  spendingByCategory,
  spendingByPayer,
  totalsByCurrency,
} from '../utils/summary';
import { colors, radius, spacing } from '../utils/theme';

export function DashboardScreen() {
  const { household, categories, expenses, syncError } = useHousehold();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const monthlyExpenses = useMemo(
    () => expensesForMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const totals = useMemo(() => totalsByCurrency(monthlyExpenses), [monthlyExpenses]);
  const categoryTotals = useMemo(
    () => spendingByCategory(monthlyExpenses, categories),
    [categories, monthlyExpenses],
  );
  const payerTotals = useMemo(
    () => spendingByPayer(monthlyExpenses, household?.members ?? {}),
    [household?.members, monthlyExpenses],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return (
    <Screen
      subtitle={household ? household.name : 'Your shared household overview'}
      title="Dashboard"
    >
      {syncError ? <Notice message={syncError} /> : null}
      <MonthSelector month={selectedMonth} onChange={setSelectedMonth} />

      <View style={styles.totalCard}>
        <Text style={styles.eyebrow}>TOTAL SPENDING</Text>
        {Object.entries(totals).length ? (
          Object.entries(totals).map(([currency, amount]) => (
            <Text key={currency} style={styles.total}>
              {formatMoney(amount ?? 0, currency)}
            </Text>
          ))
        ) : (
          <Text style={styles.total}>—</Text>
        )}
        <Text style={styles.totalHint}>
          Totals stay separate when the household uses multiple currencies.
        </Text>
      </View>

      {monthlyExpenses.length === 0 ? (
        <EmptyState
          message="Add the first expense and the monthly picture will appear here."
          title="Nothing to summarize yet"
        />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>By category</Text>
            <SummaryBars items={categoryTotals} />
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Who paid</Text>
            <SummaryBars items={payerTotals} />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
            {monthlyExpenses.slice(0, 5).map((expense) => (
              <ExpenseRow
                category={categoryMap.get(expense.categoryId)}
                expense={expense}
                key={expense.id}
                member={household?.members[expense.paidByUserId]}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  eyebrow: { color: '#CDE0D8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  total: { color: colors.white, fontSize: 33, fontWeight: '900', letterSpacing: -0.8 },
  totalHint: { color: '#CDE0D8', fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
