import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ExpenseRow } from '../components/ExpenseRow';
import { MonthSelector } from '../components/MonthSelector';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { ExpensesStackParamList } from '../types/navigation';
import { monthKey } from '../utils/format';
import { expensesForMonth } from '../utils/summary';
import { colors, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'ExpenseList'>;

export function ExpenseListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { household, categories, expenses, syncError } = useHousehold();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const filtered = useMemo(
    () => expensesForMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return (
    <Screen subtitle="Pulsa uno de tus gastos para editarlo o eliminarlo." title="Gastos">
      {syncError ? <Notice message={syncError} /> : null}
      <MonthSelector month={selectedMonth} onChange={setSelectedMonth} />
      {filtered.length === 0 ? (
        <EmptyState
          message="No se añadieron gastos durante este mes."
          title="Un mes sin gastos"
        />
      ) : (
        <View style={styles.list}>
          <Text style={styles.count}>{filtered.length} gastos</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  count: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
});
