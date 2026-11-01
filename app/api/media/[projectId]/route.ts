import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return new NextResponse('Not found', { status: 404 });

  const filePath = path.resolve(process.cwd(), project.mediaPath);
  if (!fs.existsSync(filePath)) return new NextResponse('File not found', { status: 404 });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
  };
  const contentType = mimeTypes[ext] || 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  return new NextResponse(stream as any, {
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    },
  });
}
