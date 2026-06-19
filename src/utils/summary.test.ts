import { describe, expect, it } from 'vitest';
import type { Category, Expense, HouseholdMember } from '../types/models';
import {
  expensesForMonth,
  expensesForYearToDate,
  monthlySpendingForYear,
  spendingByCategory,
  spendingByPayer,
  totalsByCurrency,
} from './summary';
import { isValidDateInput } from './format';

const expenses: Expense[] = [
  {
    id: 'e1',
    householdId: 'h1',
    amount: 42.5,
    currency: 'EUR',
    date: '2026-06-02',
    categoryId: 'food',
    description: 'Groceries',
    paidByUserId: 'u1',
    paymentMethod: 'Card',
    createdBy: 'u1',
    createdAt: null,
    updatedAt: null,
    isRecurring: true,
    recurrenceFrequency: 'monthly',
  },
  {
    id: 'e2',
    householdId: 'h1',
    amount: 10,
    currency: 'EUR',
    date: '2026-06-12',
    categoryId: 'food',
    description: 'Lunch',
    paidByUserId: 'u2',
    createdBy: 'u2',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'e3',
    householdId: 'h1',
    amount: 20,
    currency: 'USD',
    date: '2026-05-12',
    categoryId: 'travel',
    description: 'Taxi',
    paidByUserId: 'u1',
    createdBy: 'u1',
    createdAt: null,
    updatedAt: null,
  },
];

const categories: Category[] = [
  {
    id: 'food',
    householdId: 'h1',
    name: 'Food',
    color: '#123456',
    isDefault: true,
    createdBy: 'u1',
    createdAt: null,
  },
];

const members: Record<string, HouseholdMember> = {
  u1: { email: 'one@example.com', displayName: 'One', joinedAt: null },
  u2: { email: 'two@example.com', displayName: 'Two', joinedAt: null },
};

describe('summary helpers', () => {
  it('filters expenses by calendar month', () => {
    expect(expensesForMonth(expenses, '2026-06')).toHaveLength(2);
  });

  it('keeps different currencies separate', () => {
    expect(totalsByCurrency(expenses)).toEqual({ EUR: 52.5, USD: 20 });
  });

  it('groups spending by category and payer', () => {
    const june = expensesForMonth(expenses, '2026-06');
    expect(spendingByCategory(june, categories)[0]).toMatchObject({
      label: 'Food',
      amount: 52.5,
      currency: 'EUR',
    });
    expect(spendingByPayer(june, members).map((item) => item.amount)).toEqual([42.5, 10]);
  });

  it('validates editable expense dates', () => {
    expect(isValidDateInput('2026-06-19')).toBe(true);
    expect(isValidDateInput('2026-02-31')).toBe(false);
    expect(isValidDateInput('19/06/2026')).toBe(false);
  });

  it('projects monthly recurring expenses into future months', () => {
    const july = expensesForMonth(expenses, '2026-07');
    expect(july).toHaveLength(1);
    expect(july[0]).toMatchObject({
      id: 'e1',
      date: '2026-07-02',
      isProjected: true,
      isRecurring: true,
    });
  });

  it('removes a deleted expense from every recalculated total', () => {
    const remaining = expenses.filter((expense) => expense.id !== 'e1');
    const june = expensesForMonth(remaining, '2026-06');

    expect(totalsByCurrency(june)).toEqual({ EUR: 10 });
    expect(spendingByCategory(june, categories)[0].amount).toBe(10);
    expect(spendingByPayer(june, members).map((item) => item.amount)).toEqual([10]);
    expect(expensesForMonth(remaining, '2026-07')).toEqual([]);
  });

  it('builds a clickable-year data set and year-to-date category source', () => {
    const months = monthlySpendingForYear(expenses, 2026, '2026-07-15');
    const yearToDate = expensesForYearToDate(expenses, 2026, '2026-07-15');

    expect(months).toHaveLength(12);
    expect(months[5]).toMatchObject({
      month: '2026-06',
      hasExpenses: true,
      isFuture: false,
      totals: { EUR: 52.5 },
    });
    expect(months[6]).toMatchObject({
      month: '2026-07',
      hasExpenses: true,
      isFuture: false,
      totals: { EUR: 42.5 },
    });
    expect(months[7]).toMatchObject({
      month: '2026-08',
      hasExpenses: true,
      isFuture: true,
      totals: { EUR: 42.5 },
    });
    expect(yearToDate.map((expense) => expense.date)).toEqual([
      '2026-05-12',
      '2026-06-02',
      '2026-06-12',
      '2026-07-02',
    ]);
  });
});
