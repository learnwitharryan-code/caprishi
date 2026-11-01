import 'server-only';
import { genai, MODEL, FALLBACK_MODELS } from './client';
import { GeminiTranscriptionSchema, GeminiTranscription } from './schemas';
import { Language } from '@/types/caption';

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const LANG_NAMES: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  ur: 'Urdu (Nastaliq/Arabic script, RTL)',
  hinglish: 'Hinglish (Hindi romanized in Latin script)',
  auto: 'auto-detected language',
};

function buildTranslationPrompt(from: Language, to: Language): string {
  const isHinglish = to === 'hinglish';
  return `You are a professional translator specializing in South Asian languages.

Task: ${isHinglish ? 'Transliterate' : 'Translate'} the caption segments from ${LANG_NAMES[from]} to ${LANG_NAMES[to]}.

Rules:
1. Only change the "text" field in each segment and each word.
2. Keep all timing data (start, end) EXACTLY the same.
3. For Hinglish: romanize each Hindi/Urdu word phonetically in Latin script. Keep English words unchanged. Match word count per segment.
4. For Urdu: use Nastaliq script, right-to-left.
5. Do not add or remove words — match the word count in each segment as closely as possible.
6. Return ONLY valid JSON matching this schema:
{ "segments": [{ "text": "...", "start": 0.0, "end": 0.0, "words": [{ "text": "...", "start": 0.0, "end": 0.0 }] }] }
7. No explanations, no markdown, no extra keys.`;
}

export async function translateTranscription(
  transcription: GeminiTranscription,
  from: Language,
  to: Language,
  retries = 0
): Promise<GeminiTranscription> {
  const targetModel = FALLBACK_MODELS[retries % FALLBACK_MODELS.length] || MODEL;
  try {
    const response = await genai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${buildTranslationPrompt(from, to)}

Caption segments to translate:
${JSON.stringify(transcription)}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text ?? '';
    const parsed = JSON.parse(text);
    return GeminiTranscriptionSchema.parse(parsed);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      await sleep(1000 * Math.pow(2, retries));
      return translateTranscription(transcription, from, to, retries + 1);
    }
    throw err;
  }
}
