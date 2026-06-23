import { describe, expect, it } from 'vitest';
import type { Expense } from '../types/models';
import { defaultExpenseFilters, filterExpenses } from './expenseFilters';

const expenses = [
  { id: 'food-kuba', date: '2026-06-02', categoryId: 'food', paidByUserId: 'kuba' },
  { id: 'food-laura', date: '2026-05-20', categoryId: 'food', paidByUserId: 'laura' },
  { id: 'rent-laura', date: '2026-06-03', categoryId: 'rent', paidByUserId: 'laura' },
] as Expense[];

describe('filterExpenses', () => {
  it('combines category, member, and month filters', () => {
    const filters = {
      ...defaultExpenseFilters(new Date('2026-06-10T12:00:00')),
      categoryId: 'food',
      userId: 'kuba',
    };
    expect(filterExpenses(expenses, filters).map((expense) => expense.id)).toEqual([
      'food-kuba',
    ]);
  });

  it('supports year, all-time, and custom date ranges', () => {
    const base = defaultExpenseFilters(new Date('2026-06-10T12:00:00'));
    expect(filterExpenses(expenses, { ...base, period: 'year' })).toHaveLength(3);
    expect(
      filterExpenses(expenses, { ...base, period: 'all', categoryId: 'food' }),
    ).toHaveLength(2);
    expect(
      filterExpenses(expenses, {
        ...base,
        period: 'custom',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
      }).map((expense) => expense.id),
    ).toEqual(['food-laura']);
  });
});
