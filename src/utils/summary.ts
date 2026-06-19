import type { Category, Currency, Expense, HouseholdMember } from '../types/models';

export interface SummaryLine {
  id: string;
  sourceId?: string;
  label: string;
  amount: number;
  currency: Currency;
  color?: string;
}

export interface MonthSpendingSummary {
  month: string;
  totals: Partial<Record<Currency, number>>;
  intensity: number;
  hasExpenses: boolean;
  isFuture: boolean;
}

export function expensesForMonth(expenses: Expense[], selectedMonth: string) {
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);

  return expenses.flatMap((expense) => {
    if (expense.date.startsWith(selectedMonth)) return [expense];
    if (!expense.isRecurring || !expense.recurrenceFrequency) return [];

    const [startYear, startMonth, startDay] = expense.date.split('-').map(Number);
    const selectedIndex = selectedYear * 12 + selectedMonthNumber;
    const startIndex = startYear * 12 + startMonth;
    if (selectedIndex < startIndex) return [];
    if (expense.recurrenceFrequency === 'yearly' && selectedMonthNumber !== startMonth) return [];

    const lastDay = new Date(selectedYear, selectedMonthNumber, 0).getDate();
    const projectedDay = Math.min(startDay, lastDay);
    return [
      {
        ...expense,
        date: `${selectedMonth}-${String(projectedDay).padStart(2, '0')}`,
        isProjected: true,
      },
    ];
  });
}

export function recurringExpenses(expenses: Expense[]) {
  return expenses.filter((expense) => expense.isRecurring);
}

export function expensesForYearToDate(
  expenses: Expense[],
  year: number,
  throughDate: string,
) {
  const throughYear = Number(throughDate.slice(0, 4));
  const throughMonth =
    year < throughYear
      ? 12
      : year === throughYear
        ? Number(throughDate.slice(5, 7))
        : 0;

  return Array.from({ length: throughMonth }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    return expensesForMonth(expenses, month).filter((expense) => expense.date <= throughDate);
  }).flat();
}

export function monthlySpendingForYear(
  expenses: Expense[],
  year: number,
  throughDate: string,
): MonthSpendingSummary[] {
  const throughYear = Number(throughDate.slice(0, 4));
  const throughMonth =
    year < throughYear
      ? 12
      : year === throughYear
        ? Number(throughDate.slice(5, 7))
        : 0;
  const monthData = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const isFuture = index + 1 > throughMonth;
    const monthExpenses = expensesForMonth(expenses, month);
    return { month, totals: totalsByCurrency(monthExpenses), isFuture };
  });
  const maxima = monthData.reduce<Partial<Record<Currency, number>>>((result, item) => {
    Object.entries(item.totals).forEach(([currency, amount]) => {
      const key = currency as Currency;
      result[key] = Math.max(result[key] ?? 0, amount ?? 0);
    });
    return result;
  }, {});

  return monthData.map((item) => {
    const ratios = Object.entries(item.totals).map(
      ([currency, amount]) => (amount ?? 0) / (maxima[currency as Currency] ?? 1),
    );
    return {
      ...item,
      hasExpenses: ratios.length > 0,
      intensity: ratios.length ? Math.max(...ratios) : 0,
    };
  });
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
      sourceId: expense.categoryId,
      label: category?.name ?? 'Categoría eliminada',
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
      label: members[expense.paidByUserId]?.displayName ?? 'Miembro desconocido',
      amount: (current?.amount ?? 0) + expense.amount,
      currency: expense.currency,
    });
  });

  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}
