'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, Film, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const FEATURES = [
  { icon: Sparkles, title: 'AI Captions', desc: 'Hindi, English, Urdu & Hinglish in seconds' },
  { icon: Globe, title: 'RTL Support', desc: 'Perfect Urdu Nastaliq & Devanagari rendering' },
  { icon: Film, title: 'Animated Templates', desc: '30+ creator-style caption templates' },
  { icon: Zap, title: 'Up to 4K Export', desc: 'Burn captions into video, or export SRT' },
];

export default function HomePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setFileInfo({ name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB' });
      setUploading(true);
      setError('');
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^.]+$/, ''));

      try {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 80) + 10);
        };
        const result = await new Promise<{ projectId: string }>((resolve, reject) => {
          xhr.open('POST', '/api/upload');
          xhr.onload = () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
            else {
              try {
                reject(new Error(JSON.parse(xhr.responseText).error ?? 'Upload failed'));
              } catch {
                reject(new Error('Upload failed'));
              }
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });
        setProgress(100);
        setTimeout(() => router.push(`/editor/${result.projectId}`), 500);
      } catch (err: any) {
        setError(err.message);
        setUploading(false);
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-gray-950 to-blue-900/30" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 60%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Logo */}
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              CaptionForge
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
              AI Caption Studio
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-2">for Indian & Pakistani Creators</p>
          <p className="text-3xl font-bold mb-8" style={{ fontFamily: 'Noto Sans Devanagari, serif' }}>
            <span className="text-purple-400">हिंदी</span> ·{' '}
            <span className="text-blue-400">English</span> ·{' '}
            <span className="text-green-400">اردو</span> ·{' '}
            <span className="text-yellow-400">Hinglish</span>
          </p>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`mt-8 max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
              isDragActive
                ? 'border-purple-400 bg-purple-900/20'
                : 'border-gray-700 hover:border-gray-500 bg-gray-900/30'
            } ${uploading ? 'pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/50 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
                {fileInfo && (
                  <p className="text-gray-300">
                    {fileInfo.name} ({fileInfo.size})
                  </p>
                )}
                <Progress value={progress} className="max-w-xs mx-auto h-2" />
                <p className="text-sm text-gray-500">
                  {progress < 90 ? 'Uploading...' : 'Processing with FFmpeg...'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-200">
                    {isDragActive ? 'Drop your video here!' : 'Drop your video or audio file'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    MP4, MOV, MKV, WEBM, MP3, WAV, M4A · Max 500MB
                  </p>
                </div>
                <Button variant="outline" className="border-gray-600">
                  Choose File
                </Button>
              </div>
            )}
            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-8 text-gray-600 text-sm border-t border-gray-900">
        CaptionForge · Built for creators · All API calls are server-side
      </footer>
    </div>
  );
}
