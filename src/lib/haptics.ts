import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap — for key presses, selections. No-op on web. */
export const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

/** Success notification — for saving a transaction. No-op on web. */
export const success = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
};
