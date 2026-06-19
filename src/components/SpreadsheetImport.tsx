import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  Category,
  Currency,
  Expense,
  SpreadsheetTransactionImport,
} from '../types/models';
import {
  existingExpenseFingerprints,
  parseSpreadsheetRows,
  type ParsedSpreadsheetTransaction,
  type SpreadsheetCell,
} from '../utils/spreadsheetImport';
import { colors, radius, spacing } from '../utils/theme';
import { AppButton } from './AppButton';

interface ReviewRow extends ParsedSpreadsheetTransaction {
  selected: boolean;
  duplicate: boolean;
  categoryId?: string;
}

function normalizedName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset) {
  const extension = asset.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'tsv' || asset.mimeType === 'text/csv') {
    const text = asset.file ? await asset.file.text() : await new ExpoFile(asset.uri).text();
    const parsed = Papa.parse<(string | number | null)[]>(text, {
      delimiter: extension === 'tsv' ? '\t' : '',
      skipEmptyLines: 'greedy',
    });
    if (parsed.errors.length && !parsed.data.length) {
      throw new Error(parsed.errors[0].message);
    }
    return parsed.data;
  }

  const { readSheet } = await import('read-excel-file/universal');
  if (asset.file) return readSheet(asset.file);
  const bytes = await new ExpoFile(asset.uri).bytes();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return readSheet(arrayBuffer);
}

