import Groq from 'groq-sdk';

let client: Groq | null = null;
/** Lazily construct the Groq client so a missing key fails per-request, not at module load. */
function groq(): Groq {
  if (!client) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set on the server');
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

/**
 * Bias Whisper toward this app's finance vocabulary (mobile-banking apps, taka, Banglish
 * number words, farm/freelance terms) so they survive transcription instead of being
 * "corrected" into common words. Whisper uses `prompt` only as a hint; it is not output.
 */
// Written in Bengali script on purpose: Whisper mirrors the prompt's script, so a Bangla-script
// hint makes it transcribe Bangla speech in Bangla (না রোমানাইজড). English words still pass through.
const VOCAB_PROMPT =
  'এটি একটি ব্যক্তিগত আয়-ব্যয়ের ভয়েস নোট, বাংলা ও ইংরেজি মিশিয়ে বলা। ' +
  'পেমেন্ট মাধ্যম: বিকাশ, নগদ, রকেট, ক্যাশ, ব্যাংক ট্রান্সফার, কার্ড। ' +
  'টাকার অঙ্ক: পাঁচশো টাকা, হাজার, দেড় হাজার, দুই হাজার, পাঁচ হাজার, লাখ। ' +
  'বিষয়: জ্বালানি, যাতায়াত, বাজার, খাবার, বীজ, সার, কীটনাশক, সেচ, মজুরি, ' +
  'মোবাইল রিচার্জ, ইন্টারনেট, হোস্টিং, ফসল বিক্রি, দুধ, ডিম, ক্লায়েন্ট পেমেন্ট।';

/** Transcribe an audio clip with Groq's free-tier Whisper-large-v3 (Bangla + code-switching). */
export async function transcribe(file: File): Promise<string> {
  const res = await groq().audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'bn',
    prompt: VOCAB_PROMPT,
    temperature: 0,
  });
  return (res.text ?? '').trim();
}
