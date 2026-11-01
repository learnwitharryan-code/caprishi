import { CaptionSegment } from '@/types/caption';

function pad(n: number, len: number): string {
  return String(Math.floor(n)).padStart(len, '0');
}

export function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

export function generateSRT(segments: CaptionSegment[]): string {
  const blocks = segments.map((seg, i) => {
    const start = formatTimecode(seg.start);
    const end = formatTimecode(seg.end);
    const text = seg.text.trim();
    return `${i + 1}\n${start} --> ${end}\n${text}\n`;
  });
  return blocks.join('\n') + '\n';
}

export function generateVTT(segments: CaptionSegment[]): string {
  const header = 'WEBVTT\n\n';
  const blocks = segments.map((seg, i) => {
    const start = formatTimecode(seg.start).replace(',', '.');
    const end = formatTimecode(seg.end).replace(',', '.');
    return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
  });
  return header + blocks.join('\n') + '\n';
}

export function generateTXT(segments: CaptionSegment[]): string {
  return segments.map(s => s.text.trim()).join('\n');
}

export function generateJSON(segments: CaptionSegment[]): string {
  return JSON.stringify(segments, null, 2);
}
