import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSRT, generateVTT, generateTXT, generateJSON } from '@/lib/captions/srt';
import { CaptionTrack, Language } from '@/types/caption';

export async function POST(req: NextRequest) {
  try {
    const { projectId, language, format } = (await req.json()) as {
      projectId: string;
      language: Language;
      format: 'srt' | 'vtt' | 'txt' | 'json';
    };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tracks: CaptionTrack[] = JSON.parse(project.tracksJson || '[]');
    const track = tracks.find(t => t.language === language);
    if (!track) return NextResponse.json({ error: `No ${language} track found` }, { status: 404 });

    const generators = {
      srt: () => generateSRT(track.segments),
      vtt: () => generateVTT(track.segments),
      txt: () => generateTXT(track.segments),
      json: () => generateJSON(track.segments),
    };

    const content = generators[format]();
    const mimeTypes = {
      srt: 'text/plain; charset=utf-8',
      vtt: 'text/vtt; charset=utf-8',
      txt: 'text/plain; charset=utf-8',
      json: 'application/json',
    };

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeTypes[format],
        'Content-Disposition': `attachment; filename="${project.name}_${language}.${format}"`,
      },
    });
  } catch (err: any) {
    console.error('[export]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
