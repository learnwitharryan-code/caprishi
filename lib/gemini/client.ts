import 'server-only';
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

export const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
