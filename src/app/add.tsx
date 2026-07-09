import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Keypad } from '@/components/keypad';
import { DatePickerSheet } from '@/components/pickers';
import { Chip, PrimaryButton, SectionLabel, SegmentedControl } from '@/components/ui';
import { Radius, Spacing, Tabular } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayLabel, formatAmount, todayISO } from '@/lib/format';
import { success as hapticSuccess } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import type { Category, TxType } from '@/types';

export default function AddScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const settings = useStore((s) => s.settings);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const params = useLocalSearchParams<{
    id?: string;
    from?: string;
    type?: string;
    amount?: string;
    categoryId?: string;
    paymentMethod?: string;
    date?: string;
    note?: string;
  }>();
  const editId = params.id;
  const existing = useStore((s) => (editId ? s.transactions.find((t) => t.id === editId) : undefined));
  const isEdit = !!existing;
  const fromVoice = params.from === 'voice' && !isEdit;
  const prefillType: TxType | undefined =
    params.type === 'income' || params.type === 'expense' ? params.type : undefined;

  const [type, setType] = useState<TxType>(existing?.type ?? prefillType ?? settings.defaultType);
  const [amountStr, setAmountStr] = useState(existing ? String(existing.amount) : params.amount ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? params.categoryId ?? null);
  const [dateISO, setDateISO] = useState(existing?.date ?? params.date ?? todayISO());
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(
    existing?.paymentMethod ?? params.paymentMethod ?? settings.lastPaymentMethod
  );
  const [note, setNote] = useState(existing?.note ?? params.note ?? '');
  const [savedFlash, setSavedFlash] = useState(false);
  const [datePicker, setDatePicker] = useState(false);

  const cats = useMemo(() => {
    const ofType = categories.filter((c) => c.type === type);
    const seen = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === type && !seen.has(t.categoryId)) seen.set(t.categoryId, t.createdAt);
    }
    const recentIds = [...seen.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    const recentSet = new Set(recentIds);
    const recent = recentIds.map((id) => ofType.find((c) => c.id === id)).filter(Boolean) as Category[];
    const rest = ofType.filter((c) => !recentSet.has(c.id));
    return [...recent, ...rest];
  }, [categories, transactions, type]);

  const amount = Number(amountStr || '0');
  const canSave = amount > 0 && !!categoryId;
  const tone = type === 'income' ? theme.income : theme.expense;
  const isToday = dateISO >= todayISO();

  function onKey(k: string) {
    setAmountStr((s) => {
      if (k === '.') {
        if (s.includes('.')) return s;
        return s === '' ? '0.' : s + '.';
      }
      if (s.includes('.')) {
        const dec = s.split('.')[1];
        if (dec.length >= 2) return s;
      }
      if (s.replace('.', '').length >= 9) return s;
      if (s === '0') return k;
      return s + k;
    });
  }
  const onBackspace = () => setAmountStr((s) => s.slice(0, -1));

  function changeType(next: TxType) {
    setType(next);
    if (categoryId) {
      const c = categories.find((x) => x.id === categoryId);
      if (c && c.type !== next) setCategoryId(null);
    }
  }

  function save(again: boolean) {
    if (!canSave) return;
    const payload = {
      type,
      amount,
      categoryId: categoryId!,
      date: dateISO,
      note: note.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
    };
    if (isEdit && editId) {
      updateTransaction(editId, payload);
      hapticSuccess();
      goBack();
      return;
    }
    addTransaction(payload);
    hapticSuccess();
    if (again) {
      setAmountStr('');
      setNote('');
      setCategoryId(null);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } else {
      goBack();
    }
  }

  function onDelete() {
    if (editId) {
      deleteTransaction(editId);
      hapticSuccess();
      goBack();
    }
  }

  const displayAmount = (() => {
    if (!amountStr) return '0';
    const [i, d] = amountStr.split('.');
    const gi = formatAmount(Number(i || '0'));
    return d !== undefined ? `${gi}.${d}` : gi;
  })();

  return (
    <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel="Cancel" onPress={goBack} hitSlop={8} style={styles.cancelBtn}>
          <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
        </Pressable>
        <View style={styles.segWrap}>
          <SegmentedControl<TxType>
            value={type}
            onChange={changeType}
            options={[
              { label: 'Expense', value: 'expense', color: theme.expense },
              { label: 'Income', value: 'income', color: theme.income },
            ]}
          />
        </View>
        <View style={styles.cancelBtn} />
      </View>

      {/* Amount */}
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: tone }, Tabular]}>৳{displayAmount}</Text>
        <Text style={[styles.amountSub, { color: theme.textSecondary }]}>
          {savedFlash
            ? 'Saved ✓'
            : isEdit
              ? 'Editing transaction'
              : fromVoice
                ? 'From voice · check & save'
                : type === 'income'
                  ? 'Money in'
                  : 'Money out'}
        </Text>
      </View>

      {/* Middle (scrollable) */}
      <ScrollView style={styles.middle} contentContainerStyle={styles.middleContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionLabel>Category</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.catRow}>
          {cats.map((c) => {
            const selected = c.id === categoryId;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Category ${c.name}`}
                onPress={() => setCategoryId(c.id)}
                style={styles.catItem}>
                <View style={[styles.catCircle, { backgroundColor: selected ? c.color : c.color + '22' }]}>
                  <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={24} color={selected ? '#fff' : c.color} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.catName, { color: selected ? theme.text : theme.textSecondary, fontWeight: selected ? '600' : '500' }]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.fieldRow}>
          <View style={styles.flex1}>
            <SectionLabel>Date</SectionLabel>
            <View style={[styles.stepper, { backgroundColor: theme.backgroundElement }]}>
              <Pressable hitSlop={8} onPress={() => setDateISO((d) => dayjs(d).subtract(1, 'day').format('YYYY-MM-DD'))}>
                <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
              </Pressable>
              <Pressable accessibilityLabel="Pick date" onPress={() => setDatePicker(true)} hitSlop={8} style={styles.dateLabelBtn}>
                <Text style={[styles.dateLabel, { color: theme.text }]}>{dayLabel(dateISO)}</Text>
                <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
              </Pressable>
              <Pressable hitSlop={8} disabled={isToday} onPress={() => setDateISO((d) => dayjs(d).add(1, 'day').format('YYYY-MM-DD'))}>
                <Ionicons name="chevron-forward" size={20} color={isToday ? theme.separator : theme.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>

        <SectionLabel>Payment method (optional)</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.chipRow}>
          {paymentMethods.map((p) => (
            <Chip key={p} label={p} selected={paymentMethod === p} onPress={() => setPaymentMethod((cur) => (cur === p ? undefined : p))} />
          ))}
        </ScrollView>

        <SectionLabel>Note (optional)</SectionLabel>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. lunch, bill, groceries"
          placeholderTextColor={theme.tertiary}
          style={[styles.note, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      </ScrollView>

      {/* Pinned: keypad + actions */}
      <View style={[styles.pinned, { borderTopColor: theme.separator, paddingBottom: insets.bottom + Spacing.two }]}>
        <Keypad onKey={onKey} onBackspace={onBackspace} />
        <View style={styles.actions}>
          <PrimaryButton title={isEdit ? 'Save changes' : 'Save'} color={tone} disabled={!canSave} onPress={() => save(false)} />
          {!isEdit && <PrimaryButton title="Save & add another" variant="ghost" color={tone} disabled={!canSave} onPress={() => save(true)} />}
          {isEdit && <PrimaryButton title="Delete" variant="ghost" color={theme.expense} onPress={onDelete} />}
        </View>
      </View>

      <DatePickerSheet
        visible={datePicker}
        value={dateISO}
        onClose={() => setDatePicker(false)}
        onSelect={(d) => {
          setDateISO(d);
          setDatePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex1: { flex: 1 },
  hScroll: { flexGrow: 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two },
  cancelBtn: { width: 64 },
  cancel: { fontSize: 16, fontWeight: '500' },
  segWrap: { flex: 1 },
  amountWrap: { alignItems: 'center', paddingVertical: Spacing.three, gap: 2 },
  amount: { fontSize: 46, fontWeight: '700', letterSpacing: -1, lineHeight: 52 },
  amountSub: { fontSize: 13, fontWeight: '500' },
  middle: { flex: 1 },
  middleContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  catRow: { gap: Spacing.three, paddingVertical: Spacing.one, paddingRight: Spacing.three, alignItems: 'flex-start' },
  catItem: { width: 64, alignItems: 'center', gap: 6 },
  catCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 12, textAlign: 'center' },
  fieldRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, height: 46, borderRadius: Radius.field },
  dateLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateLabel: { fontSize: 15, fontWeight: '600' },
  chipRow: { paddingVertical: Spacing.one, alignItems: 'center' },
  note: { height: 46, borderRadius: Radius.field, paddingHorizontal: Spacing.three, fontSize: 15 },
  pinned: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
});
