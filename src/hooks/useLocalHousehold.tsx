import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { strongerCategoryColor } from '../utils/categoryColors';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { LOCAL_STORAGE_KEY } from '../services/localData';
import { HouseholdContext, type HouseholdContextValue } from './householdContext';
import { useAuth } from './useAuth';

interface LocalHouseholdData {
  household: Household;
  categories: Category[];
  expenses: Expense[];
  monthlyIncomes: MonthlyIncome[];
}

interface LocalStore {
  version: 2;
  activeHouseholdId: string;
  households: Record<string, LocalHouseholdData>;
}

interface RemoteEnvelope {
  data: unknown;
  updatedAt: number;
}

function id(prefix: string) {
  const random =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function createHouseholdData(
  userId: string,
  displayName: string,
  name = 'Mi hogar',
  householdId = id('local-household'),
): LocalHouseholdData {
  const household: Household = {
    id: householdId,
    name,
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
      id: `${householdId}-default-${index + 1}`,
      householdId,
      ...category,
      isDefault: true,
      createdBy: userId,
      createdAt: null,
    })),
    expenses: [],
    monthlyIncomes: [],
  };
}

function createInitialStore(userId: string, displayName: string): LocalStore {
  const data = createHouseholdData(userId, displayName, 'Mi hogar', 'local-household');
  return {
    version: 2,
    activeHouseholdId: data.household.id,
    households: { [data.household.id]: data },
  };
}

function normalizeHouseholdData(data: LocalHouseholdData): LocalHouseholdData {
  return {
    ...data,
    categories: data.categories.map((category) => ({
      ...category,
      color: strongerCategoryColor(category.color),
    })),
  };
}

function normalizeStore(value: unknown, userId: string, displayName: string): LocalStore {
  if (!value || typeof value !== 'object') return createInitialStore(userId, displayName);
  const candidate = value as Partial<LocalStore> & Partial<LocalHouseholdData>;
  if (
    candidate.version === 2 &&
    typeof candidate.activeHouseholdId === 'string' &&
    candidate.households &&
    candidate.households[candidate.activeHouseholdId]
  ) {
    const store = candidate as LocalStore;
    return {
      ...store,
      households: Object.fromEntries(
        Object.entries(store.households).map(([idValue, householdData]) => [
          idValue,
          normalizeHouseholdData(householdData),
        ]),
      ),
    };
  }
  if (
    candidate.household &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.monthlyIncomes)
  ) {
    const legacy = candidate as LocalHouseholdData;
    return {
      version: 2,
      activeHouseholdId: legacy.household.id,
      households: { [legacy.household.id]: normalizeHouseholdData(legacy) },
    };
  }
  return createInitialStore(userId, displayName);
}

async function readRemoteStore() {
  const response = await fetch('/api/data', { cache: 'no-store' });
  if (!response.ok) throw new Error('Servidor local no disponible.');
  return (await response.json()) as RemoteEnvelope;
}

async function writeRemoteStore(store: LocalStore) {
  const response = await fetch('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(store),
  });
  if (!response.ok) throw new Error('No se pudo guardar en el Mac.');
  return (await response.json()) as { updatedAt: number };
}

