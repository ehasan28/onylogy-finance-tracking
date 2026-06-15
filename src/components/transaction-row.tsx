import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Amount, IconCircle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayLabel } from '@/lib/format';
import type { Category, Transaction } from '@/types';

export function TransactionRow({
  tx,
  category,
  symbol,
  onPress,
  divider,
}: {
  tx: Transaction;
  category?: Category;
  symbol: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  const theme = useTheme();
  const meta = [dayLabel(tx.date), tx.paymentMethod, tx.note].filter(Boolean).join('  ·  ');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.inner}>
        <IconCircle name={category?.icon ?? 'pricetag-outline'} color={category?.color} size={40} />
        <View style={styles.mid}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {category?.name ?? 'Unknown'}
          </Text>
          {!!meta && (
            <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        <Amount value={tx.amount} type={tx.type} symbol={symbol} size={16} weight="500" />
      </View>
      {divider && <View style={[styles.sep, { backgroundColor: theme.separator }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.55 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 9 },
  mid: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '500' },
  sub: { fontSize: 13, fontWeight: '400' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 40 + Spacing.three },
});
