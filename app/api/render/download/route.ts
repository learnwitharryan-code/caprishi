import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }

  // Sanitize filename to prevent path traversal
  const safeName = path.basename(file);
  const renderDir = path.resolve(process.env.RENDER_DIR || './renders');
  const filePath = path.join(renderDir, safeName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Rendered file not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  return new NextResponse(fileStream as any, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `attachment; filename="${safeName}"`,
    },
  });
}
