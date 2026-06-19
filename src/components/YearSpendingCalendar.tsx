import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Currency } from '../types/models';
import { formatMoney } from '../utils/format';
import type { MonthSpendingSummary } from '../utils/summary';
import { colors, radius, spacing } from '../utils/theme';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const LOW_COLOR = '#6F9FC1';
const HIGH_COLOR = '#C95C54';

function interpolateColor(start: string, end: string, amount: number) {
  const startRgb = start.match(/\w\w/g)?.map((value) => Number.parseInt(value, 16)) ?? [];
  const endRgb = end.match(/\w\w/g)?.map((value) => Number.parseInt(value, 16)) ?? [];
  const channels = startRgb.map((value, index) =>
    Math.round(value + (endRgb[index] - value) * amount),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function compactMoney(amount: number, currency: Currency) {
  if (amount < 10000) return formatMoney(amount, currency);
  return new Intl.NumberFormat('es-ES', {
    currency,
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
  }).format(amount);
}

export function YearSpendingCalendar({
  months,
  selectedMonth,
  year,
  onSelect,
}: {
  months: MonthSpendingSummary[];
  selectedMonth: string;
  year: number;
  onSelect: (month: string) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Calendario anual · {year}</Text>
          <Text style={styles.subtitle}>Toca un mes para abrir su resumen</Text>
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Menos</Text>
          <View style={[styles.legendDot, { backgroundColor: LOW_COLOR }]} />
          <View style={[styles.legendDot, { backgroundColor: HIGH_COLOR }]} />
          <Text style={styles.legendText}>Más</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {months.map((item, index) => {
          const isSelected = selectedMonth === item.month;
          const backgroundColor = item.hasExpenses
            ? interpolateColor(LOW_COLOR, HIGH_COLOR, item.intensity)
            : item.isFuture
              ? '#F1F3F2'
              : '#E4EDF2';
          const usesDarkText = !item.hasExpenses;

          return (
            <Pressable
              accessibilityLabel={`Abrir ${MONTHS[index]} de ${year}`}
              key={item.month}
              onPress={() => onSelect(item.month)}
              style={({ pressed }) => [
                styles.monthCell,
                { backgroundColor },
                isSelected && styles.selectedCell,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.monthName, usesDarkText && styles.emptyText]}>
                {MONTHS[index]}
              </Text>
              {Object.entries(item.totals).length ? (
                Object.entries(item.totals)
                  .slice(0, 2)
                  .map(([currency, amount]) => (
                    <Text
                      key={currency}
                      numberOfLines={1}
                      style={[styles.monthTotal, usesDarkText && styles.emptyText]}
                    >
                      {compactMoney(amount ?? 0, currency as Currency)}
                    </Text>
                  ))
              ) : (
                <Text style={[styles.monthTotal, styles.emptyText]}>—</Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>
        Con varias monedas, el color compara cada moneda por separado. Los meses futuros
        incluyen los gastos recurrentes previstos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  legend: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  legendText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  legendDot: { borderRadius: 5, height: 10, width: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '2.5%',
    rowGap: spacing.sm,
  },
  monthCell: {
    borderColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 3,
    gap: 2,
    minHeight: 72,
    padding: spacing.sm,
    width: '23.125%',
  },
  selectedCell: { borderColor: colors.primary },
  pressed: { opacity: 0.78 },
  monthName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  monthTotal: { color: colors.white, fontSize: 10, fontWeight: '700' },
  emptyText: { color: colors.muted },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
