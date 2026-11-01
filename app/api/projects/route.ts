import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: 'anonymous' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      projects: projects.map((p) => ({
        ...p,
        fileSizeBytes: p.fileSizeBytes.toString(),
      })),
    });
  } catch (err: any) {
    console.error('[projects GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
