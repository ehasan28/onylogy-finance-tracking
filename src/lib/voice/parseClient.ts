import type { Category, TxType } from '@/types';

/** Same-origin in production; override with EXPO_PUBLIC_PARSE_URL for local `vercel dev`. */
const PARSE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_PARSE_URL) || '/api/parse';
const SECRET =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ONYLOGY_SECRET) || '';

export type ParsedTx = {
  type: TxType;
  amount: number;
  categoryId: string | null;
  categoryGuess: string;
  paymentMethod: string | null;
  date: string;
  note: string;
  confidence: number;
};

export type ParseResult = {
  status: 'parsed' | 'low_confidence' | 'empty';
  transcript: string;
  transaction: ParsedTx | null;
  engine?: string;
};

export type ParseMeta = {
  categories: { id: string; name: string; type: TxType; group: string }[];
  paymentMethods: string[];
  today: string;
  currency: string;
  defaultType: TxType;
};

export function buildMeta(
  categories: Category[],
  paymentMethods: string[],
  today: string,
  currency: string,
  defaultType: TxType
): ParseMeta {
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type, group: c.group })),
    paymentMethods,
    today,
    currency,
    defaultType,
  };
}

async function send(body: BodyInit, headers: Record<string, string>): Promise<ParseResult> {
  const res = await fetch(PARSE_URL, {
    method: 'POST',
    headers: { ...(SECRET ? { 'x-onylogy-secret': SECRET } : {}), ...headers },
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`parse failed (${res.status})${t ? ': ' + t.slice(0, 200) : ''}`);
  }
  return (await res.json()) as ParseResult;
}

/** Send recorded audio → server transcribes (Whisper) + parses (Gemini/Groq). */
export async function parseFromAudio(audio: Blob, meta: ParseMeta): Promise<ParseResult> {
  const form = new FormData();
  const ext = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm';
  // RN/web FormData both accept (name, blob, filename).
  (form as any).append('audio', audio, `note.${ext}`);
  form.append('meta', JSON.stringify(meta));
  return send(form as unknown as BodyInit, {});
}

/** Send typed text → server parses directly (skips Whisper). */
export async function parseFromText(text: string, meta: ParseMeta): Promise<ParseResult> {
  return send(JSON.stringify({ text, ...meta }), { 'content-type': 'application/json' });
}
