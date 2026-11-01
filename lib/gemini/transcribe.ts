import 'server-only';
import fs from 'fs';
import path from 'path';
import { genai, MODEL, FALLBACK_MODELS } from './client';
import { GeminiTranscriptionSchema, GeminiTranscription } from './schemas';
import { Language } from '@/types/caption';

const CHUNK_DURATION = 45; // seconds
const OVERLAP = 5; // seconds
const MAX_RETRIES = 3;
const INLINE_LIMIT = 20 * 1024 * 1024; // 20 MB

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildTranscriptionPrompt(language: Language): string {
  const langInstructions: Record<Language, string> = {
    en: 'Transcribe in English. Keep all English words.',
    hi: 'Transcribe in Hindi using Devanagari script (हिंदी). Do not romanize.',
    ur: 'Transcribe in Urdu using Nastaliq/Arabic script (اردو). Do not romanize.',
    hinglish: 'Transcribe in Hinglish: write all Hindi/Urdu words phonetically in Roman (Latin) script. Keep English words unchanged. Example: "mera naam" not "मेरा नाम".',
    auto: 'Detect the language automatically. Transcribe faithfully in whatever script the speaker uses.',
  };

  return `You are a professional audio transcription service specializing in Indian and Pakistani languages.
${langInstructions[language]}

Rules:
1. Transcribe every spoken word — do not summarize or skip words.
2. Preserve code-switching naturally (e.g., Hindi+English in one sentence).
3. For Hinglish mode: romanize all Hindi/Urdu words phonetically, keep English as-is.
4. Provide word-level timestamps in decimal seconds (3 decimal places).
5. Output ONLY valid JSON matching this schema exactly:
{
  "segments": [
    {
      "text": "full segment text",
      "start": 0.000,
      "end": 3.500,
      "words": [
        { "text": "word", "start": 0.000, "end": 0.500 }
      ]
    }
  ]
}
6. Do not include any explanation, markdown, or extra keys.`;
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
 * 2. Split into overlapping chunks
 * 3. Send each chunk to Gemini in parallel (max 4 concurrent)
 * 4. Merge and drift-correct
 */
export async function transcribeAudio(
  audioPath: string,
  language: Language
): Promise<GeminiTranscription> {
  const audioBuffer = fs.readFileSync(audioPath);
  const fileSizeMB = audioBuffer.length / (1024 * 1024);

  // For small files, send directly
  if (fileSizeMB < 18) {
    return transcribeChunk(audioBuffer, 'audio/wav', language);
  }

  // For larger files, chunk the audio buffer
  // WAV header is 44 bytes; 16kHz mono 16-bit = 32000 bytes/second
  const BYTES_PER_SECOND = 32000;
  const chunkBytes = CHUNK_DURATION * BYTES_PER_SECOND;
  const overlapBytes = OVERLAP * BYTES_PER_SECOND;
  const headerOffset = 44;

  const chunks: Array<{ buffer: Buffer; offsetSeconds: number }> = [];
  let pos = headerOffset;
  let offsetSeconds = 0;

  while (pos < audioBuffer.length) {
    const end = Math.min(pos + chunkBytes, audioBuffer.length);
    // Prepend WAV header for each chunk
    const header = audioBuffer.subarray(0, headerOffset);
    const body = audioBuffer.subarray(pos, end);
    chunks.push({
      buffer: Buffer.concat([header, body]),
      offsetSeconds,
    });
    pos += chunkBytes - overlapBytes;
    offsetSeconds += CHUNK_DURATION - OVERLAP;
  }

  // Process chunks with concurrency limit of 4
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
