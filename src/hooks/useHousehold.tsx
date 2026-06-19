import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_TRANSLATIONS } from '../utils/categories';
import { db } from '../services/firebase';
import type {
  Category,
  Currency,
  Expense,
  ExpenseInput,
  Household,
  MonthlyIncome,
} from '../types/models';
import { useAuth } from './useAuth';

interface HouseholdContextValue {
  household: Household | null;
  categories: Category[];
  expenses: Expense[];
  monthlyIncomes: MonthlyIncome[];
  loading: boolean;
  syncError: string | null;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (expense: Expense) => Promise<void>;
  saveMonthlyIncome: (month: string, amount: number, currency: Currency) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (category: Category, name: string, color: string) => Promise<void>;
  deleteCategory: (
    category: Category,
    expenseAction?: 'delete-expenses' | 'move-to-other',
  ) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomInviteCode() {
  return Array.from({ length: 8 }, () =>
    INVITE_ALPHABET.charAt(Math.floor(Math.random() * INVITE_ALPHABET.length)),
  ).join('');
}

export function HouseholdProvider({ children }: PropsWithChildren) {
  const { user, profile } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile?.householdId) {
      setHousehold(null);
      setCategories([]);
      setExpenses([]);
      setMonthlyIncomes([]);
      setLoading(false);
      setSyncError(null);
      return;
    }

    setLoading(true);
    const householdId = profile.householdId;
    const onError = () => {
      setSyncError('No se pudieron actualizar los datos. Comprueba tu conexión.');
      setLoading(false);
    };

    const householdUnsubscribe = onSnapshot(
      doc(db, 'households', householdId),
      (snapshot) => {
        setHousehold(snapshot.exists() ? (snapshot.data() as Household) : null);
        setLoading(false);
        setSyncError(null);
      },
      onError,
    );

    const categoryUnsubscribe = onSnapshot(
      query(collection(db, 'households', householdId, 'categories'), orderBy('name')),
      (snapshot) => {
        const nextCategories = snapshot.docs.map((item) => item.data() as Category);
        setCategories(nextCategories);
        setSyncError(null);
        nextCategories.forEach((category) => {
          const translatedName = category.isDefault
            ? DEFAULT_CATEGORY_TRANSLATIONS[category.name]
            : undefined;
          if (translatedName) {
            void updateDoc(itemRef(householdId, category.id), { name: translatedName }).catch(
              () => undefined,
            );
          }
        });
      },
      onError,
    );

    const expenseUnsubscribe = onSnapshot(
      query(collection(db, 'households', householdId, 'expenses'), orderBy('date', 'desc')),
      (snapshot) => {
        setExpenses(snapshot.docs.map((item) => item.data() as Expense));
        setSyncError(null);
      },
      onError,
    );

    const incomeUnsubscribe = onSnapshot(
      collection(db, 'households', householdId, 'monthlyIncomes'),
      (snapshot) => {
        setMonthlyIncomes(snapshot.docs.map((item) => item.data() as MonthlyIncome));
        setSyncError(null);
      },
      onError,
    );

