import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, IconCircle, PrimaryButton, SectionLabel, SegmentedControl } from '@/components/ui';
import { GroupColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import type { Category, TxType } from '@/types';

const ICON_CHOICES = [
  'pricetag-outline', 'cart-outline', 'cash-outline', 'card-outline', 'home-outline',
  'restaurant-outline', 'fast-food-outline', 'cafe-outline', 'bus-outline', 'car-outline',
  'leaf-outline', 'paw-outline', 'flask-outline', 'water-outline', 'flash-outline',
  'briefcase-outline', 'people-outline', 'globe-outline', 'wifi-outline', 'phone-portrait-outline',
  'medkit-outline', 'school-outline', 'book-outline', 'gift-outline', 'heart-outline',
  'moon-outline', 'build-outline', 'shirt-outline', 'barbell-outline', 'game-controller-outline',
];

export default function CategoriesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [group, setGroup] = useState('');
  const [icon, setIcon] = useState('pricetag-outline');

  const groupsForType = [...new Set(categories.filter((c) => c.type === type).map((c) => c.group))];

  function add() {
    const n = name.trim();
    if (!n) return;
    const g = group.trim() || 'Other';
    addCategory({ name: n, type, group: g, icon, color: GroupColors[g] ?? GroupColors.Other });
    setName('');
    setIcon('pricetag-outline');
  }

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  return (
    <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.accent} />
          <Text style={[styles.backText, { color: theme.accent }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SectionLabel>Add category</SectionLabel>
        <Card style={styles.gap}>
          <SegmentedControl<TxType>
            value={type}
            onChange={setType}
            options={[
              { label: 'Expense', value: 'expense', color: theme.expense },
              { label: 'Income', value: 'income', color: theme.income },
            ]}
          />
          <View style={styles.previewRow}>
            <IconCircle name={icon} color={GroupColors[group.trim()] ?? theme.accent} size={44} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name (e.g. Fuel)"
              placeholderTextColor={theme.tertiary}
              style={[inputStyle, styles.flex1]}
            />
          </View>
          <TextInput
            value={group}
            onChangeText={setGroup}
            placeholder="Group (e.g. Farming)"
            placeholderTextColor={theme.tertiary}
            style={inputStyle}
          />
          {groupsForType.length > 0 && (
            <View style={styles.hints}>
              {groupsForType.map((g) => (
                <Pressable key={g} onPress={() => setGroup(g)} style={[styles.hint, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.hintText, { color: theme.textSecondary }]}>{g}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View>
            <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconRow}
              keyboardShouldPersistTaps="handled">
              {ICON_CHOICES.map((ic) => {
                const active = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setIcon(ic)}
                    style={[styles.iconPick, { backgroundColor: active ? theme.accent : theme.backgroundElement }]}>
                    <Ionicons name={ic as keyof typeof Ionicons.glyphMap} size={20} color={active ? '#fff' : theme.textSecondary} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <PrimaryButton title="Add category" onPress={add} disabled={!name.trim()} />
        </Card>

        <CategoryList title="Income" items={categories.filter((c) => c.type === 'income')} onDelete={deleteCategory} />
        <CategoryList title="Expense" items={categories.filter((c) => c.type === 'expense')} onDelete={deleteCategory} />
      </ScrollView>
    </View>
  );
}

function CategoryList({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: Category[];
  onDelete: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <>
      <SectionLabel style={styles.blockLabel}>{title}</SectionLabel>
      <Card style={styles.listCard}>
        {items.map((c, i) => (
          <View key={c.id}>
            <View style={styles.catRow}>
              <IconCircle name={c.icon} color={c.color} size={38} />
              <View style={styles.flex1}>
                <Text style={[styles.catName, { color: theme.text }]}>{c.name}</Text>
                <Text style={[styles.catGroup, { color: theme.textSecondary }]}>{c.group}</Text>
              </View>
              <Pressable onPress={() => onDelete(c.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={19} color={theme.textSecondary} />
              </Pressable>
            </View>
            {i < items.length - 1 && <View style={[styles.sep, { backgroundColor: theme.separator }]} />}
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex1: { flex: 1 },
  spacer: { width: 64 },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 64 },
  backText: { fontSize: 16, fontWeight: '400', marginLeft: -2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  body: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six, maxWidth: 600, width: '100%', alignSelf: 'center' },
  gap: { gap: Spacing.three },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  input: { height: 46, borderRadius: Radius.field, paddingHorizontal: Spacing.three, fontSize: 15 },
  hints: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  hint: { paddingHorizontal: Spacing.three, paddingVertical: 7, borderRadius: Radius.pill },
  hintText: { fontSize: 13, fontWeight: '500' },
  pickLabel: { fontSize: 13, fontWeight: '500', marginBottom: Spacing.two },
  iconRow: { gap: Spacing.two, paddingRight: Spacing.three },
  iconPick: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  blockLabel: { marginTop: Spacing.five },
  listCard: { paddingVertical: Spacing.one },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two, paddingHorizontal: Spacing.one },
  catName: { fontSize: 16, fontWeight: '500' },
  catGroup: { fontSize: 13, fontWeight: '400', marginTop: 1 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
});
