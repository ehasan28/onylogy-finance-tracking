import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const tabBarHeight = useStore((s) => s.tabBarHeight);
  const padTop = insets.top + Spacing.three;
  const padBottom = (tabBarHeight || 72) + Spacing.three;

  if (!scroll) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <View style={[styles.inner, styles.fill, { paddingTop: padTop, paddingBottom: padBottom }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.center}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.inner, { paddingTop: padTop, paddingBottom: padBottom }]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flexDirection: 'row', justifyContent: 'center' },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
});
