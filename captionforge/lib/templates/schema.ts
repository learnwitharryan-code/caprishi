import { z } from 'zod';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const AnimationSchema = z.object({
  type: z.enum([
    'none', 'fade', 'slideUp', 'slideDown', 'slideLeft', 'slideRight',
    'scale', 'bounce', 'shake', 'typewriter', 'glitch', 'flip',
  ]),
  duration: z.number().default(0.25),
  easing: z.string().default('easeOut'),
  delay: z.number().default(0),
  stagger: z.number().optional(),
});

export const WordHighlightSchema = z.object({
  mode: z.enum([
    'none',
    'color-swap',
    'scale-up',
    'background-box',
    'underline',
    'karaoke-fill',
    'glow',
    'bold',
  ]),
  activeColor: z.string().optional(),
  activeScale: z.number().optional(),
  activeBackground: z.string().optional(),
  activeBorderRadius: z.string().optional(),
  activePadding: z.string().optional(),
  karaokeColor: z.string().optional(),
});

export const FontSchema = z.object({
  latin: z.string().default('Poppins'),
  devanagari: z.string().default('Noto Sans Devanagari'),
  arabic: z.string().default('Noto Nastaliq Urdu'),
  naskh: z.string().default('Noto Naskh Arabic'),
});

export const BackgroundBoxSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default('rgba(0,0,0,0.6)'),
  borderRadius: z.string().default('8px'),
  padding: z.string().default('8px 16px'),
  blur: z.number().optional(),
});

export const StrokeSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default('#000000'),
  width: z.number().default(2),
});

export const ShadowSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default('rgba(0,0,0,0.8)'),
  x: z.number().default(2),
  y: z.number().default(2),
  blur: z.number().default(4),
});

export const GradientSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(['linear', 'radial']).default('linear'),
  colors: z.array(z.string()).min(2),
  angle: z.number().default(90),
});

// ─── Main Template Schema ─────────────────────────────────────────────────────

export const CaptionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'energy', 'cinematic', 'minimal', 'language',
    'creative', 'bilingual', 'broadcast', 'social', 'custom',
  ]),
  tags: z.array(z.string()).default([]),
  isBuiltIn: z.boolean().default(true),

  // Typography
  font: FontSchema,
  fontSize: z.number().default(48),
  fontWeight: z.number().default(700),
  lineHeight: z.number().default(1.2),
  letterSpacing: z.number().default(0),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).default('none'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  direction: z.enum(['ltr', 'rtl', 'auto']).default('auto'),

  // Color
  color: z.string().default('#FFFFFF'),
  gradient: GradientSchema.optional(),

  // Effects
  stroke: StrokeSchema,
  shadow: ShadowSchema,
  glow: ShadowSchema.optional(),

  // Background
  backgroundBox: BackgroundBoxSchema,

  // Position
  position: z.object({
    vertical: z.enum(['top', 'middle', 'bottom']).default('bottom'),
    horizontalOffset: z.number().default(0),
    verticalOffset: z.number().default(8),
    maxWidthPercent: z.number().default(85),
    safeZonePercent: z.number().default(5),
  }),

  // Segmentation overrides
  segmentation: z.object({
    maxCharsPerLine: z.number().default(32),
    maxWordsPerSegment: z.number().default(8),
    maxLines: z.number().default(2),
    minDurationMs: z.number().default(500),
    groupByPunctuation: z.boolean().default(true),
  }).optional(),

  // Animation
  animationIn: AnimationSchema,
  animationOut: AnimationSchema,
  wordHighlight: WordHighlightSchema,
  wordEntryAnimation: AnimationSchema.optional(),

  // Special FX
  glitch: z.object({
    enabled: z.boolean().default(false),
    intensity: z.number().default(3),
    colors: z.tuple([z.string(), z.string()]).optional(),
  }).optional(),

  // Emoji
  emojiMode: z.enum(['none', 'auto-append', 'auto-inline']).default('none'),

  // Bilingual
  bilingual: z.object({
    enabled: z.boolean().default(false),
    secondaryLanguage: z.enum(['en', 'hi', 'ur', 'hinglish']).optional(),
    secondaryFontSize: z.number().default(36),
    secondaryColor: z.string().default('rgba(255,255,255,0.75)'),
    gap: z.number().default(8),
  }).optional(),
});

export type CaptionTemplate = z.infer<typeof CaptionTemplateSchema>;
export type Animation = z.infer<typeof AnimationSchema>;
export type WordHighlight = z.infer<typeof WordHighlightSchema>;
