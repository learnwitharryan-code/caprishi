import { v4 as uuid } from 'uuid';
import { CaptionSegment, CaptionWord, Language } from '@/types/caption';
import { GeminiTranscription } from '@/lib/gemini/schemas';

export interface SegmentationRules {
  minWords?: number;
  maxWordsPerSegment?: number;
  maxCharsPerLine?: number;
  pauseThresholdSeconds?: number;
  endPaddingSeconds?: number;
}

export const PACING_PRESETS = {
  '1-2': { minWords: 1, maxWordsPerSegment: 2, maxCharsPerLine: 18, label: '1-2 words (Fast Shorts)' },
  '2-3': { minWords: 2, maxWordsPerSegment: 3, maxCharsPerLine: 24, label: '2-3 words (Punchy Reels)' },
  '2-4': { minWords: 2, maxWordsPerSegment: 4, maxCharsPerLine: 30, label: '2-4 words (Recommended)' },
  '3-5': { minWords: 3, maxWordsPerSegment: 5, maxCharsPerLine: 36, label: '3-5 words (Standard)' },
  '5-8': { minWords: 5, maxWordsPerSegment: 8, maxCharsPerLine: 45, label: '5-8 words (Full Sentence)' },
} as const;

export type PacingPresetKey = keyof typeof PACING_PRESETS;

export const DEFAULT_RULES: SegmentationRules = {
  minWords: 2,
  maxWordsPerSegment: 4,
  maxCharsPerLine: 30,
  pauseThresholdSeconds: 0.35,
  endPaddingSeconds: 0.08,
};

/**
 * Re-segments a flat list of words into timed caption segments according to
 * word count limits, sentence punctuation, and speech silence pauses.
 */
export function resegmentWords(
  words: CaptionWord[],
  language: Language,
  rules: SegmentationRules = DEFAULT_RULES
): CaptionSegment[] {
  if (!words || words.length === 0) return [];

  const minWords = rules.minWords ?? 2;
  const maxWords = rules.maxWordsPerSegment ?? 4;
  const maxChars = rules.maxCharsPerLine ?? 30;
  const pauseThreshold = rules.pauseThresholdSeconds ?? 0.35;
  const endPadding = rules.endPaddingSeconds ?? 0.08;

  // Clean and sort words by start time
  const cleanWords = words
    .filter(w => w && w.text && w.text.trim().length > 0)
    .sort((a, b) => a.start - b.start);

  const segments: CaptionSegment[] = [];
  let currentGroup: CaptionWord[] = [];

  for (let i = 0; i < cleanWords.length; i++) {
    const word = cleanWords[i];
    const prevWord = currentGroup[currentGroup.length - 1];

    // Detect if there is a speech pause gap before this word
    const pauseOccurred = prevWord && (word.start - prevWord.end > pauseThreshold);

    // Detect if previous word had sentence-ending punctuation
    const prevHasPunctuation =
      prevWord && /[.?!,;|।،؟]$/.test(prevWord.text.trim());

    // Word and character count constraints
    const wouldExceedWords = currentGroup.length >= maxWords;
    const currentLength = currentGroup.map(w => w.text).join(' ').length;
    const wouldExceedChars = (currentLength + 1 + word.text.length) > maxChars;

    const shouldSplit =
      currentGroup.length >= minWords &&
      (wouldExceedWords || wouldExceedChars || pauseOccurred || prevHasPunctuation);

    if (currentGroup.length > 0 && (shouldSplit || pauseOccurred)) {
      const segStart = currentGroup[0].start;
      const lastWord = currentGroup[currentGroup.length - 1];
      // Hold caption slightly past last word, but never overlap next word start
      const segEnd = Math.min(lastWord.end + endPadding, word.start - 0.02);

      segments.push({
        id: uuid(),
        language,
        text: currentGroup.map(w => w.text).join(' '),
        start: Math.round(segStart * 1000) / 1000,
        end: Math.round(Math.max(segEnd, lastWord.end) * 1000) / 1000,
        words: [...currentGroup],
      });
      currentGroup = [];
    }

    currentGroup.push(word);
  }

  // Push final segment
  if (currentGroup.length > 0) {
    const segStart = currentGroup[0].start;
    const lastWord = currentGroup[currentGroup.length - 1];
    segments.push({
      id: uuid(),
      language,
      text: currentGroup.map(w => w.text).join(' '),
      start: Math.round(segStart * 1000) / 1000,
      end: Math.round((lastWord.end + endPadding) * 1000) / 1000,
      words: [...currentGroup],
    });
  }

  return segments;
}

/**
 * Re-segments existing caption segments of a track to match a new pacing preset.
 */
export function resegmentSegments(
  segments: CaptionSegment[],
  language: Language,
  rules: SegmentationRules = DEFAULT_RULES
): CaptionSegment[] {
  const allWords = segments.flatMap(s => s.words || []);
  return resegmentWords(allWords, language, rules);
}

/**
 * Converts raw Gemini transcription to structured caption track segments,
 * applying pacing and gapping rules automatically.
 */
export function geminiToCaptionTrack(
  transcription: GeminiTranscription,
  language: Language,
  rules: SegmentationRules = DEFAULT_RULES
): CaptionSegment[] {
  const rawWords: CaptionWord[] = [];

  for (const seg of transcription.segments) {
    for (const w of seg.words) {
      rawWords.push({
        id: uuid(),
        text: w.text,
        start: w.start,
        end: w.end,
      });
    }
  }

  // Re-segment with pacing rules
  return resegmentWords(rawWords, language, rules);
}
