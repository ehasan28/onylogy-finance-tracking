import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CountUpMoney, ProgressBar } from '@/components/animated';
import { MonthPickerSheet } from '@/components/pickers';
import { Screen } from '@/components/screen';
import { TransactionRow } from '@/components/transaction-row';
import { Amount, Card, SectionLabel } from '@/components/ui';
import { GroupColors, Spacing, Tabular } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { byMonth, catMap, groupTotals, totals } from '@/lib/calc';
import { addMonths, currentMonthKey, money, monthLabel } from '@/lib/format';
import { useStore } from '@/store/useStore';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();

  const hydrated = useStore((s) => s.hydrated);
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const targets = useStore((s) => s.targets);
  const symbol = useStore((s) => s.settings.currencySymbol);

  const [mk, setMk] = useState(currentMonthKey());
  const [monthPicker, setMonthPicker] = useState(false);

  const monthTx = useMemo(() => byMonth(transactions, mk), [transactions, mk]);
  const t = useMemo(() => totals(monthTx), [monthTx]);
  const incomeGroups = useMemo(() => groupTotals(monthTx, categories, 'income'), [monthTx, categories]);
  const cmap = useMemo(() => catMap(categories), [categories]);
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
        .slice(0, 5),
    [transactions]
  );

  const target = targets.find((x) => x.month === mk);
  const pct = target && target.incomeTarget > 0 ? (t.income / target.incomeTarget) * 100 : 0;
  const sources = Object.entries(incomeGroups).sort((a, b) => b[1] - a[1]);
  const isCurrent = mk >= currentMonthKey();

  if (!hydrated) {
    return (
      <Screen scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Month */}
      <View style={styles.monthRow}>
        <Pressable hitSlop={10} onPress={() => setMk((m) => addMonths(m, -1))}>
          <Ionicons name="chevron-back" size={22} color={theme.tertiary} />
        </Pressable>
        <Pressable accessibilityLabel="Pick month" onPress={() => setMonthPicker(true)} hitSlop={8} style={styles.monthBtn}>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel(mk)}</Text>
          <Ionicons name="chevron-down" size={15} color={theme.textSecondary} />
        </Pressable>
        <Pressable hitSlop={10} disabled={isCurrent} onPress={() => setMk((m) => addMonths(m, 1))}>
          <Ionicons name="chevron-forward" size={22} color={isCurrent ? theme.separator : theme.tertiary} />
        </Pressable>
      </View>

      {/* Hero */}
      <Animated.View entering={FadeInDown.duration(360)}>
        <Card style={styles.hero}>
          <Text style={[styles.heroCaption, { color: theme.textSecondary }]}>Net balance · this month</Text>
          <CountUpMoney value={t.balance} symbol={symbol} style={[styles.balance, { color: theme.text }, Tabular]} />
          <View style={[styles.heroDivider, { backgroundColor: theme.separator }]} />
          <View style={styles.heroRow}>
            <View style={styles.heroCol}>
              <Text style={[styles.heroColLabel, { color: theme.textSecondary }]}>Income</Text>
              <CountUpMoney value={t.income} symbol={symbol} style={[styles.heroSub, { color: theme.income }, Tabular]} />
            </View>
            <View style={[styles.heroVDivider, { backgroundColor: theme.separator }]} />
            <View style={styles.heroCol}>
              <Text style={[styles.heroColLabel, { color: theme.textSecondary }]}>Expense</Text>
              <CountUpMoney value={t.expense} symbol={symbol} style={[styles.heroSub, { color: theme.expense }, Tabular]} />
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Income target */}
      {target && target.incomeTarget > 0 ? (
        <Card style={styles.block}>
          <View style={styles.rowBetween}>
            <SectionLabel style={styles.noMargin}>Income target</SectionLabel>
            <Text style={[styles.pct, { color: theme.accent }]}>{Math.round(pct)}%</Text>
          </View>
          <View style={styles.targetBar}>
            <ProgressBar pct={pct} color={theme.accent} />
          </View>
          <Text style={[styles.subCaption, { color: theme.tertiary }]}>
            {money(t.income, symbol)} of {money(target.incomeTarget, symbol)}
          </Text>
        </Card>
      ) : (
        <Pressable style={styles.block} onPress={() => router.push('/settings')}>
          <Card style={styles.hintCard}>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>Set a monthly income target</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.tertiary} />
          </Card>
        </Pressable>
      )}

      {/* Income by source */}
      {sources.length > 0 && (
        <Animated.View entering={FadeInDown.duration(360).delay(80)} style={styles.block}>
          <SectionLabel>Income by source</SectionLabel>
          <Card style={styles.listCard}>
            {sources.map(([group, amt], i) => (
              <View key={group}>
                <View style={styles.sourceRow}>
                  <View style={[styles.dot, { backgroundColor: GroupColors[group] ?? GroupColors.Other }]} />
                  <Text style={[styles.sourceName, { color: theme.text }]}>{group}</Text>
                  <Amount value={amt} symbol={symbol} size={15} weight="500" />
                </View>
                {i < sources.length - 1 && <View style={[styles.sep, { backgroundColor: theme.separator }]} />}
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* Recent */}
      <View style={styles.block}>
        <View style={styles.recentHead}>
          <SectionLabel style={styles.noMargin}>Recent</SectionLabel>
          <Pressable onPress={() => router.push('/transactions')} hitSlop={8}>
            <Text style={[styles.seeAll, { color: theme.accent }]}>See all</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Card>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>No transactions yet. Tap ＋ to add your first.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {recent.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                category={cmap[tx.categoryId]}
                symbol={symbol}
                divider={i < recent.length - 1}
                onPress={() => router.push({ pathname: '/add', params: { id: tx.id } })}
              />
            ))}
          </Card>
        )}
      </View>

      <MonthPickerSheet
        visible={monthPicker}
        value={mk}
        onClose={() => setMonthPicker(false)}
        onSelect={(m) => {
          setMk(m);
          setMonthPicker(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingBottom: Spacing.three },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 17, fontWeight: '600' },

  hero: { paddingVertical: Spacing.four },
  heroCaption: { fontSize: 13, fontWeight: '500' },
  balance: { fontSize: 42, fontWeight: '700', letterSpacing: -0.5, marginTop: 4, lineHeight: 48 },
  heroDivider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroCol: { flex: 1, gap: 3 },
  heroColLabel: { fontSize: 13, fontWeight: '500' },
  heroSub: { fontSize: 19, fontWeight: '600' },
  heroVDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginHorizontal: Spacing.three },

  block: { marginTop: Spacing.four },
  noMargin: { marginBottom: 0 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pct: { fontSize: 13, fontWeight: '700' },
  targetBar: { marginTop: Spacing.two, marginBottom: Spacing.two },
  subCaption: { fontSize: 12, fontWeight: '500' },
  hintCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintText: { fontSize: 15, fontWeight: '500' },
  listCard: { paddingVertical: Spacing.one },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 11 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  sourceName: { flex: 1, fontSize: 15, fontWeight: '500' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 21 },
  seeAll: { fontSize: 15, fontWeight: '500' },
});
