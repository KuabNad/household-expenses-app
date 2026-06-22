import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type {
  Category,
  Currency,
  Expense,
  ExpenseInput,
  Household,
  MonthlyIncome,
  SpreadsheetTransactionImport,
} from '../types/models';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { LOCAL_STORAGE_KEY } from '../services/localData';
import { HouseholdContext, type HouseholdContextValue } from './householdContext';
import { useAuth } from './useAuth';

const HOUSEHOLD_ID = 'local-household';

interface LocalHouseholdData {
  household: Household;
  categories: Category[];
  expenses: Expense[];
  monthlyIncomes: MonthlyIncome[];
}

function id(prefix: string) {
  const random =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function createInitialData(userId: string, displayName: string): LocalHouseholdData {
  const household: Household = {
    id: HOUSEHOLD_ID,
    name: 'Mi hogar',
    inviteCode: 'LOCAL',
    members: {
      [userId]: {
        email: 'local@mac',
        displayName,
        joinedAt: null,
      },
    },
    memberIds: [userId],
    createdBy: userId,
    createdAt: null,
  };
  return {
    household,
    categories: DEFAULT_CATEGORIES.map((category, index) => ({
      id: `default-${index + 1}`,
      householdId: HOUSEHOLD_ID,
      ...category,
      isDefault: true,
      createdBy: userId,
      createdAt: null,
    })),
    expenses: [],
    monthlyIncomes: [],
  };
}

export function LocalHouseholdProvider({ children }: PropsWithChildren) {
  const { user, profile } = useAuth();
  const userId = user?.uid ?? 'local-user';
  const [data, setData] = useState<LocalHouseholdData>(() =>
    createInitialData(userId, profile?.displayName ?? 'Usuario local'),
  );
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(LOCAL_STORAGE_KEY)
      .then((stored) => {
        if (stored) setData(JSON.parse(stored) as LocalHouseholdData);
      })
      .catch(() => setSyncError('No se pudieron leer los datos guardados en este Mac.'))
      .finally(() => {
        setHydrated(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)).catch(() =>
      setSyncError('No se pudieron guardar los cambios en este Mac.'),
    );
  }, [data, hydrated]);

  const createHousehold = useCallback(async (name: string) => {
    setData((current) => ({
      ...current,
      household: { ...current.household, name: name.trim() || current.household.name },
    }));
  }, []);

  const addMember = useCallback(async (displayName: string) => {
    const cleanName = displayName.trim();
    if (cleanName.length < 2) throw new Error('Introduce al menos 2 caracteres.');
    if (
      Object.values(data.household.members).some(
        (member) => member.displayName.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      throw new Error('Ya existe una persona con este nombre.');
    }
    const memberId = id('member');
    setData((current) => ({
      ...current,
      household: {
        ...current.household,
        members: {
          ...current.household.members,
          [memberId]: {
            email: '',
            displayName: cleanName,
            joinedAt: null,
          },
        },
        memberIds: [...current.household.memberIds, memberId],
      },
    }));
  }, [data.household.members]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const now = null;
      const expense: Expense = {
        id: id('expense'),
        householdId: HOUSEHOLD_ID,
        ...input,
        paymentMethod: input.paymentMethod?.trim() ?? '',
        description: input.description.trim(),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      setData((current) => ({
        ...current,
        expenses: [expense, ...current.expenses],
      }));
    },
    [userId],
  );

  const updateExpense = useCallback(async (expenseId: string, input: ExpenseInput) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              ...input,
              paymentMethod: input.paymentMethod?.trim() ?? '',
              description: input.description.trim(),
              updatedAt: null,
            }
          : expense,
      ),
    }));
  }, []);

  const deleteExpense = useCallback(async (expense: Expense) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((item) => item.id !== expense.id),
    }));
  }, []);

  const saveMonthlyIncome = useCallback(
    async (
      month: string,
      amount: number,
      currency: Currency,
      targetUserId = userId,
    ) => {
      if (!Number.isFinite(amount) || amount < 0) throw new Error('Introduce un ingreso válido.');
      setData((current) => {
        const existing = current.monthlyIncomes.find(
          (income) =>
            income.month === month &&
            income.userId === targetUserId &&
            income.currency === currency,
        );
        const next: MonthlyIncome = {
          id: existing?.id ?? `${month}_${targetUserId}_${currency}`,
          householdId: HOUSEHOLD_ID,
          userId: targetUserId,
          month,
          amount: Math.round(amount * 100) / 100,
          currency,
          createdAt: null,
          updatedAt: null,
        };
        return {
          ...current,
          monthlyIncomes: existing
            ? current.monthlyIncomes.map((income) => (income.id === existing.id ? next : income))
            : [...current.monthlyIncomes, next],
        };
      });
    },
    [userId],
  );

  const importSpreadsheetTransactions = useCallback(
    async (transactions: SpreadsheetTransactionImport[], targetUserId = userId) => {
      if (!transactions.length) throw new Error('No hay movimientos seleccionados.');
      const expenseRows = transactions.filter((item) => item.type === 'expense');
      const incomeGroups = new Map<string, { month: string; currency: Currency; amount: number }>();
      transactions
        .filter((item) => item.type === 'income')
        .forEach((item) => {
          const month = item.date.slice(0, 7);
          const key = `${month}-${item.currency}`;
          const current = incomeGroups.get(key);
          incomeGroups.set(key, {
            month,
            currency: item.currency,
            amount: (current?.amount ?? 0) + item.amount,
          });
        });

      setData((current) => {
        const importedExpenses: Expense[] = expenseRows.map((item) => ({
          id: id('expense'),
          householdId: HOUSEHOLD_ID,
          amount: item.amount,
          currency: item.currency,
          date: item.date,
          categoryId: item.categoryId,
          description: item.description.trim(),
          paidByUserId: targetUserId,
          paymentMethod: 'Importación bancaria',
          isRecurring: false,
          importFingerprint: item.fingerprint,
          importSource: 'spreadsheet',
          createdBy: userId,
          createdAt: null,
          updatedAt: null,
        }));
        let incomes = [...current.monthlyIncomes];
        incomeGroups.forEach(({ month, currency, amount }) => {
          const existing = incomes.find(
            (income) =>
              income.month === month &&
              income.userId === targetUserId &&
              income.currency === currency,
          );
          const next: MonthlyIncome = {
            id: existing?.id ?? `${month}_${targetUserId}_${currency}`,
            householdId: HOUSEHOLD_ID,
            userId: targetUserId,
            month,
            amount: Math.round(amount * 100) / 100,
            currency,
            createdAt: null,
            updatedAt: null,
          };
          incomes = existing
            ? incomes.map((income) => (income.id === existing.id ? next : income))
            : [...incomes, next];
        });
        return {
          ...current,
          expenses: [...importedExpenses, ...current.expenses],
          monthlyIncomes: incomes,
        };
      });
      return { expenses: expenseRows.length, incomeMonths: incomeGroups.size };
    },
    [userId],
  );

  const addCategory = useCallback(
    async (name: string, color: string) => {
      const cleanName = name.trim();
      if (data.categories.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Ya existe una categoría con este nombre.');
      }
      setData((current) => ({
        ...current,
        categories: [
          ...current.categories,
          {
            id: id('category'),
            householdId: HOUSEHOLD_ID,
            name: cleanName,
            icon: 'pricetag-outline',
            color,
            isDefault: false,
            createdBy: userId,
            createdAt: null,
          },
        ],
      }));
    },
    [data.categories, userId],
  );

  const updateCategory = useCallback(async (category: Category, name: string, color: string) => {
    setData((current) => ({
      ...current,
      categories: current.categories.map((item) =>
        item.id === category.id ? { ...item, name: name.trim(), color } : item,
      ),
    }));
  }, []);

  const deleteCategory = useCallback(
    async (
      category: Category,
      expenseAction?: 'delete-expenses' | 'move-to-other',
    ) => {
      if (category.isDefault) throw new Error('Las categorías predeterminadas no se pueden eliminar.');
      const affected = data.expenses.filter((expense) => expense.categoryId === category.id);
      if (affected.length && !expenseAction) {
        throw new Error('Elige qué hacer con los gastos de esta categoría.');
      }
      setData((current) => {
        const other = current.categories.find(
          (item) => item.isDefault && item.name.toLowerCase() === 'otros',
        );
        return {
          ...current,
          categories: current.categories.filter((item) => item.id !== category.id),
          expenses:
            expenseAction === 'delete-expenses'
              ? current.expenses.filter((expense) => expense.categoryId !== category.id)
              : current.expenses.map((expense) =>
                  expense.categoryId === category.id && other
                    ? { ...expense, categoryId: other.id }
                    : expense,
                ),
        };
      });
    },
    [data.expenses],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      household: data.household,
      categories: [...data.categories].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      expenses: [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)),
      monthlyIncomes: data.monthlyIncomes,
      loading,
      syncError,
      createHousehold,
      joinHousehold: async () => {
        throw new Error('Las invitaciones no están disponibles en el modo local.');
      },
      addMember,
      addExpense,
      updateExpense,
      deleteExpense,
      saveMonthlyIncome,
      importSpreadsheetTransactions,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      addCategory,
      addExpense,
      addMember,
      createHousehold,
      data,
      deleteCategory,
      deleteExpense,
      importSpreadsheetTransactions,
      loading,
      saveMonthlyIncome,
      syncError,
      updateCategory,
      updateExpense,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
