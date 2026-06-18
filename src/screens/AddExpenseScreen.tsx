import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Alert } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ExpenseForm } from '../components/ExpenseForm';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { MainTabParamList } from '../types/navigation';
import type { ExpenseInput } from '../types/models';

type Props = BottomTabScreenProps<MainTabParamList, 'AddExpense'>;

export function AddExpenseScreen({ navigation }: Props) {
  const { household, categories, addExpense, syncError } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const submit = async (input: ExpenseInput) => {
    try {
      setLoading(true);
      await addExpense(input);
      setFormKey((value) => value + 1);
      Alert.alert('Expense saved', 'Everyone in the household can see it now.', [
        { text: 'Add another' },
        { text: 'View expenses', onPress: () => navigation.navigate('Expenses') },
      ]);
    } catch (error) {
      Alert.alert('Could not save expense', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen subtitle="Add the essentials now; tidy notes can wait." title="Add expense">
      {syncError ? <Notice message={syncError} /> : null}
      {!household ? (
        <EmptyState message="Your household is still loading." title="Just a moment" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          message="Create at least one category before adding an expense."
          title="No categories yet"
        />
      ) : (
        <ExpenseForm
          categories={categories}
          household={household}
          key={formKey}
          loading={loading}
          onSubmit={submit}
          submitLabel="Save expense"
        />
      )}
    </Screen>
  );
}
