import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  const p =
    typeof ffmpegPath === 'string'
      ? ffmpegPath
      : (ffmpegPath as any)?.default || ffmpegPath;
  ffmpeg.setFfmpegPath(p);
}

export interface MediaInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  codec: string;
  fileSizeBytes: number;
}

export async function probeMedia(filePath: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata) {
        return resolve({
          duration: 0,
          width: 1920,
          height: 1080,
          fps: 30,
          hasAudio: true,
          codec: 'unknown',
          fileSizeBytes: 0,
        });
      }
      const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams?.find((s) => s.codec_type === 'audio');
      const fpsStr = videoStream?.r_frame_rate ?? '30/1';
      const [num, den] = fpsStr.split('/').map(Number);
      resolve({
        duration: metadata.format?.duration ?? 0,
        width: videoStream?.width ?? 0,
        height: videoStream?.height ?? 0,
        fps: den ? num / den : 30,
        hasAudio: !!audioStream,
        codec: videoStream?.codec_name ?? 'unknown',
        fileSizeBytes: metadata.format?.size ?? 0,
      });
    });
  });
}
