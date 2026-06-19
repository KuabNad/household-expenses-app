import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ExpenseForm } from '../components/ExpenseForm';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { ExpenseInput } from '../types/models';
import type { ExpensesStackParamList } from '../types/navigation';
import { colors, radius, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'EditExpense'>;

export function EditExpenseScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { expense } = route.params;
  const { household, categories, updateExpense, deleteExpense } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const isOwner = expense.createdBy === user?.uid;

  const submit = async (input: ExpenseInput) => {
    try {
      setLoading(true);
      await updateExpense(expense.id, input);
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo actualizar el gasto', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteExpense(expense);
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo eliminar el gasto', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!household || !isOwner) {
    return (
      <Screen>
        <AppButton label="Volver" onPress={() => navigation.goBack()} variant="secondary" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ExpenseForm
        categories={categories}
        household={household}
        initial={{ ...expense, isRecurring: expense.isRecurring ?? false }}
        loading={loading}
        onSubmit={submit}
        submitLabel="Guardar cambios"
      />
      {showDeleteConfirmation ? (
        <View style={styles.deleteCard}>
          <Text style={styles.deleteTitle}>¿Eliminar este gasto?</Text>
          <Text style={styles.deleteText}>
            Desaparecerá de las listas, del gasto total y de todos los subtotales.
          </Text>
          <AppButton
            label="Sí, eliminar gasto"
            loading={loading}
            onPress={confirmDelete}
            variant="danger"
          />
          <AppButton
            label="Cancelar"
            onPress={() => setShowDeleteConfirmation(false)}
            variant="text"
          />
        </View>
      ) : (
        <AppButton
          label="Eliminar gasto"
          onPress={() => setShowDeleteConfirmation(true)}
          variant="danger"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  deleteCard: {
    backgroundColor: '#F7E3E3',
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  deleteTitle: { color: colors.danger, fontSize: 18, fontWeight: '800' },
  deleteText: { color: colors.text, lineHeight: 20 },
});
