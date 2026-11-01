import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { translateTranscription } from '@/lib/gemini/translate';
import { geminiToCaptionTrack } from '@/lib/captions/segment';
import { Language, CaptionTrack } from '@/types/caption';
import { v4 as uuid } from 'uuid';
import { GeminiTranscriptionSchema } from '@/lib/gemini/schemas';

export async function POST(req: NextRequest) {
  try {
    const { projectId, fromLanguage, toLanguage } = (await req.json()) as {
      projectId: string;
      fromLanguage: Language;
      toLanguage: Language;
    };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tracks: CaptionTrack[] = JSON.parse(project.tracksJson || '[]');
    const sourceTrack = tracks.find(t => t.language === fromLanguage);
    if (!sourceTrack)
      return NextResponse.json(
        { error: `No ${fromLanguage} track found. Transcribe first.` },
        { status: 400 }
      );

    // Convert to Gemini format for translation
    const geminiInput = GeminiTranscriptionSchema.parse({
      segments: sourceTrack.segments.map(seg => ({
        text: seg.text,
        start: seg.start,
        end: seg.end,
        words: seg.words.map(w => ({ text: w.text, start: w.start, end: w.end })),
      })),
    });

    const translated = await translateTranscription(geminiInput, fromLanguage, toLanguage);
    const segments = geminiToCaptionTrack(translated, toLanguage);

    const newTrack: CaptionTrack = {
      id: uuid(),
      language: toLanguage,
      segments,
      createdAt: new Date().toISOString(),
      source: 'gemini',
    };

    const updatedTracks = [
      ...tracks.filter(t => t.language !== toLanguage),
      newTrack,
    ];

    await prisma.project.update({
      where: { id: projectId },
      data: { tracksJson: JSON.stringify(updatedTracks) },
    });

    return NextResponse.json({ track: newTrack });
  } catch (err: any) {
    console.error('[translate]', err);
    return NextResponse.json({ error: err.message ?? 'Translation failed' }, { status: 500 });
  }
}
