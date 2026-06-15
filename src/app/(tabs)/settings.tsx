import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card, PrimaryButton, ScreenTitle, SectionLabel, SegmentedControl } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportCSV } from '@/lib/export';
import { currentMonthKey, monthLabel } from '@/lib/format';
import { useStore } from '@/store/useStore';

type ThemeMode = 'light' | 'system' | 'dark';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const mk = currentMonthKey();

  const targets = useStore((s) => s.targets);
  const target = targets.find((t) => t.month === mk);
  const setTarget = useStore((s) => s.setTarget);
  const settings = useStore((s) => s.settings);
  const setCurrencySymbol = useStore((s) => s.setCurrencySymbol);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const addPaymentMethod = useStore((s) => s.addPaymentMethod);
  const removePaymentMethod = useStore((s) => s.removePaymentMethod);
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const resetAll = useStore((s) => s.resetAll);
  const setTheme = useStore((s) => s.setTheme);

  const [incomeTarget, setIncomeTarget] = useState(target?.incomeTarget ? String(target.incomeTarget) : '');
  const [expenseLimit, setExpenseLimit] = useState(target?.expenseLimit ? String(target.expenseLimit) : '');
  const [newPm, setNewPm] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedTarget, setSavedTarget] = useState(false);

  const num = (s: string) => {
    const n = Number(s.replace(/[^\d.]/g, ''));
    return isFinite(n) ? n : 0;
  };

  function saveTarget() {
    setTarget(mk, { incomeTarget: num(incomeTarget), expenseLimit: expenseLimit ? num(expenseLimit) : undefined });
    setSavedTarget(true);
    setTimeout(() => setSavedTarget(false), 1500);
  }

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  return (
    <Screen>
      <ScreenTitle>Settings</ScreenTitle>

      <SectionLabel>Appearance</SectionLabel>
      <Card>
        <SegmentedControl<ThemeMode>
          value={(settings.theme ?? 'light') as ThemeMode}
          onChange={(v) => setTheme(v)}
          options={[
            { label: 'Light', value: 'light' },
            { label: 'System', value: 'system' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Card>

      <SectionLabel style={styles.blockLabel}>Monthly target · {monthLabel(mk)}</SectionLabel>
      <Card style={styles.gap}>
        <View>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Income target ({settings.currencySymbol})</Text>
          <TextInput
            value={incomeTarget}
            onChangeText={setIncomeTarget}
            onBlur={saveTarget}
            keyboardType="numeric"
            placeholder="e.g. 50000"
            placeholderTextColor={theme.tertiary}
            style={inputStyle}
          />
        </View>
        <View>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Expense limit (optional)</Text>
          <TextInput
            value={expenseLimit}
            onChangeText={setExpenseLimit}
            onBlur={saveTarget}
            keyboardType="numeric"
            placeholder="e.g. 30000"
            placeholderTextColor={theme.tertiary}
            style={inputStyle}
          />
        </View>
        <PrimaryButton title={savedTarget ? 'Saved ✓' : 'Save target'} onPress={saveTarget} />
      </Card>

      <SectionLabel style={styles.blockLabel}>Payment methods</SectionLabel>
      <Card style={styles.gap}>
        <View style={styles.pmWrap}>
          {paymentMethods.map((p) => (
            <View key={p} style={[styles.pmChip, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.pmText, { color: theme.text }]}>{p}</Text>
              <Pressable onPress={() => removePaymentMethod(p)} hitSlop={6}>
                <Ionicons name="close-circle" size={17} color={theme.tertiary} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={newPm}
            onChangeText={setNewPm}
            placeholder="Add method"
            placeholderTextColor={theme.tertiary}
            style={[inputStyle, styles.flex1]}
          />
          <PrimaryButton
            title="Add"
            onPress={() => {
              if (newPm.trim()) {
                addPaymentMethod(newPm.trim());
                setNewPm('');
              }
            }}
          />
        </View>
      </Card>

      <SectionLabel style={styles.blockLabel}>Currency symbol</SectionLabel>
      <Card>
        <TextInput
          value={settings.currencySymbol}
          onChangeText={setCurrencySymbol}
          maxLength={3}
          placeholderTextColor={theme.tertiary}
          style={[inputStyle, styles.currency]}
        />
      </Card>

      <SectionLabel style={styles.blockLabel}>Categories</SectionLabel>
      <Pressable onPress={() => router.push('/categories')}>
        <Card style={styles.rowBetween}>
          <Text style={[styles.rowText, { color: theme.text }]}>Manage categories</Text>
          <View style={styles.rowRight}>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{categories.length}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.tertiary} />
          </View>
        </Card>
      </Pressable>

      <SectionLabel style={styles.blockLabel}>Data</SectionLabel>
      <Card style={styles.gapSmall}>
        <PrimaryButton title="Export CSV" onPress={() => exportCSV(transactions, categories)} />
        <PrimaryButton
          title={confirmReset ? 'Tap again to confirm reset' : 'Reset all data'}
          variant="ghost"
          color={theme.expense}
          onPress={() => {
            if (confirmReset) {
              resetAll();
              setConfirmReset(false);
              setIncomeTarget('');
              setExpenseLimit('');
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
        />
      </Card>

      <Text style={[styles.about, { color: theme.tertiary }]}>
        Onylogy Finance Tracking · v1{'\n'}All data stored privately on your device
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.three },
  gapSmall: { gap: Spacing.two },
  blockLabel: { marginTop: Spacing.five },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { height: 46, borderRadius: Radius.field, paddingHorizontal: Spacing.three, fontSize: 15 },
  flex1: { flex: 1 },
  currency: { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  pmWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pmChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: Spacing.three, paddingRight: 10, paddingVertical: 9, borderRadius: Radius.pill },
  pmText: { fontSize: 14, fontWeight: '500' },
  addRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  rowValue: { fontSize: 15, fontWeight: '500' },
  about: { textAlign: 'center', marginTop: Spacing.five, lineHeight: 20, fontSize: 13, fontWeight: '500' },
});
