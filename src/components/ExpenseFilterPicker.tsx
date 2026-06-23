import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Category, HouseholdMember } from '../types/models';
import type { ExpenseFilters, ExpensePeriod } from '../utils/expenseFilters';
import { isValidDateInput } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

const PERIODS: Array<{ value: ExpensePeriod; label: string }> = [
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'all', label: 'Todo' },
  { value: 'custom', label: 'Fechas' },
];

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ExpenseFilterPicker({
  categories,
  filters,
  members,
  open,
  onApply,
  onClose,
}: {
  categories: Category[];
  filters: ExpenseFilters;
  members: Record<string, HouseholdMember>;
  open: boolean;
  onApply: (filters: ExpenseFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [filters, open]);

  const apply = () => {
    if (
      draft.period === 'custom' &&
      (!isValidDateInput(draft.startDate) || !isValidDateInput(draft.endDate))
    ) {
      Alert.alert('Fechas no válidas', 'Usa el formato AAAA-MM-DD.');
      return;
    }
    if (draft.period === 'custom' && draft.startDate > draft.endDate) {
      Alert.alert('Rango no válido', 'La fecha inicial debe ser anterior a la fecha final.');
      return;
    }
    if (draft.period === 'month' && !/^\d{4}-\d{2}$/.test(draft.month)) {
      Alert.alert('Mes no válido', 'Usa el formato AAAA-MM.');
      return;
    }
    if (draft.period === 'year' && (draft.year < 1900 || draft.year > 2200)) {
      Alert.alert('Año no válido', 'Introduce un año válido.');
      return;
    }
    onApply(draft);
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Filtrar gastos</Text>
              <Text style={styles.subtitle}>Combina categoría, persona y fechas.</Text>
            </View>
            <Pressable accessibilityLabel="Cerrar filtros" hitSlop={10} onPress={onClose}>
              <Ionicons color={colors.muted} name="close-outline" size={27} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.choices}>
                <Choice
                  label="Todas"
                  onPress={() => setDraft((current) => ({ ...current, categoryId: null }))}
                  selected={!draft.categoryId}
                />
                {categories.map((category) => (
                  <Choice
                    key={category.id}
                    label={category.name}
                    onPress={() =>
                      setDraft((current) => ({ ...current, categoryId: category.id }))
                    }
                    selected={draft.categoryId === category.id}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pagado por</Text>
              <View style={styles.choices}>
                <Choice
                  label="Todas las personas"
                  onPress={() => setDraft((current) => ({ ...current, userId: null }))}
                  selected={!draft.userId}
                />
                {Object.entries(members).map(([id, member]) => (
                  <Choice
                    key={id}
                    label={member.displayName}
                    onPress={() => setDraft((current) => ({ ...current, userId: id }))}
                    selected={draft.userId === id}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Período</Text>
              <View style={styles.choices}>
                {PERIODS.map((period) => (
                  <Choice
                    key={period.value}
                    label={period.label}
                    onPress={() =>
                      setDraft((current) => ({ ...current, period: period.value }))
                    }
                    selected={draft.period === period.value}
                  />
                ))}
              </View>
              {draft.period === 'month' ? (
                <AppInput
                  label="Mes (AAAA-MM)"
                  onChangeText={(month) => setDraft((current) => ({ ...current, month }))}
                  placeholder="2026-06"
                  value={draft.month}
                />
              ) : null}
              {draft.period === 'year' ? (
                <AppInput
                  keyboardType="number-pad"
                  label="Año"
                  onChangeText={(year) =>
                    setDraft((current) => ({
                      ...current,
                      year: Number(year.replace(/\D/g, '')) || 0,
                    }))
                  }
                  placeholder="2026"
                  value={draft.year ? String(draft.year) : ''}
                />
              ) : null}
              {draft.period === 'custom' ? (
                <View style={styles.dateFields}>
                  <AppInput
                    label="Desde (AAAA-MM-DD)"
                    onChangeText={(startDate) =>
                      setDraft((current) => ({ ...current, startDate }))
                    }
                    placeholder="2026-01-01"
                    style={styles.dateInput}
                    value={draft.startDate}
                  />
                  <AppInput
                    label="Hasta (AAAA-MM-DD)"
                    onChangeText={(endDate) =>
                      setDraft((current) => ({ ...current, endDate }))
                    }
                    placeholder="2026-12-31"
                    style={styles.dateInput}
                    value={draft.endDate}
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <AppButton
              label="Limpiar"
              onPress={() =>
                setDraft({
                  ...filters,
                  categoryId: null,
                  userId: null,
                  period: 'all',
                })
              }
              style={styles.action}
              variant="text"
            />
            <AppButton label="Aplicar filtros" onPress={apply} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(19, 30, 26, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    maxHeight: '90%',
    maxWidth: 680,
    padding: spacing.lg,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 13 },
  content: { gap: spacing.lg, paddingBottom: spacing.sm },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: '800' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  choiceTextSelected: { color: colors.white },
  dateFields: { gap: spacing.sm },
  dateInput: { minWidth: 180 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
