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
import { colors, radius, spacing } from '../utils/theme';

const COLORS = ['#315C4C', '#D28B5C', '#6F8FA6', '#A16E83', '#7D9363', '#C5A53D'];

export function CategoryManagementScreen() {
  const { categories, addCategory, updateCategory, deleteCategory, syncError } = useHousehold();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEditing(null);
    setName('');
    setColor(COLORS[0]);
  };

  const submit = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Category name needed', 'Enter at least 2 characters.');
      return;
    }
    try {
      setLoading(true);
      if (editing) await updateCategory(editing, name, color);
      else await addCategory(name, color);
      reset();
    } catch (error) {
      Alert.alert('Could not save category', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const edit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setColor(category.color ?? COLORS[0]);
  };

  const remove = (category: Category) => {
    Alert.alert('Delete category?', `Delete “${category.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(category);
          } catch (error) {
            Alert.alert('Could not delete category', friendlyError(error));
          }
        },
      },
    ]);
  };

  return (
    <Screen
      subtitle="Default categories stay put. Custom ones are shared with everyone."
      title="Categories"
    >
      {syncError ? <Notice message={syncError} /> : null}
      <View style={styles.form}>
        <Text style={styles.formTitle}>{editing ? 'Edit category' : 'New category'}</Text>
        <AppInput label="Name" onChangeText={setName} placeholder="Pets" value={name} />
        <View style={styles.colors}>
          {COLORS.map((item) => (
            <Pressable
              accessibilityLabel={`Use color ${item}`}
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
            <AppButton label="Cancel" onPress={reset} style={styles.action} variant="text" />
          ) : null}
          <AppButton
            label={editing ? 'Save category' : 'Add category'}
            loading={loading}
            onPress={submit}
            style={styles.action}
          />
        </View>
      </View>

      {categories.length === 0 ? (
        <EmptyState message="Categories will appear here." title="No categories yet" />
      ) : (
        <View style={styles.list}>
          {categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: category.color ?? colors.muted }]} />
              <View style={styles.nameWrap}>
                <Text style={styles.name}>{category.name}</Text>
                <Text style={styles.type}>{category.isDefault ? 'Default' : 'Custom'}</Text>
              </View>
              {!category.isDefault ? (
                <>
                  <Pressable hitSlop={10} onPress={() => edit(category)}>
                    <Ionicons color={colors.primary} name="pencil-outline" size={21} />
                  </Pressable>
                  <Pressable hitSlop={10} onPress={() => remove(category)}>
                    <Ionicons color={colors.danger} name="trash-outline" size={21} />
                  </Pressable>
                </>
              ) : null}
            </View>
          ))}
        </View>
      )}
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
  colors: { flexDirection: 'row', gap: spacing.md },
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
});
