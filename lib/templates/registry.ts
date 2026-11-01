export interface CaptionStyle {
  id: string;
  name: string;
  category: string;
  isNew?: boolean;

  // LINE & WRAP CONTROL
  singleLine: boolean;
  maxWidthPercent: number;

  // FONTS
  fontFamily: string;
  fallbackFont?: string;
  fontFace: 'Regular' | 'Medium' | 'SemiBold' | 'Bold' | 'Extra Bold' | 'Black' | 'Regular Italic' | 'Bold Italic';
  fontSize: number; // in px (default 32)

  // FORMAT
  styles: 'capitalize' | 'uppercase' | 'lowercase' | 'none';
  underline: boolean;
  italic?: boolean;
  textAlign: 'left' | 'center' | 'right';

  // POSITION
  positionX: number; // 0 to 100% (default 50.0)
  verticalPosition: number; // 0 to 100% (default 65.0)
  screenPosition?: 'top' | 'middle' | 'bottom';

  // COLOR & GRADIENT
  colorType: 'solid' | 'gradient';
  textColor: string;
  gradientColorsCount?: 2 | 3 | 4;
  gradientColor1?: string;
  gradientColor2?: string;
  gradientColor3?: string;
  gradientColor4?: string;
  gradientStop1?: number;
  gradientStop2?: number;
  gradientStop3?: number;
  gradientStop4?: number;
  gradientAngle?: number;

  // EMPHASIS (Active word highlight)
  emphasisMode: 'emphasize' | 'spotlight';
  emphasisColorType: 'solid' | 'gradient';
  highlightColor: string;
  highlightColors?: string[];
  emphasisGradientCount?: 2 | 3 | 4;
  emphasisGradient1?: string;
  emphasisGradient2?: string;
  emphasisGradient3?: string;
  emphasisGradient4?: string;
  emphasisGradientStop1?: number;
  emphasisGradientStop2?: number;
  emphasisGradientStop3?: number;
  emphasisGradientStop4?: number;
  emphasisGradientAngle?: number;
  highlightBg?: string;
  highlightBgs?: string[];
  emphasisSize: number; // Active word scale multiplier
  emphasisGlow: boolean;
  emphasisGlowColor: string;
  emphasisFont?: string;
  emphasisFontFace?: string;
  emphasisStyles?: 'capitalize' | 'uppercase' | 'lowercase' | 'none' | 'alternating';
  emphasisUnderline?: boolean;
  emphasisRotation?: number;

  // SPACING
  letterSpacing: number; // in px
  lineSpacing: number; // multiplier
  wordSpacing: number; // in px

  // EFFECTS: DROP SHADOW
  dropShadowEnabled: boolean;
  dropShadowColor: string;
  dropShadowOpacity: number;
  dropShadowX: number;
  dropShadowY: number;
  dropShadowBlur: number;

  // EFFECTS: 3D DEPTH
  threeDDepthEnabled: boolean;
  threeDDepthColor: string;
  threeDDepthX: number;
  threeDDepthY: number;
  threeDDepthBlur: number;

  // EFFECTS: STROKE
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;

  // EFFECTS: GLOW
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;

  arcEnabled?: boolean;

  // EFFECTS: BACKGROUND BOX
  bgBoxEnabled: boolean;
  bgColor: string;
  bgPadding: string;
  borderRadius: string;

  letterBoxesEnabled?: boolean;
  scale: number;
  direction?: 'ltr' | 'rtl';

  // ANIMATION & MODE (from 30 Trending Templates)
  animation?: 'pop' | 'bounce' | 'shake' | 'glitch' | 'blur' | 'fade' | 'slide' | 'wob' | 'zoom' | 'none';
  mode?: 'hl' | 'fill' | 'type';
  dimInactive?: number;
  emoji?: boolean;
  bilingual?: boolean;
  subtitleFont?: string;
  annotation?: 'none' | 'circle' | 'under' | 'strike' | 'sketch';
  caret?: boolean;
  wordsPerCaption?: number;

  // Preview helper
  previewWords?: string[];
  previewActiveIndex?: number;
}

