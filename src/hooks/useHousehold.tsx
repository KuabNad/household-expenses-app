import {
  arrayUnion,
  collection,
  deleteDoc,
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
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { db } from '../services/firebase';
import type { Category, Expense, ExpenseInput, Household } from '../types/models';
import { useAuth } from './useAuth';

interface HouseholdContextValue {
  household: Household | null;
  categories: Category[];
  expenses: Expense[];
  loading: boolean;
  syncError: string | null;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (expense: Expense) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (category: Category, name: string, color: string) => Promise<void>;
  deleteCategory: (category: Category) => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile?.householdId) {
      setHousehold(null);
      setCategories([]);
      setExpenses([]);
      setLoading(false);
      setSyncError(null);
      return;
    }

    setLoading(true);
    const householdId = profile.householdId;
    const onError = () => {
      setSyncError('Could not refresh household data. Check your connection.');
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
        setCategories(snapshot.docs.map((item) => item.data() as Category));
        setSyncError(null);
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

    return () => {
      householdUnsubscribe();
      categoryUnsubscribe();
      expenseUnsubscribe();
    };
  }, [profile?.householdId, user]);

  const requireSession = useCallback(() => {
    if (!user || !profile) throw new Error('You must be logged in.');
    return { user, profile };
  }, [profile, user]);

  const requireHousehold = useCallback(() => {
    const session = requireSession();
    if (!session.profile.householdId) throw new Error('Create or join a household first.');
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
      if (!inviteSnapshot.exists()) throw new Error('Invite code not found.');

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
      await setDoc(expenseRef, {
        id: expenseRef.id,
        householdId: session.householdId,
        ...input,
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
        throw new Error('Only the person who added this expense can delete it.');
      }
      await deleteDoc(doc(db, 'households', session.householdId, 'expenses', expense.id));
    },
    [requireHousehold],
  );

  const addCategory = useCallback(
    async (name: string, color: string) => {
      const session = requireHousehold();
      const cleanName = name.trim();
      if (categories.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('A category with this name already exists.');
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
      if (category.isDefault) throw new Error('Default categories cannot be edited.');
      await updateDoc(
        doc(db, 'households', session.householdId, 'categories', category.id),
        { name: name.trim(), color },
      );
    },
    [requireHousehold],
  );

  const deleteCategory = useCallback(
    async (category: Category) => {
      const session = requireHousehold();
      if (category.isDefault) throw new Error('Default categories cannot be deleted.');
      if (expenses.some((expense) => expense.categoryId === category.id)) {
        throw new Error('Move or delete expenses in this category first.');
      }
      await deleteDoc(doc(db, 'households', session.householdId, 'categories', category.id));
    },
    [expenses, requireHousehold],
  );

  const value = useMemo<HouseholdContextValue>(
    () => ({
      household,
      categories,
      expenses,
      loading,
      syncError,
      createHousehold,
      joinHousehold,
      addExpense,
      updateExpense,
      deleteExpense,
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
      household,
      joinHousehold,
      loading,
      syncError,
      updateCategory,
      updateExpense,
    ],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used within HouseholdProvider.');
  return context;
}
