import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseSort } from '../utils/expenseSort';
import { colors, radius, spacing } from '../utils/theme';

export type { ExpenseSort } from '../utils/expenseSort';

const OPTIONS: Array<{
  value: ExpenseSort;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: 'newest',
    label: 'Más recientes primero',
    description: 'Ordena desde la fecha más nueva.',
    icon: 'arrow-down-outline',
  },
  {
    value: 'oldest',
    label: 'Más antiguos primero',
    description: 'Ordena desde la fecha más antigua.',
    icon: 'arrow-up-outline',
  },
  {
    value: 'highest',
    label: 'Mayor importe primero',
    description: 'Muestra primero los gastos más caros.',
    icon: 'trending-up-outline',
  },
  {
    value: 'lowest',
    label: 'Menor importe primero',
    description: 'Muestra primero los gastos más pequeños.',
    icon: 'trending-down-outline',
  },
];

export function expenseSortLabel(value: ExpenseSort) {
  return OPTIONS.find((option) => option.value === value)?.label ?? OPTIONS[0].label;
}

export function ExpenseSortPicker({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: ExpenseSort;
  onChange: (value: ExpenseSort) => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <Pressable accessibilityLabel="Cerrar orden de gastos" onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Ordenar gastos</Text>
              <Text style={styles.subtitle}>Elige cómo mostrar esta lista.</Text>
            </View>
            <Pressable accessibilityLabel="Cerrar" hitSlop={10} onPress={onClose}>
              <Ionicons color={colors.muted} name="close-outline" size={26} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    onClose();
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={[styles.icon, selected && styles.iconSelected]}>
                    <Ionicons
                      color={selected ? colors.white : colors.primary}
                      name={option.icon}
                      size={20}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {selected ? (
                    <Ionicons color={colors.primary} name="checkmark-circle" size={22} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.note}>
            Con varias monedas, el importe se compara sin convertir divisas.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(19, 30, 26, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.lg,
    maxWidth: 520,
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
  title: { color: colors.text, fontSize: 21, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 13 },
  options: { gap: spacing.sm },
  option: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  optionSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconSelected: { backgroundColor: colors.primary },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  optionDescription: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  note: { color: colors.warning, fontSize: 11, lineHeight: 16 },
});