export function LocalHouseholdProvider({ children }: PropsWithChildren) {
  const { user, profile } = useAuth();
  const userId = user?.uid ?? 'local-user';
  const displayName = profile?.displayName ?? 'Usuario local';
  const [store, setStore] = useState<LocalStore>(() => createInitialStore(userId, displayName));
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const remoteUpdatedAt = useRef(0);
  const skipNextRemoteWrite = useRef(false);

  const data =
    store.households[store.activeHouseholdId] ??
    Object.values(store.households)[0] ??
    createHouseholdData(userId, displayName);

  useEffect(() => {
    void (async () => {
      try {
        const remote = await readRemoteStore();
        if (remote.data) {
          setStore(normalizeStore(remote.data, userId, displayName));
          remoteUpdatedAt.current = remote.updatedAt;
        } else {
          const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) setStore(normalizeStore(JSON.parse(stored), userId, displayName));
        }
      } catch {
        try {
          const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) setStore(normalizeStore(JSON.parse(stored), userId, displayName));
          setSyncError('Modo individual: no se pudo conectar con el servidor local del Mac.');
        } catch {
          setSyncError('No se pudieron leer los datos guardados.');
        }
      } finally {
        setHydrated(true);
        setLoading(false);
      }
    })();
  }, [displayName, userId]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store)).catch(() =>
      setSyncError('No se pudo guardar la copia de seguridad del navegador.'),
    );
    if (skipNextRemoteWrite.current) {
      skipNextRemoteWrite.current = false;
      return;
    }
    void writeRemoteStore(store)
      .then(({ updatedAt }) => {
        remoteUpdatedAt.current = updatedAt;
        setSyncError(null);
      })
      .catch(() => setSyncError('Los cambios se guardaron en este navegador, pero no en el Mac.'));
  }, [hydrated, store]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => {
      void readRemoteStore()
        .then((remote) => {
          if (remote.data && remote.updatedAt > remoteUpdatedAt.current) {
            remoteUpdatedAt.current = remote.updatedAt;
            skipNextRemoteWrite.current = true;
            setStore((current) => {
              const next = normalizeStore(remote.data, userId, displayName);
              return next.households[current.activeHouseholdId]
                ? { ...next, activeHouseholdId: current.activeHouseholdId }
                : next;
            });
          }
        })
        .catch(() => undefined);
    }, 2500);
    return () => clearInterval(timer);
  }, [displayName, hydrated, userId]);

  const updateActive = useCallback(
    (updater: (current: LocalHouseholdData) => LocalHouseholdData) => {
      setStore((current) => {
        const active = current.households[current.activeHouseholdId];
        if (!active) return current;
        return {
          ...current,
          households: {
            ...current.households,
            [current.activeHouseholdId]: updater(active),
          },
        };
      });
    },
    [],
  );

  const createHousehold = useCallback(
    async (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('Introduce un nombre para el hogar.');
      updateActive((current) => ({
        ...current,
        household: { ...current.household, name: cleanName },
      }));
    },
    [updateActive],
  );

  const createAdditionalHousehold = useCallback(
    async (name: string) => {
      const cleanName = name.trim();
      if (cleanName.length < 2) throw new Error('Introduce al menos 2 caracteres.');
      if (
        Object.values(store.households).some(
          (item) => item.household.name.toLowerCase() === cleanName.toLowerCase(),
        )
      ) {
        throw new Error('Ya existe un hogar con este nombre.');
      }
      const next = createHouseholdData(
        userId,
        data.household.members[userId]?.displayName ?? displayName,
        cleanName,
      );
      setStore((current) => ({
        ...current,
        activeHouseholdId: next.household.id,
        households: { ...current.households, [next.household.id]: next },
      }));
    },
    [data.household.members, displayName, store.households, userId],
  );

  const switchHousehold = useCallback(async (householdId: string) => {
    setStore((current) =>
      current.households[householdId]
        ? { ...current, activeHouseholdId: householdId }
        : current,
    );
  }, []);

  const addMember = useCallback(
    async (name: string) => {
      const cleanName = name.trim();
      if (cleanName.length < 2) throw new Error('Introduce al menos 2 caracteres.');
      if (
        Object.values(data.household.members).some(
          (member) => member.displayName.toLowerCase() === cleanName.toLowerCase(),
        )
      ) {
        throw new Error('Ya existe una persona con este nombre.');
      }
      const memberId = id('member');
      updateActive((current) => ({
        ...current,
        household: {
          ...current.household,
          members: {
            ...current.household.members,
            [memberId]: { email: '', displayName: cleanName, joinedAt: null },
          },
          memberIds: [...current.household.memberIds, memberId],
        },
      }));
    },
    [data.household.members, updateActive],
  );

  const updateMember = useCallback(
    async (memberId: string, name: string) => {
      const cleanName = name.trim();
      if (cleanName.length < 2) throw new Error('Introduce al menos 2 caracteres.');
      if (!data.household.members[memberId]) throw new Error('No se encontró la persona.');
      if (
        Object.entries(data.household.members).some(
          ([idValue, member]) =>
            idValue !== memberId &&
            member.displayName.toLowerCase() === cleanName.toLowerCase(),
        )
      ) {
        throw new Error('Ya existe una persona con este nombre.');
      }
      updateActive((current) => ({
        ...current,
        household: {
          ...current.household,
          members: {
            ...current.household.members,
            [memberId]: { ...current.household.members[memberId], displayName: cleanName },
          },
        },
      }));
    },
    [data.household.members, updateActive],
  );

  const clearHousehold = useCallback(async () => {
    updateActive((current) => {
      const fresh = createHouseholdData(
        current.household.createdBy,
        current.household.members[current.household.createdBy]?.displayName ?? displayName,
        current.household.name,
        current.household.id,
      );
      return {
        ...fresh,
        household: {
          ...fresh.household,
          members: current.household.members,
          memberIds: current.household.memberIds,
        },
      };
    });
  }, [displayName, updateActive]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const expense: Expense = {
        id: id('expense'),
        householdId: data.household.id,
        ...input,
        paymentMethod: input.paymentMethod?.trim() ?? '',
        description: input.description.trim(),
        createdBy: userId,
        createdAt: null,
        updatedAt: null,
      };
      updateActive((current) => ({ ...current, expenses: [expense, ...current.expenses] }));
    },
    [data.household.id, updateActive, userId],
  );

  const updateExpense = useCallback(
    async (expenseId: string, input: ExpenseInput) => {
      updateActive((current) => ({
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
    },
    [updateActive],
  );

  const deleteExpense = useCallback(
    async (expense: Expense) => {
      updateActive((current) => ({
        ...current,
        expenses: current.expenses.filter((item) => item.id !== expense.id),
      }));
    },
    [updateActive],
  );

  const saveMonthlyIncome = useCallback(
    async (month: string, amount: number, currency: Currency, targetUserId = userId) => {
      if (!Number.isFinite(amount) || amount < 0) throw new Error('Introduce un ingreso válido.');
      updateActive((current) => {
        const existing = current.monthlyIncomes.find(
          (income) =>
            income.month === month &&
            income.userId === targetUserId &&
            income.currency === currency,
        );
        const next: MonthlyIncome = {
          id: existing?.id ?? `${current.household.id}_${month}_${targetUserId}_${currency}`,
          householdId: current.household.id,
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
    [updateActive, userId],
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
      updateActive((current) => {
        const importedExpenses: Expense[] = expenseRows.map((item) => ({
          id: id('expense'),
          householdId: current.household.id,
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
            id:
              existing?.id ??
              `${current.household.id}_${month}_${targetUserId}_${currency}`,
            householdId: current.household.id,
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
    [updateActive, userId],
  );

  const addCategory = useCallback(
    async (name: string, color: string) => {
      const cleanName = name.trim();
      if (data.categories.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Ya existe una categoría con este nombre.');
      }
      updateActive((current) => ({
        ...current,
        categories: [
          ...current.categories,
          {
            id: id('category'),
            householdId: current.household.id,
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
    [data.categories, updateActive, userId],
  );

  const updateCategory = useCallback(
    async (category: Category, name: string, color: string) => {
      updateActive((current) => ({
        ...current,
        categories: current.categories.map((item) =>
          item.id === category.id ? { ...item, name: name.trim(), color } : item,
        ),
      }));
    },
    [updateActive],
  );

  const deleteCategory = useCallback(
    async (category: Category, expenseAction?: 'delete-expenses' | 'move-to-other') => {
      if (category.isDefault) throw new Error('Las categorías predeterminadas no se pueden eliminar.');
      const affected = data.expenses.filter((expense) => expense.categoryId === category.id);
      if (affected.length && !expenseAction) {
        throw new Error('Elige qué hacer con los gastos de esta categoría.');
      }
      updateActive((current) => {
        const other = current.categories.find(
          (item) =>
            item.isDefault &&
            (item.icon === 'ellipsis-horizontal-outline' ||
              item.name.toLowerCase() === 'otros'),
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
    [data.expenses, updateActive],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      household: data.household,
      households: Object.values(store.households)
        .map((item) => ({ id: item.household.id, name: item.household.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
      categories: [...data.categories].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      expenses: [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)),
      monthlyIncomes: data.monthlyIncomes,
      loading,
      syncError,
      createHousehold,
      createAdditionalHousehold,
      switchHousehold,
      clearHousehold,
      joinHousehold: async () => {
        throw new Error('Las invitaciones no están disponibles en el modo local.');
      },
      addMember,
      updateMember,
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
      clearHousehold,
      createAdditionalHousehold,
      createHousehold,
      data,
      deleteCategory,
      deleteExpense,
      importSpreadsheetTransactions,
      loading,
      saveMonthlyIncome,
      store.households,
      switchHousehold,
      syncError,
      updateCategory,
      updateExpense,
      updateMember,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
