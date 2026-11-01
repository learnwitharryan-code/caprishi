import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

const resolvedFfmpeg = typeof ffmpegPath === 'string' ? ffmpegPath : (ffmpegPath as any)?.default;
if (resolvedFfmpeg) {
  ffmpeg.setFfmpegPath(resolvedFfmpeg);
}

/**
 * Extract audio from a video file as 16kHz mono WAV.
 * @param inputPath  Path to the source video/audio file
 * @param outputDir  Directory to write the extracted audio
 * @returns path to the WAV file
 */
export async function extractAudio(inputPath: string, outputDir: string): Promise<string> {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${basename}_audio.wav`);

  if (fs.existsSync(outputPath)) return outputPath; // cached

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}
