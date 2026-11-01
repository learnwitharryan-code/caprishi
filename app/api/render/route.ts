import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderVideo, RenderResolution } from '@/lib/ffmpeg/render';
import { CaptionStyle, DEFAULT_STYLE } from '@/lib/templates/registry';
import { CaptionSegment, CaptionTrack } from '@/types/caption';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const {
      projectId,
      resolution = '1080p',
      style = DEFAULT_STYLE,
      trackId,
      segments: incomingSegments,
    } = (await req.json()) as {
      projectId: string;
      resolution?: RenderResolution;
      style?: CaptionStyle;
      trackId?: string;
      segments?: CaptionSegment[];
    };

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!fs.existsSync(project.mediaPath)) {
      return NextResponse.json({ error: 'Source media file missing' }, { status: 404 });
    }

    let segmentsToRender: CaptionSegment[] = [];

    if (incomingSegments && incomingSegments.length > 0) {
      segmentsToRender = incomingSegments;
    } else {
      const tracks: CaptionTrack[] = JSON.parse(project.tracksJson || '[]');
      const activeTrack =
        tracks.find((t) => t.id === (trackId || project.activeTrackId)) || tracks[0];

      if (!activeTrack || !activeTrack.segments.length) {
        return NextResponse.json({ error: 'No captions to burn into video' }, { status: 400 });
      }
      segmentsToRender = activeTrack.segments;
    }

    const renderDir = path.resolve(process.env.RENDER_DIR || './renders');
    if (!fs.existsSync(renderDir)) {
      fs.mkdirSync(renderDir, { recursive: true });
    }

    const outputFileName = `render_${projectId}_${resolution}_${Date.now()}.mp4`;
    const outputPath = path.join(renderDir, outputFileName);

    // Save active customized style to project record
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          templateId: style.id,
          captionStyleJson: JSON.stringify(style),
        },
      });
    } catch (e) {
      console.warn('[render] Could not persist style to project', e);
    }

    await renderVideo(
      project.mediaPath,
      segmentsToRender,
      style,
      resolution,
      outputPath
    );

    const downloadUrl = `/api/render/download?file=${outputFileName}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: outputFileName,
      resolution,
    });
  } catch (err: any) {
    console.error('[render]', err);
    return NextResponse.json(
      { error: err.message || 'Render failed' },
      { status: 500 }
    );
  }
}
