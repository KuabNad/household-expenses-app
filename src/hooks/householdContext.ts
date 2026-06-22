import { createContext, useContext } from 'react';
import type {
  Category,
  Currency,
  Expense,
  ExpenseInput,
  Household,
  MonthlyIncome,
  SpreadsheetTransactionImport,
} from '../types/models';

export interface HouseholdContextValue {
  household: Household | null;
  households: Array<{ id: string; name: string }>;
  categories: Category[];
  expenses: Expense[];
  monthlyIncomes: MonthlyIncome[];
  loading: boolean;
  syncError: string | null;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  addMember: (displayName: string) => Promise<void>;
  updateMember: (memberId: string, displayName: string) => Promise<void>;
  createAdditionalHousehold: (name: string) => Promise<void>;
  switchHousehold: (householdId: string) => Promise<void>;
  clearHousehold: () => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (expense: Expense) => Promise<void>;
  saveMonthlyIncome: (
    month: string,
    amount: number,
    currency: Currency,
    userId?: string,
  ) => Promise<void>;
  importSpreadsheetTransactions: (
    transactions: SpreadsheetTransactionImport[],
    userId?: string,
  ) => Promise<{ expenses: number; incomeMonths: number }>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (category: Category, name: string, color: string) => Promise<void>;
  deleteCategory: (
    category: Category,
    expenseAction?: 'delete-expenses' | 'move-to-other',
  ) => Promise<void>;
}

export const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export function useHouseholdContext() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('El contexto del hogar no está disponible.');
  return context;
}
