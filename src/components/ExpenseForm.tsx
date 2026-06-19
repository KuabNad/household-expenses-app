import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  Category,
  Currency,
  ExpenseInput,
  Household,
  RecurrenceFrequency,
} from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { isValidDateInput, toDateInput } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { MiniCalendar } from './MiniCalendar';

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
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    initial?.recurrenceFrequency ?? 'monthly',
  );
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
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
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
        <Pressable onPress={() => setShowDate((value) => !value)} style={styles.dateButton}>
          <Text style={styles.dateText}>{date}</Text>
          <Ionicons color={colors.primary} name="calendar-outline" size={23} />
        </Pressable>
        {showDate ? (
          <MiniCalendar
            onChange={setDate}
            onClose={() => setShowDate(false)}
            value={date}
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

      <View style={styles.recurringCard}>
        <View style={styles.recurringHeading}>
          <View style={styles.recurringText}>
            <Text style={styles.recurringTitle}>Gasto recurrente / suscripción</Text>
            <Text style={styles.recurringDescription}>
              Se repetirá automáticamente en los resúmenes futuros.
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isRecurring }}
            onPress={() => setIsRecurring((value) => !value)}
            style={[styles.switchTrack, isRecurring && styles.switchTrackActive]}
          >
            <View style={[styles.switchThumb, isRecurring && styles.switchThumbActive]} />
          </Pressable>
        </View>
        {isRecurring ? (
          <View style={styles.field}>
            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.choices}>
              <Choice
                label="Mensual"
                onPress={() => setRecurrenceFrequency('monthly')}
                selected={recurrenceFrequency === 'monthly'}
              />
              <Choice
                label="Anual"
                onPress={() => setRecurrenceFrequency('yearly')}
                selected={recurrenceFrequency === 'yearly'}
              />
            </View>
          </View>
        ) : null}
      </View>

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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  dateText: { color: colors.text, fontSize: 16 },
  recurringCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  recurringHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  recurringText: { flex: 1, gap: 3 },
  recurringTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  recurringDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  switchTrack: {
    backgroundColor: colors.border,
    borderRadius: 16,
    height: 30,
    justifyContent: 'center',
    padding: 3,
    width: 52,
  },
  switchTrackActive: { backgroundColor: colors.primary },
  switchThumb: {
    backgroundColor: colors.white,
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  error: { color: colors.danger, fontSize: 14 },
});
