import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CaptionTrack, CaptionSegment, CaptionWord } from '@/types/caption';
import { syncWordsToTimeline } from '@/lib/captions/segment';
import { genai, MODEL, FALLBACK_MODELS } from '@/lib/gemini/client';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { projectId, trackId, mode = 'cadence' } = (await req.json()) as {
      projectId: string;
      trackId?: string;
      mode?: 'cadence' | 'ai';
    };

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const tracks: CaptionTrack[] = JSON.parse(project.tracksJson || '[]');
    const targetTrackId = trackId || project.activeTrackId;
    const track = tracks.find((t) => t.id === targetTrackId) || tracks[0];

    if (!track || !track.segments.length) {
      return NextResponse.json({ error: 'No captions found to sync' }, { status: 400 });
    }

    let syncedSegments: CaptionSegment[] = [];

    // AI Audio Alignment mode
    if (mode === 'ai' && project.audioPath && fs.existsSync(project.audioPath)) {
      try {
        const audioBuffer = fs.readFileSync(project.audioPath);
        const base64Audio = audioBuffer.toString('base64');
        const simplifiedTranscript = track.segments.map((s) => ({
          id: s.id,
          text: s.text,
          approxStart: s.start,
          approxEnd: s.end,
          words: s.words.map((w) => w.text),
        }));

        const prompt = `You are a precision speech-to-text forced alignment tool.
Listen to the audio and adjust the exact start and end timestamps (in decimal seconds, 3 decimals) for each word in these captions:
${JSON.stringify(simplifiedTranscript)}

Rules:
1. Align timestamps with the actual acoustic speech in the audio.
2. Words in the same segment must not have gaps.
3. Return ONLY valid JSON matching this schema:
{
  "segments": [
    {
      "id": "segment-id",
      "start": 0.000,
      "end": 2.500,
      "words": [
        { "text": "word", "start": 0.000, "end": 0.500 }
      ]
    }
  ]
}`;

        const modelToUse = FALLBACK_MODELS[0] || MODEL;
        const response = await genai.models.generateContent({
          model: modelToUse,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/wav',
                    data: base64Audio,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.segments && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          const aiSegmentsMap = new Map<string, any>(parsed.segments.map((s: any) => [s.id, s]));
          const aligned = track.segments.map((origSeg) => {
            const aiSeg = aiSegmentsMap.get(origSeg.id);
            if (!aiSeg) return origSeg;
            const newWords: CaptionWord[] = (aiSeg.words || []).map((w: any, idx: number) => ({
              id: origSeg.words[idx]?.id || `w-${Date.now()}-${idx}`,
              text: w.text || origSeg.words[idx]?.text || '',
              start: typeof w.start === 'number' ? w.start : origSeg.start,
              end: typeof w.end === 'number' ? w.end : origSeg.end,
            }));
            return {
              ...origSeg,
              start: typeof aiSeg.start === 'number' ? aiSeg.start : origSeg.start,
              end: typeof aiSeg.end === 'number' ? aiSeg.end : origSeg.end,
              words: newWords.length > 0 ? newWords : origSeg.words,
            };
          });
          syncedSegments = syncWordsToTimeline(aligned);
        } else {
          syncedSegments = syncWordsToTimeline(track.segments);
        }
      } catch (aiErr) {
        console.warn('[sync-words] AI alignment failed, falling back to cadence sync', aiErr);
        syncedSegments = syncWordsToTimeline(track.segments);
      }
    } else {
      // Cadence zero-gap sync
      syncedSegments = syncWordsToTimeline(track.segments);
    }

    const updatedTrack: CaptionTrack = {
      ...track,
      segments: syncedSegments,
    };

    const updatedTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));

    await prisma.project.update({
      where: { id: projectId },
      data: {
        tracksJson: JSON.stringify(updatedTracks),
      },
    });

    return NextResponse.json({
      success: true,
      mode,
      segments: syncedSegments,
    });
  } catch (err: any) {
    console.error('[sync-words]', err);
    return NextResponse.json({ error: err.message || 'Word sync failed' }, { status: 500 });
  }
}
