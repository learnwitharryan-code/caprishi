import 'server-only';
import fs from 'fs';
import path from 'path';
import { genai, MODEL, FALLBACK_MODELS } from './client';
import { GeminiTranscriptionSchema, GeminiTranscription } from './schemas';
import { Language } from '@/types/caption';
import { sanitizeToHinglish } from '@/lib/captions/transliterate';

const CHUNK_DURATION = 45; // seconds
const OVERLAP = 5; // seconds
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildTranscriptionPrompt(language: Language): string {
  const langInstructions: Record<Language, string> = {
    en: 'Transcribe in English. Keep all English words in standard English.',
    hi: 'Transcribe in Hindi using Devanagari script (हिंदी). Do not romanize.',
    ur: 'Transcribe in Urdu using Nastaliq/Arabic script (اردو). Do not romanize.',
    hinglish: 'Transcribe in STRICT HINGLISH: Use Roman/Latin alphabet ONLY (A-Z). NEVER use Devanagari script (NO हिंदी characters). Transcribe all Hindi/Urdu words phonetically in English letters (e.g. "mera naam", "samajh nahi aata", "karna bahut difficult hai"). Keep technical English terms in standard English (e.g. "ChatGPT", "AI", "software engineering", "dashboard").',
    auto: 'Transcribe in STRICT HINGLISH (or English): Use the Roman/Latin alphabet ONLY (A-Z). NEVER use Devanagari script (ABSOLUTELY NO हिंदी characters like "है", "कि", "पर", "का", "डैशबोर्ड"). Transcribe all Hindi words phonetically in Roman script (e.g. "kya", "hai", "par", "bahut", "workflow", "dashboard"). Keep English words in English.',
  };

  return `You are an elite short-form video transcription and forced alignment engine for Instagram Reels and YouTube Shorts.
${langInstructions[language]}

CRITICAL RULES:
1. Transcribe every spoken word in strict chronological order. Do not skip or summarize words.
2. SCRIPT REQUIREMENT: If Hinglish or Auto mode, output LATIN ALPHABET ONLY (A-Z). ZERO Devanagari characters allowed.
3. Word-level timestamps: Match the acoustic speech in the audio with high precision (decimal seconds, 3 decimal places).
4. Do not hallucinate future words or loop phrases. Every word must correspond to the speaker's real voice.
5. Output ONLY valid JSON matching this exact structure:
{
  "segments": [
    {
      "text": "full phrase text",
      "start": 0.000,
      "end": 2.500,
      "words": [
        { "text": "word1", "start": 0.000, "end": 0.500 },
        { "text": "word2", "start": 0.500, "end": 1.100 }
      ]
    }
  ]
}
6. No extra text, markdown wrappers, or explanations outside the JSON object.`;
}

async function transcribeChunk(
  audioBuffer: Buffer,
  mimeType: string,
  language: Language,
  retries = 0
): Promise<GeminiTranscription> {
  const targetModel = FALLBACK_MODELS[retries % FALLBACK_MODELS.length] || MODEL;
  try {
    const base64Audio = audioBuffer.toString('base64');
    const response = await genai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            { text: buildTranscriptionPrompt(language) },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const text = response.text ?? '';
    const parsed = JSON.parse(text);

    // Normalize and sanitize segments
    if (parsed.segments && Array.isArray(parsed.segments)) {
      parsed.segments = parsed.segments.map((seg: any) => {
        const segStart = typeof seg.start === 'number' ? seg.start : 0;
        const segEnd = typeof seg.end === 'number' ? seg.end : segStart + 1.0;

        const rawText = String(seg.text || '').trim();
        const cleanText = (language === 'hi' || language === 'ur')
          ? rawText
          : sanitizeToHinglish(rawText);

        let words = Array.isArray(seg.words) ? seg.words : [];
        if (words.length === 0 && cleanText.length > 0) {
          const tokens = cleanText.split(/\s+/).filter(Boolean);
          const dur = (segEnd - segStart) / (tokens.length || 1);
          words = tokens.map((t, idx) => ({
            text: t,
            start: Math.round((segStart + idx * dur) * 1000) / 1000,
            end: Math.round((segStart + (idx + 1) * dur) * 1000) / 1000,
          }));
        } else {
          words = words.map((w: any) => ({
            text: (language === 'hi' || language === 'ur') ? String(w.text || '') : sanitizeToHinglish(String(w.text || '')),
            start: typeof w.start === 'number' ? w.start : segStart,
            end: typeof w.end === 'number' ? w.end : segEnd,
          }));
        }

        return {
          text: cleanText,
          start: Math.round(segStart * 1000) / 1000,
          end: Math.round(segEnd * 1000) / 1000,
          words,
        };
      });
    }

    return GeminiTranscriptionSchema.parse(parsed);
  } catch (err) {
    if (retries < MAX_RETRIES) {
      await sleep(1000 * Math.pow(2, retries));
      return transcribeChunk(audioBuffer, mimeType, language, retries + 1);
    }
    throw err;
  }
}

