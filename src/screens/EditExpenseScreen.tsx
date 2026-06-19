import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ExpenseForm } from '../components/ExpenseForm';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { ExpenseInput } from '../types/models';
import type { ExpensesStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'EditExpense'>;

export function EditExpenseScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { expense } = route.params;
  const { household, categories, updateExpense, deleteExpense } = useHousehold();
  const [loading, setLoading] = useState(false);
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

  const confirmDelete = () => {
    Alert.alert('¿Eliminar gasto?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteExpense(expense);
            navigation.goBack();
          } catch (error) {
            Alert.alert('No se pudo eliminar el gasto', friendlyError(error));
            setLoading(false);
          }
        },
      },
    ]);
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
        initial={expense}
        loading={loading}
        onSubmit={submit}
        submitLabel="Guardar cambios"
      />
      <AppButton label="Eliminar gasto" onPress={confirmDelete} variant="danger" />
    </Screen>
  );
}
