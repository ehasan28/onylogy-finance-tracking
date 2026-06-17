import { authorized, json, preflight } from '../lib/server/http';
import { transcribe } from '../lib/server/transcribe';
import { parseTransaction, type CategoryLite } from '../lib/server/parseTransaction';

type Meta = {
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

/** Pull the audio File + JSON `meta` field out of multipart form-data. */
async function readMultipart(request: Request): Promise<{ file: File; meta: Meta }> {
  const form = await request.formData();
  const f = form.get('audio') ?? form.get('file') ?? [...form.values()].find((v) => v instanceof File);
  if (!(f instanceof File)) throw new Error("no 'audio' file field in form data");
  const metaRaw = form.get('meta');
  const meta = typeof metaRaw === 'string' ? (JSON.parse(metaRaw) as Meta) : {};
  return { file: f, meta };
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return json(401, { error: 'unauthorized' });

  const ct = request.headers.get('content-type') || '';
  let transcript = '';
  let meta: Meta = {};

  try {
    if (ct.includes('application/json')) {
      const body = (await request.json()) as Meta;
      meta = body;
      transcript = (body.text ?? '').trim();
    } else if (ct.includes('multipart/form-data')) {
      const { file, meta: m } = await readMultipart(request);
      meta = m;
      transcript = await transcribe(file);
    } else {
      return json(400, { error: 'send JSON {text,...} or multipart/form-data {audio, meta}' });
    }
  } catch (e: unknown) {
    return json(400, { error: `input/transcription failed: ${(e as Error)?.message ?? e}` });
  }

  if (!transcript) {
    return json(200, { status: 'empty', transcript: '', transaction: null });
  }

  try {
    const { transaction, engine } = await parseTransaction({
      transcript,
      categories: Array.isArray(meta.categories) ? meta.categories : [],
      paymentMethods: Array.isArray(meta.paymentMethods) ? meta.paymentMethods : [],
      today: meta.today || new Date().toISOString().slice(0, 10),
      currency: meta.currency || '৳',
      defaultType: meta.defaultType === 'income' ? 'income' : 'expense',
    });
    const status = transaction.amount > 0 && transaction.confidence >= 0.4 ? 'parsed' : 'low_confidence';
    return json(200, { status, transcript, transaction, engine });
  } catch (e: unknown) {
    return json(502, { error: `parsing failed: ${(e as Error)?.message ?? e}`, transcript });
  }
}