const baseDefaults: Omit<CaptionStyle, 'id' | 'name' | 'category'> = {
  singleLine: true,
  maxWidthPercent: 90,
  fontFamily: 'Poppins, sans-serif',
  fontFace: 'Bold',
  fontSize: 34,
  styles: 'none',
  underline: false,
  textAlign: 'center',
  positionX: 50,
  verticalPosition: 65,
  colorType: 'solid',
  textColor: '#FFFFFF',
  gradientColorsCount: 2,
  gradientColor1: '#FACC15',
  gradientColor2: '#EF4444',
  gradientColor3: '#3B82F6',
  gradientColor4: '#10B981',
  gradientStop1: 0,
  gradientStop2: 100,
  gradientStop3: 66,
  gradientStop4: 100,
  gradientAngle: 135,
  emphasisMode: 'emphasize',
  emphasisColorType: 'solid',
  highlightColor: '#FFE600',
  emphasisGradientCount: 2,
  emphasisGradient1: '#FACC15',
  emphasisGradient2: '#EF4444',
  emphasisGradient3: '#3B82F6',
  emphasisGradient4: '#10B981',
  emphasisGradientStop1: 0,
  emphasisGradientStop2: 100,
  emphasisGradientStop3: 66,
  emphasisGradientStop4: 100,
  emphasisGradientAngle: 135,
  emphasisSize: 1.0,
  emphasisGlow: false,
  emphasisGlowColor: '#FFE600',
  letterSpacing: 0,
  lineSpacing: 1.2,
  wordSpacing: 14,
  dropShadowEnabled: false,
  dropShadowColor: '#000000',
  dropShadowOpacity: 70,
  dropShadowX: 0,
  dropShadowY: 3,
  dropShadowBlur: 6,
  threeDDepthEnabled: false,
  threeDDepthColor: '#000000',
  threeDDepthX: 2,
  threeDDepthY: 4,
  threeDDepthBlur: 0,
  strokeEnabled: false,
  strokeColor: '#000000',
  strokeWidth: 2,
  glowEnabled: false,
  glowColor: '#00E5FF',
  glowBlur: 14,
  bgBoxEnabled: false,
  bgColor: 'rgba(0,0,0,0.75)',
  bgPadding: '10px 22px',
  borderRadius: '16px',
  scale: 1.0,
  animation: 'pop',
  mode: 'hl',
  wordsPerCaption: 3,
};

