import { z } from 'zod';

export const GeminiWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

export const GeminiSegmentSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  words: z.array(GeminiWordSchema).default([]),
});

export const GeminiTranscriptionSchema = z.object({
  segments: z.array(GeminiSegmentSchema).min(1),
});

export type GeminiTranscription = z.infer<typeof GeminiTranscriptionSchema>;
