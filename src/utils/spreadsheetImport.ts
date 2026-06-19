import type { Currency, Expense } from '../types/models';
import { toDateInput } from './format';

export type ImportedTransactionType = 'expense' | 'income';

export interface ParsedSpreadsheetTransaction {
  id: string;
  rowNumber: number;
  type: ImportedTransactionType;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  categoryName?: string;
  fingerprint: string;
}

export interface SpreadsheetParseResult {
  transactions: ParsedSpreadsheetTransaction[];
  errors: string[];
  detectedFormat: string;
}

export type SpreadsheetCell = string | number | boolean | Date | null | undefined;

const HEADER_ALIASES = {
  date: ['fecha', 'date', 'data', 'datum', 'transactiondate', 'operationdate', 'valuedate'],
  description: [
    'descripcion',
    'description',
    'concepto',
    'details',
    'detalle',
    'merchant',
    'beneficiary',
    'beneficiario',
    'nazwa',
    'tytul',
  ],
  amount: ['importe', 'amount', 'monto', 'kwota', 'value', 'cantidad'],
  debit: ['cargo', 'debit', 'debito', 'withdrawal', 'outcome', 'gasto', 'salida'],
  credit: ['abono', 'credit', 'credito', 'deposit', 'income', 'ingreso', 'entrada'],
  currency: ['moneda', 'currency', 'divisa', 'waluta'],
  category: ['categoria', 'category', 'kategoria'],
  type: ['tipo', 'type', 'transactiontype', 'movimiento'],
} as const;

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Alimentación',
    keywords: [
      'mercadona',
      'carrefour',
      'alcampo',
      'lidl',
      'panaderia',
      'pasteleria',
      'caf.',
      'vending',
      'restaurant',
      'restaurante',
      'supermercado',
    ],
  },
  {
    category: 'Servicios',
    keywords: [
      'securitas',
      't-mobile',
      'apple.com/bill',
      'domestic and gen',
      'mecaclima',
      'tributos',
      'comunidad',
      'geo alternativa',
    ],
  },
  {
    category: 'Transporte',
    keywords: [
      'gasolinera',
      'estacion bp',
      'gas santa cruz',
      'parking',
      'naviera',
      'fred olsen',
      'itv',
    ],
  },
  {
    category: 'Salud',
    keywords: ['farmacia', 'hospital', 'clinica', 'mutua'],
  },
  {
    category: 'Niños',
    keywords: ['mundolandia', 'hiperjuguetes', 'neverland', 'juguete'],
  },
  {
    category: 'Entretenimiento',
    keywords: ['coinbase', 'decathlon', 'peluqueria', 'estilistas'],
  },
  {
    category: 'Viajes',
    keywords: ['airline', 'hotel', 'booking', 'ryanair', 'binter'],
  },
  {
    category: 'Alquiler / Hipoteca',
    keywords: ['alquiler', 'hipoteca', 'czynsz'],
  },
];

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function columnIndex(headers: SpreadsheetCell[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.includes(normalize(header)));
}

function parseAmount(value: SpreadsheetCell) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value ?? '')
    .trim()
    .replace(/[^\d,.\-+]/g, '');
  if (!raw) return null;
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let normalized = raw;
  if (lastComma > lastDot) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma >= 0) {
    normalized = raw.replace(/,/g, '');
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    normalized = decimals === 2 ? raw.replace(',', '.') : raw.replace(/,/g, '');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: SpreadsheetCell) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateInput(value);
  const raw = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return null;
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  const date = new Date(year, Number(match[2]) - 1, Number(match[1]), 12);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[1])
  ) {
    return null;
  }
  return toDateInput(date);
}

function parseCurrency(value: SpreadsheetCell, fallback: Currency): Currency {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  const currencies: Currency[] = ['EUR', 'USD', 'GBP', 'PLN', 'CAD', 'AUD'];
  return currencies.includes(normalized as Currency) ? (normalized as Currency) : fallback;
}

function parseType(value: SpreadsheetCell, signedAmount: number): ImportedTransactionType {
  const type = normalize(value);
  if (
    ['ingreso', 'income', 'credit', 'credito', 'abono', 'deposit', 'entrada'].some((item) =>
      type.includes(item),
    )
  ) {
    return 'income';
  }
  if (
    ['gasto', 'expense', 'debit', 'debito', 'cargo', 'withdrawal', 'salida'].some((item) =>
      type.includes(item),
    )
  ) {
    return 'expense';
  }
  return signedAmount < 0 ? 'expense' : 'income';
}

