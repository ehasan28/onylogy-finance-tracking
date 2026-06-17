import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

export type ParseInput = {
  transcript: string;
  categories: CategoryLite[];
  paymentMethods: string[];
  today: string;
  currency: string;
  defaultType: 'income' | 'expense';
};

function buildSystem(input: ParseInput): string {
  const cats = input.categories
    .map((c) => `- id="${c.id}" | ${c.type} | "${c.name}" (${c.group})`)
    .join('\n');
  return [
    'You convert a personal-finance voice note (mixed Bangla + English, "Banglish") into ONE transaction.',
    `Today is ${input.today}. Currency is ${input.currency} (Bangladeshi taka).`,
    '',
    'Available categories — choose the single best categoryId from this list:',
    cats,
    '',
    `Payment methods: ${input.paymentMethods.join(', ')}.`,
    '',
    'Rules:',
    '- Derive everything ONLY from the note. Never invent an amount.',
    `- type: "expense" for money spent/bought/paid; "income" for money received/earned/sold. If unclear use "${input.defaultType}".`,
    '- amount: a positive number in taka. Understand Banglish numbers: "panch sho"=500, "hajar"=1000, "der hajar"=1500, "dui hajar"=2000, "sho"=hundred, "lakh"=100000. Strip the currency word.',
    '- categoryId: the best-matching id above for what was bought/earned, or "" if nothing fits. categoryGuess: a short human label for the category you inferred (even if categoryId is "").',
    '- paymentMethod: one of the methods above if mentioned (bikash/bkash→bKash, nagad→Nagad, rocket→Rocket, cash/nogod→Cash, bank→Bank Transfer, card→Card); else "".',
    '- date: YYYY-MM-DD. "kal/gotokal"=yesterday, "aj/ajke/today"=today, "porshu"=day before yesterday; default today.',
    '- note: a short clean description; keep the wording, names and places the speaker used.',
    '- confidence: 0..1, your certainty about amount + category. Be honest; low values trigger a manual review.',
  ].join('\n');
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    categoryId: { type: Type.STRING },
    categoryGuess: { type: Type.STRING },
    paymentMethod: { type: Type.STRING },
    date: { type: Type.STRING },
    note: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
  },
  required: ['type', 'amount', 'categoryId', 'categoryGuess', 'paymentMethod', 'date', 'note', 'confidence'],
  propertyOrdering: ['type', 'amount', 'categoryId', 'categoryGuess', 'paymentMethod', 'date', 'note', 'confidence'],
};

function normalize(raw: Record<string, unknown>, input: ParseInput): ParsedTx {
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

async function viaGemini(input: ParseInput): Promise<ParsedTx> {
  const res = await ai.models.generateContent({
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
  const res = await groq.chat.completions.create({
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

/** Gemini 2.5 Flash primary; Groq Llama fallback on any Gemini error / rate-limit. */
export async function parseTransaction(
  input: ParseInput
): Promise<{ transaction: ParsedTx; engine: 'gemini' | 'groq' }> {
  try {
    return { transaction: await viaGemini(input), engine: 'gemini' };
  } catch {
    return { transaction: await viaGroq(input), engine: 'groq' };
  }
}
