import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CardShadow, Radius, Spacing, Tabular } from '@/constants/theme';
import { useColorMode, useTheme } from '@/hooks/use-theme';
import { money, signedMoney } from '@/lib/format';
import { tap as hapticTap } from '@/lib/haptics';
import type { TxType } from '@/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const mode = useColorMode();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: StyleSheet.hairlineWidth },
        mode === 'light' && CardShadow,
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.textSecondary }, style]}>{children}</Text>;
}

export function ScreenTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.screenTitle, { color: theme.text }, style]}>{children}</Text>;
}

export function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const theme = useTheme();
  const bg = selected ? color ?? theme.accent : theme.backgroundElement;
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color: selected ? '#fff' : theme.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Money text with tabular figures + semantic tone. */
export function Amount({
  value,
  type,
  symbol = '৳',
  size = 17,
  weight = '600',
  muted,
  style,
}: {
  value: number;
  type?: TxType;
  symbol?: string;
  size?: number;
  weight?: TextStyle['fontWeight'];
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const color = muted
    ? theme.textSecondary
    : type === 'income'
      ? theme.income
      : type === 'expense'
        ? theme.expense
        : theme.text;
  const text = type ? signedMoney(value, type, symbol) : money(value, symbol);
  return <Text style={[{ color, fontSize: size, fontWeight: weight }, Tabular, style]}>{text}</Text>;
}

/** Monochrome line icon inside a softly-tinted circle (replaces emoji squares). */
export function IconCircle({ name, color, size = 38 }: { name: string; color?: string; size?: number }) {
  const theme = useTheme();
  const c = color ?? theme.accent;
  const bg = c.startsWith('#') ? c + '22' : theme.accentSoft;
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Ionicons name={name as IoniconName} size={Math.round(size * 0.5)} color={c} />
    </View>
  );
}

/** iOS-style segmented control. Pass `color` on an option for a tinted thumb (e.g. green/red). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  const mode = useColorMode();
  return (
    <View style={[styles.segTrack, { backgroundColor: theme.backgroundElement }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        const thumb = opt.color ?? theme.card;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            onPress={() => {
              hapticTap();
              onChange(opt.value);
            }}
            style={[
              styles.segItem,
              active && { backgroundColor: thumb },
              active && !opt.color && mode === 'light' && (styles.segShadow as object),
            ]}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: active ? (opt.color ? '#fff' : theme.text) : theme.textSecondary,
              }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  color,
  disabled,
  haptic = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  color?: string;
  disabled?: boolean;
  haptic?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const accent = color ?? theme.accent;
  const bg = variant === 'ghost' ? 'transparent' : accent;
  const fg = variant === 'ghost' ? accent : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={() => {
        if (haptic) hapticTap();
        onPress?.();
      }}>
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: bg },
          variant === 'ghost' && styles.btnGhost,
          disabled && styles.btnDisabled,
          aStyle,
        ]}>
        <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, padding: Spacing.three },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.two, letterSpacing: 0.2 },
  screenTitle: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2, marginBottom: Spacing.four },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: 9, borderRadius: Radius.pill, marginRight: Spacing.two },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  segTrack: { flexDirection: 'row', borderRadius: Radius.md, padding: 3, gap: 3 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  segShadow: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
    default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  }),
  btn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  btnGhost: { height: 46 },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 17, fontWeight: '600' },
});
