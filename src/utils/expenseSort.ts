import type { Expense } from '../types/models';

export type ExpenseSort = 'newest' | 'oldest' | 'highest' | 'lowest';

export function sortExpenses(expenses: Expense[], sort: ExpenseSort) {
  return [...expenses].sort((a, b) => {
    if (sort === 'oldest') {
      return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    }
    if (sort === 'highest') {
      return b.amount - a.amount || b.date.localeCompare(a.date);
    }
    if (sort === 'lowest') {
      return a.amount - b.amount || b.date.localeCompare(a.date);
    }
    return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
  });
}
