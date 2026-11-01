import { v4 as uuid } from 'uuid';
import { CaptionSegment, CaptionWord, Language } from '@/types/caption';
import { GeminiTranscription } from '@/lib/gemini/schemas';
import { sanitizeToHinglish } from './transliterate';

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

  // Stable sort by start time while preserving speech sequence order
  const cleanWords = words
    .map((w, index) => ({ w, index }))
    .filter(({ w }) => w && w.text && w.text.trim().length > 0)
    .sort((a, b) => {
      const diff = a.w.start - b.w.start;
      if (Math.abs(diff) > 0.01) return diff;
      return a.index - b.index;
    })
    .map(({ w }) => {
      const text = (language === 'hi' || language === 'ur') ? w.text : sanitizeToHinglish(w.text);
      return { ...w, text };
    });

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
      const minEnd = segStart + 0.2;
      const candidateEnd = Math.max(lastWord.end + endPadding, minEnd);
      // Ensure we don't overlap with the next word if it is ahead
      const segEnd = word.start > segStart + 0.05
        ? Math.min(candidateEnd, word.start - 0.02)
        : Math.max(lastWord.end, minEnd);

      const roundedStart = Math.round(segStart * 1000) / 1000;
      const roundedEnd = Math.round(Math.max(roundedStart + 0.2, segEnd) * 1000) / 1000;

      segments.push({
        id: uuid(),
        language,
        text: currentGroup.map(w => w.text).join(' '),
        start: roundedStart,
        end: roundedEnd,
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
    const roundedStart = Math.round(segStart * 1000) / 1000;
    const roundedEnd = Math.round(Math.max(roundedStart + 0.25, lastWord.end + endPadding) * 1000) / 1000;
    segments.push({
      id: uuid(),
      language,
      text: currentGroup.map(w => w.text).join(' '),
      start: roundedStart,
      end: roundedEnd,
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
  const resegmented = resegmentWords(allWords, language, rules);
  return syncWordsToTimeline(resegmented, 0);
}

/**
 * Calculates natural phonetic speech weight for a word based on character length,
 * vowel/syllable density, and punctuation pauses.
 */
export function computeWordPhoneticWeight(wordText: string): number {
  if (!wordText) return 1;
  const clean = wordText.trim().replace(/[^\w\u0600-\u06FF\u0900-\u097F]/g, '');
  if (!clean) return 1;

  // Syllables roughly correlate to vowel clusters (Latin + Devanagari + Arabic)
  const vowels = (clean.match(/[aeiouyāīūēōअआइईउऊएऐओऔ]/gi) || []).length;
  // Length + vowel density with minimum 1.0
  const baseWeight = Math.max(1, clean.length * 0.7 + vowels * 0.85);

  // Pause punctuation weight: natural holding pause at clause/sentence boundaries
  const hasComma = /[,،]/.test(wordText);
  const hasFullStop = /[.?!।؟]/.test(wordText);
  if (hasFullStop) return baseWeight * 1.35;
  if (hasComma) return baseWeight * 1.18;
  return baseWeight;
}

/**
 * Precision Word-to-Word Sync Engine:
 * 1. Preserves acoustic segment boundaries (seg.start, seg.end) to prevent any cumulative drift across the video!
 * 2. Word 0 begins at seg.start and the last word terminates exactly at seg.end.
 * 3. Eliminates all dead gaps between words (word[i].end === word[i+1].start).
 * 4. Distributes word durations proportionally using natural phonetic/syllable weights.
 * 5. Sanitizes any Devanagari to pure Hinglish when in Hinglish or English mode.
 */
export function syncWordsToTimeline(
  segments: CaptionSegment[],
  leadOffsetSeconds: number = 0
): CaptionSegment[] {
  if (!segments || segments.length === 0) return [];

  // Sort segments by start time
  const sorted = [...segments].sort((a, b) => a.start - b.start);

  return sorted.map((seg, segIdx) => {
    // Only apply leadOffsetSeconds if explicitly provided non-zero, clamping cleanly
    const rawStart = leadOffsetSeconds !== 0 ? Math.max(0, seg.start + leadOffsetSeconds) : seg.start;
    const rawEnd = leadOffsetSeconds !== 0 ? Math.max(rawStart + 0.25, seg.end + leadOffsetSeconds) : seg.end;

    const clampedStart = Math.round(rawStart * 1000) / 1000;
    let clampedEnd = Math.round(Math.max(clampedStart + 0.25, rawEnd) * 1000) / 1000;

    // Guard against overlap with next segment without shrinking unnaturally
    const nextSeg = sorted[segIdx + 1];
    if (nextSeg) {
      const nextStart = leadOffsetSeconds !== 0 ? Math.max(0, nextSeg.start + leadOffsetSeconds) : nextSeg.start;
      if (clampedEnd > nextStart) {
        clampedEnd = Math.max(clampedStart + 0.15, Math.round(nextStart * 1000) / 1000);
      }
    }

    const segDuration = Math.max(0.15, clampedEnd - clampedStart);

    // Sanitize segment text
    const cleanText = (seg.language === 'hi' || seg.language === 'ur')
      ? seg.text
      : sanitizeToHinglish(seg.text);

    // Ensure words exist
    let words = seg.words && seg.words.length > 0
      ? seg.words.map(w => ({
          ...w,
          text: (seg.language === 'hi' || seg.language === 'ur') ? w.text : sanitizeToHinglish(w.text)
        }))
      : cleanText.split(/\s+/).filter(Boolean).map(text => ({ id: uuid(), text, start: clampedStart, end: clampedEnd }));

    if (words.length === 0) {
      words = [{ id: uuid(), text: cleanText || '...', start: clampedStart, end: clampedEnd }];
    }

    if (words.length === 1) {
      const syncedWords = [{
        ...words[0],
        start: clampedStart,
        end: clampedEnd,
      }];
      return {
        ...seg,
        text: cleanText,
        start: clampedStart,
        end: clampedEnd,
        words: syncedWords,
      };
    }

    // Multi-word sync: compute phonetic syllable weights
    const weights = words.map(w => computeWordPhoneticWeight(w.text));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;

    let currTime = clampedStart;
    const syncedWords: CaptionWord[] = [];

    for (let i = 0; i < words.length; i++) {
      const isLast = i === words.length - 1;
      const wDur = isLast
        ? Math.max(0.05, clampedEnd - currTime)
        : Math.round(((weights[i] / totalWeight) * segDuration) * 1000) / 1000;

      const wStart = currTime;
      const wEnd = isLast ? clampedEnd : Math.round((currTime + wDur) * 1000) / 1000;

      syncedWords.push({
        id: words[i].id || uuid(),
        text: words[i].text,
        start: wStart,
        end: Math.max(wStart + 0.05, wEnd),
      });

      currTime = wEnd;
    }

    // Ensure last word terminates exactly at clampedEnd
    if (syncedWords.length > 0) {
      syncedWords[syncedWords.length - 1].end = clampedEnd;
    }

    return {
      ...seg,
      text: cleanText,
      start: clampedStart,
      end: clampedEnd,
      words: syncedWords,
    };
  });
}

/**
 * Converts raw Gemini transcription to structured caption track segments,
 * applying pacing and zero-gap alignment automatically.
 */
export function geminiToCaptionTrack(
  transcription: GeminiTranscription,
  language: Language,
  rules: SegmentationRules = DEFAULT_RULES
): CaptionSegment[] {
  const rawWords: CaptionWord[] = [];

  for (const seg of transcription.segments) {
    const wordsList = seg.words && seg.words.length > 0
      ? seg.words
      : seg.text.split(/\s+/).filter(Boolean).map((t, idx, arr) => {
          const dur = (seg.end - seg.start) / arr.length;
          return {
            text: t,
            start: seg.start + idx * dur,
            end: seg.start + (idx + 1) * dur,
          };
        });

    for (const w of wordsList) {
      const cleanWordText = (language === 'hi' || language === 'ur')
        ? w.text
        : sanitizeToHinglish(w.text);

      rawWords.push({
        id: uuid(),
        text: cleanWordText,
        start: w.start,
        end: w.end,
      });
    }
  }

  // Re-segment with pacing rules and zero gaps — preserve exact acoustic start/end (offset 0)
  const segmented = resegmentWords(rawWords, language, rules);
  return syncWordsToTimeline(segmented, 0);
}
