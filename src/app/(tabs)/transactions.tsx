import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { TransactionRow } from '@/components/transaction-row';
import { Card, Chip, ScreenTitle, SegmentedControl } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { catMap } from '@/lib/calc';
import { dayLabel, money } from '@/lib/format';
import { useStore } from '@/store/useStore';
import type { Transaction, TxType } from '@/types';

type TypeFilter = 'all' | TxType;

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const symbol = useStore((s) => s.settings.currencySymbol);
  const cmap = useMemo(() => catMap(categories), [categories]);

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [group, setGroup] = useState<string | null>(null);

  const groups = useMemo(() => [...new Set(categories.map((c) => c.group))], [categories]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      const c = cmap[t.categoryId];
      if (group && c?.group !== group) return false;
      if (qq) {
        const hay = `${c?.name ?? ''} ${t.note ?? ''} ${t.paymentMethod ?? ''}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, group, q, cmap]);

  const sections = useMemo(() => {
    const byDate = new Map<string, Transaction[]>();
    const sorted = [...filtered].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
    );
    for (const t of sorted) {
      const arr = byDate.get(t.date) ?? [];
      arr.push(t);
      byDate.set(t.date, arr);
    }
    return [...byDate.entries()].map(([date, items]) => {
      let net = 0;
      for (const t of items) net += t.type === 'income' ? t.amount : -t.amount;
      return { date, items, net };
    });
  }, [filtered]);

  return (
    <Screen>
      <ScreenTitle>History</ScreenTitle>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search notes, category, payment…"
        placeholderTextColor={theme.tertiary}
        style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      <View style={styles.filterGap}>
        <SegmentedControl<TypeFilter>
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Income', value: 'income', color: theme.income },
            { label: 'Expense', value: 'expense', color: theme.expense },
          ]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.groupRow}>
        <Chip label="All groups" selected={group === null} onPress={() => setGroup(null)} />
        {groups.map((g) => (
          <Chip key={g} label={g} selected={group === g} onPress={() => setGroup((cur) => (cur === g ? null : g))} />
        ))}
      </ScrollView>

      {sections.length === 0 ? (
        <Card>
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No transactions match.</Text>
        </Card>
      ) : (
        sections.map((sec) => (
          <View key={sec.date} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{dayLabel(sec.date)}</Text>
              <Text style={[styles.dayNet, { color: theme.tertiary }]}>{money(sec.net, symbol)}</Text>
            </View>
            <Card style={styles.listCard}>
              {sec.items.map((tx, i) => (
                <Animated.View key={tx.id} layout={LinearTransition.duration(220)}>
                  <TransactionRow
                    tx={tx}
                    category={cmap[tx.categoryId]}
                    symbol={symbol}
                    divider={i < sec.items.length - 1}
                    onPress={() => router.push({ pathname: '/add', params: { id: tx.id } })}
                  />
                </Animated.View>
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { height: 46, borderRadius: Radius.field, paddingHorizontal: Spacing.three, fontSize: 15, marginBottom: Spacing.three },
  filterGap: { marginBottom: Spacing.three },
  hScroll: { flexGrow: 0 },
  groupRow: { gap: Spacing.two, paddingBottom: Spacing.three, paddingRight: Spacing.three, alignItems: 'center' },
  empty: { fontSize: 15, fontWeight: '500' },
  section: { marginBottom: Spacing.four },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.two,
  },
  dayLabel: { fontSize: 13, fontWeight: '600' },
  dayNet: { fontSize: 13, fontWeight: '500' },
  listCard: { paddingVertical: Spacing.one },
});
