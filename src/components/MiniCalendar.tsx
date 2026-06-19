import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toDateInput } from '../utils/format';
import { colors, radius, spacing } from '../utils/theme';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MiniCalendar({
  value,
  maximumDate = new Date(),
  onChange,
  onClose,
}: {
  value: string;
  maximumDate?: Date;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const selected = new Date(`${value}T12:00:00`);
  const [viewMonth, setViewMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const days = useMemo(() => {
    const mondayOffset = (viewMonth.getDay() + 6) % 7;
    const start = new Date(viewMonth);
    start.setDate(1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [viewMonth]);

  const moveMonth = (offset: number) => {
    setViewMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Mes anterior" hitSlop={8} onPress={() => moveMonth(-1)}>
          <Ionicons color={colors.primary} name="chevron-back" size={23} />
        </Pressable>
        <Text style={styles.month}>
          {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(viewMonth)}
        </Text>
        <Pressable accessibilityLabel="Mes siguiente" hitSlop={8} onPress={() => moveMonth(1)}>
          <Ionicons color={colors.primary} name="chevron-forward" size={23} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((weekday, index) => (
          <View key={`${weekday}-${index}`} style={styles.cell}>
            <Text style={styles.weekday}>{weekday}</Text>
          </View>
        ))}
        {days.map((day) => {
          const key = toDateInput(day);
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const isSelected = key === value;
          const disabled = day > maximumDate;
          return (
            <Pressable
              accessibilityLabel={key}
              disabled={disabled}
              key={key}
              onPress={() => {
                onChange(key);
                onClose();
              }}
              style={[styles.cell, isSelected && styles.selectedCell]}
            >
              <Text
                style={[
                  styles.day,
                  !isCurrentMonth && styles.outsideDay,
                  disabled && styles.disabledDay,
                  isSelected && styles.selectedDay,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          onChange(toDateInput(new Date()));
          onClose();
        }}
        style={styles.today}
      >
        <Text style={styles.todayText}>Hoy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 360,
    padding: spacing.md,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  month: { color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    width: '14.2857%',
  },
  weekday: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  day: { color: colors.text, fontSize: 14, fontWeight: '600' },
  outsideDay: { color: '#B0B7B3' },
  disabledDay: { color: colors.border },
  selectedCell: { backgroundColor: colors.primary },
  selectedDay: { color: colors.white, fontWeight: '900' },
  today: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  todayText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
});
