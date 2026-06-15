import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { Amount, Card, IconCircle, ScreenTitle, SectionLabel } from '@/components/ui';
import { GroupColors, Spacing, Tabular } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { byMonth, categoryTotals, farmingPL, groupTotals, totals } from '@/lib/calc';
import { addMonths, currentMonthKey, money, monthLabel, shortMonthLabel } from '@/lib/format';
import { useStore } from '@/store/useStore';

function VBar({ ratio, color }: { ratio: number; color: string }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withTiming(Math.max(0.02, Math.min(1, ratio)), { duration: 600 });
  }, [ratio, h]);
  const aStyle = useAnimatedStyle(() => ({ height: `${h.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, aStyle]} />
    </View>
  );
}

export default function ReportsScreen() {
  const theme = useTheme();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const symbol = useStore((s) => s.settings.currencySymbol);
  const [mk, setMk] = useState(currentMonthKey());

  const months = useMemo(() => {
    const arr: string[] = [];
    for (let i = 5; i >= 0; i--) arr.push(addMonths(currentMonthKey(), -i));
    return arr;
  }, []);

  const monthlyNet = useMemo(
    () =>
      months.map((m) => {
        const tt = totals(byMonth(transactions, m));
        return { m, net: tt.income - tt.expense };
      }),
    [months, transactions]
  );
  const maxNet = Math.max(1, ...monthlyNet.map((d) => Math.abs(d.net)));

  const monthTx = useMemo(() => byMonth(transactions, mk), [transactions, mk]);
  const t = useMemo(() => totals(monthTx), [monthTx]);
  const expenseCats = useMemo(() => categoryTotals(monthTx, categories, 'expense'), [monthTx, categories]);
  const farm = useMemo(() => farmingPL(monthTx, categories), [monthTx, categories]);
  const incomeGroups = useMemo(
    () => Object.entries(groupTotals(monthTx, categories, 'income')).sort((a, b) => b[1] - a[1]),
    [monthTx, categories]
  );

  const legend = expenseCats.slice(0, 6);
  const restAmount = expenseCats.slice(6).reduce((s, x) => s + x.amount, 0);
  const isCurrent = mk >= currentMonthKey();
  const hasAnything = transactions.length > 0;

  if (!hasAnything) {
    return (
      <Screen>
        <ScreenTitle>Reports</ScreenTitle>
        <Card>
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            Add some transactions and your charts, farming profit/loss, and breakdowns will appear here.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenTitle>Reports</ScreenTitle>

      <SectionLabel>Net balance · last 6 months</SectionLabel>
      <Card>
        <View style={styles.chartRow}>
          {monthlyNet.map((d) => (
            <View key={d.m} style={styles.barCol}>
              <VBar ratio={Math.abs(d.net) / maxNet} color={d.net >= 0 ? theme.income : theme.expense} />
              <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{shortMonthLabel(d.m).split(' ')[0]}</Text>
            </View>
          ))}
        </View>
        <View style={styles.captionRow}>
          <View style={[styles.dot, { backgroundColor: theme.income }]} />
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Surplus</Text>
          <View style={[styles.dot, { backgroundColor: theme.expense, marginLeft: Spacing.three }]} />
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Deficit</Text>
        </View>
      </Card>

      <View style={styles.monthRow}>
        <Pressable hitSlop={10} onPress={() => setMk((m) => addMonths(m, -1))}>
          <Ionicons name="chevron-back" size={22} color={theme.tertiary} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel(mk)}</Text>
        <Pressable hitSlop={10} disabled={isCurrent} onPress={() => setMk((m) => addMonths(m, 1))}>
          <Ionicons name="chevron-forward" size={22} color={isCurrent ? theme.separator : theme.tertiary} />
        </Pressable>
      </View>

      <SectionLabel>Farming profit / loss</SectionLabel>
      <Card style={styles.farmCard}>
        <View style={styles.farmCol}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Income</Text>
          <Text style={[styles.farmVal, { color: theme.income }, Tabular]}>{money(farm.income, symbol)}</Text>
        </View>
        <View style={styles.farmCol}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Expense</Text>
          <Text style={[styles.farmVal, { color: theme.expense }, Tabular]}>{money(farm.expense, symbol)}</Text>
        </View>
        <View style={styles.farmCol}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Profit</Text>
          <Text style={[styles.farmVal, { color: farm.profit >= 0 ? theme.income : theme.expense }, Tabular]}>
            {money(farm.profit, symbol)}
          </Text>
        </View>
      </Card>

      <SectionLabel style={styles.blockLabel}>Where money went · expenses</SectionLabel>
      <Card style={styles.gap}>
        {t.expense > 0 ? (
          <>
            <View style={[styles.stack, { backgroundColor: theme.backgroundElement }]}>
              {expenseCats.map((s) => (
                <View key={s.cat.id} style={{ flex: s.amount, backgroundColor: s.cat.color }} />
              ))}
            </View>
            {legend.map((s, i) => (
              <View key={s.cat.id} style={[styles.legendRow, i > 0 && styles.legendGap]}>
                <IconCircle name={s.cat.icon} color={s.cat.color} size={30} />
                <Text style={[styles.legendName, { color: theme.text }]} numberOfLines={1}>{s.cat.name}</Text>
                <Text style={[styles.legendVal, { color: theme.textSecondary }, Tabular]}>
                  {Math.round((s.amount / t.expense) * 100)}% · {money(s.amount, symbol)}
                </Text>
              </View>
            ))}
            {restAmount > 0 && (
              <View style={[styles.legendRow, styles.legendGap]}>
                <IconCircle name="ellipsis-horizontal" color={GroupColors.Other} size={30} />
                <Text style={[styles.legendName, { color: theme.text }]}>Other</Text>
                <Text style={[styles.legendVal, { color: theme.textSecondary }, Tabular]}>{money(restAmount, symbol)}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No expenses in {monthLabel(mk)}.</Text>
        )}
      </Card>

      {incomeGroups.length > 0 && (
        <>
          <SectionLabel style={styles.blockLabel}>Income by source</SectionLabel>
          <Card style={styles.listCard}>
            {incomeGroups.map(([g, amt], i) => (
              <View key={g}>
                <View style={styles.sourceRow}>
                  <View style={[styles.dot, { backgroundColor: GroupColors[g] ?? GroupColors.Other }]} />
                  <Text style={[styles.legendName, { color: theme.text }]}>{g}</Text>
                  <Amount value={amt} symbol={symbol} size={15} weight="500" />
                </View>
                {i < incomeGroups.length - 1 && <View style={[styles.sep, { backgroundColor: theme.separator }]} />}
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 15, fontWeight: '500' },
  muted: { fontSize: 13, fontWeight: '500' },
  gap: { gap: Spacing.two },
  blockLabel: { marginTop: Spacing.five },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: Spacing.two },
  barCol: { flex: 1, alignItems: 'center', gap: Spacing.one },
  barTrack: { height: 120, width: '58%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 3 },
  barLabel: { fontSize: 10, fontWeight: '500' },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.three },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four, marginTop: Spacing.five, marginBottom: Spacing.three },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  farmCard: { flexDirection: 'row', justifyContent: 'space-between' },
  farmCol: { gap: 3 },
  farmVal: { fontSize: 16, fontWeight: '600' },
  stack: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  legendGap: { marginTop: Spacing.three },
  legendName: { flex: 1, fontSize: 15, fontWeight: '500' },
  legendVal: { fontSize: 13, fontWeight: '500' },
  listCard: { paddingVertical: Spacing.one },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 11 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 21 },
});
