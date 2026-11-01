import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', '@prisma/client'],
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {},
};

export default nextConfig;
