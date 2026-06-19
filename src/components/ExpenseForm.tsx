import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Category, Currency, ExpenseInput, Household } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { isValidDateInput, toDateInput } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'PLN', 'CAD', 'AUD'];

interface ExpenseFormProps {
  categories: Category[];
  household: Household;
  initial?: ExpenseInput;
  submitLabel: string;
  loading: boolean;
  onSubmit: (input: ExpenseInput) => void;
}

function Choice({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        selected && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary },
      ]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ExpenseForm({
  categories,
  household,
  initial,
  submitLabel,
  loading,
  onSubmit,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'EUR');
  const [date, setDate] = useState(initial?.date ?? toDateInput(new Date()));
  const [showDate, setShowDate] = useState(false);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [paidByUserId, setPaidByUserId] = useState(
    initial?.paidByUserId ?? user?.uid ?? household.createdBy,
  );
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? '');
  const [error, setError] = useState('');

  const members = useMemo(() => Object.entries(household.members), [household.members]);

  const submit = () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Introduce un importe mayor que cero.');
      return;
    }
    if (!isValidDateInput(date)) {
      setError('Introduce una fecha válida.');
      return;
    }
    if (!categoryId) {
      setError('Selecciona una categoría.');
      return;
    }
    if (!paidByUserId) {
      setError('Selecciona quién pagó.');
      return;
    }
    setError('');
    onSubmit({
      amount: Math.round(parsedAmount * 100) / 100,
      currency,
      date,
      categoryId,
      description,
      paidByUserId,
      paymentMethod,
    });
  };

  return (
    <View style={styles.form}>
      <View style={styles.amountRow}>
        <View style={styles.amount}>
          <AppInput
            keyboardType="decimal-pad"
            label="Importe"
            onChangeText={setAmount}
            placeholder="0.00"
            value={amount}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Moneda</Text>
        <View style={styles.choices}>
          {CURRENCIES.map((item) => (
            <Choice
              key={item}
              label={item}
              onPress={() => setCurrency(item)}
              selected={currency === item}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fecha</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            accessibilityLabel="Fecha"
            onChangeText={setDate}
            style={styles.dateButton}
            value={date}
            {...({ type: 'date', max: toDateInput(new Date()) } as object)}
          />
        ) : (
          <Pressable onPress={() => setShowDate((value) => !value)} style={styles.dateButton}>
            <Text style={styles.dateText}>{date}</Text>
          </Pressable>
        )}
        {showDate && Platform.OS !== 'web' ? (
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            mode="date"
            onChange={(_, selected) => {
              if (Platform.OS !== 'ios') setShowDate(false);
              if (selected) setDate(toDateInput(selected));
            }}
            value={new Date(`${date}T12:00:00`)}
          />
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.choices}>
          {categories.map((category) => (
            <Choice
              color={category.color}
              key={category.id}
              label={category.name}
              onPress={() => setCategoryId(category.id)}
              selected={categoryId === category.id}
            />
          ))}
        </View>
      </View>

      <AppInput
        label="Descripción / nota"
        multiline
        onChangeText={setDescription}
        placeholder="Compra semanal"
        value={description}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Pagado por</Text>
        <View style={styles.choices}>
          {members.map(([id, member]) => (
            <Choice
              key={id}
              label={member.displayName}
              onPress={() => setPaidByUserId(id)}
              selected={paidByUserId === id}
            />
          ))}
        </View>
      </View>

      <AppInput
        label="Método de pago (opcional)"
        onChangeText={setPaymentMethod}
        placeholder="Tarjeta, efectivo, transferencia"
        value={paymentMethod}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label={submitLabel} loading={loading} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  amountRow: { flexDirection: 'row', gap: spacing.md },
  amount: { flex: 1 },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  choiceText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  choiceSelected: { color: colors.white },
  dateButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  dateText: { color: colors.text, fontSize: 16 },
  error: { color: colors.danger, fontSize: 14 },
});
