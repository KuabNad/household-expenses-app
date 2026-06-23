import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import type { SummaryLine } from '../utils/summary';
import { formatMoney } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 88;

function point(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(radians),
    y: CENTER + RADIUS * Math.sin(radians),
  };
}

function slicePath(startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.99) {
    const top = point(0);
    const bottom = point(180);
    return [
      `M ${CENTER} ${CENTER}`,
      `L ${top.x} ${top.y}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${bottom.x} ${bottom.y}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${top.x} ${top.y}`,
      'Z',
    ].join(' ');
  }
  const start = point(endAngle);
  const end = point(startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export function InteractivePieChart({
  items,
  selectedCategoryId,
  onSelect,
  onOpenCategory,
}: {
  items: SummaryLine[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onOpenCategory?: (categoryId: string) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  let angle = 0;
  const slices = items.map((item) => {
    const startAngle = angle;
    angle += total ? (item.amount / total) * 360 : 0;
    return { ...item, startAngle, endAngle: angle };
  });

  return (
    <View style={styles.container}>
      <Svg accessibilityLabel="Gráfico circular de gastos por categoría" height={SIZE} width={SIZE}>
        <G>
          {slices.map((slice, index) => {
            const selected = selectedCategoryId === slice.sourceId;
            return (
              <Path
                d={slicePath(slice.startAngle, slice.endAngle)}
                fill={slice.color ?? colors.chart[index % colors.chart.length]}
                key={slice.id}
                onPress={() => onSelect(selected ? null : slice.sourceId ?? null)}
                opacity={selectedCategoryId && !selected ? 0.3 : 1}
                stroke={colors.surface}
                strokeWidth={selected ? 5 : 2}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.legend}>
        {items.map((item, index) => {
          const selected = selectedCategoryId === item.sourceId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(selected ? null : item.sourceId ?? null)}
              style={[styles.legendItem, selected && styles.legendSelected]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.color ?? colors.chart[index % colors.chart.length] },
                ]}
              />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendAmount}>{formatMoney(item.amount, item.currency)}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedCategoryId ? (
        <View style={styles.selectedActions}>
          {onOpenCategory ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenCategory(selectedCategoryId)}
              style={styles.open}
            >
              <Text style={styles.openText}>Ver gastos de esta categoría</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => onSelect(null)} style={styles.clear}>
            <Text style={styles.clearText}>Mostrar todas las categorías</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.hint}>Pulsa una porción o categoría para filtrar el panel.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md },
  legend: { gap: spacing.sm, width: '100%' },
  legendItem: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  legendSelected: { backgroundColor: colors.primaryLight },
  dot: { borderRadius: 6, height: 12, width: 12 },
  legendLabel: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '600' },
  legendAmount: { color: colors.text, fontSize: 13, fontWeight: '800' },
  clear: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  selectedActions: { gap: spacing.sm, width: '100%' },
  open: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  openText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
