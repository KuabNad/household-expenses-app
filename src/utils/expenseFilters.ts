import type { Expense } from '../types/models';
import { monthKey, toDateInput } from './format';

export type ExpensePeriod = 'month' | 'year' | 'all' | 'custom';

export interface ExpenseFilters {
  categoryId: string | null;
  userId: string | null;
  period: ExpensePeriod;
  month: string;
  year: number;
  startDate: string;
  endDate: string;
}

export function defaultExpenseFilters(date = new Date()): ExpenseFilters {
  return {
    categoryId: null,
    userId: null,
    period: 'month',
    month: monthKey(date),
    year: date.getFullYear(),
    startDate: toDateInput(new Date(date.getFullYear(), date.getMonth(), 1)),
    endDate: toDateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

export function expenseDateRange(filters: ExpenseFilters) {
  if (filters.period === 'month') {
    return { startDate: `${filters.month}-01`, endDate: `${filters.month}-31` };
  }
  if (filters.period === 'year') {
    return { startDate: `${filters.year}-01-01`, endDate: `${filters.year}-12-31` };
  }
  if (filters.period === 'custom') {
    return { startDate: filters.startDate, endDate: filters.endDate };
  }
  return { startDate: '', endDate: '' };
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters) {
  const { startDate, endDate } = expenseDateRange(filters);
  return expenses.filter(
    (expense) =>
      (!filters.categoryId || expense.categoryId === filters.categoryId) &&
      (!filters.userId || expense.paidByUserId === filters.userId) &&
      (!startDate || expense.date >= startDate) &&
      (!endDate || expense.date <= endDate),
  );
}
