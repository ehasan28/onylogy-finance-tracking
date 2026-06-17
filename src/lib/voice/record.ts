/**
 * Minimal mic-recording wrapper around the Web MediaRecorder API (PWA/web only).
 * All web globals are accessed via `globalThis` casts so this typechecks in the RN project
 * without depending on DOM lib types. On platforms without MediaRecorder it reports
 * `recordingSupported() === false` and the Voice screen falls back to typing.
 */
export type Recorder = { stop: () => Promise<Blob>; cancel: () => void };

const g: any = globalThis as any;

export function recordingSupported(): boolean {
  return !!g?.navigator?.mediaDevices?.getUserMedia && typeof g.MediaRecorder !== 'undefined';
}

function pickMime(): string | undefined {
  const MR: any = g.MediaRecorder;
  if (!MR?.isTypeSupported) return undefined;
  // iOS Safari → audio/mp4 (m4a); Chrome/Firefox → webm/ogg. Whisper accepts all of these.
  return ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((t) => MR.isTypeSupported(t));
}

/** Request mic permission and start recording. Resolves with a controller; throws on deny/unsupported. */
export async function startRecording(): Promise<Recorder> {
  if (!recordingSupported()) throw new Error('unsupported');
  const stream = await g.navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMime();
  const mr = new g.MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: any[] = [];
  mr.ondataavailable = (e: any) => {
    if (e?.data && e.data.size > 0) chunks.push(e.data);
  };
  mr.start();

  const cleanup = () => stream.getTracks().forEach((t: any) => t.stop());

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        mr.onstop = () => {
          cleanup();
          resolve(new g.Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
        };
        mr.stop();
      }),
    cancel: () => {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
      cleanup();
    },
  };
}