export function SpreadsheetImport({
  categories,
  currentUserId,
  expenses,
  onImport,
}: {
  categories: Category[];
  currentUserId: string;
  expenses: Expense[];
  onImport: (
    transactions: SpreadsheetTransactionImport[],
  ) => Promise<{ expenses: number; incomeMonths: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const duplicateFingerprints = useMemo(
    () => existingExpenseFingerprints(expenses, currentUserId),
    [currentUserId, expenses],
  );
  const otherCategory =
    categories.find((category) => normalizedName(category.name) === 'otros') ??
    categories[0];

  const pickFile = async () => {
    try {
      setLoading(true);
      setErrors([]);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/csv',
          'text/tab-separated-values',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      let table: SpreadsheetCell[][];
      try {
        table = (await readPickedFile(asset)) as unknown as SpreadsheetCell[][];
      } finally {
        if (!asset.file) {
          try {
            new ExpoFile(asset.uri).delete();
          } catch {
            // The operating system may already have removed the temporary copy.
          }
        }
      }
      const parsed = parseSpreadsheetRows(table, currentUserId);
      const categoryMap = new Map(
        categories.map((category) => [normalizedName(category.name), category.id]),
      );
      setFileName(asset.name);
      setErrors(parsed.errors);
      const seen = new Set<string>();
      setRows(
        parsed.transactions.map((transaction) => {
          const duplicate =
            seen.has(transaction.fingerprint) ||
            (transaction.type === 'expense' &&
              duplicateFingerprints.has(transaction.fingerprint));
          seen.add(transaction.fingerprint);
          return {
            ...transaction,
            duplicate,
            selected: !duplicate,
            categoryId:
              transaction.type === 'expense'
                ? categoryMap.get(normalizedName(transaction.categoryName ?? '')) ??
                  otherCategory?.id
                : undefined,
          };
        }),
      );
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : 'No se pudo leer la hoja de cálculo.',
      ]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)),
    );
  };

  const cycleCategory = (id: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id || row.type !== 'expense') return row;
        const index = categories.findIndex((category) => category.id === row.categoryId);
        return { ...row, categoryId: categories[(index + 1) % categories.length]?.id };
      }),
    );
  };

  const submit = async () => {
    const selected = rows.filter((row) => row.selected);
    const invalidExpense = selected.find(
      (row) => row.type === 'expense' && !row.categoryId,
    );
    if (!selected.length || invalidExpense) {
      setErrors([
        invalidExpense
          ? 'Todos los gastos necesitan una categoría.'
          : 'Selecciona al menos un movimiento.',
      ]);
      return;
    }
    try {
      setLoading(true);
      const result = await onImport(
        selected.map((row): SpreadsheetTransactionImport =>
          row.type === 'expense'
            ? {
                type: 'expense',
                date: row.date,
                amount: row.amount,
                currency: row.currency,
                description: row.description,
                categoryId: row.categoryId!,
                fingerprint: row.fingerprint,
              }
            : {
                type: 'income',
                date: row.date,
                amount: row.amount,
                currency: row.currency,
                description: row.description,
                fingerprint: row.fingerprint,
              },
        ),
      );
      setRows([]);
      setErrors([]);
      setFileName('');
      setOpen(false);
      Alert.alert(
        'Importación completada',
        `${result.expenses} gastos añadidos. Ingresos actualizados en ${result.incomeMonths} mes(es).`,
      );
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : 'No se pudieron importar los movimientos.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <View style={styles.closedCard}>
        <View style={styles.closedText}>
          <Text style={styles.title}>Importar CSV o Excel (.xlsx)</Text>
          <Text style={styles.subtitle}>
            Añade tus propios ingresos y gastos desde una tabla, sin subir el archivo.
          </Text>
        </View>
        <AppButton label="Importar tabla" onPress={() => setOpen(true)} variant="secondary" />
      </View>
    );
  }

  const selectedCount = rows.filter((row) => row.selected).length;
  return (
    <View style={styles.container}>
        <Text style={styles.title}>Importar movimientos bancarios</Text>
      <Text style={styles.subtitle}>
        Columnas recomendadas: Fecha, Descripción, Importe, Moneda, Tipo y Categoría.
        Usa importes negativos para gastos y positivos para ingresos, o escribe
        “gasto/ingreso” en Tipo.
      </Text>
      <AppButton
        label={fileName ? 'Elegir otro archivo' : 'Elegir CSV o Excel (.xlsx)'}
        loading={loading && !rows.length}
        onPress={pickFile}
        variant="secondary"
      />
      {fileName ? <Text style={styles.fileName}>{fileName}</Text> : null}
      {errors.map((error) => (
        <Text key={error} style={styles.error}>
          {error}
        </Text>
      ))}

      {rows.length ? (
        <>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>
              Revisar {rows.length} movimientos · {selectedCount} seleccionados
            </Text>
            <Text style={styles.reviewNote}>
              Los ingresos seleccionados sustituirán tu total mensual en esa moneda.
            </Text>
          </View>
          <View style={styles.rows}>
            {rows.map((row) => {
              const category = categories.find((item) => item.id === row.categoryId);
              return (
                <View
                  key={row.id}
                  style={[styles.row, !row.selected && styles.rowDisabled]}
                >
                  <Pressable onPress={() => toggleRow(row.id)} style={styles.rowMain}>
                    <View
                      style={[styles.checkbox, row.selected && styles.checkboxSelected]}
                    >
                      <Text style={styles.checkmark}>{row.selected ? '✓' : ''}</Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text numberOfLines={1} style={styles.description}>
                        {row.description}
                      </Text>
                      <Text style={styles.meta}>
                        {row.date} · {row.type === 'expense' ? 'Gasto' : 'Ingreso'}
                        {row.duplicate ? ' · Posible duplicado' : ''}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.amount,
                        row.type === 'income' ? styles.income : styles.expense,
                      ]}
                    >
                      {row.type === 'expense' ? '−' : '+'}
                      {row.amount.toFixed(2)} {row.currency}
                    </Text>
                  </Pressable>
                  {row.type === 'expense' && row.selected ? (
                    <Pressable onPress={() => cycleCategory(row.id)} style={styles.category}>
                      <Text style={styles.categoryText}>
                        Categoría: {category?.name ?? 'Seleccionar'} · tocar para cambiar
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
          <AppButton label={`Importar ${selectedCount} movimientos`} loading={loading} onPress={submit} />
        </>
      ) : null}
      <AppButton
        label="Cancelar"
        onPress={() => {
          setOpen(false);
          setRows([]);
          setErrors([]);
          setFileName('');
        }}
        variant="text"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  closedCard: {
    alignItems: 'center',
    backgroundColor: '#E8F0EC',
    borderColor: '#C5D8CF',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  closedText: { flex: 1, gap: 3, minWidth: 220 },
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  fileName: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 13 },
  reviewHeader: { gap: 3 },
  reviewTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  reviewNote: { color: colors.warning, fontSize: 11, lineHeight: 16 },
  rows: { gap: spacing.sm },
  row: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  rowDisabled: { opacity: 0.52 },
  rowMain: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '900' },
  rowText: { flex: 1, gap: 2 },
  description: { color: colors.text, fontSize: 13, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 10 },
  amount: { fontSize: 12, fontWeight: '900' },
  income: { color: colors.primary },
  expense: { color: colors.danger },
  category: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  categoryText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
});
