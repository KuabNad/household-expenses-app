import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  Currency,
  Expense,
  HouseholdMember,
  MonthlyIncome,
} from '../types/models';
import { formatMoney } from '../utils/format';
import { monthlyFinancesByMember } from '../utils/summary';
import { colors, radius, spacing } from '../utils/theme';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'PLN', 'CAD', 'AUD'];

export function MonthlyMemberFinances({
  currentUserId,
  expenses,
  incomes,
  members,
  month,
  onSave,
}: {
  currentUserId?: string;
  expenses: Expense[];
  incomes: MonthlyIncome[];
  members: Record<string, HouseholdMember>;
  month: string;
  onSave: (amount: number, currency: Currency) => Promise<void>;
}) {
  const ownIncome = incomes.find(
    (income) => income.month === month && income.userId === currentUserId,
  );
  const [amount, setAmount] = useState(ownIncome ? String(ownIncome.amount) : '');
  const [currency, setCurrency] = useState<Currency>(ownIncome?.currency ?? 'EUR');
  const [editing, setEditing] = useState(!ownIncome);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAmount(ownIncome ? String(ownIncome.amount) : '');
    setCurrency(ownIncome?.currency ?? 'EUR');
    setEditing(!ownIncome);
    setMessage('');
  }, [month, ownIncome?.amount, ownIncome?.currency]);

  const memberSummaries = useMemo(
    () => monthlyFinancesByMember(expenses, incomes, members, month),
    [expenses, incomes, members, month],
  );

  const submit = async () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setMessage('Introduce un ingreso válido.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      await onSave(parsed, currency);
      setEditing(false);
      setMessage('Ingreso mensual guardado.');
    } catch {
      setMessage('No se pudo guardar el ingreso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.title}>Total mensual, gastos y ahorro por persona</Text>
          <Text style={styles.subtitle}>
            Cada persona añade su ingreso. El ahorro se calcula como ingreso menos gastos pagados.
          </Text>
        </View>
        {!editing ? (
          <AppButton
            label="Editar mi ingreso"
            onPress={() => setEditing(true)}
            style={styles.editButton}
            variant="secondary"
          />
        ) : null}
      </View>

      {editing ? (
        <View style={styles.editor}>
          <AppInput
            keyboardType="decimal-pad"
            label="Mi ingreso mensual"
            onChangeText={setAmount}
            placeholder="0.00"
            value={amount}
          />
          <View style={styles.currencyRow}>
            {CURRENCIES.map((item) => (
              <AppButton
                key={item}
                label={item}
                onPress={() => setCurrency(item)}
                style={styles.currencyButton}
                variant={currency === item ? 'primary' : 'secondary'}
              />
            ))}
          </View>
          <AppButton label="Guardar mi ingreso" loading={loading} onPress={submit} />
        </View>
      ) : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.memberList}>
        {memberSummaries.map(({ userId, member, lines }) => (
          <View key={userId} style={styles.memberCard}>
            <Text style={styles.memberName}>
              {member.displayName}
              {userId === currentUserId ? ' · Tú' : ''}
            </Text>
            {lines.length ? (
              lines.map((line) => (
                  <View key={line.currency} style={styles.currencySummary}>
                    <Text style={styles.currencyLabel}>{line.currency}</Text>
                    <View style={styles.metricRow}>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Ingreso total</Text>
                        <Text style={styles.metricValue}>
                          {formatMoney(line.income, line.currency)}
                        </Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Gastos</Text>
                        <Text style={styles.metricValue}>
                          {formatMoney(line.expenses, line.currency)}
                        </Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Ahorro</Text>
                        <Text
                          style={[
                            styles.metricValue,
                            line.savings < 0 ? styles.negative : styles.positive,
                          ]}
                        >
                          {formatMoney(line.savings, line.currency)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
            ) : (
              <Text style={styles.noData}>Todavía no hay ingresos ni gastos este mes.</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headingText: { flex: 1, gap: 3, minWidth: 220 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  editButton: { minHeight: 40 },
  editor: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  currencyButton: { minHeight: 38, paddingHorizontal: spacing.sm },
  message: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  memberList: { gap: spacing.sm },
  memberCard: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  memberName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  currencySummary: { gap: spacing.xs },
  currencyLabel: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, gap: 2 },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  metricValue: { color: colors.text, fontSize: 13, fontWeight: '800' },
  positive: { color: colors.primary },
  negative: { color: colors.danger },
  noData: { color: colors.muted, fontSize: 13 },
});
