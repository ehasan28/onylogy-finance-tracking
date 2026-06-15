import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { Finance, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentMonthKey, monthLabel, todayISO } from '@/lib/format';

function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.card }]}>{children}</View>
      </View>
    </Modal>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Pick a month (YYYY-MM). Future months are disabled. */
export function MonthPickerSheet({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  onSelect: (mk: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [year, setYear] = useState(() => Number(value.slice(0, 4)));
  useEffect(() => {
    if (visible) setYear(Number(value.slice(0, 4)));
  }, [visible, value]);

  const cur = currentMonthKey();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={10} onPress={() => setYear((y) => y - 1)}>
          <ThemedText style={styles.arrow}>‹</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">{year}</ThemedText>
        <Pressable hitSlop={10} disabled={year >= 9999} onPress={() => setYear((y) => y + 1)}>
          <ThemedText style={styles.arrow}>›</ThemedText>
        </Pressable>
      </View>
      <View style={styles.monthGrid}>
        {MONTHS.map((m, i) => {
          const mk = `${year}-${String(i + 1).padStart(2, '0')}`;
          const active = mk === value.slice(0, 7);
          const future = mk > cur;
          return (
            <Pressable
              key={m}
              disabled={future}
              onPress={() => onSelect(mk)}
              style={[
                styles.monthCell,
                { backgroundColor: active ? Finance.primary : theme.backgroundElement },
                future && styles.dim,
              ]}>
              <ThemedText type="smallBold" style={{ color: active ? '#fff' : theme.text }}>
                {m}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Pick a specific date (YYYY-MM-DD) from a calendar. Future dates are disabled. */
export function DatePickerSheet({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  onSelect: (d: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [vm, setVm] = useState(() => value.slice(0, 7));
  useEffect(() => {
    if (visible) setVm(value.slice(0, 7));
  }, [visible, value]);

  const today = todayISO();
  const first = dayjs(vm + '-01');
  const daysInMonth = first.daysInMonth();
  const startWeekday = first.day();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const canGoNext = dayjs(vm + '-01').add(1, 'month').format('YYYY-MM') <= currentMonthKey();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={10} onPress={() => setVm((m) => dayjs(m + '-01').subtract(1, 'month').format('YYYY-MM'))}>
          <ThemedText style={styles.arrow}>‹</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{monthLabel(vm)}</ThemedText>
        <Pressable
          hitSlop={10}
          disabled={!canGoNext}
          onPress={() => setVm((m) => dayjs(m + '-01').add(1, 'month').format('YYYY-MM'))}>
          <ThemedText style={[styles.arrow, !canGoNext && styles.dim]}>›</ThemedText>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekday}>
            {w}
          </ThemedText>
        ))}
      </View>
      <View style={styles.dayGrid}>
        {cells.map((d, idx) => {
          if (d === null) return <View key={`b${idx}`} style={styles.dayCell} />;
          const ds = `${vm}-${String(d).padStart(2, '0')}`;
          const active = ds === value;
          const future = ds > today;
          const isToday = ds === today;
          return (
            <Pressable key={ds} disabled={future} onPress={() => onSelect(ds)} style={styles.dayCell}>
              <View style={[styles.dayInner, active && { backgroundColor: Finance.primary }, future && styles.dim]}>
                <ThemedText
                  type="small"
                  style={{
                    color: active ? '#fff' : isToday ? Finance.primary : theme.text,
                    fontWeight: active || isToday ? '700' : '500',
                  }}>
                  {d}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.todayBtn}>
        <PrimaryButton title="Today" variant="ghost" onPress={() => onSelect(today)} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: { width: '100%', maxWidth: 360, borderRadius: Radius.lg, padding: Spacing.four },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  arrow: { fontSize: 28, fontWeight: '700', paddingHorizontal: Spacing.two },
  dim: { opacity: 0.3 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  monthCell: {
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.one },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  todayBtn: { marginTop: Spacing.three },
});
