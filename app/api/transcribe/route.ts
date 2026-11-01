import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { transcribeAudio } from '@/lib/gemini/transcribe';
import { checkGeminiApiKey } from '@/lib/gemini/client';
import { geminiToCaptionTrack, PACING_PRESETS, PacingPresetKey, DEFAULT_RULES } from '@/lib/captions/segment';
import { Language, CaptionTrack } from '@/types/caption';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let projectId = '';
  try {
    const body = (await req.json()) as {
      projectId: string;
      language?: Language;
      pacingPreset?: PacingPresetKey;
    };
    projectId = body.projectId;
    const language = body.language || 'hinglish';
    const pacingRules =
      body.pacingPreset && PACING_PRESETS[body.pacingPreset]
        ? PACING_PRESETS[body.pacingPreset]
        : DEFAULT_RULES;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (!project.audioPath) return NextResponse.json({ error: 'Audio not extracted yet' }, { status: 400 });

    if (!checkGeminiApiKey()) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables. Please add GEMINI_API_KEY in Project Settings > Environment Variables.' },
        { status: 500 }
      );
    }

    // Update status
    await prisma.project.update({ where: { id: projectId }, data: { status: 'transcribing' } });

    const transcription = await transcribeAudio(project.audioPath, language);
    const segments = geminiToCaptionTrack(transcription, language, pacingRules);

    const track: CaptionTrack = {
      id: uuid(),
      language,
      segments,
      createdAt: new Date().toISOString(),
      source: 'gemini',
    };

    const existingTracks: CaptionTrack[] = JSON.parse(project.tracksJson || '[]');
    const updatedTracks = [
      ...existingTracks.filter(t => t.language !== language),
      track,
    ];

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ready',
        tracksJson: JSON.stringify(updatedTracks),
        activeTrackId: track.id,
      },
    });

    return NextResponse.json({ track });
  } catch (err: any) {
    console.error('[transcribe]', err);
    if (projectId) {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'error' } }).catch(() => {});
    }
    return NextResponse.json({ error: err.message ?? 'Transcription failed' }, { status: 500 });
  }
}
