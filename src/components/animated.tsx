import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount } from '@/lib/format';

/** Animate a number from its previous shown value up to `target` with ease-out. */
function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(0);
  const valRef = useRef(0);
  useEffect(() => {
    const from = valRef.current;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      valRef.current = v;
      setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        valRef.current = target;
        setVal(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function CountUpMoney({
  value,
  symbol = '৳',
  style,
  themeColor,
}: {
  value: number;
  symbol?: string;
  style?: ThemedTextProps['style'];
  themeColor?: ThemedTextProps['themeColor'];
}) {
  const v = useCountUp(value);
  return (
    <ThemedText themeColor={themeColor} style={style}>
      {(v < 0 ? '-' : '') + symbol + formatAmount(Math.abs(v))}
    </ThemedText>
  );
}

export function ProgressBar({
  pct,
  color,
  trackColor,
}: {
  pct: number;
  color: string;
  trackColor?: string;
}) {
  const theme = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(100, pct)), { duration: 600 });
  }, [pct, w]);
  const aStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={[styles.track, { backgroundColor: trackColor ?? theme.backgroundSelected }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, aStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
