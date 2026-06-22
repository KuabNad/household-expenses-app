import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ExpenseRow } from '../components/ExpenseRow';
import { InteractivePieChart } from '../components/InteractivePieChart';
import { MonthSelector } from '../components/MonthSelector';
import { MonthlyMemberFinances } from '../components/MonthlyMemberFinances';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { SummaryBars } from '../components/SummaryBars';
import { YearSpendingCalendar } from '../components/YearSpendingCalendar';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';
import { isLocalMode } from '../services/runtime';
import { formatMoney, monthKey, toDateInput } from '../utils/format';
import {
  expensesForMonth,
  expensesForYearToDate,
  monthlySpendingForYear,
  spendingByCategory,
  spendingByPayer,
  totalsByCurrency,
} from '../utils/summary';
import { colors, radius, spacing } from '../utils/theme';

export function DashboardScreen() {
  const { user } = useAuth();
  const {
    household,
    categories,
    expenses,
    monthlyIncomes,
    saveMonthlyIncome,
    syncError,
  } = useHousehold();
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const todayKey = toDateInput(today);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(today));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const changeMonth = (month: string) => {
    setSelectedMonth(month);
    setSelectedCategoryId(null);
  };
  const monthlyExpenses = useMemo(
    () => expensesForMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const categoryTotals = useMemo(
    () => spendingByCategory(monthlyExpenses, categories),
    [categories, monthlyExpenses],
  );
  const visibleExpenses = useMemo(
    () =>
      selectedCategoryId
        ? monthlyExpenses.filter((expense) => expense.categoryId === selectedCategoryId)
        : monthlyExpenses,
    [monthlyExpenses, selectedCategoryId],
  );
  const visibleTotals = useMemo(() => totalsByCurrency(visibleExpenses), [visibleExpenses]);
  const payerTotals = useMemo(
    () => spendingByPayer(visibleExpenses, household?.members ?? {}),
    [household?.members, visibleExpenses],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const recurringMonthlyExpenses = useMemo(
    () => monthlyExpenses.filter((expense) => expense.isRecurring),
    [monthlyExpenses],
  );
  const recurringTotals = useMemo(
    () => totalsByCurrency(recurringMonthlyExpenses),
    [recurringMonthlyExpenses],
  );
  const yearMonths = useMemo(
    () => monthlySpendingForYear(expenses, currentYear, todayKey),
    [currentYear, expenses, todayKey],
  );
  const yearToDateExpenses = useMemo(
    () => expensesForYearToDate(expenses, currentYear, todayKey),
    [currentYear, expenses, todayKey],
  );
  const yearCategoryTotals = useMemo(
    () => spendingByCategory(yearToDateExpenses, categories),
    [categories, yearToDateExpenses],
  );

  return (
    <Screen
      subtitle={household ? household.name : 'Resumen compartido del hogar'}
      title="Resumen"
    >
      {syncError ? <Notice message={syncError} /> : null}
      <MonthSelector month={selectedMonth} onChange={changeMonth} />
      <YearSpendingCalendar
        months={yearMonths}
        onSelect={changeMonth}
        selectedMonth={selectedMonth}
        year={currentYear}
      />

      <View style={styles.totalCard}>
        <Text style={styles.eyebrow}>
          {selectedCategoryId ? 'TOTAL DE LA CATEGORÍA' : 'GASTO TOTAL'}
        </Text>
        {Object.entries(visibleTotals).length ? (
          Object.entries(visibleTotals).map(([currency, amount]) => (
            <Text key={currency} style={styles.total}>
              {formatMoney(amount ?? 0, currency)}
            </Text>
          ))
        ) : (
          <Text style={styles.total}>—</Text>
        )}
        <Text style={styles.totalHint}>
          Los totales se muestran por separado cuando se utilizan varias monedas.
        </Text>
      </View>
      {household ? (
        <MonthlyMemberFinances
          currentUserId={user?.uid}
          expenses={monthlyExpenses}
          incomes={monthlyIncomes}
          members={household.members}
          month={selectedMonth}
          canEditAllMembers={isLocalMode}
          onSave={(amount, currency, userId) =>
            saveMonthlyIncome(selectedMonth, amount, currency, userId)
          }
        />
      ) : null}

      {monthlyExpenses.length === 0 ? (
        <EmptyState
          message="Añade el primer gasto y aquí aparecerá el resumen mensual."
          title="Todavía no hay datos"
        />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Gastos por categoría</Text>
            <InteractivePieChart
              items={categoryTotals}
              onSelect={setSelectedCategoryId}
              selectedCategoryId={selectedCategoryId}
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {selectedCategoryId ? 'Quién pagó en esta categoría' : 'Quién pagó'}
            </Text>
            <SummaryBars items={payerTotals} />
          </View>
          {recurringMonthlyExpenses.length ? (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionTitleWrap}>
                  <Text style={styles.subscriptionEyebrow}>SUSCRIPCIONES Y RECURRENTES</Text>
                  <Text style={styles.subscriptionSubtitle}>
                    Gastos que se repiten durante este mes
                  </Text>
                </View>
                <View>
                  {Object.entries(recurringTotals).map(([currency, amount]) => (
                    <Text key={currency} style={styles.subscriptionTotal}>
                      {formatMoney(amount ?? 0, currency)}
                    </Text>
                  ))}
                </View>
              </View>
              {recurringMonthlyExpenses.map((expense) => (
                <ExpenseRow
                  category={categoryMap.get(expense.categoryId)}
                  expense={expense}
                  key={`recurring-${expense.id}`}
                  member={household?.members[expense.paidByUserId]}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategoryId ? 'Gastos de la categoría' : 'Gastos recientes'}
            </Text>
            {visibleExpenses.slice(0, 5).map((expense) => (
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
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gastos por categoría · {currentYear} hasta hoy</Text>
        <Text style={styles.sectionHint}>
          Incluye todos los meses transcurridos del año y separa las monedas.
        </Text>
        {yearCategoryTotals.length ? (
          <SummaryBars items={yearCategoryTotals} />
        ) : (
          <Text style={styles.emptyHint}>Todavía no hay gastos este año.</Text>
        )}
      </View>
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
  sectionHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  emptyHint: { color: colors.muted, fontSize: 14 },
  subscriptionCard: {
    backgroundColor: '#E8F0EC',
    borderColor: '#C5D8CF',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  subscriptionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  subscriptionTitleWrap: { flex: 1, gap: 3 },
  subscriptionEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subscriptionSubtitle: { color: colors.muted, fontSize: 12 },
  subscriptionTotal: { color: colors.primary, fontSize: 17, fontWeight: '900', textAlign: 'right' },
});
