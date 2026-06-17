import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayISO } from '@/lib/format';
import { success as hapticSuccess, tap as hapticTap } from '@/lib/haptics';
import { buildMeta, parseFromAudio, parseFromText, type ParseResult, type ParsedTx } from '@/lib/voice/parseClient';
import { recordingSupported, startRecording, type Recorder } from '@/lib/voice/record';
import { useStore } from '@/store/useStore';

type Phase = 'idle' | 'recording' | 'working' | 'error';

export default function VoiceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const categories = useStore((s) => s.categories);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const settings = useStore((s) => s.settings);
  const addTransaction = useStore((s) => s.addTransaction);

  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const recorderRef = useRef<Recorder | null>(null);
  const canRecord = recordingSupported();

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (phase === 'recording') {
      pulse.value = withRepeat(withTiming(1.16, { duration: 700 }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [phase, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => () => recorderRef.current?.cancel(), []);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const meta = () => buildMeta(categories, paymentMethods, todayISO(), settings.currencySymbol, settings.defaultType);

  async function startRec() {
    setError('');
    try {
      hapticTap();
      recorderRef.current = await startRecording();
      setPhase('recording');
    } catch (e) {
      setError(
        (e as Error)?.name === 'NotAllowedError'
          ? 'Microphone is blocked. Allow mic access in your browser, or type below.'
          : 'Could not start the mic on this device. Type below instead.'
      );
      setPhase('error');
    }
  }

  async function stopRec() {
    const rec = recorderRef.current;
    if (!rec) return;
    setPhase('working');
    try {
      const blob = await rec.stop();
      recorderRef.current = null;
      handleResult(await parseFromAudio(blob, meta()));
    } catch (e) {
      setError(humanError(e));
      setPhase('error');
    }
  }

  async function submitText() {
    const t = text.trim();
    if (!t) return;
    setPhase('working');
    try {
      handleResult(await parseFromText(t, meta()));
    } catch (e) {
      setError(humanError(e));
      setPhase('error');
    }
  }

  function handleResult(result: ParseResult) {
    const tx = result.transaction;
    if (result.status === 'empty' || !tx) {
      setError('Didn’t catch that. Tap the mic and try again, or type it below.');
      setPhase('error');
      return;
    }
    const reviewFirst = !settings.voiceAutoSave || tx.amount <= 0 || !tx.categoryId;
    if (!reviewFirst && tx.categoryId) {
      addTransaction({
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        date: tx.date,
        note: tx.note || undefined,
        paymentMethod: tx.paymentMethod || undefined,
      });
      hapticSuccess();
      goBack();
      return;
    }
    router.replace({ pathname: '/add', params: prefillParams(tx, result.transcript) });
  }

  const recording = phase === 'recording';
  const micColor = recording ? theme.expense : theme.accent;

  return (
    <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.side}>
          <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Voice add</Text>
        <View style={styles.side} />
      </View>

      <View style={styles.center}>
        {phase === 'working' ? (
          <>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.status, { color: theme.textSecondary }]}>Understanding…</Text>
          </>
        ) : (
          <>
            {canRecord && (
              <Pressable onPress={recording ? stopRec : startRec} accessibilityLabel={recording ? 'Stop' : 'Record'}>
                <Animated.View style={[styles.mic, { backgroundColor: micColor }, pulseStyle]}>
                  <Ionicons name={recording ? 'stop' : 'mic'} size={46} color="#fff" />
                </Animated.View>
              </Pressable>
            )}
            <Text style={[styles.status, { color: theme.textSecondary }]}>
              {recording
                ? 'Listening… tap to stop'
                : canRecord
                  ? 'Tap and speak — Bangla or English'
                  : 'Type what you spent below'}
            </Text>
            {phase === 'error' && !!error && <Text style={[styles.error, { color: theme.expense }]}>{error}</Text>}
          </>
        )}
      </View>

      <View style={[styles.typeRow, { paddingBottom: insets.bottom + Spacing.three }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="or type — e.g. fuel 500 bkash"
          placeholderTextColor={theme.tertiary}
          editable={phase !== 'working'}
          onSubmitEditing={submitText}
          returnKeyType="done"
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
        <Pressable
          onPress={submitText}
          disabled={!text.trim() || phase === 'working'}
          style={[styles.send, { backgroundColor: text.trim() ? theme.accent : theme.backgroundSelected }]}>
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function humanError(e: unknown): string {
  const m = String((e as Error)?.message ?? e);
  if (m.includes('Failed to fetch') || m.includes('Network')) return 'No connection to the voice service. Check internet and try again.';
  return 'Could not understand that. Try again or type it below.';
}

function prefillParams(tx: ParsedTx, transcript: string): Record<string, string> {
  const p: Record<string, string> = { from: 'voice', type: tx.type, date: tx.date };
  if (tx.amount > 0) p.amount = String(tx.amount);
  if (tx.categoryId) p.categoryId = tx.categoryId;
  if (tx.paymentMethod) p.paymentMethod = tx.paymentMethod;
  const note = tx.note || transcript;
  if (note) p.note = note.slice(0, 140);
  return p;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  side: { width: 64 },
  cancel: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 16, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingHorizontal: Spacing.four },
  mic: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  error: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  input: { flex: 1, height: 48, borderRadius: Radius.field, paddingHorizontal: Spacing.three, fontSize: 15 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
