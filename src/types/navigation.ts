import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Expense } from './models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HouseholdStackParamList = {
  HouseholdSetup: undefined;
  JoinHousehold: undefined;
};

export type ExpensesStackParamList = {
  ExpenseList: undefined;
  EditExpense: { expense: Expense };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: NavigatorScreenParams<ExpensesStackParamList> | undefined;
  AddExpense: undefined;
  Categories: undefined;
  Settings: undefined;
};
