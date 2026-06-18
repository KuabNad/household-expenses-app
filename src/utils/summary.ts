import type { Category, Currency, Expense, HouseholdMember } from '../types/models';

export interface SummaryLine {
  id: string;
  label: string;
  amount: number;
  currency: Currency;
  color?: string;
}

export function expensesForMonth(expenses: Expense[], selectedMonth: string) {
  return expenses.filter((expense) => expense.date.startsWith(selectedMonth));
}

export function totalsByCurrency(expenses: Expense[]) {
  return expenses.reduce<Partial<Record<Currency, number>>>((totals, expense) => {
    totals[expense.currency] = (totals[expense.currency] ?? 0) + expense.amount;
    return totals;
  }, {});
}

export function spendingByCategory(expenses: Expense[], categories: Category[]) {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, SummaryLine>();

  expenses.forEach((expense) => {
    const category = categoryMap.get(expense.categoryId);
    const key = `${expense.categoryId}-${expense.currency}`;
    const current = totals.get(key);
    totals.set(key, {
      id: key,
      label: category?.name ?? 'Deleted category',
      amount: (current?.amount ?? 0) + expense.amount,
      currency: expense.currency,
      color: category?.color,
    });
  });

  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export function spendingByPayer(
  expenses: Expense[],
  members: Record<string, HouseholdMember>,
) {
  const totals = new Map<string, SummaryLine>();

  expenses.forEach((expense) => {
    const key = `${expense.paidByUserId}-${expense.currency}`;
    const current = totals.get(key);
    totals.set(key, {
      id: key,
      label: members[expense.paidByUserId]?.displayName ?? 'Unknown member',
      amount: (current?.amount ?? 0) + expense.amount,
      currency: expense.currency,
    });
  });

  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}
