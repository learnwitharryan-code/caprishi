import { z } from 'zod';

export const CaptionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fontFamily: z.string(),
  fontSize: z.number().default(48),
  fontWeight: z.union([z.string(), z.number()]).default('bold'),
  color: z.string().default('#FFFFFF'),
  highlightColor: z.string().default('#FACC15'),
  backgroundColor: z.string().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().default(0),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().default(0),
  animation: z.enum(['pop', 'fade', 'bounce', 'wave', 'karaoke', 'none']).default('pop'),
  position: z.enum(['top', 'middle', 'bottom']).default('bottom'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  maxWordsPerLine: z.number().default(4),
  textTransform: z.enum(['uppercase', 'lowercase', 'capitalize', 'none']).default('none'),
});

export type CaptionTemplate = z.infer<typeof CaptionTemplateSchema>;
