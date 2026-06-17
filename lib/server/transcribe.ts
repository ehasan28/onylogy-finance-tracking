import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Bias Whisper toward this app's finance vocabulary (mobile-banking apps, taka, Banglish
 * number words, farm/freelance terms) so they survive transcription instead of being
 * "corrected" into common words. Whisper uses `prompt` only as a hint; it is not output.
 */
const VOCAB_PROMPT =
  'A personal finance voice note in mixed Bangla and English (Banglish). ' +
  'Payment methods: bKash, Nagad, Rocket, Cash, Bank Transfer, Card. ' +
  'Amounts in taka (৳): 500 taka, panch sho, hajar, der hajar, dui hajar, ad-sho. ' +
  'Topics: fuel, transport, bazar, food, seeds, sar (fertilizer), kitnashok, sech, mojuri (labor), ' +
  'mobile recharge, internet, hosting, Fiverr, Upwork, client payment, fosol bikri (crop sale), doodh, dim.';

/** Transcribe an audio clip with Groq's free-tier Whisper-large-v3 (Bangla + code-switching). */
export async function transcribe(file: File): Promise<string> {
  const res = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'bn',
    prompt: VOCAB_PROMPT,
    temperature: 0,
  });
  return (res.text ?? '').trim();
}
