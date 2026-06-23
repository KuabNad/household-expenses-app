import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Expense } from './models';
import type { ExpensePeriod } from '../utils/expenseFilters';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HouseholdStackParamList = {
  HouseholdSetup: undefined;
  JoinHousehold: undefined;
};

export type ExpensesStackParamList = {
  ExpenseList:
    | {
        categoryId?: string;
        userId?: string;
        period?: ExpensePeriod;
        month?: string;
        year?: number;
        startDate?: string;
        endDate?: string;
        requestKey?: number;
      }
    | undefined;
  EditExpense: { expense: Expense };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: NavigatorScreenParams<ExpensesStackParamList> | undefined;
  AddExpense: undefined;
  Categories: undefined;
  Settings: undefined;
};