export const TEMPLATES: Record<string, CaptionStyle> = {
  // 1. Viral Pop
  'viral-pop': {
    ...baseDefaults,
    id: 'viral-pop',
    name: 'Viral Pop',
    category: 'Creator',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Black',
    fontSize: 38,
    textColor: '#FFFFFF',
    highlightColor: '#FFE600',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 3,
    styles: 'uppercase',
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 70,
    dropShadowX: 0,
    dropShadowY: 3,
    dropShadowBlur: 6,
    previewWords: ['VIRAL', 'POP', 'CAPTION'],
    previewActiveIndex: 1,
  },

  // 2. Mega Bold
  'mega-bold': {
    ...baseDefaults,
    id: 'mega-bold',
    name: 'Mega Bold',
    category: 'Creator',
    fontFamily: 'Anton, sans-serif',
    fontFace: 'Regular',
    fontSize: 54,
    textColor: '#FFFFFF',
    highlightColor: '#39FF14',
    highlightColors: ['#39FF14', '#FFE600', '#FF3B3B'],
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 5,
    screenPosition: 'middle',
    verticalPosition: 50,
    styles: 'uppercase',
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 2,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 80,
    dropShadowX: 0,
    dropShadowY: 4,
    dropShadowBlur: 8,
    previewWords: ['MEGA', 'BOLD'],
    previewActiveIndex: 0,
  },

  // 3. Karaoke Fill
  'karaoke-fill': {
    ...baseDefaults,
    id: 'karaoke-fill',
    name: 'Karaoke Fill',
    category: 'Music',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFFFFF',
    highlightColor: '#FFD60A',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 2,
    animation: 'none',
    mode: 'fill',
    wordsPerCaption: 4,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 60,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    previewWords: ['Karaoke', 'Fill', 'Lyrics', 'Beat'],
    previewActiveIndex: 1,
  },

  // 4. Typewriter
  'typewriter': {
    ...baseDefaults,
    id: 'typewriter',
    name: 'Typewriter',
    category: 'Minimal',
    fontFamily: '"Space Mono", monospace',
    fontFace: 'Bold',
    fontSize: 30,
    textColor: '#EAFFEA',
    highlightColor: '#EAFFEA',
    bgBoxEnabled: true,
    bgColor: '#000000',
    borderRadius: '8px',
    bgPadding: '6px 14px',
    textAlign: 'left',
    positionX: 35,
    caret: true,
    animation: 'fade',
    mode: 'type',
    wordsPerCaption: 4,
    previewWords: ['Typewriter', 'text', 'line', 'code'],
    previewActiveIndex: 2,
  },

  // 5. Neon Night
  'neon-night': {
    ...baseDefaults,
    id: 'neon-night',
    name: 'Neon Night',
    category: 'Aesthetic',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFE6FA',
    highlightColor: '#4DF3FF',
    glowEnabled: true,
    glowColor: '#FF2FB3',
    glowBlur: 18,
    emphasisGlow: true,
    emphasisGlowColor: '#4DF3FF',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Neon', 'Night', 'Glow'],
    previewActiveIndex: 1,
  },

  // 6. Highlighter Box
  'highlighter-box': {
    ...baseDefaults,
    id: 'highlighter-box',
    name: 'Highlighter Box',
    category: 'Creator',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFFFFF',
    highlightColor: '#111111',
    highlightBg: '#FFE600',
    emphasisSize: 1.05,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 75,
    dropShadowX: 0,
    dropShadowY: 3,
    dropShadowBlur: 8,
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Daily', 'Highlighter', 'Trick'],
    previewActiveIndex: 1,
  },

  // 7. Clean Minimal
  'clean-minimal': {
    ...baseDefaults,
    id: 'clean-minimal',
    name: 'Clean Minimal',
    category: 'Minimal',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Medium',
    fontSize: 32,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    dimInactive: 0.5,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 60,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Clean', 'aesthetic', 'minimal', 'vibe'],
    previewActiveIndex: 2,
  },

  // 8. Cinematic Serif
  'cinematic-serif': {
    ...baseDefaults,
    id: 'cinematic-serif',
    name: 'Cinematic Serif',
    category: 'Cinematic',
    fontFamily: '"Playfair Display", serif',
    fontFace: 'Regular Italic',
    italic: true,
    fontSize: 32,
    textColor: '#F5EFE0',
    highlightColor: '#FFFFFF',
    dimInactive: 0.7,
    letterBoxesEnabled: true,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 80,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 8,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 5,
    previewWords: ['A', 'cinematic', 'story', 'worth', 'telling'],
    previewActiveIndex: 2,
  },

  // 9. Gradient Flow
  'gradient-flow': {
    ...baseDefaults,
    id: 'gradient-flow',
    name: 'Gradient Flow',
    category: 'Aesthetic',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 37,
    colorType: 'gradient',
    gradientColor1: '#A78BFA',
    gradientColor2: '#F472B6',
    gradientColor3: '#FB923C',
    gradientAngle: 90,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    emphasisGlow: true,
    emphasisGlowColor: '#F472B6',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Gradient', 'Color', 'Flow'],
    previewActiveIndex: 1,
  },

  // 10. Glitch Cyber
  'glitch-cyber': {
    ...baseDefaults,
    id: 'glitch-cyber',
    name: 'Glitch Cyber',
    category: 'Aesthetic',
    fontFamily: '"Space Mono", monospace',
    fontFace: 'Bold',
    fontSize: 32,
    textColor: '#FFFFFF',
    highlightColor: '#00E5FF',
    threeDDepthEnabled: true,
    threeDDepthColor: '#FF003C',
    threeDDepthX: 3,
    threeDDepthY: 0,
    threeDDepthBlur: 0,
    styles: 'uppercase',
    screenPosition: 'top',
    verticalPosition: 20,
    animation: 'glitch',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['CYBER', 'GLITCH', 'SYSTEM'],
    previewActiveIndex: 1,
  },

  // 11. Bounce Fun
  'bounce-fun': {
    ...baseDefaults,
    id: 'bounce-fun',
    name: 'Bounce Fun',
    category: 'Fun',
    fontFamily: 'Fredoka, sans-serif',
    fontFace: 'Bold',
    fontSize: 40,
    textColor: '#FFFFFF',
    highlightColor: '#FFD60A',
    highlightColors: ['#FFD60A', '#4CC9F0', '#FF6EC7', '#7CFF6B'],
    strokeEnabled: true,
    strokeColor: '#3A0CA3',
    strokeWidth: 4,
    animation: 'bounce',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Super', 'Fun', 'Bounce'],
    previewActiveIndex: 1,
  },

  // 12. Comic Pop
  'comic-pop': {
    ...baseDefaults,
    id: 'comic-pop',
    name: 'Comic Pop',
    category: 'Fun',
    fontFamily: 'Bangers, cursive',
    fontFace: 'Regular',
    fontSize: 46,
    textColor: '#FFFFFF',
    highlightColor: '#FFE600',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 4,
    threeDDepthEnabled: true,
    threeDDepthColor: '#E11D48',
    threeDDepthX: 3,
    threeDDepthY: 3,
    threeDDepthBlur: 0,
    styles: 'uppercase',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'wob',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['BOOM', 'COMIC', 'ACTION'],
    previewActiveIndex: 1,
  },

  // 13. Bilingual Stack
  'bilingual-stack': {
    ...baseDefaults,
    id: 'bilingual-stack',
    name: 'Bilingual Stack',
    category: 'Desi',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Bold',
    fontSize: 34,
    textColor: '#FFFFFF',
    highlightColor: '#FFD60A',
    bilingual: true,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 75,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Life', 'Changing', 'Simple', 'Habit'],
    previewActiveIndex: 1,
  },

  // 14. Handwritten
  'handwritten': {
    ...baseDefaults,
    id: 'handwritten',
    name: 'Handwritten',
    category: 'Aesthetic',
    fontFamily: 'Caveat, cursive',
    fontFace: 'Bold',
    fontSize: 50,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    highlightBg: 'linear-gradient(transparent 58%, #ffd54acc 58%)',
    textAlign: 'left',
    positionX: 35,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 65,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Notes', 'written', 'by', 'hand'],
    previewActiveIndex: 1,
  },

  // 15. News Bar
  'news-bar': {
    ...baseDefaults,
    id: 'news-bar',
    name: 'News Bar',
    category: 'Pro',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Bold',
    fontSize: 30,
    textColor: '#FFFFFF',
    highlightColor: '#FFE600',
    bgBoxEnabled: true,
    bgColor: '#C1121F',
    borderRadius: '0px',
    bgPadding: '8px 20px',
    styles: 'uppercase',
    animation: 'slide',
    mode: 'hl',
    wordsPerCaption: 5,
    previewWords: ['BREAKING', 'UPDATE', 'RIGHT', 'NOW', 'LIVE'],
    previewActiveIndex: 1,
  },

  // 16. Podcast Pill
  'podcast-pill': {
    ...baseDefaults,
    id: 'podcast-pill',
    name: 'Podcast Pill',
    category: 'Pro',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'SemiBold',
    fontSize: 32,
    textColor: '#FFFFFF',
    highlightColor: '#22D3EE',
    bgBoxEnabled: true,
    bgColor: 'rgba(15,15,22,0.85)',
    borderRadius: '9999px',
    bgPadding: '8px 22px',
    screenPosition: 'top',
    verticalPosition: 20,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Weekly', 'Podcast', 'Episode', 'Talk'],
    previewActiveIndex: 1,
  },

  // 17. Emoji React
  'emoji-react': {
    ...baseDefaults,
    id: 'emoji-react',
    name: 'Emoji React',
    category: 'Fun',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 37,
    textColor: '#FFFFFF',
    highlightColor: '#FF5DA2',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 3,
    emoji: true,
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Crazy', 'Fire', 'Reaction'],
    previewActiveIndex: 1,
  },

  // 18. Shake Impact
  'shake-impact': {
    ...baseDefaults,
    id: 'shake-impact',
    name: 'Shake Impact',
    category: 'Creator',
    fontFamily: 'Anton, sans-serif',
    fontFace: 'Regular',
    fontSize: 48,
    textColor: '#FFFFFF',
    highlightColor: '#FF2D2D',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 4,
    styles: 'uppercase',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'shake',
    mode: 'hl',
    wordsPerCaption: 2,
    previewWords: ['MAX', 'SHAKE'],
    previewActiveIndex: 1,
  },

  // 19. Blur Reveal
  'blur-reveal': {
    ...baseDefaults,
    id: 'blur-reveal',
    name: 'Blur Reveal',
    category: 'Cinematic',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 60,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 8,
    animation: 'blur',
    mode: 'type',
    wordsPerCaption: 4,
    previewWords: ['Smooth', 'blur', 'focus', 'reveal'],
    previewActiveIndex: 2,
  },

  // 20. Sticker Label
  'sticker-label': {
    ...baseDefaults,
    id: 'sticker-label',
    name: 'Sticker Label',
    category: 'Creator',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    highlightBg: '#FF5DA2',
    highlightBgs: ['#FF5DA2', '#3B82F6', '#22C55E', '#F59E0B'],
    emphasisRotation: -3,
    screenPosition: 'middle',
    verticalPosition: 50,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 65,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Sticker', 'Color', 'Label'],
    previewActiveIndex: 1,
  },

  // 21. Gold Calligraphy
  'gold-calligraphy': {
    ...baseDefaults,
    id: 'gold-calligraphy',
    name: 'Gold Calligraphy',
    category: 'Desi',
    fontFamily: '"Noto Nastaliq Urdu", "Playfair Display", serif',
    fallbackFont: 'Playfair Display',
    fontFace: 'Bold',
    fontSize: 37,
    colorType: 'gradient',
    gradientColor1: '#FFF3B0',
    gradientColor2: '#D4A017',
    gradientAngle: 135,
    textColor: '#FFF6C8',
    highlightColor: '#FFF6C8',
    emphasisGlow: true,
    emphasisGlowColor: '#D4A017',
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Royal', 'Gold', 'Crown'],
    previewActiveIndex: 1,
  },

  // 22. Bollywood Retro
  'bollywood-retro': {
    ...baseDefaults,
    id: 'bollywood-retro',
    name: 'Bollywood Retro',
    category: 'Desi',
    fontFamily: '"Rozha One", serif',
    fontFace: 'Regular',
    fontSize: 42,
    textColor: '#FFD23F',
    highlightColor: '#FFFFFF',
    strokeEnabled: true,
    strokeColor: '#7A0019',
    strokeWidth: 3,
    threeDDepthEnabled: true,
    threeDDepthColor: '#B3123A',
    threeDDepthX: 3,
    threeDDepthY: 3,
    threeDDepthBlur: 0,
    screenPosition: 'top',
    verticalPosition: 20,
    animation: 'zoom',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['Bollywood', 'Retro', 'Style'],
    previewActiveIndex: 1,
  },

  // 23. Circle Callout
  'circle-callout': {
    ...baseDefaults,
    id: 'circle-callout',
    name: 'Circle Callout',
    category: 'Annotated',
    fontFamily: 'Anton, sans-serif',
    fontFace: 'Regular Italic',
    italic: true,
    fontSize: 42,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    styles: 'uppercase',
    annotation: 'circle',
    bilingual: true,
    subtitleFont: 'Caveat',
    textAlign: 'left',
    positionX: 35,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['SECRET', 'VIRAL', 'TRICK', 'NOW'],
    previewActiveIndex: 1,
  },

  // 24. Scribble Underline
  'scribble-underline': {
    ...baseDefaults,
    id: 'scribble-underline',
    name: 'Scribble Underline',
    category: 'Annotated',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Extra Bold',
    fontSize: 35,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    annotation: 'under',
    textAlign: 'left',
    positionX: 35,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 65,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Highlight', 'this', 'key', 'point'],
    previewActiveIndex: 2,
  },

  // 25. Sketch Box
  'sketch-box': {
    ...baseDefaults,
    id: 'sketch-box',
    name: 'Sketch Box',
    category: 'Annotated',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Bold',
    fontSize: 34,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    annotation: 'sketch',
    screenPosition: 'middle',
    verticalPosition: 50,
    dropShadowEnabled: true,
    dropShadowColor: '#000000',
    dropShadowOpacity: 70,
    dropShadowX: 0,
    dropShadowY: 2,
    dropShadowBlur: 6,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['Creative', 'Sketch', 'Box', 'Frame'],
    previewActiveIndex: 1,
  },

  // 26. Marker Strike
  'marker-strike': {
    ...baseDefaults,
    id: 'marker-strike',
    name: 'Marker Strike',
    category: 'Annotated',
    fontFamily: 'Anton, sans-serif',
    fontFace: 'Regular Italic',
    italic: true,
    fontSize: 43,
    textColor: '#FFFFFF',
    highlightColor: '#FF6B6B',
    styles: 'uppercase',
    annotation: 'strike',
    screenPosition: 'top',
    verticalPosition: 20,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['MISTAKE', 'STRIKE', 'FIX'],
    previewActiveIndex: 0,
  },

  // 27. Top Hook
  'top-hook': {
    ...baseDefaults,
    id: 'top-hook',
    name: 'Top Hook',
    category: 'Layout',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Black',
    fontSize: 34,
    textColor: '#111111',
    highlightColor: '#E11D48',
    bgBoxEnabled: true,
    bgColor: '#FFFFFF',
    borderRadius: '6px',
    bgPadding: '6px 16px',
    styles: 'uppercase',
    screenPosition: 'top',
    verticalPosition: 16,
    animation: 'fade',
    mode: 'hl',
    wordsPerCaption: 4,
    previewWords: ['STOP', 'SCROLLING', 'WATCH', 'THIS'],
    previewActiveIndex: 1,
  },

  // 28. Center Stamp
  'center-stamp': {
    ...baseDefaults,
    id: 'center-stamp',
    name: 'Center Stamp',
    category: 'Layout',
    fontFamily: 'Anton, sans-serif',
    fontFace: 'Regular',
    fontSize: 72,
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 6,
    styles: 'uppercase',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'zoom',
    mode: 'hl',
    wordsPerCaption: 1,
    singleLine: true,
    previewWords: ['IMPACT'],
    previewActiveIndex: 0,
  },

  // 29. Size Jump
  'size-jump': {
    ...baseDefaults,
    id: 'size-jump',
    name: 'Size Jump',
    category: 'Layout',
    fontFamily: 'Montserrat, sans-serif',
    fontFace: 'Black',
    fontSize: 32,
    textColor: '#FFFFFF',
    highlightColor: '#FFE600',
    emphasisSize: 1.6,
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 3,
    styles: 'uppercase',
    screenPosition: 'middle',
    verticalPosition: 50,
    animation: 'pop',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['HUGE', 'SIZE', 'JUMP'],
    previewActiveIndex: 1,
  },

  // 30. Corner Tag
  'corner-tag': {
    ...baseDefaults,
    id: 'corner-tag',
    name: 'Corner Tag',
    category: 'Layout',
    fontFamily: 'Poppins, sans-serif',
    fontFace: 'Extra Bold',
    italic: true,
    fontSize: 32,
    textColor: '#111111',
    highlightColor: '#E11D48',
    bgBoxEnabled: true,
    bgColor: '#FFFFFF',
    borderRadius: '0px',
    bgPadding: '6px 16px',
    styles: 'uppercase',
    textAlign: 'right',
    positionX: 75,
    screenPosition: 'top',
    verticalPosition: 16,
    animation: 'slide',
    mode: 'hl',
    wordsPerCaption: 3,
    previewWords: ['PRO', 'CORNER', 'TAG'],
    previewActiveIndex: 1,
  },
};

export const DEFAULT_STYLE: CaptionStyle = TEMPLATES['viral-pop'];
