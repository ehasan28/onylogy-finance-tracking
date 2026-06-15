/**
 * Onylogy Finance — design tokens (Apple-minimal, near-monochrome).
 * Light + dark. One restrained green accent; red reserved for expense/destructive.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#ECECEF',
    backgroundElement: '#F2F2F7', // fill: inputs, chips, tracks
    backgroundSelected: '#E5E5EA',
    separator: '#E8E8EB',
    textSecondary: '#8E8E93',
    tertiary: '#C2C2C7',
    accent: '#16834A',
    accentSoft: 'rgba(22,131,74,0.12)',
    income: '#16834A',
    expense: '#E5484D',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    card: '#1C1C1E',
    cardBorder: '#2C2C2E',
    backgroundElement: '#2C2C2E',
    backgroundSelected: '#3A3A3C',
    separator: '#2C2C2E',
    textSecondary: '#98989F',
    tertiary: '#48484A',
    accent: '#2FB85A',
    accentSoft: 'rgba(47,184,90,0.20)',
    income: '#2FB85A',
    expense: '#FF453A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Money/figures: crisp column alignment. */
export const Tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** iOS-like type scale. */
export const Type = {
  largeTitle: { fontSize: 32, fontWeight: '700' as const, letterSpacing: 0.2 },
  title: { fontSize: 24, fontWeight: '700' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '500' as const },
  footnote: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

/** Accent palette (kept under the `Finance` name for existing references; refined values). */
export const Finance = {
  primary: '#16834A',
  primaryDark: '#0F6B3C',
  primarySoft: 'rgba(22,131,74,0.12)',
  income: '#16834A',
  incomeSoft: 'rgba(22,131,74,0.12)',
  expense: '#E5484D',
  expenseSoft: 'rgba(229,72,77,0.12)',
  amber: '#E8910C',
  textOnPrimary: '#ffffff',
} as const;

export const Radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  card: 18,
  field: 12,
  pill: 999,
} as const;

/** Whisper-soft card elevation (light mode only — dark uses a hairline border instead). */
export const CardShadow = (Platform.select({
  web: { boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.05)' },
  default: {
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
}) ?? {}) as object;

/** Refined, distinct tints per category group (for icon circles + charts). */
export const GroupColors: Record<string, string> = {
  Farming: '#2FA060',
  Development: '#2F6FED',
  'Family Support': '#B05CD6',
  Personal: '#E8910C',
  Business: '#129DAE',
  Giving: '#6366F1',
  Other: '#8E8E93',
};
