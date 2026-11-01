import { CaptionTrack, Language } from './caption';

export type ProjectStatus = 'uploading' | 'transcribing' | 'ready' | 'rendering' | 'done' | 'error';

export interface Project {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  mediaUrl: string;
  mediaDuration: number;
  mediaWidth: number;
  mediaHeight: number;
  mediaFps: number;
  fileSizeBytes: number;
  tracks: CaptionTrack[];
  activeTrackId: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export type RenderResolution = '720p' | '1080p' | '1440p' | '4K';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type Codec = 'h264' | 'h265' | 'prores4444' | 'vp9';

export interface RenderPreset {
  resolution: RenderResolution;
  aspectRatio: AspectRatio;
  codec: Codec;
  crf: number;
  fps?: number;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
  progress: number;
  eta?: number;
  preset: RenderPreset;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
}
