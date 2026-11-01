import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { CaptionSegment } from '@/types/caption';
import { CaptionStyle } from '@/lib/templates/registry';
import { probeMedia } from './probe';

if (ffmpegPath) {
  const p =
    typeof ffmpegPath === 'string'
      ? ffmpegPath
      : (ffmpegPath as any)?.default || ffmpegPath;
  ffmpeg.setFfmpegPath(p);
}

export type RenderResolution = '720p' | '1080p' | '1440p' | '4K';

function pad(n: number, len = 2): string {
  return String(Math.floor(n)).padStart(len, '0');
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function hexToAssColor(hex: string, alpha = '00'): string {
  if (!hex) return `&H${alpha}FFFFFF&`;
  let c = hex.replace('#', '').trim();
  if (c.startsWith('rgba') || c.startsWith('rgb')) {
    return `&H${alpha}FFFFFF&`;
  }
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return `&H${alpha}FFFFFF&`;
  const r = c.substring(0, 2);
  const g = c.substring(2, 4);
  const b = c.substring(4, 6);
  return `&H${alpha}${b}${g}${r}&`;
}

function resolveAssFontName(rawFamily: string, fontFace?: string): { fontName: string; isBold: number } {
  const base = rawFamily ? rawFamily.split(',')[0].trim().replace(/['"]/g, '') : 'Poppins';
  const face = fontFace || 'Bold';
  const isHeavy = face.includes('Black') || face.includes('Extra Bold');
  const isBold = face.includes('Bold') || face.includes('Black') || face.includes('SemiBold') || face.includes('Medium') || face === 'Heavy';

  const lower = base.toLowerCase();
  if (lower.includes('permanent marker')) return { fontName: 'Permanent Marker', isBold: 0 };
  if (lower.includes('titan one')) return { fontName: 'Titan One', isBold: 0 };
  if (lower.includes('vt323')) return { fontName: 'VT323', isBold: 0 };
  if (lower.includes('black han sans')) return { fontName: 'Black Han Sans', isBold: 0 };
  if (lower.includes('cinzel')) return { fontName: face.includes('Bold') ? 'Cinzel' : 'Cinzel', isBold: isBold ? -1 : 0 };
  if (lower.includes('roboto')) return { fontName: 'Roboto', isBold: isBold ? -1 : 0 };
  if (lower.includes('poppins')) {
    if (face.includes('Black')) return { fontName: 'Poppins Black', isBold: 0 };
    if (face.includes('Extra Bold')) return { fontName: 'Poppins ExtraBold', isBold: 0 };
    return { fontName: 'Poppins', isBold: -1 };
  }
  if (lower.includes('montserrat')) {
    if (face.includes('Black')) return { fontName: 'Montserrat Black', isBold: 0 };
    if (face.includes('Extra Bold')) return { fontName: 'Montserrat ExtraBold', isBold: 0 };
    return { fontName: 'Montserrat', isBold: -1 };
  }
  if (lower.includes('anton')) return { fontName: 'Anton', isBold: 0 };
  if (lower.includes('bebas')) return { fontName: 'Bebas Neue', isBold: 0 };
  if (lower.includes('space mono')) return { fontName: 'Space Mono', isBold: -1 };
  if (lower.includes('righteous')) return { fontName: 'Righteous', isBold: 0 };
  if (lower.includes('bangers')) return { fontName: 'Bangers', isBold: 0 };
  if (lower.includes('playfair')) return { fontName: 'Playfair Display', isBold: isBold ? -1 : 0 };
  if (lower.includes('fredoka')) return { fontName: 'Fredoka', isBold: isBold ? -1 : 0 };
  if (lower.includes('caveat')) return { fontName: 'Caveat', isBold: isBold ? -1 : 0 };
  if (lower.includes('rozha')) return { fontName: 'Rozha One', isBold: 0 };
  if (lower.includes('mukta')) return { fontName: 'Mukta', isBold: -1 };
  if (lower.includes('noto sans devanagari')) return { fontName: 'Noto Sans Devanagari', isBold: -1 };
  if (lower.includes('outfit')) return { fontName: 'Outfit', isBold: isBold ? -1 : 0 };
  if (lower.includes('oswald')) return { fontName: 'Oswald', isBold: isBold ? -1 : 0 };
  if (lower.includes('inter')) return { fontName: 'Inter', isBold: isBold ? -1 : 0 };
  if (lower.includes('arial black')) return { fontName: 'Arial', isBold: -1 };
  if (lower.includes('impact')) return { fontName: 'Impact', isBold: 0 };

  return { fontName: base || 'Poppins', isBold: isBold ? -1 : 0 };
}

/**
 * Generate an Advanced SubStation Alpha (.ass) file with pixel-perfect match
 * to the web editor's screen preview (fonts, position, scale, colors, stroke, shadow, glow, spacing).
 */
export function generateAssFile(
  segments: CaptionSegment[],
  style: CaptionStyle,
  resWidth: number,
  resHeight: number,
  outputPath: string
): void {
  // Screen preview reference height: on desktop browser preview is ~710px high.
  // We scale font size and effects proportionally to target render resolution height.
  const scaleRatio = resHeight / 710;
  const baseSize = style.fontSize || 34;
  const scaleMultiplier = style.scale || 1.0;
  const fontSize = Math.max(16, Math.round(baseSize * scaleRatio * scaleMultiplier));

  // Clean font name and resolve exact TTF family
  const { fontName, isBold } = resolveAssFontName(style.fontFamily, style.fontFace);

  // Normal Word Color (Solid or primary gradient stop)
  const normalColorHex = style.colorType === 'gradient'
    ? (style.gradientColor1 || '#FACC15')
    : (style.textColor || '#FFFFFF');
  const primaryColor = hexToAssColor(normalColorHex);

  // Default active word color fallback
  const defaultActiveColorHex = style.emphasisColorType === 'gradient'
    ? (style.emphasisGradient1 || '#FACC15')
    : (style.highlightColor || '#FFE600');
  const defaultHighlightColor = hexToAssColor(defaultActiveColorHex);

  // Stroke / Outline
  const outlineColor = hexToAssColor(style.strokeColor || '#000000');
  const outlineWidth = style.strokeEnabled
    ? Math.max(1, Math.round((style.strokeWidth || 2) * scaleRatio * 0.9))
    : 0;

  // Drop Shadow / 3D Depth
  let shadowDist = 0;
  let backColor = '&H00000000&';

  if (style.threeDDepthEnabled) {
    shadowDist = Math.max(2, Math.round((style.threeDDepthY || 4) * scaleRatio));
    backColor = hexToAssColor(style.threeDDepthColor || '#000000', '00');
  } else if (style.dropShadowEnabled) {
    const rawDist = Math.hypot(style.dropShadowX || 0, style.dropShadowY || 0);
    shadowDist = Math.max(1, Math.round((rawDist || 2) * scaleRatio));
    const alphaVal = Math.round((1 - (style.dropShadowOpacity ?? 63) / 100) * 255);
    const alphaHex = Math.max(0, Math.min(255, alphaVal)).toString(16).padStart(2, '0').toUpperCase();
    backColor = hexToAssColor(style.dropShadowColor || '#000000', alphaHex);
  } else if (style.bgBoxEnabled) {
    backColor = hexToAssColor(style.bgColor || '#000000', '40');
  }

  const borderStyle = style.bgBoxEnabled ? 3 : 1; // 3 = opaque box, 1 = outline + shadow

  // Font face: Italic, Underline
  const isItalic = (style.italic || (style.fontFace && style.fontFace.includes('Italic'))) ? -1 : 0;
  const isUnderline = style.underline ? -1 : 0;

  // Letter spacing
  const letterSpacing = Math.round((style.letterSpacing || 0) * scaleRatio);

  // Exact Position coordinates (X & Y %) matching the screen
  const posX = Math.round(((style.positionX ?? 50) / 100) * resWidth);
  const posY = Math.round(((style.verticalPosition ?? 65) / 100) * resHeight);

  // Wrap style: \q2 = single-line (no word wrap); \q1 = multi-line wrap
  const wrapTag = style.singleLine ? '\\q2' : '\\q1';

  const header = `[Script Info]
Title: CaptionForge Export
ScriptType: v4.00+
PlayResX: ${resWidth}
PlayResY: ${resHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},${defaultHighlightColor},${outlineColor},${backColor},${isBold},${isItalic},${isUnderline},0,100,100,${letterSpacing},0,${borderStyle},${outlineWidth},${shadowDist},5,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogues: string[] = [];

  const transformWord = (raw: string, isActive: boolean) => {
    if (!raw) return '';
    const styleMode = (isActive && style.emphasisStyles && style.emphasisStyles !== 'none')
      ? style.emphasisStyles
      : style.styles;
    if (styleMode === 'uppercase') return raw.toUpperCase();
    if (styleMode === 'lowercase') return raw.toLowerCase();
    if (styleMode === 'capitalize') return raw.charAt(0).toUpperCase() + raw.slice(1);
    return raw;
  };

  // Word spacing separator
  let separator = ' ';
  if (style.wordSpacing !== undefined && style.wordSpacing > 0) {
    const spaceCount = Math.max(1, Math.min(8, Math.round(style.wordSpacing / 12)));
    separator = '\\h'.repeat(spaceCount) + ' ';
  }

  // Inactive word dimming alpha calculation
  let dimAlphaHex = '00';
  const hasDim = style.dimInactive !== undefined && style.dimInactive < 1 && style.mode !== 'fill';
  if (hasDim) {
    const alphaVal = Math.round((1 - (style.dimInactive ?? 1)) * 255);
    dimAlphaHex = Math.max(0, Math.min(255, alphaVal)).toString(16).padStart(2, '0').toUpperCase();
  }

  for (const seg of segments) {
    if (!seg.words || seg.words.length === 0) {
      const start = formatAssTime(seg.start);
      const end = formatAssTime(seg.end);
      const text = transformWord(seg.text, false);
      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})${wrapTag}}${text}`);
      continue;
    }

    // Generate word-highlighted dialogues for each word in the segment
    for (let i = 0; i < seg.words.length; i++) {
      const activeW = seg.words[i];
      const nextW = seg.words[i + 1];
      const start = formatAssTime(activeW.start);
      const end = formatAssTime(nextW ? nextW.start : seg.end);

      // Build text with active word highlighted
      const wordsElements: string[] = [];

      for (let wIdx = 0; wIdx < seg.words.length; wIdx++) {
        // Typewriter mode hides future words
        if (style.mode === 'type' && wIdx > i) {
          continue;
        }

        const isCurrentActive = wIdx === i;
        const isFillActive = style.mode === 'fill' && wIdx <= i;
        const isActive = isCurrentActive || isFillActive;
        const w = seg.words[wIdx];
        const text = transformWord(w.text, isActive);

        if (isActive) {
          // Resolve highlight color (multi-color cycle or solid)
          let activeColorHex = defaultActiveColorHex;
          if (style.highlightColors && style.highlightColors.length > 0) {
            activeColorHex = style.highlightColors[wIdx % style.highlightColors.length];
          }
          const wordHighlightColor = hexToAssColor(activeColorHex);

          // Resolve active sticker background box
          let activeBg = style.highlightBg;
          if (style.highlightBgs && style.highlightBgs.length > 0) {
            activeBg = style.highlightBgs[wIdx % style.highlightBgs.length];
          }

          const scaleInt = (style.emphasisSize && style.emphasisSize > 1.0)
            ? Math.round(style.emphasisSize * 100)
            : 100;
          const scaleTag = scaleInt !== 100 ? `\\fscx${scaleInt}\\fscy${scaleInt}` : '';
          const glowTag = style.emphasisGlow ? `\\blur${Math.max(2, Math.round(4 * scaleRatio))}` : '';
          const rotTag = style.emphasisRotation ? `\\frz${style.emphasisRotation}` : '';

          if (activeBg) {
            // Sticker box badge around the active word
            const badgeColor = hexToAssColor(activeBg);
            const badgeBord = Math.max(8, Math.round(14 * scaleRatio));
            wordsElements.push(`{\\1a&H00&\\3a&H00&\\c${wordHighlightColor}\\3c${badgeColor}\\bord${badgeBord}${scaleTag}${glowTag}${rotTag}}${text}{\\c${primaryColor}\\3c${outlineColor}\\bord${outlineWidth}\\fscx100\\fscy100\\blur0\\frz0}`);
          } else {
            wordsElements.push(`{\\1a&H00&\\3a&H00&\\c${wordHighlightColor}${scaleTag}${glowTag}${rotTag}}${text}{\\c${primaryColor}\\fscx100\\fscy100\\blur0\\frz0}`);
          }
        } else {
          // Inactive word: apply dimming if configured
          if (hasDim) {
            wordsElements.push(`{\\1a&H${dimAlphaHex}&\\3a&H${dimAlphaHex}&\\c${primaryColor}}${text}{\\1a&H00&\\3a&H00&}`);
          } else {
            wordsElements.push(text);
          }
        }
      }

      const lineContent = wordsElements.join(separator);
      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})${wrapTag}}${lineContent}`);
    }
  }

  const content = header + dialogues.join('\n') + '\n';
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * Render video with burned-in captions up to 4K using FFmpeg
 */
export async function renderVideo(
  inputVideoPath: string,
  segments: CaptionSegment[],
  style: CaptionStyle,
  resolution: RenderResolution,
  outputVideoPath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const mediaInfo = await probeMedia(inputVideoPath);
  const isVertical = mediaInfo.height > mediaInfo.width;

  // Determine target resolution dimensions
  let width = 1080;
  let height = 1920;

  switch (resolution) {
    case '720p':
      width = isVertical ? 720 : 1280;
      height = isVertical ? 1280 : 720;
      break;
    case '1080p':
      width = isVertical ? 1080 : 1920;
      height = isVertical ? 1920 : 1080;
      break;
    case '1440p':
      width = isVertical ? 1440 : 2560;
      height = isVertical ? 2560 : 1440;
      break;
    case '4K':
      width = isVertical ? 2160 : 3840;
      height = isVertical ? 3840 : 2160;
      break;
  }

  // Temporary ASS subtitle file
  const tempAssName = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ass`;
  const tempAssPath = path.resolve(process.cwd(), tempAssName);

  generateAssFile(segments, style, width, height, tempAssPath);

  // Fonts directory for FFmpeg (use relative path to avoid Windows spaces)
  const fontsDir = 'public/fonts';

  // FFmpeg filter string: scale + pad + burned-in subtitles with custom fonts directory
  const filterString = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,subtitles='${tempAssName}':fontsdir='${fontsDir}'`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputVideoPath)
      .outputOptions([
        '-vf', filterString,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', resolution === '4K' ? '16' : '18',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
      ])
      .on('progress', (p) => {
        if (onProgress && p.percent) {
          onProgress(Math.min(100, Math.round(p.percent)));
        }
      })
      .on('end', () => {
        try {
          if (fs.existsSync(tempAssPath)) fs.unlinkSync(tempAssPath);
        } catch {}
        resolve(outputVideoPath);
      })
      .on('error', (err) => {
        try {
          if (fs.existsSync(tempAssPath)) fs.unlinkSync(tempAssPath);
        } catch {}
        reject(err);
      })
      .save(outputVideoPath);
  });
}