function mergeChunks(
  chunks: Array<{ transcription: GeminiTranscription; offsetSeconds: number }>
): GeminiTranscription {
  const allSegments = [];
  let lastEnd = 0;

  for (const { transcription, offsetSeconds } of chunks) {
    for (const seg of transcription.segments) {
      const adjustedStart = seg.start + offsetSeconds;
      const adjustedEnd = seg.end + offsetSeconds;

      // Skip duplicate overlap segments
      if (adjustedStart < lastEnd - 0.1) continue;

      allSegments.push({
        ...seg,
        start: Math.round(adjustedStart * 1000) / 1000,
        end: Math.round(adjustedEnd * 1000) / 1000,
        words: seg.words.map(w => ({
          ...w,
          start: Math.round((w.start + offsetSeconds) * 1000) / 1000,
          end: Math.round((w.end + offsetSeconds) * 1000) / 1000,
        })),
      });
      lastEnd = adjustedEnd;
    }
  }

  return { segments: allSegments };
}

/**
 * Full transcription pipeline:
 * 1. Read WAV file
 * 2. Send to Gemini
 * 3. Merge and drift-correct
 */
export async function transcribeAudio(
  audioPath: string,
  language: Language
): Promise<GeminiTranscription> {
  const audioBuffer = fs.readFileSync(audioPath);
  const fileSizeMB = audioBuffer.length / (1024 * 1024);

  // For audio files under 20MB, send directly
  if (fileSizeMB < 20) {
    return transcribeChunk(audioBuffer, 'audio/wav', language);
  }

  // For larger files, chunk the audio buffer
  const BYTES_PER_SECOND = 32000;
  const chunkBytes = CHUNK_DURATION * BYTES_PER_SECOND;
  const overlapBytes = OVERLAP * BYTES_PER_SECOND;
  const headerOffset = 44;

  const chunks: Array<{ buffer: Buffer; offsetSeconds: number }> = [];
  let pos = headerOffset;
  let offsetSeconds = 0;

  while (pos < audioBuffer.length) {
    const end = Math.min(pos + chunkBytes, audioBuffer.length);
    const header = audioBuffer.subarray(0, headerOffset);
    const body = audioBuffer.subarray(pos, end);
    chunks.push({
      buffer: Buffer.concat([header, body]),
      offsetSeconds,
    });
    pos += chunkBytes - overlapBytes;
    offsetSeconds += CHUNK_DURATION - OVERLAP;
  }

  const CONCURRENCY = 4;
  const results: Array<{ transcription: GeminiTranscription; offsetSeconds: number }> = [];

  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(c =>
        transcribeChunk(c.buffer, 'audio/wav', language).then(t => ({
          transcription: t,
          offsetSeconds: c.offsetSeconds,
        }))
      )
    );
    results.push(...batchResults);
  }

  return mergeChunks(results);
}
