import { describe, expect, it } from 'vitest';
import type { Category, Expense, HouseholdMember } from '../types/models';
import {
  expensesForMonth,
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
});
