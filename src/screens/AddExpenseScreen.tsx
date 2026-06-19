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
      Alert.alert('Gasto guardado', 'Todos los miembros del hogar ya pueden verlo.', [
        { text: 'Añadir otro' },
        { text: 'Ver gastos', onPress: () => navigation.navigate('Expenses') },
      ]);
    } catch (error) {
      Alert.alert('No se pudo guardar el gasto', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen subtitle="Añade los datos principales del gasto." title="Añadir gasto">
      {syncError ? <Notice message={syncError} /> : null}
      {!household ? (
        <EmptyState message="Tu hogar todavía se está cargando." title="Un momento" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          message="Crea al menos una categoría antes de añadir un gasto."
          title="Todavía no hay categorías"
        />
      ) : (
        <ExpenseForm
          categories={categories}
          household={household}
          key={formKey}
          loading={loading}
          onSubmit={submit}
          submitLabel="Guardar gasto"
        />
      )}
    </Screen>
  );
}