    return () => {
      householdUnsubscribe();
      categoryUnsubscribe();
      expenseUnsubscribe();
      incomeUnsubscribe();
    };
  }, [profile?.householdId, user]);

  const requireSession = useCallback(() => {
    if (!user || !profile) throw new Error('Debes iniciar sesión.');
    return { user, profile };
  }, [profile, user]);

  const requireHousehold = useCallback(() => {
    const session = requireSession();
    if (!session.profile.householdId) throw new Error('Primero crea o únete a un hogar.');
    return { ...session, householdId: session.profile.householdId };
  }, [requireSession]);

  const createHousehold = useCallback(
    async (name: string) => {
      const session = requireSession();
      let inviteCode = randomInviteCode();
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const existing = await getDoc(doc(db, 'invites', inviteCode));
        if (!existing.exists()) break;
        inviteCode = randomInviteCode();
      }

      const householdRef = doc(collection(db, 'households'));
      const batch = writeBatch(db);
      const member = {
        email: session.profile.email,
        displayName: session.profile.displayName,
        joinedAt: serverTimestamp(),
      };

      batch.set(householdRef, {
        id: householdRef.id,
        name: name.trim(),
        inviteCode,
        members: { [session.user.uid]: member },
        memberIds: [session.user.uid],
        createdBy: session.user.uid,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'invites', inviteCode), {
        code: inviteCode,
        householdId: householdRef.id,
        householdName: name.trim(),
        createdBy: session.user.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', session.user.uid), { householdId: householdRef.id });

      DEFAULT_CATEGORIES.forEach((category) => {
        const categoryRef = doc(collection(householdRef, 'categories'));
        batch.set(categoryRef, {
          id: categoryRef.id,
          householdId: householdRef.id,
          ...category,
          isDefault: true,
          createdBy: session.user.uid,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    },
    [requireSession],
  );

  const joinHousehold = useCallback(
    async (rawCode: string) => {
      const session = requireSession();
      const inviteCode = rawCode.trim().toUpperCase();
      const inviteRef = doc(db, 'invites', inviteCode);

      const inviteSnapshot = await getDoc(inviteRef);
      if (!inviteSnapshot.exists()) throw new Error('No se encontró el código de invitación.');

      const householdId = String(inviteSnapshot.data().householdId);
      const householdRef = doc(db, 'households', householdId);
      const batch = writeBatch(db);
      batch.update(householdRef, {
          [`members.${session.user.uid}`]: {
            email: session.profile.email,
            displayName: session.profile.displayName,
            joinedAt: serverTimestamp(),
          },
          memberIds: arrayUnion(session.user.uid),
          updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', session.user.uid), { householdId });
      await batch.commit();
    },
    [requireSession],
  );

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const session = requireHousehold();
      const expenseRef = doc(collection(db, 'households', session.householdId, 'expenses'));
      const { recurrenceFrequency, ...expenseInput } = input;
      await setDoc(expenseRef, {
        id: expenseRef.id,
        householdId: session.householdId,
        ...expenseInput,
        ...(input.isRecurring
          ? { recurrenceFrequency: recurrenceFrequency ?? 'monthly' }
          : {}),
        paymentMethod: input.paymentMethod?.trim() ?? '',
        description: input.description.trim(),
        createdBy: session.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [requireHousehold],
  );

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      const session = requireHousehold();
      await updateDoc(doc(db, 'households', session.householdId, 'expenses', id), {
        ...input,
        recurrenceFrequency: input.isRecurring
          ? input.recurrenceFrequency ?? 'monthly'
          : deleteField(),
        paymentMethod: input.paymentMethod?.trim() ?? '',
        description: input.description.trim(),
        updatedAt: serverTimestamp(),
      });
    },
    [requireHousehold],
  );

  const deleteExpense = useCallback(
    async (expense: Expense) => {
      const session = requireHousehold();
      if (expense.createdBy !== session.user.uid) {
        throw new Error('Solo la persona que añadió este gasto puede eliminarlo.');
      }
      await deleteDoc(doc(db, 'households', session.householdId, 'expenses', expense.id));
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    },
    [requireHousehold],
  );

  const saveMonthlyIncome = useCallback(
    async (month: string, amount: number, currency: Currency) => {
      const session = requireHousehold();
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('Introduce un ingreso válido.');
      }
      const incomeRef = doc(
        db,
        'households',
        session.householdId,
        'monthlyIncomes',
        `${month}_${session.user.uid}`,
      );
      await setDoc(
        incomeRef,
        {
          id: incomeRef.id,
          householdId: session.householdId,
          userId: session.user.uid,
          month,
          amount: Math.round(amount * 100) / 100,
          currency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [requireHousehold],
  );

  const addCategory = useCallback(
    async (name: string, color: string) => {
      const session = requireHousehold();
      const cleanName = name.trim();
      if (categories.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Ya existe una categoría con este nombre.');
      }
      const categoryRef = doc(collection(db, 'households', session.householdId, 'categories'));
      await setDoc(categoryRef, {
        id: categoryRef.id,
        householdId: session.householdId,
        name: cleanName,
        icon: 'pricetag-outline',
        color,
        isDefault: false,
        createdBy: session.user.uid,
        createdAt: serverTimestamp(),
      });
    },
    [categories, requireHousehold],
  );

  const updateCategory = useCallback(
    async (category: Category, name: string, color: string) => {
      const session = requireHousehold();
      await updateDoc(
        doc(db, 'households', session.householdId, 'categories', category.id),
        { name: name.trim(), color },
      );
    },
    [requireHousehold],
  );

  const deleteCategory = useCallback(
    async (
      category: Category,
      expenseAction?: 'delete-expenses' | 'move-to-other',
    ) => {
      const session = requireHousehold();
      if (category.isDefault) throw new Error('Las categorías predeterminadas no se pueden eliminar.');
      const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id);

      if (categoryExpenses.length > 450) {
        throw new Error(
          'Esta categoría tiene demasiados gastos para eliminarlos de una vez. Contacta con soporte.',
        );
      }

      if (categoryExpenses.length && !expenseAction) {
        throw new Error('Elige qué hacer con los gastos de esta categoría.');
      }

      const otherCategory =
        categories.find(
          (item) => item.isDefault && item.icon === 'ellipsis-horizontal-outline',
        ) ??
        categories.find(
          (item) =>
            item.isDefault &&
            ['otros', 'other'].includes(item.name.trim().toLocaleLowerCase('es')),
        );

      if (expenseAction === 'move-to-other' && !otherCategory) {
        throw new Error('No se encontró la categoría “Otros”.');
      }

      const batch = writeBatch(db);
      categoryExpenses.forEach((expense) => {
        const expenseRef = doc(
          db,
          'households',
          session.householdId,
          'expenses',
          expense.id,
        );
        if (expenseAction === 'delete-expenses') {
          batch.delete(expenseRef);
        } else if (expenseAction === 'move-to-other' && otherCategory) {
          batch.update(expenseRef, {
            categoryId: otherCategory.id,
            updatedAt: serverTimestamp(),
          });
        }
      });
      batch.delete(doc(db, 'households', session.householdId, 'categories', category.id));
      await batch.commit();
    },
    [categories, expenses, requireHousehold],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      household,
      categories,
      expenses,
      monthlyIncomes,
      loading,
      syncError,
      createHousehold,
      joinHousehold,
      addExpense,
      updateExpense,
      deleteExpense,
      saveMonthlyIncome,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      addCategory,
      addExpense,
      categories,
      createHousehold,
      deleteCategory,
      deleteExpense,
      expenses,
      monthlyIncomes,
      household,
      joinHousehold,
      loading,
      syncError,
      saveMonthlyIncome,
      updateCategory,
      updateExpense,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('El contexto del hogar no está disponible.');
  return context;
}

function itemRef(householdId: string, categoryId: string) {
  return doc(db, 'households', householdId, 'categories', categoryId);
}
