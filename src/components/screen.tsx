import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoiceFab } from '@/components/voice-fab';
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

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      {scroll ? (
        <ScrollView style={styles.fill} contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={[styles.inner, { paddingTop: padTop, paddingBottom: padBottom }]}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.inner, styles.fill, { paddingTop: padTop, paddingBottom: padBottom }]}>{children}</View>
      )}
      <VoiceFab />
    </View>
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
