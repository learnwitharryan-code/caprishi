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
  let c = hex.replace('#', '').trim();
  if (c.startsWith('rgba')) {
    return '&H00FFFFFF&';
  }
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return '&H00FFFFFF&';
  const r = c.substring(0, 2);
  const g = c.substring(2, 4);
  const b = c.substring(4, 6);
  return `&H${alpha}${b}${g}${r}&`;
}

/**
 * Generate an Advanced SubStation Alpha (.ass) file with word-level highlights,
 * font styling, position, and resolution scaling.
 */
export function generateAssFile(
  segments: CaptionSegment[],
  style: CaptionStyle,
  resWidth: number,
  resHeight: number,
  outputPath: string
): void {
  // Scale font size proportionally to video height (baseline height 1920 for vertical)
  const scaleRatio = resHeight / 1920;
  const baseSize = style.fontSize || 32;
  const scaleMultiplier = style.scale || 1.0;
  const fontSize = Math.round(baseSize * 1.8 * scaleMultiplier * scaleRatio);

  const fontName = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const primaryColor = hexToAssColor(style.textColor || '#FFFFFF');
  const highlightColor = hexToAssColor(style.highlightColor || '#FACC15');
  const outlineColor = hexToAssColor(style.strokeColor || '#000000');
  const backColor = hexToAssColor(style.bgColor || '#000000', style.bgBoxEnabled ? '50' : '90');

  // Alignment: 1 = bottom-left, 2 = bottom-center, 3 = bottom-right
  let alignment = 2;
  if (style.textAlign === 'left') alignment = 1;
  if (style.textAlign === 'right') alignment = 3;

  // Vertical position (0 to 100% from top)
  const vPos = style.verticalPosition ?? 65;
  const marginV = Math.max(30, Math.round(((100 - vPos) / 100) * resHeight));

  // Spacing between letters/words (increased to prevent font collision)
  const letterSpacing = Math.round((style.letterSpacing || 1) * scaleRatio + 1);
  const outlineWidth = style.strokeEnabled
    ? Math.max(2, Math.round((style.strokeWidth || 2) * scaleRatio * 1.5))
    : 1;
  const borderStyle = style.bgBoxEnabled ? 3 : 1; // 3 = opaque box, 1 = outline + shadow

  const header = `[Script Info]
Title: CaptionForge Export
ScriptType: v4.00+
PlayResX: ${resWidth}
PlayResY: ${resHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},${highlightColor},${outlineColor},${backColor},-1,0,0,0,100,100,${letterSpacing},0,${borderStyle},${outlineWidth},${Math.round(2 * scaleRatio)},${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogues: string[] = [];

  const transformWord = (raw: string) => {
    const isUpper = style.styles === 'uppercase' || (style as any).textTransform === 'uppercase';
    const isLower = style.styles === 'lowercase';
    const isCap = style.styles === 'capitalize';
    if (isUpper) return raw.toUpperCase();
    if (isLower) return raw.toLowerCase();
    if (isCap) return raw.charAt(0).toUpperCase() + raw.slice(1);
    return raw;
  };

  for (const seg of segments) {
    if (!seg.words || seg.words.length === 0) {
      const start = formatAssTime(seg.start);
      const end = formatAssTime(seg.end);
      const text = transformWord(seg.text);
      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
      continue;
    }

    // Generate word-highlighted dialogues for each word in the segment
    for (let i = 0; i < seg.words.length; i++) {
      const activeW = seg.words[i];
      const nextW = seg.words[i + 1];
      const start = formatAssTime(activeW.start);
      const end = formatAssTime(nextW ? nextW.start : seg.end);

      // Build text with active word highlighted and clean word spacing (\h = hard space in ASS)
      const wordsText = seg.words
        .map((w, idx) => {
          const text = transformWord(w.text);
          if (idx === i) {
            const scaleInt = Math.round((style.emphasisSize || 1.08) * 100);
            return `{\\c${highlightColor}\\fscx${scaleInt}\\fscy${scaleInt}}${text}{\\r}`;
          }
          return `{\\c${primaryColor}}${text}`;
        });

      const baseSpacing = style.wordSpacing ?? 14;
      const spaceRepeat = Math.max(1, Math.min(8, Math.round(baseSpacing / 12)));
      const separator = '\\h'.repeat(spaceRepeat) + ' ';

      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${wordsText.join(separator)}`);
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

  // Use a relative path in process.cwd() for the temporary .ass file to avoid Windows drive colon/spaces
  const tempAssName = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ass`;
  const tempAssPath = path.resolve(process.cwd(), tempAssName);

  generateAssFile(segments, style, width, height, tempAssPath);

  const filterString = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,subtitles='${tempAssName}'`;

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
