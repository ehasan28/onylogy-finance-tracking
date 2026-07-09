import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';

let geminiClient: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set on the server');
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

let groqClient: Groq | null = null;
function groq(): Groq {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set on the server');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export type CategoryLite = { id: string; name: string; type: 'income' | 'expense'; group: string };

export type ParsedTx = {
  type: 'income' | 'expense';
  amount: number;
  categoryId: string | null;
  categoryGuess: string;
  paymentMethod: string | null;
  date: string; // YYYY-MM-DD
  note: string;
  confidence: number; // 0..1
};

export type ParseMeta = {
  categories: CategoryLite[];
  paymentMethods: string[];
  today: string;
  currency: string;
  defaultType: 'income' | 'expense';
};

export type ParseInput = ParseMeta & { transcript: string };

function buildSystem(input: ParseMeta): string {
  const cats = input.categories
    .map((c) => `- id="${c.id}" | ${c.type} | "${c.name}" (${c.group})`)
    .join('\n');
  return [
    'You convert a personal-finance voice note (mixed Bangla + English, "Banglish") into ONE transaction.',
    `Today is ${input.today}. Currency is ${input.currency} (Bangladeshi taka).`,
    'The speech may be in Bangla (Bengali script), romanized Bangla, English, or a mix — understand all of them.',
    '',
    'Available categories — choose the single best categoryId from this list:',
    cats,
    '',
    `Payment methods: ${input.paymentMethods.join(', ')}.`,
    '',
    'Rules:',
    '- Derive everything ONLY from the note. Never invent an amount.',
    `- type: "expense" for money spent/bought/paid; "income" for money received/earned/sold. If unclear use "${input.defaultType}".`,
    '- amount: a positive number in taka. Understand Bangla/Banglish numbers: "panch sho"/"পাঁচশো"=500, "hajar"/"হাজার"=1000, "der hajar"/"দেড় হাজার"=1500, "dui hajar"/"দুই হাজার"=2000, "lakh"/"লাখ"=100000. Strip the currency word.',
    '- categoryId: the best-matching id above for what was bought/earned, or "" if nothing fits. categoryGuess: a short human label for the category (even if categoryId is "").',
    '- paymentMethod: one of the methods above if mentioned (বিকাশ/bikash/bkash→bKash, নগদ/nagad→Nagad, রকেট/rocket→Rocket, ক্যাশ/নগদ টাকা/cash/nogod→Cash, ব্যাংক/bank→Bank Transfer, কার্ড/card→Card); else "".',
    '- date: YYYY-MM-DD. "kal/gotokal/গতকাল"=yesterday, "aj/ajke/আজ/আজকে/today"=today, "porshu/পরশু"=day before yesterday; default today.',
    '- note: a short, natural description of the transaction. If the user spoke Bangla, write it in CLEAN, correctly-spelled Bangla — silently fix any garbled or misspelled words from imperfect transcription so it reads as proper natural Bangla. If they spoke English, write English. Do NOT translate between languages.',
    '- confidence: 0..1, your certainty about amount + category. Be honest; low values trigger a manual review.',
  ].join('\n');
}

const TX_PROPS = {
  type: { type: Type.STRING },
  amount: { type: Type.NUMBER },
  categoryId: { type: Type.STRING },
  categoryGuess: { type: Type.STRING },
  paymentMethod: { type: Type.STRING },
  date: { type: Type.STRING },
  note: { type: Type.STRING },
  confidence: { type: Type.NUMBER },
};
const TX_REQUIRED = ['type', 'amount', 'categoryId', 'categoryGuess', 'paymentMethod', 'date', 'note', 'confidence'];

const SCHEMA = { type: Type.OBJECT, properties: TX_PROPS, required: TX_REQUIRED };
/** Audio path also returns a clean transcript. */
const AUDIO_SCHEMA = {
  type: Type.OBJECT,
  properties: { transcript: { type: Type.STRING }, ...TX_PROPS },
  required: ['transcript', ...TX_REQUIRED],
};

function normalize(raw: Record<string, unknown>, input: ParseMeta): ParsedTx {
  const validIds = new Set(input.categories.map((c) => c.id));
  const type: 'income' | 'expense' =
    raw?.type === 'income' ? 'income' : raw?.type === 'expense' ? 'expense' : input.defaultType;

  let categoryId =
    typeof raw?.categoryId === 'string' && validIds.has(raw.categoryId) ? (raw.categoryId as string) : null;
  if (categoryId) {
    const c = input.categories.find((x) => x.id === categoryId);
    if (c && c.type !== type) categoryId = null; // category must match the tx direction
  }

  const pm =
    typeof raw?.paymentMethod === 'string' && input.paymentMethods.includes(raw.paymentMethod)
      ? (raw.paymentMethod as string)
      : null;

  const amount = Number(raw?.amount);
  const date =
    typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? (raw.date as string) : input.today;

  return {
    type,
    amount: isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0,
    categoryId,
    categoryGuess: typeof raw?.categoryGuess === 'string' ? raw.categoryGuess : '',
    paymentMethod: pm,
    date,
    note: typeof raw?.note === 'string' ? raw.note.trim() : '',
    confidence: typeof raw?.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
  };
}

/** AUDIO (primary): Gemini listens to the clip directly — stronger Bangla than Whisper — and returns
 *  a clean transcript + the transaction in one call. */
export async function parseAudioWithGemini(
  base64: string,
  mimeType: string,
  input: ParseMeta
): Promise<{ transaction: ParsedTx; transcript: string }> {
  const res = await gemini().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Listen to this finance voice note and extract the transaction. Transcribe carefully; keep Bangla in correct Bangla spelling.' },
        ],
      },
    ],
    config: {
      systemInstruction:
        buildSystem(input) +
        '\n- transcript: the accurate, correctly-spelled transcription of the audio (Bangla script if spoken in Bangla).',
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: AUDIO_SCHEMA,
    },
  });
  const raw = JSON.parse(res.text ?? '{}');
  return { transaction: normalize(raw, input), transcript: typeof raw.transcript === 'string' ? raw.transcript : '' };
}

async function viaGemini(input: ParseInput): Promise<ParsedTx> {
  const res = await gemini().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: input.transcript,
    config: {
      systemInstruction: buildSystem(input),
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
    },
  });
  return normalize(JSON.parse(res.text ?? '{}'), input);
}

async function viaGroq(input: ParseInput): Promise<ParsedTx> {
  const res = await groq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          buildSystem(input) +
          '\n\nReturn ONE JSON object with exactly these keys: type, amount, categoryId, categoryGuess, paymentMethod, date, note, confidence.',
      },
      { role: 'user', content: input.transcript },
    ],
  });
  const txt = res.choices?.[0]?.message?.content ?? '{}';
  return normalize(JSON.parse(txt), input);
}

/** TEXT parse: Gemini 2.5 Flash primary; Groq Llama fallback on any Gemini error / rate-limit. */
export async function parseTransaction(
  input: ParseInput
): Promise<{ transaction: ParsedTx; engine: 'gemini' | 'groq' }> {
  try {
    return { transaction: await viaGemini(input), engine: 'gemini' };
  } catch {
    return { transaction: await viaGroq(input), engine: 'groq' };
  }
}
