import { authorized, json, preflight } from '../lib/server/http';
import { transcribe } from '../lib/server/transcribe';
import { parseAudioWithGemini, parseTransaction, type CategoryLite, type ParseMeta } from '../lib/server/parseTransaction';

type Body = {
  text?: string;
  categories?: CategoryLite[];
  paymentMethods?: string[];
  today?: string;
  currency?: string;
  defaultType?: 'income' | 'expense';
};

export function OPTIONS(): Response {
  return preflight();
}

/** Health check. */
export function GET(): Response {
  return json(200, { ok: true, service: 'onylogy-parse' });
}

async function readMultipart(request: Request): Promise<{ file: File; meta: Body }> {
  const form = await request.formData();
  const f = form.get('audio') ?? form.get('file') ?? [...form.values()].find((v) => v instanceof File);
  if (!(f instanceof File)) throw new Error("no 'audio' file field in form data");
  const metaRaw = form.get('meta');
  const meta = typeof metaRaw === 'string' ? (JSON.parse(metaRaw) as Body) : {};
  return { file: f, meta };
}

function metaFrom(body: Body): ParseMeta {
  return {
    categories: Array.isArray(body.categories) ? body.categories : [],
    paymentMethods: Array.isArray(body.paymentMethods) ? body.paymentMethods : [],
    today: body.today || new Date().toISOString().slice(0, 10),
    currency: body.currency || '৳',
    defaultType: body.defaultType === 'income' ? 'income' : 'expense',
  };
}

const statusFor = (amount: number, confidence: number) =>
  amount > 0 && confidence >= 0.4 ? 'parsed' : 'low_confidence';

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return json(401, { error: 'unauthorized' });
  const ct = request.headers.get('content-type') || '';

  try {
    // ---- AUDIO: Gemini-audio primary (better Bangla), Whisper → text parse as fallback ----
    if (ct.includes('multipart/form-data')) {
      const { file, meta } = await readMultipart(request);
      const input = metaFrom(meta);
      const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');

      try {
        const { transaction, transcript } = await parseAudioWithGemini(base64, file.type || 'audio/mp4', input);
        return json(200, { status: statusFor(transaction.amount, transaction.confidence), transcript, transaction, engine: 'gemini-audio' });
      } catch {
        const transcript = await transcribe(file); // Groq Whisper fallback
        if (!transcript) return json(200, { status: 'empty', transcript: '', transaction: null });
        const { transaction, engine } = await parseTransaction({ transcript, ...input });
        return json(200, { status: statusFor(transaction.amount, transaction.confidence), transcript, transaction, engine });
      }
    }

    // ---- TEXT ----
    if (ct.includes('application/json')) {
      const body = (await request.json()) as Body;
      const text = (body.text ?? '').trim();
      if (!text) return json(200, { status: 'empty', transcript: '', transaction: null });
      const { transaction, engine } = await parseTransaction({ transcript: text, ...metaFrom(body) });
      return json(200, { status: statusFor(transaction.amount, transaction.confidence), transcript: text, transaction, engine });
    }

    return json(400, { error: 'send JSON {text,...} or multipart/form-data {audio, meta}' });
  } catch (e: unknown) {
    return json(502, { error: `parse failed: ${(e as Error)?.message ?? e}` });
  }
}
