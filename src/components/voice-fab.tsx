import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { tap as hapticTap } from '@/lib/haptics';
import { useStore } from '@/store/useStore';

/** Floating mic button, bottom-right, above the tab bar. Opens the Voice quick-add. */
export function VoiceFab() {
  const router = useRouter();
  const theme = useTheme();
  const tabBarHeight = useStore((s) => s.tabBarHeight);
  const bottom = (tabBarHeight || 72) + 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add transaction by voice"
      onPress={() => {
        hapticTap();
        router.push('/voice');
      }}
      style={[styles.wrap, { bottom }]}>
      <View style={[styles.fab, { backgroundColor: theme.accent }]}>
        <Ionicons name="mic" size={24} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 18, zIndex: 50 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 6px 18px rgba(22,131,74,0.40)' },
      default: {
        shadowColor: '#16834A',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      },
    }),
  },
});
