import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store/useStore';

/** Resolved color mode honoring the user's Settings preference (light / dark / system). */
export function useColorMode(): 'light' | 'dark' {
  const device = useColorScheme();
  const pref = useStore((s) => s.settings.theme) ?? 'light';
  if (pref === 'system') return device === 'dark' ? 'dark' : 'light';
  return pref;
}

export function useTheme() {
  return Colors[useColorMode()];
}
