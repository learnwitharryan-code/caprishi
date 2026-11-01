import 'server-only';
import { GoogleGenAI } from '@google/genai';

// Safe build-time fallback to prevent Vercel "Failed to collect page data" build errors
const apiKey = process.env.GEMINI_API_KEY || 'dummy_api_key_for_build';

export const genai = new GoogleGenAI({
  apiKey,
});

export const MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

export function checkGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_api_key_for_build');
}
