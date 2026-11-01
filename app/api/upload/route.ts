import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { probeMedia } from '@/lib/ffmpeg/probe';
import { extractAudio } from '@/lib/ffmpeg/extract-audio';
import { prisma } from '@/lib/db';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '500') * 1024 * 1024;
const ALLOWED = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/mp4',
]);

export async function POST(req: NextRequest) {
  try {
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectName = (formData.get('name') as string) ?? 'Untitled Project';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: `File too large. Max ${process.env.MAX_UPLOAD_SIZE_MB}MB.` },
        { status: 413 }
      );
    if (!ALLOWED.has(file.type))
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Sanitize filename
    const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, '') || '.mp4';
    const safeName = `${hash.slice(0, 16)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await writeFile(filePath, buffer);

    // Probe media
    const info = await probeMedia(filePath);

    // Extract audio
    const audioPath = await extractAudio(filePath, UPLOAD_DIR);

    // Ensure anonymous user exists in SQLite
    await prisma.user
      .upsert({
        where: { id: 'anonymous' },
        update: {},
        create: {
          id: 'anonymous',
          email: 'anonymous@captionforge.local',
          name: 'Anonymous User',
        },
      })
      .catch(() => {});

    // Create project in DB
    const project = await prisma.project.create({
      data: {
        userId: 'anonymous',
        name: projectName,
        status: 'ready',
        mediaPath: filePath,
        audioPath,
        mediaDuration: info.duration,
        mediaWidth: info.width,
        mediaHeight: info.height,
        mediaFps: info.fps,
        fileSizeBytes: BigInt(file.size),
        fileHash: hash,
        templateId: 'viral-pop',
      },
    });

    return NextResponse.json({
      projectId: project.id,
      mediaInfo: info,
      message: 'Upload successful',
    });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
