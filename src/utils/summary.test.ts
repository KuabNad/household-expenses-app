import { describe, expect, it } from 'vitest';
import type { Category, Expense, HouseholdMember, MonthlyIncome } from '../types/models';
import {
  expensesForMonth,
  expensesForYearToDate,
  monthlySpendingForYear,
  monthlyFinancesByMember,
  spendingByCategory,
  spendingByPayer,
  totalsByCurrency,
} from './summary';
import { isValidDateInput } from './format';
import {
  decodeSpreadsheetText,
  detectSpreadsheetDelimiter,
  existingExpenseFingerprints,
  parseSpreadsheetRows,
} from './spreadsheetImport';

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

const incomes: MonthlyIncome[] = [
  {
    id: '2026-06_u1',
    householdId: 'h1',
    userId: 'u1',
    month: '2026-06',
    amount: 2000,
    currency: 'EUR',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: '2026-06_u2',
    householdId: 'h1',
    userId: 'u2',
    month: '2026-06',
    amount: 1500,
    currency: 'EUR',
    createdAt: null,
    updatedAt: null,
  },
];

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

  it('calculates monthly income, expenses and savings for every member', () => {
    const june = expensesForMonth(expenses, '2026-06');
    const finances = monthlyFinancesByMember(june, incomes, members, '2026-06');

    expect(finances[0]).toMatchObject({
      userId: 'u1',
      lines: [{ currency: 'EUR', income: 2000, expenses: 42.5, savings: 1957.5 }],
    });
    expect(finances[1]).toMatchObject({
      userId: 'u2',
      lines: [{ currency: 'EUR', income: 1500, expenses: 10, savings: 1490 }],
    });
  });

  it('parses spreadsheet income and expenses with European numbers and dates', () => {
    const result = parseSpreadsheetRows(
      [
        ['Fecha', 'Descripción', 'Importe', 'Moneda', 'Tipo', 'Categoría'],
        ['01/06/2026', 'Supermercado', '-1.234,56', 'EUR', 'Gasto', 'Food'],
        ['03/06/2026', 'Nómina', '2.500,00', 'EUR', 'Ingreso', ''],
      ],
      'u1',
    );

    expect(result.errors).toEqual([]);
    expect(result.transactions).toMatchObject([
      {
        type: 'expense',
        date: '2026-06-01',
        description: 'Supermercado',
        amount: 1234.56,
        currency: 'EUR',
        categoryName: 'Food',
      },
      {
        type: 'income',
        date: '2026-06-03',
        description: 'Nómina',
        amount: 2500,
        currency: 'EUR',
      },
    ]);
  });

  it('supports debit and credit columns and detects existing expenses', () => {
    const result = parseSpreadsheetRows(
      [
        ['Date', 'Description', 'Debit', 'Credit', 'Currency'],
        ['12/06/2026', 'Lunch', '10.00', '', 'EUR'],
        ['15/06/2026', 'Salary', '', '1500.00', 'EUR'],
      ],
      'u2',
    );

    expect(result.transactions.map((item) => item.type)).toEqual(['expense', 'income']);
    expect(
      existingExpenseFingerprints(expenses, 'u2').has(
        result.transactions[0].fingerprint,
      ),
    ).toBe(true);
  });

  it('recognizes the Spanish bank export and derives EUR from amount cells', () => {
    const result = parseSpreadsheetRows(
      [
        ['Concepto', 'Fecha', 'Importe', 'Saldo'],
        ['PANADERIA LA SALUD', '29/05/2026', '-3,60EUR', '236,44EUR'],
        ['TRANSFER. EN DIV.', '08/06/2026', '160,00EUR', '187,41EUR'],
      ],
      'u1',
    );

    expect(result.detectedFormat).toBe('Banco español');
    expect(result.transactions).toMatchObject([
      {
        type: 'expense',
        date: '2026-05-29',
        amount: 3.6,
        currency: 'EUR',
        categoryName: 'Alimentación',
      },
      {
        type: 'income',
        date: '2026-06-08',
        amount: 160,
        currency: 'EUR',
      },
    ]);
  });

  it('recognizes an mBank statement after metadata rows', () => {
    const result = parseSpreadsheetRows(
      [
        ['mBank S.A. Bankowość Detaliczna'],
        ['#Waluta', 'PLN'],
        [],
        [
          '#Data księgowania',
          '#Data operacji',
          '#Opis operacji',
          '#Tytuł',
          '#Nadawca/Odbiorca',
          '#Numer konta',
          '#Kwota',
          '#Saldo po operacji',
        ],
        [
          '2026-03-01',
          '2026-03-01',
          'ZAKUP PRZY UŻYCIU KARTY',
          'MERCADONA CUESTA PI/TENERIFE DATA TRANSAKCJI: 2026-02-28',
          '',
          '',
          '-24,03',
          '95 667,75',
        ],
        [
          '2026-03-18',
          '2026-03-18',
          'PRZELEW ZEWNĘTRZNY PRZYCHODZĄCY',
          'Świadczenie ZUS',
          'ZUS',
          '',
          '1 600,00',
          '94 000,00',
        ],
      ],
      'u1',
    );

    expect(result.detectedFormat).toBe('mBank Polonia');
    expect(result.transactions).toMatchObject([
      {
        type: 'expense',
        description: 'MERCADONA CUESTA PI/TENERIFE',
        amount: 24.03,
        currency: 'PLN',
        categoryName: 'Alimentación',
      },
      {
        type: 'income',
        description: 'Świadczenie ZUS',
        amount: 1600,
        currency: 'PLN',
      },
    ]);
  });

  it('decodes Windows-1250 mBank headers and selects semicolon delimiters', () => {
    const bytes = new Uint8Array([
      35, 68, 97, 116, 97, 32, 107, 115, 105, 234, 103, 111, 119, 97, 110, 105, 97,
      59, 35, 68, 97, 116, 97, 32, 111, 112, 101, 114, 97, 99, 106, 105, 59, 35, 79,
      112, 105, 115, 32, 111, 112, 101, 114, 97, 99, 106, 105, 59, 35, 84, 121, 116,
      117, 179, 59, 35, 75, 119, 111, 116, 97, 59,
    ]);
    const decoded = decodeSpreadsheetText(bytes);

    expect(decoded).toContain('#Data księgowania');
    expect(decoded).toContain('#Tytuł');
    expect(detectSpreadsheetDelimiter(decoded)).toBe(';');
  });

  it('recognizes mBank even when Polish header characters are distorted', () => {
    const result = parseSpreadsheetRows(
      [
        ['#Waluta', 'PLN'],
        [
          '#Data ksiÍgowania',
          '#Data operacji',
          '#Opis operacji',
          '#Tytu≥',
          '#Nadawca/Odbiorca',
          '#Numer konta',
          '#Kwota',
          '#Saldo po operacji',
        ],
        [
          '2026-03-01',
          '2026-03-01',
          'ZAKUP PRZY UŻYCIU KARTY',
          'MERCADONA',
          '',
          '',
          '-24,03',
          '95 667,75',
        ],
      ],
      'u1',
    );

    expect(result.detectedFormat).toBe('mBank Polonia');
    expect(result.transactions[0]).toMatchObject({
      type: 'expense',
      amount: 24.03,
      currency: 'PLN',
    });
  });
});
