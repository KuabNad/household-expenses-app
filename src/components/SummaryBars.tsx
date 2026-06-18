import { StyleSheet, Text, View } from 'react-native';
import type { SummaryLine } from '../utils/summary';
import { formatMoney } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';

export function SummaryBars({ items }: { items: SummaryLine[] }) {
  const maximum = Math.max(...items.map((item) => item.amount), 1);

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.labels}>
            <Text style={styles.name}>{item.label}</Text>
            <Text style={styles.amount}>{formatMoney(item.amount, item.currency)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: item.color ?? colors.chart[index % colors.chart.length],
                  width: `${Math.max((item.amount / maximum) * 100, 4)}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  item: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' },
  amount: { color: colors.text, fontSize: 14, fontWeight: '800' },
  track: { backgroundColor: '#EDF0EE', borderRadius: radius.sm, height: 8, overflow: 'hidden' },
  bar: { borderRadius: radius.sm, height: 8 },
});
