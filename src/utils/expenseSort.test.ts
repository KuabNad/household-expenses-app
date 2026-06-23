import { describe, expect, it } from 'vitest';
import type { Expense } from '../types/models';
import { sortExpenses } from './expenseSort';

const expenses = [
  { id: 'middle', date: '2026-05-10', amount: 20 },
  { id: 'newest', date: '2026-06-15', amount: 5 },
  { id: 'oldest', date: '2026-04-01', amount: 80 },
] as Expense[];

describe('sortExpenses', () => {
  it('sorts by newest and oldest date', () => {
    expect(sortExpenses(expenses, 'newest').map((item) => item.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
    expect(sortExpenses(expenses, 'oldest').map((item) => item.id)).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
  });

  it('sorts by highest and lowest amount', () => {
    expect(sortExpenses(expenses, 'highest').map((item) => item.id)).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
    expect(sortExpenses(expenses, 'lowest').map((item) => item.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });
});
