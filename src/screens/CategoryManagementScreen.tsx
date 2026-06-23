import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { Category } from '../types/models';
import { CATEGORY_COLORS, strongerCategoryColor } from '../utils/categoryColors';
import { colors, radius, spacing } from '../utils/theme';

export function CategoryManagementScreen() {
  const { categories, expenses, addCategory, updateCategory, deleteCategory, syncError } =
    useHousehold();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const reset = () => {
    setEditing(null);
    setName('');
    setColor(CATEGORY_COLORS[0]);
  };

  const submit = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Nombre necesario', 'Introduce al menos 2 caracteres.');
      return;
    }
    try {
      setLoading(true);
      if (editing) await updateCategory(editing, name, color);
      else await addCategory(name, color);
      reset();
    } catch (error) {
      Alert.alert('No se pudo guardar la categoría', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const edit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setColor(strongerCategoryColor(category.color));
  };

  const remove = async (expenseAction?: 'delete-expenses' | 'move-to-other') => {
    if (!pendingDelete) return;
    try {
      setLoading(true);
      await deleteCategory(pendingDelete, expenseAction);
      setPendingDelete(null);
    } catch (error) {
      Alert.alert('No se pudo eliminar la categoría', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const pendingExpenseCount = pendingDelete
    ? expenses.filter((expense) => expense.categoryId === pendingDelete.id).length
    : 0;

  return (
    <Screen
      subtitle="Puedes renombrar todas las categorías. Solo se pueden eliminar las personalizadas."
      title="Categorías"
    >
      {syncError ? <Notice message={syncError} /> : null}
      <View style={styles.form}>
        <Text style={styles.formTitle}>{editing ? 'Editar categoría' : 'Nueva categoría'}</Text>
        <AppInput label="Nombre" onChangeText={setName} placeholder="Mascotas" value={name} />
        <View style={styles.colors}>
          {CATEGORY_COLORS.map((item) => (
            <Pressable
              accessibilityLabel={`Usar color ${item}`}
              key={item}
              onPress={() => setColor(item)}
              style={[
                styles.color,
                { backgroundColor: item },
                color === item && styles.selectedColor,
              ]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          {editing ? (
            <AppButton label="Cancelar" onPress={reset} style={styles.action} variant="text" />
          ) : null}
          <AppButton
            label={editing ? 'Guardar categoría' : 'Añadir categoría'}
            loading={loading}
            onPress={submit}
            style={styles.action}
          />
        </View>
      </View>

      {categories.length === 0 ? (
        <EmptyState message="Las categorías aparecerán aquí." title="Todavía no hay categorías" />
      ) : (
        <View style={styles.list}>
          {categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: strongerCategoryColor(category.color) },
                ]}
              />
              <View style={styles.nameWrap}>
                <Text style={styles.name}>{category.name}</Text>
                <Text style={styles.type}>
                  {category.isDefault ? 'Predeterminada' : 'Personalizada'}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => edit(category)}>
                <Ionicons color={colors.primary} name="pencil-outline" size={21} />
              </Pressable>
              {!category.isDefault ? (
                <Pressable hitSlop={10} onPress={() => setPendingDelete(category)}>
                  <Ionicons color={colors.danger} name="trash-outline" size={21} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {pendingDelete ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>¿Eliminar “{pendingDelete.name}”?</Text>
          <Text style={styles.confirmText}>
            {pendingExpenseCount
              ? `Esta categoría contiene ${pendingExpenseCount} ${
                  pendingExpenseCount === 1 ? 'gasto' : 'gastos'
                }. Elige qué quieres hacer.`
              : 'Esta categoría no contiene gastos y se puede eliminar de forma segura.'}
          </Text>
          {pendingExpenseCount ? (
            <>
              <AppButton
                label={`Mover ${pendingExpenseCount === 1 ? 'el gasto' : 'los gastos'} a Otros`}
                loading={loading}
                onPress={() => remove('move-to-other')}
                variant="secondary"
              />
              <AppButton
                label={`Eliminar categoría y ${
                  pendingExpenseCount === 1 ? 'gasto' : 'gastos'
                }`}
                loading={loading}
                onPress={() => remove('delete-expenses')}
                variant="danger"
              />
            </>
          ) : (
            <AppButton
              label="Eliminar categoría"
              loading={loading}
              onPress={() => remove()}
              variant="danger"
            />
          )}
          <View style={styles.cancelRow}>
            <AppButton
              label="Cancelar"
              onPress={() => setPendingDelete(null)}
              style={styles.cancelButton}
              variant="text"
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  formTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  color: { borderRadius: 16, height: 30, width: 30 },
  selectedColor: { borderColor: colors.text, borderWidth: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  list: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  dot: { borderRadius: 8, height: 16, width: 16 },
  nameWrap: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  type: { color: colors.muted, fontSize: 12 },
  confirmCard: {
    backgroundColor: '#F7E3E3',
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  confirmTitle: { color: colors.danger, fontSize: 18, fontWeight: '800' },
  confirmText: { color: colors.text, lineHeight: 20 },
  cancelRow: { alignItems: 'center' },
  cancelButton: { minWidth: 140 },
});
