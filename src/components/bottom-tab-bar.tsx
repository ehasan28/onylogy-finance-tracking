import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type TabTriggerSlotProps } from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useColorMode, useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';

type IconBase = 'home' | 'receipt' | 'stats-chart' | 'settings';

/** Frosted, translucent tab bar (blur on web). Measures its own height for screen padding. */
export function BottomBar({ children, style, ...props }: ViewProps) {
  const theme = useTheme();
  const mode = useColorMode();
  const insets = useSafeAreaInsets();
  const setTabBarHeight = useStore((s) => s.setTabBarHeight);

  const glass =
    Platform.OS === 'web'
      ? {
          backgroundColor: mode === 'dark' ? 'rgba(18,18,20,0.72)' : 'rgba(255,255,255,0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        }
      : { backgroundColor: theme.card };

  return (
    <View
      {...props}
      onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}
      style={[
        styles.bar,
        { borderTopColor: theme.separator, paddingBottom: insets.bottom + Spacing.two },
        glass as object,
        style,
      ]}>
      {children}
    </View>
  );
}

type ItemProps = Partial<TabTriggerSlotProps> & { icon: IconBase; label: string };

export function TabItem({ icon, label, isFocused, ...props }: ItemProps) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;
  const name = (isFocused ? icon : `${icon}-outline`) as keyof typeof Ionicons.glyphMap;
  return (
    <Pressable {...props} accessibilityRole="button" accessibilityLabel={label} style={styles.item}>
      <Ionicons name={name} size={24} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function CenterAddButton() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add transaction"
      onPress={() => router.push('/add')}
      style={styles.fabWrap}>
      <View style={[styles.fab, { backgroundColor: theme.accent }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Spacing.one },
  label: { fontSize: 11, fontWeight: '600', lineHeight: 13 },
  fabWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.18)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      },
    }),
  },
});
