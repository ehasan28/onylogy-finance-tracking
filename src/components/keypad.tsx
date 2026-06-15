import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tap } from '@/lib/haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export function Keypad({ onKey, onBackspace }: { onKey: (k: string) => void; onBackspace: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === '⌫' ? 'Backspace' : `Key ${k}`}
          onPress={() => {
            tap();
            if (k === '⌫') onBackspace();
            else onKey(k);
          }}
          style={({ pressed }) => [
            styles.key,
            { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
          ]}>
          <ThemedText style={styles.keyText}>{k}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  keyText: { fontSize: 24, fontWeight: '600' },
});
