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
      Alert.alert('Could not update expense', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteExpense(expense);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Could not delete expense', friendlyError(error));
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (!household || !isOwner) {
    return (
      <Screen>
        <AppButton label="Back" onPress={() => navigation.goBack()} variant="secondary" />
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
        submitLabel="Save changes"
      />
      <AppButton label="Delete expense" onPress={confirmDelete} variant="danger" />
    </Screen>
  );
}
