export type Language = 'en' | 'hi' | 'ur' | 'hinglish' | 'auto';

export interface CaptionWord {
  id: string;
  text: string;
  start: number; // seconds, 3 decimal places
  end: number;
  confidence?: number;
  style?: {
    color?: string;
    scale?: number;
    emoji?: string;
  };
}

export interface CaptionSegment {
  id: string;
  words: CaptionWord[];
  text: string;
  start: number;
  end: number;
  language: Language;
  speaker?: string;
}

export interface CaptionTrack {
  id: string;
  language: Language;
  segments: CaptionSegment[];
  createdAt: string;
  source: 'gemini' | 'manual' | 'import';
}
