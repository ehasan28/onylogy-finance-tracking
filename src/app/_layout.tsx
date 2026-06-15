import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorMode } from '@/hooks/use-theme';

export default function RootLayout() {
  const mode = useColorMode();

  // Ask the browser to keep our data (exempt from automatic eviction). Web/PWA only.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.storage?.persist) {
      nav.storage
        .persisted?.()
        .then((already: boolean) => {
          if (!already) nav.storage.persist();
        })
        .catch(() => {});
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