export function suggestCategory(description: string) {
  const text = normalize(description);
  return CATEGORY_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => text.includes(normalize(keyword))),
  )?.category;
}

function stripHash(value: SpreadsheetCell) {
  return String(value ?? '').replace(/^#/, '').trim();
}

function cleanMbankDescription(row: SpreadsheetCell[]) {
  const operation = String(row[2] ?? '').trim();
  const title = String(row[3] ?? '')
    .replace(/\s+DATA TRANSAKCJI:.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const party = String(row[4] ?? '').replace(/\s+/g, ' ').trim();
  return title || party || operation || 'Operación mBank';
}

function parseSpanishBankRows(rows: SpreadsheetCell[][], userId: string) {
  const transactions = rows.slice(1).flatMap((row, index) => {
    const date = parseDate(row[1]);
    const description = String(row[0] ?? '').trim();
    const signedAmount = parseAmount(row[2]);
    if (!date || !description || signedAmount === null || signedAmount === 0) return [];
    const currencyMatch = String(row[2] ?? '').toUpperCase().match(/EUR|USD|GBP|PLN|CAD|AUD/);
    const currency = parseCurrency(currencyMatch?.[0], 'EUR');
    const type: ImportedTransactionType = signedAmount < 0 ? 'expense' : 'income';
    const amount = Math.abs(signedAmount);
    const fingerprint = transactionFingerprint({
      userId,
      date,
      amount,
      currency,
      description,
      type,
    });
    return [{
      id: `${fingerprint}-${index + 2}`,
      rowNumber: index + 2,
      type,
      date,
      description,
      amount,
      currency,
      categoryName: type === 'expense' ? suggestCategory(description) : undefined,
      fingerprint,
    }];
  });
  return {
    transactions,
    errors: transactions.length ? [] : ['No se encontraron movimientos bancarios válidos.'],
    detectedFormat: 'Banco español',
  };
}

function parseMbankRows(rows: SpreadsheetCell[][], userId: string) {
  const headerIndex = rows.findIndex((row) =>
    row.map(stripHash).some((cell) => normalize(cell) === 'dataksiegowania'),
  );
  if (headerIndex < 0) {
    return {
      transactions: [],
      errors: ['No se encontró la cabecera de operaciones de mBank.'],
      detectedFormat: 'mBank Polonia',
    };
  }
  const currencyRow = rows.find((row) => normalize(stripHash(row[0])) === 'waluta');
  const currency = parseCurrency(currencyRow?.[1], 'PLN');
  const transactions = rows.slice(headerIndex + 1).flatMap((row, index) => {
    const date = parseDate(row[1] || row[0]);
    const signedAmount = parseAmount(row[6]);
    if (!date || signedAmount === null || signedAmount === 0) return [];
    const description = cleanMbankDescription(row);
    const type: ImportedTransactionType = signedAmount < 0 ? 'expense' : 'income';
    const amount = Math.abs(signedAmount);
    const fingerprint = transactionFingerprint({
      userId,
      date,
      amount,
      currency,
      description,
      type,
    });
    return [{
      id: `${fingerprint}-${headerIndex + index + 2}`,
      rowNumber: headerIndex + index + 2,
      type,
      date,
      description,
      amount,
      currency,
      categoryName: type === 'expense' ? suggestCategory(description) : undefined,
      fingerprint,
    }];
  });
  return {
    transactions,
    errors: transactions.length ? [] : ['No se encontraron operaciones de mBank válidas.'],
    detectedFormat: 'mBank Polonia',
  };
}

export function detectSpreadsheetFormat(rows: SpreadsheetCell[][]) {
  const firstCells = rows
    .slice(0, 50)
    .flat()
    .map((cell) => normalize(stripHash(cell)));
  if (
    firstCells.includes('dataksiegowania') &&
    firstCells.includes('opisoperacji') &&
    firstCells.includes('kwota')
  ) {
    return 'mbank';
  }
  const firstRow = rows[0]?.map((cell) => normalize(cell)) ?? [];
  if (
    firstRow.includes('concepto') &&
    firstRow.includes('fecha') &&
    firstRow.includes('importe') &&
    firstRow.includes('saldo')
  ) {
    return 'spanish-bank';
  }
  return 'generic';
}

export function transactionFingerprint({
  userId,
  date,
  amount,
  currency,
  description,
  type,
}: {
  userId: string;
  date: string;
  amount: number;
  currency: Currency;
  description: string;
  type: ImportedTransactionType;
}) {
  const source = `${userId}|${type}|${date}|${amount.toFixed(2)}|${currency}|${normalize(description)}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sheet-${(hash >>> 0).toString(16)}`;
}

export function parseSpreadsheetRows(
  rows: SpreadsheetCell[][],
  userId: string,
  defaultCurrency: Currency = 'EUR',
): SpreadsheetParseResult {
  const errors: string[] = [];
  if (rows.length < 2) {
    return {
      transactions: [],
      errors: ['La tabla no contiene movimientos.'],
      detectedFormat: 'Formato desconocido',
    };
  }
  const format = detectSpreadsheetFormat(rows);
  if (format === 'mbank') return parseMbankRows(rows, userId);
  if (format === 'spanish-bank') return parseSpanishBankRows(rows, userId);

  const headers = rows[0];
  const indexes = {
    date: columnIndex(headers, HEADER_ALIASES.date),
    description: columnIndex(headers, HEADER_ALIASES.description),
    amount: columnIndex(headers, HEADER_ALIASES.amount),
    debit: columnIndex(headers, HEADER_ALIASES.debit),
    credit: columnIndex(headers, HEADER_ALIASES.credit),
    currency: columnIndex(headers, HEADER_ALIASES.currency),
    category: columnIndex(headers, HEADER_ALIASES.category),
    type: columnIndex(headers, HEADER_ALIASES.type),
  };

  if (indexes.date < 0 || indexes.description < 0) {
    return {
      transactions: [],
      errors: ['La primera fila debe incluir las columnas Fecha y Descripción.'],
      detectedFormat: 'Tabla genérica',
    };
  }
  if (indexes.amount < 0 && indexes.debit < 0 && indexes.credit < 0) {
    return {
      transactions: [],
      errors: ['Añade una columna Importe o columnas separadas Cargo y Abono.'],
      detectedFormat: 'Tabla genérica',
    };
  }

  const transactions = rows.slice(1).flatMap((row, index) => {
    const rowNumber = index + 2;
    if (row.every((cell) => String(cell ?? '').trim() === '')) return [];
    const date = parseDate(row[indexes.date]);
    const description = String(row[indexes.description] ?? '').trim();
    const debit = indexes.debit >= 0 ? parseAmount(row[indexes.debit]) : null;
    const credit = indexes.credit >= 0 ? parseAmount(row[indexes.credit]) : null;
    const rawAmount = indexes.amount >= 0 ? parseAmount(row[indexes.amount]) : null;

    if (!date || !description || (rawAmount === null && debit === null && credit === null)) {
      errors.push(`Fila ${rowNumber}: faltan fecha, descripción o importe válido.`);
      return [];
    }

    let signedAmount = rawAmount ?? 0;
    let type: ImportedTransactionType;
    if (credit !== null && credit !== 0) {
      signedAmount = Math.abs(credit);
      type = 'income';
    } else if (debit !== null && debit !== 0) {
      signedAmount = -Math.abs(debit);
      type = 'expense';
    } else {
      type = indexes.type >= 0
        ? parseType(row[indexes.type], signedAmount)
        : parseType('', signedAmount);
    }
    if (signedAmount === 0) return [];

    const currency = parseCurrency(
      indexes.currency >= 0 ? row[indexes.currency] : undefined,
      defaultCurrency,
    );
    const amount = Math.abs(signedAmount);
    const fingerprint = transactionFingerprint({
      userId,
      date,
      amount,
      currency,
      description,
      type,
    });
    return [{
      id: `${fingerprint}-${rowNumber}`,
      rowNumber,
      type,
      date,
      description,
      amount,
      currency,
      categoryName:
        indexes.category >= 0 ? String(row[indexes.category] ?? '').trim() || undefined : undefined,
      fingerprint,
    }];
  });

  return { transactions, errors, detectedFormat: 'Tabla genérica' };
}

export function existingExpenseFingerprints(expenses: Expense[], userId: string) {
  return new Set(
    expenses
      .filter((expense) => expense.createdBy === userId)
      .map(
        (expense) =>
          expense.importFingerprint ??
          transactionFingerprint({
            userId,
            date: expense.date,
            amount: expense.amount,
            currency: expense.currency,
            description: expense.description,
            type: 'expense',
          }),
      ),
  );
}
