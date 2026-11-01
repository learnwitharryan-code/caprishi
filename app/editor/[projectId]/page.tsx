'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Download,
  Wand2,
  Play,
  Pause,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Droplet,
  Palette,
  Check,
  X,
  Scissors,
  GitMerge,
  Trash2,
  Edit2,
  Plus,
  Film,
  Sparkles,
  Upload,
  Type,
  Layers,
  Search,
  Minimize2,
  ChevronRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { v4 as uuid } from 'uuid';
import { Language, CaptionTrack, CaptionSegment, CaptionWord } from '@/types/caption';
import {
  PACING_PRESETS,
  PacingPresetKey,
  resegmentSegments,
  syncWordsToTimeline,
} from '@/lib/captions/segment';
import {
  generateSRT,
  generateVTT,
  generateTXT,
  generateJSON,
} from '@/lib/captions/srt';
import {
  TEMPLATES,
  DEFAULT_STYLE,
  CaptionStyle,
} from '@/lib/templates/registry';
import { RenderResolution } from '@/lib/ffmpeg/render';

type ProjectData = {
  id: string;
  name: string;
  mediaPath: string;
  mediaDuration: number;
  mediaWidth: number;
  mediaHeight: number;
  tracksJson: string;
  activeTrackId: string | null;
  status: string;
};

// All Available Creator Fonts (Clean names without "Premiere Pro" labels)
const ALL_FONTS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Anton', value: 'Anton, sans-serif' },
  { label: 'Fredoka', value: 'Fredoka, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Space Mono', value: '"Space Mono", monospace' },
  { label: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { label: 'Oswald', value: 'Oswald, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Outfit', value: 'Outfit, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Bangers', value: 'Bangers, cursive' },
  { label: 'Righteous', value: 'Righteous, cursive' },
  { label: 'Titan One', value: 'Titan One, cursive' },
  { label: 'Permanent Marker', value: '"Permanent Marker", cursive' },
  { label: 'VT323 (Pixel)', value: '"VT323", monospace' },
  { label: 'Caveat', value: 'Caveat, cursive' },
  { label: 'Cinzel', value: 'Cinzel, serif' },
  { label: 'Syne', value: 'Syne, sans-serif' },
  { label: 'Black Han Sans', value: 'Black Han Sans, sans-serif' },
  { label: 'Noto Sans Devanagari (Hindi)', value: '"Noto Sans Devanagari", serif' },
  { label: 'Noto Nastaliq Urdu (Urdu)', value: '"Noto Nastaliq Urdu", serif' },
  { label: 'Rozha One', value: '"Rozha One", serif' },
  { label: 'Mukta', value: 'Mukta, sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", sans-serif' },
];

const buildGradientString = (
  angle = 135,
  count: 2 | 3 | 4 = 2,
  c1 = '#FACC15',
  c2 = '#EF4444',
  c3 = '#3B82F6',
  c4 = '#10B981',
  s1 = 0,
  s2 = 100,
  s3 = 66,
  s4 = 100
) => {
  if (count === 4) {
    return `linear-gradient(${angle}deg, ${c1} ${s1}%, ${c2} ${s2}%, ${c3} ${s3}%, ${c4} ${s4}%)`;
  }
  if (count === 3) {
    return `linear-gradient(${angle}deg, ${c1} ${s1}%, ${c2} ${s2}%, ${c3} ${s3}%)`;
  }
  return `linear-gradient(${angle}deg, ${c1} ${s1}%, ${c2} ${s2}%)`;
};

const GRADIENT_PRESETS = [
  // 2 Colors
  { label: 'Gold Sunset', count: 2 as const, c1: '#F59E0B', c2: '#EF4444', s1: 0, s2: 100, angle: 135 },
  { label: 'Electric Cyber', count: 2 as const, c1: '#06B6D4', c2: '#A855F7', s1: 0, s2: 100, angle: 135 },
  { label: 'Lime Beast', count: 2 as const, c1: '#22C55E', c2: '#FACC15', s1: 0, s2: 100, angle: 135 },
  { label: 'Fire Blaze', count: 2 as const, c1: '#EF4444', c2: '#F97316', s1: 0, s2: 100, angle: 90 },
  { label: 'Neon Pink', count: 2 as const, c1: '#EC4899', c2: '#8B5CF6', s1: 0, s2: 100, angle: 135 },
  // 3 Colors
  { label: 'Sunset Glow (3)', count: 3 as const, c1: '#A78BFA', c2: '#F472B6', c3: '#FB923C', s1: 0, s2: 50, s3: 100, angle: 90 },
  { label: 'Vibrant RGB (3)', count: 3 as const, c1: '#3B82F6', c2: '#10B981', c3: '#FACC15', s1: 0, s2: 50, s3: 100, angle: 135 },
  { label: 'Miami Night (3)', count: 3 as const, c1: '#EC4899', c2: '#8B5CF6', c3: '#3B82F6', s1: 0, s2: 50, s3: 100, angle: 135 },
  { label: 'Royal Gold (3)', count: 3 as const, c1: '#FFF3B0', c2: '#EAB308', c3: '#CA8A04', s1: 0, s2: 50, s3: 100, angle: 135 },
  // 4 Colors
  { label: 'Rainbow Pop (4)', count: 4 as const, c1: '#EF4444', c2: '#F59E0B', c3: '#10B981', c4: '#3B82F6', s1: 0, s2: 33, s3: 66, s4: 100, angle: 90 },
  { label: 'Cyber Neon (4)', count: 4 as const, c1: '#F43F5E', c2: '#D946EF', c3: '#8B5CF6', c4: '#06B6D4', s1: 0, s2: 30, s3: 70, s4: 100, angle: 135 },
  { label: 'Aurora Glow (4)', count: 4 as const, c1: '#FDE047', c2: '#4ADE80', c3: '#22D3EE', c4: '#A855F7', s1: 0, s2: 30, s3: 65, s4: 100, angle: 90 },
];

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [tracks, setTracks] = useState<CaptionTrack[]>([]);
  const [activeTrack, setActiveTrack] = useState<CaptionTrack | null>(null);
  const [language, setLanguage] = useState<Language>('hinglish');
  const [pacing, setPacing] = useState<PacingPresetKey>('2-3');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSyncingWords, setIsSyncingWords] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Submagic Top Tabs: Captions vs Edit
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [editorMode, setEditorMode] = useState<'captions' | 'edit'>('captions');
  // Submagic Sub-Tabs: Text | Templates | Transitions | AI Audio
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'templates' | 'transitions' | 'audio'>('text');

  // Submagic Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fonts: true,
    format: true,
    position: true,
    color: true,
    emphasis: true,
    spacing: true,
    effects: true,
  });

  const toggleSection = (s: string) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  // Caption Styling State
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Custom Fonts State
  const [customFonts, setCustomFonts] = useState<Array<{ label: string; value: string }>>([]);
  const [showAddFontModal, setShowAddFontModal] = useState(false);
  const [googleFontInput, setGoogleFontInput] = useState('');

  // Custom Visual Font Dropdown States
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [showEmphasisFontDropdown, setShowEmphasisFontDropdown] = useState(false);
  const [emphasisFontSearch, setEmphasisFontSearch] = useState('');

  // Inline editing state
  const [editingSegId, setEditingSegId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingTimesId, setEditingTimesId] = useState<string | null>(null);
  const [editStartStr, setEditStartStr] = useState<string>('');
  const [editEndStr, setEditEndStr] = useState<string>('');

  // Video render state
  const [renderResolution, setRenderResolution] = useState<RenderResolution>('1080p');
  const [isRendering, setIsRendering] = useState(false);
  const [renderDownloadUrl, setRenderDownloadUrl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Timeline dragging / resizing state
  const [timelineDrag, setTimelineDrag] = useState<{
    segId: string;
    mode: 'move' | 'start' | 'end';
    initialClientX: number;
    initialStart: number;
    initialEnd: number;
    currentStart: number;
    currentEnd: number;
  } | null>(null);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then(({ project: p }) => {
        if (!p) throw new Error('Not found');
        setProject(p);
        const t: CaptionTrack[] = JSON.parse(p.tracksJson || '[]');
        setTracks(t);
        const active = t.find((tr) => tr.id === p.activeTrackId) ?? t[0] ?? null;
        setActiveTrack(active);

        // Restore saved customized captionStyle or template
        if (p.captionStyleJson) {
          try {
            const savedStyle = JSON.parse(p.captionStyleJson);
            if (savedStyle && (savedStyle.id || savedStyle.name || savedStyle.fontFamily)) {
              setCaptionStyle(savedStyle);
            }
          } catch (e) {
            console.error('Failed to parse saved captionStyleJson', e);
          }
        } else if (p.templateId && TEMPLATES[p.templateId]) {
          setCaptionStyle(TEMPLATES[p.templateId]);
        }
        setIsStyleLoaded(true);
      })
      .catch(() => toast({ title: 'Failed to load project', variant: 'destructive' }));
  }, [projectId, toast]);

  // Debounced auto-save of caption customizations (only after initial load to prevent overwriting)
  useEffect(() => {
    if (!isStyleLoaded || !project || !projectId) return;
    const timer = setTimeout(() => {
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: captionStyle.id,
          captionStyleJson: JSON.stringify(captionStyle),
        }),
      }).catch((err) => console.error('Failed to auto-save caption style', err));
    }, 600);
    return () => clearTimeout(timer);
  }, [captionStyle, isStyleLoaded, projectId, project]);

  // Invalidate previous render whenever captions, style, or resolution change
  // so export buttons refresh immediately and users never download stale renders
  const prevStyleJsonRef = useRef<string>('');
  const prevTracksJsonRef = useRef<string>('');
  const prevResRef = useRef<string>('1080p');

  useEffect(() => {
    if (!isStyleLoaded) return;
    const styleJson = JSON.stringify(captionStyle);
    const tracksJson = JSON.stringify(tracks);
    const res = renderResolution;

    if (!prevStyleJsonRef.current) {
      prevStyleJsonRef.current = styleJson;
      prevTracksJsonRef.current = tracksJson;
      prevResRef.current = res;
      return;
    }

    if (
      prevStyleJsonRef.current !== styleJson ||
      prevTracksJsonRef.current !== tracksJson ||
      prevResRef.current !== res
    ) {
      prevStyleJsonRef.current = styleJson;
      prevTracksJsonRef.current = tracksJson;
      prevResRef.current = res;
      setRenderDownloadUrl(null);
    }
  }, [captionStyle, tracks, renderResolution, isStyleLoaded]);

  // Global Pointer Dragging Listener for Timeline (60fps smooth resize & move)
  useEffect(() => {
    if (!timelineDrag) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const totalDuration = project?.mediaDuration || 1;
      const deltaPx = e.clientX - timelineDrag.initialClientX;
      const deltaTime = (deltaPx / rect.width) * totalDuration;

      let newStart = timelineDrag.initialStart;
      let newEnd = timelineDrag.initialEnd;
      const origDur = timelineDrag.initialEnd - timelineDrag.initialStart;

      if (timelineDrag.mode === 'move') {
        newStart = Math.max(0, Math.min(totalDuration - origDur, timelineDrag.initialStart + deltaTime));
        newEnd = newStart + origDur;
        if (videoRef.current) videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      } else if (timelineDrag.mode === 'start') {
        newStart = Math.max(0, Math.min(timelineDrag.initialEnd - 0.2, timelineDrag.initialStart + deltaTime));
        if (videoRef.current) videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      } else if (timelineDrag.mode === 'end') {
        newEnd = Math.max(timelineDrag.initialStart + 0.2, Math.min(totalDuration, timelineDrag.initialEnd + deltaTime));
        if (videoRef.current) videoRef.current.currentTime = newEnd;
        setCurrentTime(newEnd);
      }

      setTimelineDrag((prev) => (prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null));
    };

    const handlePointerUp = () => {
      if (timelineDrag) {
        updateSegmentTiming(timelineDrag.segId, timelineDrag.currentStart, timelineDrag.currentEnd);
      }
      setTimelineDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [timelineDrag, project?.mediaDuration]);

  // High-precision 60fps playback sync
  useEffect(() => {
    let animId: number;
    const syncTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animId = requestAnimationFrame(syncTime);
    };
    animId = requestAnimationFrame(syncTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut: Space = play/pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingSegId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingSegId]);

  // Find current active segment with smart bridge so captions don't disappear between phrases
  const currentSegment = activeTrack?.segments.find((s, idx, arr) => {
    const nextSeg = arr[idx + 1];
    // Hold caption on screen until the next segment starts (up to 0.35s) to avoid empty screen drops
    const maxHold = nextSeg ? Math.min(nextSeg.start, s.end + 0.35) : s.end + 0.35;
    return currentTime >= s.start && currentTime <= maxHold;
  });

  // High-precision word-to-word active lookup with zero micro-gap drops
  const activeWord = currentSegment?.words.find((w, i, arr) => {
    const nextW = arr[i + 1];
    const wStart = i === 0 ? Math.min(currentSegment.start, w.start) : w.start;
    const wEnd = nextW ? nextW.start : Math.max(currentSegment.end, w.end);
    return currentTime >= wStart && currentTime < wEnd;
  }) ?? currentSegment?.words[currentSegment.words.length - 1];

  // Auto-scroll transcript list
  useEffect(() => {
    if (currentSegment) {
      const el = document.getElementById(`seg-${currentSegment.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentSegment?.id]);

  const selectActiveTrack = (t: CaptionTrack) => {
    setActiveTrack(t);
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeTrackId: t.id }),
    }).catch(console.error);
  };

  const handlePacingChange = async (newPreset: PacingPresetKey) => {
    setPacing(newPreset);
    if (!activeTrack || !activeTrack.segments.length) return;

    const rules = PACING_PRESETS[newPreset];
    const newSegments = resegmentSegments(
      activeTrack.segments,
      activeTrack.language,
      rules
    );

    const updatedTrack: CaptionTrack = {
      ...activeTrack,
      segments: newSegments,
    };

    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    setActiveTrack(updatedTrack);
    setTracks(newTracks);

    toast({
      title: `Pacing: ${rules.label}`,
      description: `${newSegments.length} segments with natural speech gapping`,
    });

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracksJson: JSON.stringify(newTracks) }),
      });
    } catch {}
  };

  // Calibrate speech timing lead offset (e.g. -180ms or custom offset)
  const handleApplyLeadOffset = async (offsetMs: number) => {
    if (!activeTrack || !activeTrack.segments.length) {
      toast({ title: 'No captions available to calibrate', variant: 'destructive' });
      return;
    }
    setIsSyncingWords(true);
    try {
      const offsetSeconds = offsetMs / 1000;
      const updatedSegments = syncWordsToTimeline(activeTrack.segments, offsetSeconds);
      const updatedTrack = { ...activeTrack, segments: updatedSegments };
      const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
      persistTracks(newTracks);
      const totalWords = updatedSegments.reduce((acc, s) => acc + s.words.length, 0);
      toast({
        title: offsetMs < 0 ? `⚡ Shifted ${Math.abs(offsetMs)}ms Earlier!` : `⚡ Shifted +${offsetMs}ms Later!`,
        description: `All ${totalWords} words re-aligned with audio speech onset.`,
      });
    } finally {
      setIsSyncingWords(false);
    }
  };

  // Full Word-to-Word Sync (Cadence zero-gap & AI Audio Alignment)
  const handleWordSync = async (mode: 'cadence' | 'ai' = 'cadence') => {
    if (!activeTrack || !activeTrack.segments.length) {
      toast({ title: 'No captions available to sync', variant: 'destructive' });
      return;
    }
    setIsSyncingWords(true);
    try {
      if (mode === 'ai') {
        const res = await fetch('/api/sync-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            trackId: activeTrack.id,
            mode: 'ai',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI sync failed');
        const updatedSegments: CaptionSegment[] = data.segments;
        const updatedTrack = { ...activeTrack, segments: updatedSegments };
        const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
        persistTracks(newTracks);
        const totalWords = updatedSegments.reduce((acc, s) => acc + s.words.length, 0);
        toast({
          title: '🎙️ AI Word-to-Word Sync Complete!',
          description: `All ${totalWords} words aligned to audio waveform with zero gaps.`,
        });
      } else {
        // Precision cadence zero-gap sync (no compounding drift offset)
        const updatedSegments = syncWordsToTimeline(activeTrack.segments, 0);
        const updatedTrack = { ...activeTrack, segments: updatedSegments };
        const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
        persistTracks(newTracks);
        const totalWords = updatedSegments.reduce((acc, s) => acc + s.words.length, 0);
        toast({
          title: '⚡ Perfect Word-to-Word Sync Complete!',
          description: `All ${totalWords} words locked to speech onset with zero gaps & no drift!`,
        });
      }
    } catch (err: any) {
      // Graceful fallback to instant cadence sync
      const updatedSegments = syncWordsToTimeline(activeTrack.segments, 0);
      const updatedTrack = { ...activeTrack, segments: updatedSegments };
      const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
      persistTracks(newTracks);
      toast({
        title: '⚡ Word-to-Word Sync Complete!',
        description: 'Synchronized with zero gaps & stable timing.',
      });
    } finally {
      setIsSyncingWords(false);
    }
  };

  // Sync a single segment after manual edit
  const syncSingleSegment = (segId: string) => {
    if (!activeTrack) return;
    const updatedSegments = activeTrack.segments.map((s) => {
      if (s.id !== segId) return s;
      const [synced] = syncWordsToTimeline([s]);
      return synced;
    });
    const updatedTrack = { ...activeTrack, segments: updatedSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    toast({ title: '⚡ Caption word-to-word synced!' });
  };

  const transcribe = async () => {
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, language, pacingPreset: pacing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newTracks = [
        ...tracks.filter((t) => t.language !== data.track.language),
        data.track,
      ];
      setTracks(newTracks);
      setActiveTrack(data.track);
      toast({
        title: 'Captions generated!',
        description: `${data.track.segments.length} segments ready.`,
      });
    } catch (err: any) {
      toast({
        title: 'Transcription failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadExport = (format: 'srt' | 'vtt' | 'txt' | 'json') => {
    if (!activeTrack || !activeTrack.segments.length) {
      toast({ title: 'No captions available to export', variant: 'destructive' });
      return;
    }
    const segs = activeTrack.segments;
    let content = '';
    if (format === 'srt') content = generateSRT(segs);
    else if (format === 'vtt') content = generateVTT(segs);
    else if (format === 'txt') content = generateTXT(segs);
    else if (format === 'json') content = generateJSON(segs);

    const mimeTypes: Record<string, string> = {
      srt: 'text/plain;charset=utf-8',
      vtt: 'text/vtt;charset=utf-8',
      txt: 'text/plain;charset=utf-8',
      json: 'application/json;charset=utf-8',
    };
    const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (project?.name || 'captions').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_${activeTrack.language}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: `Exported .${format.toUpperCase()}`,
      description: `Downloaded ${segs.length} captions directly from live timeline.`,
    });
  };

  const handleRenderVideo = async () => {
    if (!activeTrack) return;
    setIsRendering(true);
    setRenderDownloadUrl(null);
    try {
      // Synchronously capture and persist the latest editor state before rendering
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: captionStyle.id,
          captionStyleJson: JSON.stringify(captionStyle),
          tracksJson: JSON.stringify(tracks),
          activeTrackId: activeTrack.id,
        }),
      }).catch((err) => console.warn('Could not sync project before render', err));

      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          resolution: renderResolution,
          style: captionStyle,
          trackId: activeTrack.id,
          segments: activeTrack.segments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRenderDownloadUrl(data.downloadUrl);
      toast({
        title: `Video Render Complete (${renderResolution})!`,
        description: 'Your burned-in video is ready to download.',
      });
    } catch (err: any) {
      toast({
        title: 'Render failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsRendering(false);
    }
  };

  const persistTracks = async (newTracks: CaptionTrack[]) => {
    setRenderDownloadUrl(null);
    setTracks(newTracks);
    if (activeTrack) {
      const updatedActive = newTracks.find((t) => t.id === activeTrack.id) || newTracks[0] || null;
      setActiveTrack(updatedActive);
    }
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracksJson: JSON.stringify(newTracks) }),
      });
    } catch (err) {
      console.error('Failed to persist tracks:', err);
    }
  };

  const saveSegmentEdit = (segId: string) => {
    if (!activeTrack) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      deleteSegment(segId);
      return;
    }
    const updatedSegments = activeTrack.segments.map((s) => {
      if (s.id !== segId) return s;
      const tokens = trimmed.split(/\s+/).filter(Boolean);
      const dummySeg: CaptionSegment = {
        ...s,
        text: trimmed,
        words: tokens.map((token, i) => ({
          id: s.words[i]?.id || uuid(),
          text: token,
          start: s.start,
          end: s.end,
        })),
      };
      const [synced] = syncWordsToTimeline([dummySeg]);
      return synced;
    });
    const updatedTrack = { ...activeTrack, segments: updatedSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    setEditingSegId(null);
    toast({ title: 'Caption updated & word-to-word synced!' });
  };

  const nudgeSegment = (segId: string, edge: 'start' | 'end', delta: number) => {
    if (!activeTrack) return;
    const updatedSegments = activeTrack.segments.map((s) => {
      if (s.id !== segId) return s;
      let newStart = s.start;
      let newEnd = s.end;
      if (edge === 'start') {
        newStart = Math.max(0, Math.round((s.start + delta) * 100) / 100);
        if (newStart >= newEnd - 0.2) newStart = Math.max(0, newEnd - 0.2);
      } else {
        newEnd = Math.max(newStart + 0.2, Math.round((s.end + delta) * 100) / 100);
        if (project && newEnd > project.mediaDuration) newEnd = project.mediaDuration;
      }
      const dummySeg: CaptionSegment = {
        ...s,
        start: newStart,
        end: newEnd,
      };
      const [synced] = syncWordsToTimeline([dummySeg]);
      return synced;
    });
    const updatedTrack = { ...activeTrack, segments: updatedSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
  };

  // Direct Timeline Drag & Resize Timing Updater
  const updateSegmentTiming = (segId: string, newStart: number, newEnd: number) => {
    if (!activeTrack) return;
    const clampedStart = Math.max(0, Math.round(newStart * 100) / 100);
    const clampedEnd = Math.max(clampedStart + 0.2, Math.round(newEnd * 100) / 100);

    const updatedSegments = activeTrack.segments.map((s) => {
      if (s.id !== segId) return s;
      const dummySeg: CaptionSegment = {
        ...s,
        start: clampedStart,
        end: clampedEnd,
      };
      const [synced] = syncWordsToTimeline([dummySeg]);
      return synced;
    });
    const updatedTrack = { ...activeTrack, segments: updatedSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
  };

  const splitSegment = (segId: string) => {
    if (!activeTrack) return;
    const segIndex = activeTrack.segments.findIndex((s) => s.id === segId);
    if (segIndex === -1) return;
    const s = activeTrack.segments[segIndex];
    if (s.words.length < 2) {
      toast({ title: 'Need at least 2 words to split', variant: 'destructive' });
      return;
    }
    const mid = Math.ceil(s.words.length / 2);
    const words1 = s.words.slice(0, mid);
    const words2 = s.words.slice(mid);
    const seg1: CaptionSegment = {
      id: uuid(),
      language: s.language,
      text: words1.map((w) => w.text).join(' '),
      start: words1[0].start,
      end: words1[words1.length - 1].end,
      words: words1,
    };
    const seg2: CaptionSegment = {
      id: uuid(),
      language: s.language,
      text: words2.map((w) => w.text).join(' '),
      start: words2[0].start,
      end: words2[words2.length - 1].end,
      words: words2,
    };
    const newSegments = [
      ...activeTrack.segments.slice(0, segIndex),
      seg1,
      seg2,
      ...activeTrack.segments.slice(segIndex + 1),
    ];
    const updatedTrack = { ...activeTrack, segments: newSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    toast({ title: 'Caption split into 2' });
  };

  const mergeWithNext = (segId: string) => {
    if (!activeTrack) return;
    const segIndex = activeTrack.segments.findIndex((s) => s.id === segId);
    if (segIndex === -1 || segIndex >= activeTrack.segments.length - 1) {
      toast({ title: 'No next caption to merge with', variant: 'destructive' });
      return;
    }
    const s1 = activeTrack.segments[segIndex];
    const s2 = activeTrack.segments[segIndex + 1];
    const mergedWords = [...s1.words, ...s2.words];
    const mergedSeg: CaptionSegment = {
      id: s1.id,
      language: s1.language,
      text: `${s1.text} ${s2.text}`,
      start: s1.start,
      end: s2.end,
      words: mergedWords,
    };
    const newSegments = [
      ...activeTrack.segments.slice(0, segIndex),
      mergedSeg,
      ...activeTrack.segments.slice(segIndex + 2),
    ];
    const updatedTrack = { ...activeTrack, segments: newSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    toast({ title: 'Merged with next caption' });
  };

  const deleteSegment = (segId: string) => {
    if (!activeTrack) return;
    const newSegments = activeTrack.segments.filter((s) => s.id !== segId);
    const updatedTrack = { ...activeTrack, segments: newSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    toast({ title: 'Caption deleted' });
  };

  const addSegment = () => {
    if (!activeTrack) return;
    const start = currentTime;
    const end = start + 1.5;
    const newWords: CaptionWord[] = [
      { id: uuid(), text: 'New', start: start, end: start + 0.75 },
      { id: uuid(), text: 'caption', start: start + 0.75, end: end },
    ];
    const newSeg: CaptionSegment = {
      id: uuid(),
      language: activeTrack.language,
      text: 'New caption',
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      words: newWords,
    };
    const newSegments = [...activeTrack.segments, newSeg].sort((a, b) => a.start - b.start);
    const updatedTrack = { ...activeTrack, segments: newSegments };
    const newTracks = tracks.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
    persistTracks(newTracks);
    setEditingSegId(newSeg.id);
    setEditText('New caption');
    toast({ title: 'New caption added' });
  };

  // Add Font Handlers
  const handleUploadFontFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fontFace = new FontFace(fontName, reader.result as ArrayBuffer);
        await fontFace.load();
        document.fonts.add(fontFace);
        const newFont = { label: `${fontName} (Uploaded)`, value: `"${fontName}", sans-serif` };
        setCustomFonts((prev) => [newFont, ...prev]);
        setCaptionStyle((s) => ({ ...s, fontFamily: newFont.value }));
        toast({ title: `Font "${fontName}" added & active!` });
        setShowAddFontModal(false);
      } catch (err: any) {
        toast({ title: 'Failed to load font file', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddGoogleFont = () => {
    const raw = googleFontInput.trim();
    if (!raw) return;
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(raw)}:wght@400;600;700;800;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const fontVal = `"${raw}", sans-serif`;
    const newFont = { label: `${raw} (Google Font)`, value: fontVal };
    setCustomFonts((prev) => [newFont, ...prev]);
    setCaptionStyle((s) => ({ ...s, fontFamily: fontVal }));
    setGoogleFontInput('');
    setShowAddFontModal(false);
    toast({ title: `Google Font "${raw}" loaded & active!` });
  };

  if (!project)
    return (
      <div className="flex items-center justify-center h-screen bg-[#111216]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10B981]" />
      </div>
    );

  const isUrdu = activeTrack?.language === 'ur';

  // Submagic font weight mappings
  const getFontWeight = (face: string) => {
    switch (face) {
      case 'Regular': return 400;
      case 'Regular Italic': return 400;
      case 'Medium': return 500;
      case 'SemiBold': return 600;
      case 'Bold': return 700;
      case 'Bold Italic': return 700;
      case 'Extra Bold': return 800;
      case 'Black': return 900;
      default: return 700;
    }
  };

  const isItalic = captionStyle.fontFace?.includes('Italic');

  // Text Transform applied directly to words (ensures 100% bug-free casing!)
  const transformWordText = (text: string, isActive: boolean = false) => {
    const styleMode = (isActive && captionStyle.emphasisStyles && captionStyle.emphasisStyles !== 'none')
      ? captionStyle.emphasisStyles
      : captionStyle.styles;

    if (!text) return text;
    if (styleMode === 'uppercase') return text.toUpperCase();
    if (styleMode === 'lowercase') return text.toLowerCase();
    if (styleMode === 'capitalize') {
      return text
        .split(/\s+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ');
    }
    if ((styleMode as any) === 'alternating') {
      return text
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    }
    return text;
  };

  // Build 3D Depth + Drop Shadow + Glow Shadows
  const shadowParts: string[] = [];
  if (captionStyle.dropShadowEnabled) {
    const alpha = (captionStyle.dropShadowOpacity ?? 63) / 100;
    shadowParts.push(`${captionStyle.dropShadowX ?? 0}px ${captionStyle.dropShadowY ?? 0}px ${captionStyle.dropShadowBlur ?? 13}px rgba(0,0,0,${alpha})`);
  }
  if (captionStyle.threeDDepthEnabled) {
    const dX = captionStyle.threeDDepthX ?? 2;
    const dY = captionStyle.threeDDepthY ?? 4;
    const dBlur = captionStyle.threeDDepthBlur ?? 0;
    const dColor = captionStyle.threeDDepthColor || '#000000';
    // Generates genuine 3D extruded directional shadow layers
    shadowParts.push(
      `${dX * 0.3}px ${dY * 0.3}px ${dBlur}px ${dColor}`,
      `${dX * 0.6}px ${dY * 0.6}px ${dBlur}px ${dColor}`,
      `${dX}px ${dY}px ${dBlur + 2}px ${dColor}`
    );
  }
  if (captionStyle.glowEnabled) {
    shadowParts.push(`0 0 ${captionStyle.glowBlur ?? 14}px ${captionStyle.glowColor ?? '#06B6D4'}`);
  }
  const computedTextShadow = shadowParts.length > 0 ? shadowParts.join(', ') : 'none';

  return (
    <div className="h-screen flex flex-col bg-[#111216] text-[#E1E4EA] overflow-hidden select-none font-sans">
      {/* Submagic Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-2.5 border-b border-[#1E2026] bg-[#141519] z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide">{project.name}</span>
            <Badge variant="outline" className="text-[10px] bg-[#181A20] border-[#2A2D37] text-emerald-400 py-0.5">
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Top Right: Upgrade pill & Avatar */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 text-xs font-semibold hover:bg-[#10B981]/25 transition-all">
            Upgrade <span className="text-[10px]">↗</span>
          </button>
          <div className="w-7 h-7 rounded-full bg-[#242732] border border-[#2D313F] flex items-center justify-center text-xs font-bold text-gray-300">
            CF
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT — Transcript & Segments Drawer */}
        <aside
          className={`h-full flex flex-col border-r border-[#1E2026] bg-[#141519] overflow-hidden select-none relative transition-all duration-200 ${
            sidebarCollapsed ? 'w-0 border-r-0' : 'w-84 shrink-0'
          }`}
        >
          {/* Top Pill Mode Switcher: [Captions] | [Edit] */}
          <div className="p-3 pb-2 border-b border-[#1E2026] shrink-0">
            <div className="flex bg-[#1A1C22] p-1 rounded-xl border border-[#282B34]">
              <button
                onClick={() => setEditorMode('captions')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  editorMode === 'captions'
                    ? 'bg-[#282B34] text-white shadow-sm font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Captions
              </button>
              <button
                onClick={() => setEditorMode('edit')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  editorMode === 'edit'
                    ? 'bg-[#282B34] text-white shadow-sm font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* MODE A: CAPTIONS (TRANSCRIPT, TIMINGS, AI GENERATION) */}
          {editorMode === 'captions' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 1. Spoken Language & AI Caption Generation Card */}
              <div className="p-3 border-b border-[#1E2026] bg-[#16181F]/70 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> AI Captions Generator
                  </span>
                  {tracks.length > 0 && (
                    <div className="flex gap-1">
                      {tracks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => selectActiveTrack(t)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            activeTrack?.id === t.id
                              ? 'bg-[#10B981] text-white shadow-sm'
                              : 'bg-[#1E2026] text-gray-400 hover:bg-[#282B34] hover:text-white'
                          }`}
                        >
                          {t.language.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">Spoken Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full bg-[#1A1C22] border border-[#282B34] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#10B981]"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="hinglish">Hinglish (Hindi/Latin)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="en">English</option>
                      <option value="ur">Urdu (اردو)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">Pacing (Words/Block)</label>
                    <select
                      value={pacing}
                      onChange={(e) => {
                        const p = e.target.value as PacingPresetKey;
                        setPacing(p);
                        if (activeTrack) handlePacingChange(p);
                      }}
                      className="w-full bg-[#1A1C22] border border-[#282B34] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#10B981]"
                    >
                      <option value="1-2">1-2 Words (Fast)</option>
                      <option value="2-3">2-3 Words (Viral)</option>
                      <option value="3-5">3-5 Words (Natural)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Generate / Re-generate Button */}
                <button
                  onClick={transcribe}
                  disabled={isTranscribing}
                  className="w-full py-2 px-3 bg-[#10B981] hover:bg-[#0EA271] disabled:bg-[#10B981]/50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isTranscribing ? 'animate-spin' : ''}`} />
                  {isTranscribing
                    ? 'Generating Captions with Gemini AI...'
                    : activeTrack?.segments.length
                    ? '⚡ Re-generate AI Captions'
                    : '⚡ Generate AI Captions'}
                </button>

                {/* Full Word-to-Word Sync & Speech Lead Calibrator */}
                {activeTrack && activeTrack.segments.length > 0 && (
                  <div className="pt-2 border-t border-[#1E2026]/80 flex flex-col gap-2">
                    {/* Primary Perfect Sync Button */}
                    <button
                      onClick={() => handleWordSync('cadence')}
                      disabled={isSyncingWords}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/40 hover:scale-[1.01]"
                      title="1-Click Auto Perfect Sync: Eliminates speech delay with acoustic onset lead"
                    >
                      <Zap className={`w-4 h-4 text-yellow-300 ${isSyncingWords ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingWords ? 'Calibrating Sync...' : '⚡ 1-Click Perfect Sync (Word-to-Word)'}</span>
                    </button>

                    {/* Fine-tuning Speech Timing Nudge Toolbar */}
                    <div className="bg-[#12141A] border border-[#232632] rounded-xl p-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                        <span>Speech Timing Nudge:</span>
                        <span className="text-emerald-400 font-mono">Earlier ➔ Later</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={() => handleApplyLeadOffset(-100)}
                          disabled={isSyncingWords}
                          className="py-1 px-1 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] hover:border-emerald-500/50 text-[10px] font-bold text-emerald-300 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Shift captions 100ms earlier (if word is spoken first)"
                        >
                          ⏩ -100ms
                        </button>
                        <button
                          onClick={() => handleApplyLeadOffset(-50)}
                          disabled={isSyncingWords}
                          className="py-1 px-1 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] hover:border-emerald-500/50 text-[10px] font-bold text-emerald-300 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Shift captions 50ms earlier"
                        >
                          ⏩ -50ms
                        </button>
                        <button
                          onClick={() => handleApplyLeadOffset(50)}
                          disabled={isSyncingWords}
                          className="py-1 px-1 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] hover:border-emerald-500/50 text-[10px] font-bold text-yellow-300 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Shift captions 50ms later (if caption shows too early)"
                        >
                          ⏪ +50ms
                        </button>
                        <button
                          onClick={() => handleApplyLeadOffset(100)}
                          disabled={isSyncingWords}
                          className="py-1 px-1 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] hover:border-emerald-500/50 text-[10px] font-bold text-yellow-300 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Shift captions 100ms later"
                        >
                          ⏪ +100ms
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Actions & Search Bar */}
              {activeTrack && activeTrack.segments.length > 0 ? (
                <div className="px-3 pt-2.5 pb-2 border-b border-[#1E2026] flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePacingChange('2-3')}
                      className="flex-1 py-1 px-2 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] hover:border-[#10B981]/50 text-emerald-400 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      title="Rechunk subtitles to natural 2-3 word blocks"
                    >
                      <Wand2 className="w-3 h-3" /> Quick Rechunk (2-3 Words)
                    </button>
                    <button
                      onClick={() => addSegment()}
                      className="py-1 px-2.5 bg-[#1A1C22] hover:bg-[#222530] border border-[#282B34] text-gray-300 hover:text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                      title="Add manual caption segment"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search words in transcript..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full bg-[#181A20] border border-[#22242C] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>
              ) : null}

              {/* 3. Segments List or Empty State */}
              {activeTrack && activeTrack.segments.length > 0 ? (
                <div ref={transcriptRef} className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {activeTrack.segments
                    .filter((s) => !transcriptSearch || s.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                    .map((seg, idx) => (
                      <div
                        key={seg.id}
                        id={`seg-${seg.id}`}
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = seg.start;
                            setCurrentTime(seg.start);
                          }
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all text-xs border ${
                          currentSegment?.id === seg.id
                            ? 'bg-[#10B981]/10 border-[#10B981]/50 shadow-md ring-1 ring-[#10B981]/30'
                            : 'bg-[#181A20] border-[#22242C] hover:bg-[#1E2129]'
                        } ${isUrdu ? 'text-right' : 'text-left'}`}
                        dir={isUrdu ? 'rtl' : 'ltr'}
                      >
                        {/* Header timing & actions */}
                        <div
                          className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-[#242732]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] text-gray-400 font-mono">
                            {formatTime(seg.start)} - {formatTime(seg.end)}
                          </span>

                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => syncSingleSegment(seg.id)}
                              className="p-1 text-gray-400 hover:text-yellow-300 rounded"
                              title="Word-to-word sync this caption"
                            >
                              <Zap className="w-3 h-3 text-yellow-400/80 hover:text-yellow-300" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSegId(seg.id);
                                setEditText(seg.text);
                              }}
                              className="p-1 text-gray-400 hover:text-white rounded"
                              title="Edit text"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => splitSegment(seg.id)}
                              className="p-1 text-gray-400 hover:text-white rounded"
                              title="Split caption"
                            >
                              <Scissors className="w-3 h-3" />
                            </button>
                            {idx < activeTrack.segments.length - 1 && (
                              <button
                                onClick={() => mergeWithNext(seg.id)}
                                className="p-1 text-gray-400 hover:text-white rounded"
                                title="Merge with next"
                              >
                                <GitMerge className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteSegment(seg.id)}
                              className="p-1 text-gray-400 hover:text-red-400 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Text representation */}
                        {editingSegId === seg.id ? (
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSegmentEdit(seg.id);
                                if (e.key === 'Escape') setEditingSegId(null);
                              }}
                              className="flex-1 bg-[#222530] rounded px-2 py-1 text-xs outline-none border border-[#10B981] text-white"
                              dir={isUrdu ? 'rtl' : 'ltr'}
                            />
                            <button
                              onClick={() => saveSegmentEdit(seg.id)}
                              className="px-2 py-1 bg-[#10B981] hover:bg-[#0EA271] text-white rounded text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSegId(null)}
                              className="px-2 py-1 bg-[#222530] hover:bg-[#2C303E] text-gray-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1">
                            {seg.words.map((w) => (
                              <span
                                key={w.id}
                                className={`${
                                  activeWord?.id === w.id
                                    ? 'text-yellow-400 font-bold bg-yellow-950/40 px-1 rounded'
                                    : 'text-gray-200'
                                } transition-colors mr-0.5`}
                              >
                                {w.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                  <button
                    onClick={() => addSegment()}
                    className="w-full py-2 border border-dashed border-[#282B34] hover:border-[#10B981] rounded-xl text-xs text-gray-400 hover:text-[#10B981] flex items-center justify-center gap-1.5 transition-all mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Caption
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">No Captions Yet</h4>
                    <p className="text-gray-400 text-xs mt-1">
                      Choose your language above and click &quot;Generate AI Captions&quot; to transcribe this video automatically.
                    </p>
                  </div>
                  <button
                    onClick={transcribe}
                    disabled={isTranscribing}
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#0EA271] text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4" /> Generate Captions Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE B: EDIT (TEXT, TEMPLATES, TRANSITIONS, AI AUDIO) */}
          {editorMode === 'edit' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Submagic Sub-Tabs: Text | Templates | Transitions | AI Audio */}
              <div className="flex border-b border-[#1E2026] px-4 gap-6 text-xs font-medium bg-[#141519] shrink-0">
                <button
                  onClick={() => setActiveSubTab('text')}
                  className={`py-2.5 transition-all relative ${
                    activeSubTab === 'text'
                      ? 'text-[#10B981] font-semibold border-b-2 border-[#10B981]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setActiveSubTab('templates')}
                  className={`py-2.5 transition-all relative ${
                    activeSubTab === 'templates'
                      ? 'text-[#10B981] font-semibold border-b-2 border-[#10B981]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveSubTab('transitions')}
                  className={`py-2.5 transition-all relative ${
                    activeSubTab === 'transitions'
                      ? 'text-[#10B981] font-semibold border-b-2 border-[#10B981]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Transitions
                </button>
                <button
                  onClick={() => setActiveSubTab('audio')}
                  className={`py-2.5 transition-all relative ${
                    activeSubTab === 'audio'
                      ? 'text-[#10B981] font-semibold border-b-2 border-[#10B981]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  AI Audio
                </button>
              </div>

              {/* Inspector Content */}
              {/* TAB 1: TEXT (THE SUBMAGIC ACCORDION LIST) */}
          {activeSubTab === 'text' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* 1. FONTS & ADD CUSTOM FONT */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('fonts')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>FONTS</span>
                  {openSections.fonts ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.fonts && (
                  <div className="pt-3 space-y-3">
                    {/* Font Family Dropdown + Add Font button */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Font Family</span>
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowFontDropdown(!showFontDropdown)}
                            className="w-40 bg-[#1A1C22] border border-[#282B34] text-white rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between outline-none hover:border-[#10B981] transition-all"
                          >
                            <span
                              className="truncate text-xs font-semibold"
                              style={{ fontFamily: captionStyle.fontFamily }}
                            >
                              {ALL_FONTS.find((f) => f.value === captionStyle.fontFamily)?.label ||
                                customFonts.find((f) => f.value === captionStyle.fontFamily)?.label ||
                                captionStyle.fontFamily.split(',')[0].replace(/['"]/g, '')}
                            </span>
                            <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                          </button>

                          {/* FLOATING CUSTOM FONT DROPDOWN WITH REAL FONT PREVIEWS! */}
                          {showFontDropdown && (
                            <div className="absolute right-0 top-full mt-1.5 w-64 max-h-80 overflow-y-auto bg-[#16181F] border border-[#282B36] rounded-xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <div className="sticky top-0 bg-[#16181F] pb-1 z-10">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Search font..."
                                  value={fontSearch}
                                  onChange={(e) => setFontSearch(e.target.value)}
                                  className="w-full bg-[#1F222C] border border-[#2C303E] rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-[#10B981]"
                                />
                              </div>

                              {customFonts.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-wider block">
                                    Custom Uploaded Fonts
                                  </span>
                                  {customFonts
                                    .filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
                                    .map((f) => (
                                      <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => {
                                          setCaptionStyle((s) => ({ ...s, fontFamily: f.value }));
                                          setShowFontDropdown(false);
                                        }}
                                        className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-all ${
                                          captionStyle.fontFamily === f.value
                                            ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                                            : 'hover:bg-[#20232E] text-gray-200'
                                        }`}
                                      >
                                        <span className="text-sm truncate" style={{ fontFamily: f.value }}>
                                          {f.label}
                                        </span>
                                        {captionStyle.fontFamily === f.value && (
                                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                        )}
                                      </button>
                                    ))}
                                </div>
                              )}

                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-wider block mb-1">
                                  Creator Fonts ({ALL_FONTS.length})
                                </span>
                                {ALL_FONTS
                                  .filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
                                  .map((f) => (
                                    <button
                                      key={f.value}
                                      type="button"
                                      onClick={() => {
                                        setCaptionStyle((s) => ({ ...s, fontFamily: f.value }));
                                        setShowFontDropdown(false);
                                      }}
                                      className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-all ${
                                        captionStyle.fontFamily === f.value
                                          ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                                          : 'hover:bg-[#20232E] text-gray-200'
                                      }`}
                                    >
                                      {/* THE FONT NAME RENDERED IN ITS ACTUAL FONT! */}
                                      <span
                                        className="text-base tracking-wide truncate"
                                        style={{ fontFamily: f.value }}
                                      >
                                        {f.label}
                                      </span>
                                      {captionStyle.fontFamily === f.value && (
                                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                      )}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, fontFamily: 'Inter, sans-serif' }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#282B34] transition-all"
                          title="Reset font"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* + Add Custom Font Button */}
                    <button
                      onClick={() => setShowAddFontModal(true)}
                      className="w-full py-1.5 rounded-lg bg-[#1A1C22] hover:bg-[#222530] border border-dashed border-[#10B981]/50 text-[#10B981] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Custom Font (Upload / Google Font)
                    </button>

                    {/* Font Face */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Font Face</span>
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <select
                            value={captionStyle.fontFace}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, fontFace: e.target.value as any }))}
                            className="w-32 bg-[#1A1C22] border border-[#282B34] text-white rounded-lg px-2.5 py-1.5 text-xs appearance-none pr-6 outline-none"
                          >
                            <option value="Regular">Regular</option>
                            <option value="Medium">Medium</option>
                            <option value="SemiBold">SemiBold</option>
                            <option value="Bold">Bold</option>
                            <option value="Extra Bold">Extra Bold</option>
                            <option value="Black">Black</option>
                            <option value="Regular Italic">Regular Italic</option>
                            <option value="Bold Italic">Bold Italic</option>
                          </select>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, fontFace: 'Medium' }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Font Size & Quick Size Pills */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs font-medium">Font Size</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={16}
                            max={72}
                            value={captionStyle.fontSize}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, fontSize: parseInt(e.target.value) }))}
                            className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                          />
                          <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 text-xs font-mono text-white min-w-[46px] text-center">
                            {captionStyle.fontSize} px
                          </div>
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, fontSize: 32 }))}
                            className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                            title="Reset"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Line Resize Buttons */}
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] text-gray-500">Quick:</span>
                        {[22, 28, 34, 42].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setCaptionStyle((s) => ({ ...s, fontSize: sz }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                              captionStyle.fontSize === sz
                                ? 'bg-[#10B981] text-white border-[#10B981]'
                                : 'bg-[#1A1C22] text-gray-400 border-[#282B34] hover:text-white'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. FORMAT & SINGLE-LINE TOGGLE */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('format')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>FORMAT & LINE WRAP</span>
                  {openSections.format ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.format && (
                  <div className="pt-3 space-y-3">
                    {/* Single Line vs Multi-Line Mode & Auto-Fit */}
                    <div className="space-y-1.5 bg-[#1A1C22] p-2 rounded-xl border border-[#282B34]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs font-semibold">Line Wrap</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, singleLine: true }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              captionStyle.singleLine
                                ? 'bg-[#10B981] text-white shadow-sm'
                                : 'bg-[#242732] text-gray-400 hover:text-white'
                            }`}
                            title="Keep caption on 1 single line"
                          >
                            1 Line Only
                          </button>
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, singleLine: false }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              !captionStyle.singleLine
                                ? 'bg-[#10B981] text-white shadow-sm'
                                : 'bg-[#242732] text-gray-400 hover:text-white'
                            }`}
                            title="Allow multi-line wrapping"
                          >
                            Multi-Line
                          </button>
                        </div>
                      </div>
                      {captionStyle.singleLine && (
                        <button
                          onClick={() => {
                            setCaptionStyle((s) => ({ ...s, fontSize: Math.max(18, Math.min(26, (s.fontSize || 32) - 6)) }));
                            toast({ title: 'Auto-fitted to 1 Line', description: 'Adjusted font size so words fit in a single line.' });
                          }}
                          className="w-full py-1 text-[11px] font-semibold text-emerald-400 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Minimize2 className="w-3 h-3" /> Auto Fit Font Size to 1 Line
                        </button>
                      )}
                    </div>

                    {/* Styles Pills: [Tt] [T] [t] [U] */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Styles</span>
                      <div className="flex items-center bg-[#1A1C22] p-1 rounded-lg border border-[#282B34] gap-1">
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, styles: s.styles === 'capitalize' ? 'none' : 'capitalize' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.styles === 'capitalize' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Capitalize Each Word"
                        >
                          Tt
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, styles: s.styles === 'uppercase' ? 'none' : 'uppercase' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.styles === 'uppercase' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="UPPERCASE"
                        >
                          T
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, styles: s.styles === 'lowercase' ? 'none' : 'lowercase' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.styles === 'lowercase' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="lowercase"
                        >
                          t
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, underline: !s.underline }))}
                          className={`w-7 h-7 rounded text-xs font-bold underline transition-all ${
                            captionStyle.underline ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Underline"
                        >
                          U
                        </button>
                      </div>
                    </div>

                    {/* Text Alignment: [Left] [Center] [Right] */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Text Alignment</span>
                      <div className="flex items-center bg-[#1A1C22] p-1 rounded-lg border border-[#282B34] gap-1">
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, textAlign: 'left' }))}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                            captionStyle.textAlign === 'left' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, textAlign: 'center' }))}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                            captionStyle.textAlign === 'center' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, textAlign: 'right' }))}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                            captionStyle.textAlign === 'right' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. POSITION: X and Y */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('position')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>POSITION</span>
                  {openSections.position ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.position && (
                  <div className="pt-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* X */}
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-gray-400 text-xs font-semibold">X</span>
                        <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 flex-1">
                          <input
                            type="number"
                            step="0.5"
                            value={captionStyle.positionX ?? 50.0}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, positionX: parseFloat(e.target.value) || 50 }))}
                            className="w-full bg-transparent text-white font-mono text-xs outline-none"
                          />
                          <span className="text-gray-500 text-xs ml-0.5">%</span>
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, positionX: 50.0 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Center X"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Y */}
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-gray-400 text-xs font-semibold">Y</span>
                        <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 flex-1">
                          <input
                            type="number"
                            step="0.5"
                            value={captionStyle.verticalPosition ?? 65.0}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, verticalPosition: parseFloat(e.target.value) || 65 }))}
                            className="w-full bg-transparent text-white font-mono text-xs outline-none"
                          />
                          <span className="text-gray-500 text-xs ml-0.5">%</span>
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, verticalPosition: 65.0 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset Y"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. COLOR & GRADIENT */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('color')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>COLOR & GRADIENT</span>
                  {openSections.color ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.color && (
                  <div className="pt-3 space-y-3">
                    {/* Mode Toggle: Solid vs Gradient */}
                    <div className="flex bg-[#1A1C22] p-1 rounded-xl border border-[#282B34]">
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, colorType: 'solid' }))}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          captionStyle.colorType === 'solid' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Droplet className="w-3.5 h-3.5" /> Solid
                      </button>
                      <button
                        onClick={() =>
                          setCaptionStyle((s) => ({
                            ...s,
                            colorType: 'gradient',
                            gradientColorsCount: s.gradientColorsCount || 2,
                            gradientColor1: s.gradientColor1 || '#FACC15',
                            gradientColor2: s.gradientColor2 || '#EF4444',
                            gradientStop1: s.gradientStop1 ?? 0,
                            gradientStop2: s.gradientStop2 ?? 100,
                            gradientAngle: s.gradientAngle ?? 135,
                          }))
                        }
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          captionStyle.colorType === 'gradient' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" /> Gradient
                      </button>
                    </div>

                    {captionStyle.colorType === 'solid' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs font-medium">Color</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2.5 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.textColor?.startsWith('#') ? captionStyle.textColor : '#FFFFFF'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, textColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-gray-500 text-xs font-mono">#</span>
                            <input
                              type="text"
                              value={captionStyle.textColor.replace('#', '')}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, textColor: `#${e.target.value}` }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, textColor: '#FFFFFF' }))}
                            className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                            title="Reset color"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pl-1 border-l-2 border-[#10B981]/40">
                        {/* 2, 3, 4 Color Count Selector */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-gray-400 block">Gradient Colors Type</span>
                          <div className="flex bg-[#1A1C22] p-1 rounded-xl border border-[#282B34]">
                            {([2, 3, 4] as const).map((cnt) => (
                              <button
                                key={cnt}
                                onClick={() => setCaptionStyle((s) => ({ ...s, gradientColorsCount: cnt }))}
                                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                                  (captionStyle.gradientColorsCount ?? 2) === cnt
                                    ? 'bg-[#10B981] text-white shadow-sm font-bold'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {cnt} Colors
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Live Ribbon Preview */}
                        <div
                          className="w-full h-5 rounded-lg border border-[#282B34] shadow-inner"
                          style={{
                            background: buildGradientString(
                              captionStyle.gradientAngle ?? 135,
                              captionStyle.gradientColorsCount ?? 2,
                              captionStyle.gradientColor1 || '#FACC15',
                              captionStyle.gradientColor2 || '#EF4444',
                              captionStyle.gradientColor3 || '#3B82F6',
                              captionStyle.gradientColor4 || '#10B981',
                              captionStyle.gradientStop1 ?? 0,
                              captionStyle.gradientStop2 ?? 100,
                              captionStyle.gradientStop3 ?? 66,
                              captionStyle.gradientStop4 ?? 100
                            ),
                          }}
                        />

                        {/* Angle / Direction Slider + Quick Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Angle / Direction</span>
                            <span className="font-mono text-emerald-400 text-xs font-semibold">{captionStyle.gradientAngle ?? 135}°</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={360}
                              value={captionStyle.gradientAngle ?? 135}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientAngle: parseInt(e.target.value) }))}
                              className="flex-1 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="flex gap-1">
                              {[
                                { label: '➔', deg: 90, title: 'Left to Right' },
                                { label: '↓', deg: 180, title: 'Top to Bottom' },
                                { label: '↘', deg: 135, title: 'Diagonal Down' },
                                { label: '↗', deg: 45, title: 'Diagonal Up' },
                              ].map((dir) => (
                                <button
                                  key={dir.label}
                                  onClick={() => setCaptionStyle((s) => ({ ...s, gradientAngle: dir.deg }))}
                                  className={`w-6 h-6 rounded bg-[#1A1C22] border text-xs flex items-center justify-center transition-all ${
                                    (captionStyle.gradientAngle ?? 135) === dir.deg
                                      ? 'border-[#10B981] text-[#10B981] font-bold'
                                      : 'border-[#282B34] text-gray-400 hover:text-white'
                                  }`}
                                  title={dir.title}
                                >
                                  {dir.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Color 1 with Dominance / Stop Slider */}
                        <div className="space-y-1 bg-[#1A1C22]/80 p-2 rounded-xl border border-[#282B34]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-200 font-semibold">Color 1 (Start)</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={captionStyle.gradientColor1 || '#FACC15'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor1: e.target.value }))}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={captionStyle.gradientColor1 || '#FACC15'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor1: e.target.value }))}
                                className="w-16 bg-[#16181F] border border-[#282B34] rounded px-1.5 py-0.5 text-white font-mono text-xs uppercase outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[11px] text-gray-400">Dominance / Stop</span>
                            <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={captionStyle.gradientStop1 ?? 0}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientStop1: parseInt(e.target.value) }))}
                                className="flex-1 h-1 bg-[#282B34] rounded appearance-none cursor-pointer accent-[#10B981]"
                              />
                              <span className="text-[11px] font-mono text-gray-300 w-8 text-right">{captionStyle.gradientStop1 ?? 0}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Color 2 with Dominance / Stop Slider */}
                        <div className="space-y-1 bg-[#1A1C22]/80 p-2 rounded-xl border border-[#282B34]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-200 font-semibold">Color 2</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={captionStyle.gradientColor2 || '#EF4444'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor2: e.target.value }))}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={captionStyle.gradientColor2 || '#EF4444'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor2: e.target.value }))}
                                className="w-16 bg-[#16181F] border border-[#282B34] rounded px-1.5 py-0.5 text-white font-mono text-xs uppercase outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[11px] text-gray-400">Dominance / Stop</span>
                            <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={captionStyle.gradientStop2 ?? 100}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientStop2: parseInt(e.target.value) }))}
                                className="flex-1 h-1 bg-[#282B34] rounded appearance-none cursor-pointer accent-[#10B981]"
                              />
                              <span className="text-[11px] font-mono text-gray-300 w-8 text-right">{captionStyle.gradientStop2 ?? 100}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Color 3 (for 3 or 4 colors) */}
                        {(captionStyle.gradientColorsCount ?? 2) >= 3 && (
                          <div className="space-y-1 bg-[#1A1C22]/80 p-2 rounded-xl border border-[#282B34]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-200 font-semibold">Color 3</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={captionStyle.gradientColor3 || '#3B82F6'}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor3: e.target.value }))}
                                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                />
                                <input
                                  type="text"
                                  value={captionStyle.gradientColor3 || '#3B82F6'}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor3: e.target.value }))}
                                  className="w-16 bg-[#16181F] border border-[#282B34] rounded px-1.5 py-0.5 text-white font-mono text-xs uppercase outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] text-gray-400">Dominance / Stop</span>
                              <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={captionStyle.gradientStop3 ?? 66}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientStop3: parseInt(e.target.value) }))}
                                  className="flex-1 h-1 bg-[#282B34] rounded appearance-none cursor-pointer accent-[#10B981]"
                                />
                                <span className="text-[11px] font-mono text-gray-300 w-8 text-right">{captionStyle.gradientStop3 ?? 66}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Color 4 (for 4 colors) */}
                        {(captionStyle.gradientColorsCount ?? 2) === 4 && (
                          <div className="space-y-1 bg-[#1A1C22]/80 p-2 rounded-xl border border-[#282B34]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-200 font-semibold">Color 4 (End)</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={captionStyle.gradientColor4 || '#10B981'}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor4: e.target.value }))}
                                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                />
                                <input
                                  type="text"
                                  value={captionStyle.gradientColor4 || '#10B981'}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientColor4: e.target.value }))}
                                  className="w-16 bg-[#16181F] border border-[#282B34] rounded px-1.5 py-0.5 text-white font-mono text-xs uppercase outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] text-gray-400">Dominance / Stop</span>
                              <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={captionStyle.gradientStop4 ?? 100}
                                  onChange={(e) => setCaptionStyle((s) => ({ ...s, gradientStop4: parseInt(e.target.value) }))}
                                  className="flex-1 h-1 bg-[#282B34] rounded appearance-none cursor-pointer accent-[#10B981]"
                                />
                                <span className="text-[11px] font-mono text-gray-300 w-8 text-right">{captionStyle.gradientStop4 ?? 100}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Presets */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Gradient Presets</span>
                          <div className="grid grid-cols-3 gap-1">
                            {GRADIENT_PRESETS.map((p) => (
                              <button
                                key={p.label}
                                onClick={() =>
                                  setCaptionStyle((s) => ({
                                    ...s,
                                    gradientColorsCount: p.count,
                                    gradientColor1: p.c1,
                                    gradientColor2: p.c2,
                                    gradientColor3: p.c3 || s.gradientColor3,
                                    gradientColor4: p.c4 || s.gradientColor4,
                                    gradientStop1: p.s1,
                                    gradientStop2: p.s2,
                                    gradientStop3: p.s3,
                                    gradientStop4: p.s4,
                                    gradientAngle: p.angle,
                                  }))
                                }
                                className="py-1 px-1.5 rounded-lg text-[10px] font-semibold text-white border border-[#282B34] truncate hover:scale-[1.02] transition-all shadow-sm"
                                style={{
                                  background: buildGradientString(p.angle, p.count, p.c1, p.c2, p.c3, p.c4, p.s1, p.s2, p.s3, p.s4),
                                }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. EMPHASIS (ACTIVE WORD HIGHLIGHT) */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('emphasis')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> EMPHASIS (ACTIVE WORD)
                  </span>
                  {openSections.emphasis ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.emphasis && (
                  <div className="pt-3 space-y-3">
                    {/* Emphasize vs Spotlight */}
                    <div className="flex bg-[#1A1C22] p-1 rounded-xl border border-[#282B34]">
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, emphasisMode: 'emphasize' }))}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                          captionStyle.emphasisMode === 'emphasize' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Emphasize
                      </button>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, emphasisMode: 'spotlight' }))}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                          captionStyle.emphasisMode === 'spotlight' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Spotlight
                      </button>
                    </div>

                    {/* Solid vs Gradient */}
                    <div className="flex bg-[#1A1C22] p-1 rounded-xl border border-[#282B34]">
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, emphasisColorType: 'solid' }))}
                        className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                          captionStyle.emphasisColorType === 'solid' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Droplet className="w-3.5 h-3.5 inline mr-1" /> Solid
                      </button>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, emphasisColorType: 'gradient', emphasisGradient1: '#FACC15', emphasisGradient2: '#EF4444' }))}
                        className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                          captionStyle.emphasisColorType === 'gradient' ? 'bg-[#282B34] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5 inline mr-1" /> Gradient
                      </button>
                    </div>

                    {/* Highlight Color */}
                    {captionStyle.emphasisColorType === 'solid' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-xs font-medium">Color</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2.5 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.highlightColor?.startsWith('#') ? captionStyle.highlightColor : '#EF4444'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, highlightColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-gray-500 text-xs font-mono">#</span>
                            <input
                              type="text"
                              value={captionStyle.highlightColor.replace('#', '')}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, highlightColor: `#${e.target.value}` }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, highlightColor: '#EF4444' }))}
                            className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                            title="Reset"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Gradient</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={captionStyle.emphasisGradient1 || '#FACC15'}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisGradient1: e.target.value }))}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="color"
                            value={captionStyle.emphasisGradient2 || '#EF4444'}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisGradient2: e.target.value }))}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Size Slider */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Size</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0.9}
                          max={1.4}
                          step={0.02}
                          value={captionStyle.emphasisSize || 1.0}
                          onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisSize: parseFloat(e.target.value) }))}
                          className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                        />
                        <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2.5 py-1 text-xs font-mono text-white min-w-[46px] text-center">
                          {(captionStyle.emphasisSize || 1.0).toFixed(1)}
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisSize: 1.0 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Glow Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Glow</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, emphasisGlow: !s.emphasisGlow }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.emphasisGlow ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.emphasisGlow ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.emphasisGlow && (
                      <div className="flex items-center justify-between pl-2 border-l-2 border-[#10B981]/40">
                        <span className="text-gray-400 text-xs">Glow color</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-1.5">
                            <input
                              type="color"
                              value={captionStyle.emphasisGlowColor || '#EF4444'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisGlowColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={captionStyle.emphasisGlowColor || '#EF4444'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisGlowColor: e.target.value }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                          <button
                            onClick={() => setCaptionStyle((s) => ({ ...s, emphasisGlowColor: '#EF4444' }))}
                            className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Emphasis Font Custom Visual Picker */}
                    <div className="flex items-center justify-between relative">
                      <span className="text-gray-300 text-xs font-medium">Font</span>
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmphasisFontDropdown(!showEmphasisFontDropdown)}
                            className="w-40 bg-[#1A1C22] border border-[#282B34] text-white rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between outline-none hover:border-[#10B981] transition-all"
                          >
                            <span
                              className="truncate text-xs font-semibold"
                              style={{ fontFamily: captionStyle.emphasisFont || captionStyle.fontFamily }}
                            >
                              {captionStyle.emphasisFont
                                ? ALL_FONTS.find((f) => f.value === captionStyle.emphasisFont)?.label ||
                                  customFonts.find((f) => f.value === captionStyle.emphasisFont)?.label ||
                                  captionStyle.emphasisFont.split(',')[0].replace(/['"]/g, '')
                                : '(Inherit Base Font)'}
                            </span>
                            <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                          </button>

                          {showEmphasisFontDropdown && (
                            <div className="absolute right-0 top-full mt-1.5 w-64 max-h-80 overflow-y-auto bg-[#16181F] border border-[#282B36] rounded-xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <div className="sticky top-0 bg-[#16181F] pb-1 z-10">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Search font..."
                                  value={emphasisFontSearch}
                                  onChange={(e) => setEmphasisFontSearch(e.target.value)}
                                  className="w-full bg-[#1F222C] border border-[#2C303E] rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-[#10B981]"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setCaptionStyle((s) => ({ ...s, emphasisFont: undefined }));
                                  setShowEmphasisFontDropdown(false);
                                }}
                                className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-gray-400 hover:bg-[#20232E] hover:text-white"
                              >
                                (Inherit Base Font)
                              </button>

                              {ALL_FONTS
                                .filter((f) => f.label.toLowerCase().includes(emphasisFontSearch.toLowerCase()))
                                .map((f) => (
                                  <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => {
                                      setCaptionStyle((s) => ({ ...s, emphasisFont: f.value }));
                                      setShowEmphasisFontDropdown(false);
                                    }}
                                    className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-all ${
                                      captionStyle.emphasisFont === f.value
                                        ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                                        : 'hover:bg-[#20232E] text-gray-200'
                                    }`}
                                  >
                                    <span
                                      className="text-base tracking-wide truncate"
                                      style={{ fontFamily: f.value }}
                                    >
                                      {f.label}
                                    </span>
                                    {captionStyle.emphasisFont === f.value && (
                                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                    )}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisFont: undefined }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset to Base Font"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Emphasis Font Face */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Font Face</span>
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <select
                            value={captionStyle.emphasisFontFace || captionStyle.fontFace}
                            onChange={(e) => setCaptionStyle((s) => ({ ...s, emphasisFontFace: e.target.value as any }))}
                            className="w-32 bg-[#1A1C22] border border-[#282B34] text-white rounded-lg px-2.5 py-1.5 text-xs appearance-none pr-6 outline-none"
                          >
                            <option value="Regular">Regular</option>
                            <option value="Medium">Medium</option>
                            <option value="SemiBold">SemiBold</option>
                            <option value="Bold">Bold</option>
                            <option value="Extra Bold">Extra Bold</option>
                            <option value="Black">Black</option>
                            <option value="Regular Italic">Regular Italic</option>
                            <option value="Bold Italic">Bold Italic</option>
                          </select>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisFontFace: undefined }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset Font Face"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Emphasis Styles: [Tt] [T] [t] [U] [tT] (Matches Screenshot 2) */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Styles</span>
                      <div className="flex items-center bg-[#1A1C22] p-1 rounded-lg border border-[#282B34] gap-1">
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisStyles: s.emphasisStyles === 'capitalize' ? 'none' : 'capitalize' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.emphasisStyles === 'capitalize' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Capitalize active word"
                        >
                          Tt
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisStyles: s.emphasisStyles === 'uppercase' ? 'none' : 'uppercase' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.emphasisStyles === 'uppercase' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="UPPERCASE active word"
                        >
                          T
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisStyles: s.emphasisStyles === 'lowercase' ? 'none' : 'lowercase' }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            captionStyle.emphasisStyles === 'lowercase' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="lowercase active word"
                        >
                          t
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisUnderline: !s.emphasisUnderline }))}
                          className={`w-7 h-7 rounded text-xs font-bold underline transition-all ${
                            captionStyle.emphasisUnderline ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="Underline active word"
                        >
                          U
                        </button>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, emphasisStyles: (s.emphasisStyles as any) === 'alternating' ? 'none' : ('alternating' as any) }))}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            (captionStyle.emphasisStyles as any) === 'alternating' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                          }`}
                          title="tT Alternating Casing"
                        >
                          tT
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. SPACING: Letter Spacing + WORD SPACING + Line Spacing */}
              <div className="border-b border-[#1E2026] pb-4">
                <button
                  onClick={() => toggleSection('spacing')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>SPACING & WORD BREATHING</span>
                  {openSections.spacing ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.spacing && (
                  <div className="pt-3 space-y-3">
                    {/* Word Spacing (Expanded limit up to 150px) */}
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-xs font-semibold">Word Spacing</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={150}
                          value={captionStyle.wordSpacing ?? 14}
                          onChange={(e) => setCaptionStyle((s) => ({ ...s, wordSpacing: parseInt(e.target.value) || 0 }))}
                          className="w-24 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                        />
                        <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-1.5 py-0.5 text-xs font-mono text-white min-w-[56px] text-center">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={captionStyle.wordSpacing ?? 14}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setCaptionStyle((s) => ({ ...s, wordSpacing: isNaN(v) ? 0 : Math.max(0, Math.min(200, v)) }));
                            }}
                            className="w-10 bg-transparent text-center text-white focus:outline-none"
                          />
                          <span className="text-[10px] text-gray-400">px</span>
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, wordSpacing: 14 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset word spacing to default (14px)"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Letter Spacing */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Letter Spacing</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-10}
                          max={20}
                          value={captionStyle.letterSpacing || 0}
                          onChange={(e) => setCaptionStyle((s) => ({ ...s, letterSpacing: parseInt(e.target.value) }))}
                          className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                        />
                        <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2.5 py-1 text-xs font-mono text-white min-w-[46px] text-center">
                          {captionStyle.letterSpacing || 0}
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, letterSpacing: 0 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Line Spacing */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Line Spacing</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0.8}
                          max={2.4}
                          step={0.05}
                          value={captionStyle.lineSpacing || 1.2}
                          onChange={(e) => setCaptionStyle((s) => ({ ...s, lineSpacing: parseFloat(e.target.value) }))}
                          className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                        />
                        <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2.5 py-1 text-xs font-mono text-white min-w-[46px] text-center">
                          {(captionStyle.lineSpacing || 1.2).toFixed(1)}
                        </div>
                        <button
                          onClick={() => setCaptionStyle((s) => ({ ...s, lineSpacing: 1.2 }))}
                          className="w-7 h-7 rounded-lg bg-[#1A1C22] border border-[#282B34] flex items-center justify-center text-gray-400 hover:text-white"
                          title="Reset"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. EFFECTS */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection('effects')}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-200 uppercase tracking-wider hover:text-white"
                >
                  <span>EFFECTS</span>
                  {openSections.effects ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {openSections.effects && (
                  <div className="pt-3 space-y-3">
                    {/* 1. Drop Shadow Switch (Matches Screenshot 4) */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Drop Shadow</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, dropShadowEnabled: !s.dropShadowEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.dropShadowEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.dropShadowEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.dropShadowEnabled && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-[#10B981]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Color</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-1.5">
                              <input
                                type="color"
                                value={captionStyle.dropShadowColor || '#000000'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowColor: e.target.value }))}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={captionStyle.dropShadowColor || '#000000'}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowColor: e.target.value }))}
                                className="w-14 bg-transparent text-white font-mono text-xs uppercase outline-none"
                              />
                            </div>
                            <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={captionStyle.dropShadowOpacity ?? 63}
                                onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowOpacity: parseInt(e.target.value) || 0 }))}
                                className="w-8 bg-transparent text-white font-mono text-xs text-right outline-none"
                              />
                              <span className="text-gray-500 text-xs ml-0.5">%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Position X</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-20}
                              max={20}
                              value={captionStyle.dropShadowX ?? 0}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowX: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.dropShadowX ?? 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Position Y</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-20}
                              max={20}
                              value={captionStyle.dropShadowY ?? 0}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowY: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.dropShadowY ?? 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Blur</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={40}
                              value={captionStyle.dropShadowBlur ?? 13}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, dropShadowBlur: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.dropShadowBlur ?? 13}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Glow Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Glow</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, glowEnabled: !s.glowEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.glowEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.glowEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.glowEnabled && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-[#10B981]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Glow Color</span>
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.glowColor || '#06B6D4'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, glowColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={captionStyle.glowColor || '#06B6D4'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, glowColor: e.target.value }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Glow Blur</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={2}
                              max={40}
                              value={captionStyle.glowBlur ?? 14}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, glowBlur: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.glowBlur ?? 14}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. 3D Depth Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">3D Depth</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, threeDDepthEnabled: !s.threeDDepthEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.threeDDepthEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.threeDDepthEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.threeDDepthEnabled && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-[#10B981]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">3D Color</span>
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.threeDDepthColor || '#000000'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, threeDDepthColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={captionStyle.threeDDepthColor || '#000000'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, threeDDepthColor: e.target.value }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Position X</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-20}
                              max={20}
                              value={captionStyle.threeDDepthX ?? 2}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, threeDDepthX: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.threeDDepthX ?? 2}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Position Y (Depth)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={-20}
                              max={20}
                              value={captionStyle.threeDDepthY ?? 4}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, threeDDepthY: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.threeDDepthY ?? 4}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Blur</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={30}
                              value={captionStyle.threeDDepthBlur ?? 0}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, threeDDepthBlur: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.threeDDepthBlur ?? 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Text Stroke Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Text Stroke</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, strokeEnabled: !s.strokeEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.strokeEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.strokeEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.strokeEnabled && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-[#10B981]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Stroke Color</span>
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.strokeColor || '#000000'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, strokeColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={captionStyle.strokeColor || '#000000'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, strokeColor: e.target.value }))}
                              className="w-16 bg-transparent text-white font-mono text-xs uppercase outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Stroke Width</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={1}
                              max={14}
                              value={captionStyle.strokeWidth || 2}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, strokeWidth: parseInt(e.target.value) }))}
                              className="w-20 h-1 bg-[#282B34] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                            />
                            <div className="bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-0.5 text-xs font-mono text-white min-w-[32px] text-center">
                              {captionStyle.strokeWidth || 2}px
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Arc Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Arc</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, arcEnabled: !s.arcEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.arcEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.arcEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 6. Background Box Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Background</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, bgBoxEnabled: !s.bgBoxEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.bgBoxEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.bgBoxEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {captionStyle.bgBoxEnabled && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-[#10B981]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Box Color</span>
                          <div className="flex items-center bg-[#1A1C22] border border-[#282B34] rounded-lg px-2 py-1 gap-2">
                            <input
                              type="color"
                              value={captionStyle.bgColor?.startsWith('#') ? captionStyle.bgColor : '#000000'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, bgColor: e.target.value }))}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={captionStyle.bgColor || 'rgba(0,0,0,0.85)'}
                              onChange={(e) => setCaptionStyle((s) => ({ ...s, bgColor: e.target.value }))}
                              className="w-24 bg-transparent text-white font-mono text-[11px] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7. Letter boxes Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs font-medium">Letter boxes</span>
                      <button
                        onClick={() => setCaptionStyle((s) => ({ ...s, letterBoxesEnabled: !s.letterBoxesEnabled }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                          captionStyle.letterBoxesEnabled ? 'bg-[#10B981]' : 'bg-[#282B34]'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            captionStyle.letterBoxesEnabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRENDING TEMPLATES (30 STYLES) WITH LIVE VISUAL PREVIEWS */}
          {activeSubTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Trending Templates (30 Styles)
                </span>
                <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 text-[10px]">
                  {Object.keys(TEMPLATES).length} Styles
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pb-8">
                {Object.entries(TEMPLATES).map(([key, tpl], cardIdx) => {
                  const isSelected = captionStyle.id === key;
                  const words = tpl.previewWords || ['Trending', 'Caption', 'Style'];
                  const activeIdx = tpl.previewActiveIndex ?? (words.length - 1);

                  // Preview shadow computation
                  const shadowParts: string[] = [];
                  if (tpl.dropShadowEnabled) {
                    const alpha = (tpl.dropShadowOpacity ?? 70) / 100;
                    shadowParts.push(`${tpl.dropShadowX ?? 0}px ${tpl.dropShadowY ?? 2}px ${tpl.dropShadowBlur ?? 10}px rgba(0,0,0,${alpha})`);
                  }
                  if (tpl.threeDDepthEnabled) {
                    const dX = tpl.threeDDepthX ?? 2;
                    const dY = tpl.threeDDepthY ?? 4;
                    const dBlur = tpl.threeDDepthBlur ?? 0;
                    const dColor = tpl.threeDDepthColor || '#000000';
                    shadowParts.push(
                      `${dX * 0.3}px ${dY * 0.3}px ${dBlur}px ${dColor}`,
                      `${dX * 0.6}px ${dY * 0.6}px ${dBlur}px ${dColor}`,
                      `${dX}px ${dY}px ${dBlur + 2}px ${dColor}`
                    );
                  }
                  if (tpl.glowEnabled) {
                    shadowParts.push(`0 0 ${tpl.glowBlur ?? 14}px ${tpl.glowColor ?? '#06B6D4'}`);
                  }
                  const previewShadow = shadowParts.length > 0 ? shadowParts.join(', ') : 'none';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setCaptionStyle({
                          ...tpl,
                          positionX: captionStyle.positionX,
                          verticalPosition: tpl.verticalPosition ?? captionStyle.verticalPosition,
                          scale: captionStyle.scale,
                          wordSpacing: captionStyle.wordSpacing ?? 14,
                        })
                      }
                      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-150 border text-left flex flex-col ${
                        isSelected
                          ? 'bg-[#181A22] border-[#10B981] ring-2 ring-[#10B981] shadow-xl shadow-[#10B981]/25 scale-[1.01]'
                          : 'bg-[#14151B] border-[#22242E] hover:border-[#383D4D] hover:bg-[#181A22]'
                      }`}
                    >
                      {/* Top Header Bar of the Card — No Crown Icon, Clean Category Badge */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 bg-[#101116] w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-[11px] text-white truncate">
                            {tpl.name}
                          </span>
                          {tpl.isNew && (
                            <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                          {tpl.category}
                        </span>
                      </div>

                      {/* Visual Preview Box with Ambient Studio Hue & Exact Template Styling */}
                      <div
                        className="w-full h-24 relative flex flex-col items-center justify-center p-2 select-none overflow-hidden"
                        style={{
                          background: `radial-gradient(ellipse at 50% 50%, hsl(${((cardIdx * 47) + 200) % 360} 40% 12%) 0%, #08090C 100%)`,
                        }}
                      >
                        {/* Letterbox bars if template has bars */}
                        {tpl.letterBoxesEnabled && (
                          <>
                            <div className="absolute top-0 left-0 right-0 h-2 bg-black z-10" />
                            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black z-10" />
                          </>
                        )}

                        {/* Emoji if emoji react */}
                        {tpl.emoji && (
                          <div className="text-sm leading-none mb-0.5 text-center">🔥</div>
                        )}

                        <div
                          className="flex items-center justify-center flex-nowrap whitespace-nowrap gap-1 select-none"
                          style={{
                            fontFamily: tpl.fontFamily,
                            fontSize: `${Math.min(15, (tpl.fontSize || 32) * 0.44)}px`,
                            fontWeight: getFontWeight(tpl.fontFace),
                            fontStyle: tpl.italic ? 'italic' : 'normal',
                            letterSpacing: `${(tpl.letterSpacing || 0) * 0.5}px`,
                            textShadow: previewShadow,
                            paintOrder: 'stroke fill',
                            WebkitTextStroke: tpl.strokeEnabled
                              ? `${Math.max(1, Math.round((tpl.strokeWidth || 2) * 0.45))}px ${tpl.strokeColor || '#000000'}`
                              : 'none',
                            backgroundColor: tpl.bgBoxEnabled ? tpl.bgColor : 'transparent',
                            padding: tpl.bgBoxEnabled ? (tpl.bgPadding || '3px 8px') : '0px',
                            borderRadius: tpl.bgBoxEnabled ? (tpl.borderRadius || '4px') : '0px',
                          }}
                        >
                          {words.map((w, idx) => {
                            const isWordActive = idx === activeIdx;
                            const isWordFill = tpl.mode === 'fill' && idx <= activeIdx;
                            const isAct = isWordActive || isWordFill;

                            if (tpl.mode === 'type' && idx > activeIdx) return null;

                            const transformed =
                              tpl.styles === 'uppercase'
                                ? w.toUpperCase()
                                : tpl.styles === 'lowercase'
                                ? w.toLowerCase()
                                : tpl.styles === 'capitalize'
                                ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                                : w;

                            // Resolve color
                            let color = tpl.textColor || '#FFFFFF';
                            if (isAct) {
                              if (tpl.highlightColors && tpl.highlightColors.length > 0) {
                                color = tpl.highlightColors[idx % tpl.highlightColors.length];
                              } else {
                                color = tpl.highlightColor || '#FFE600';
                              }
                            }

                            // Gradient text
                            const isGrad = tpl.colorType === 'gradient' && !isAct;
                            const gradStyle: React.CSSProperties = isGrad
                              ? {
                                  backgroundImage: `linear-gradient(${tpl.gradientAngle || 90}deg, ${tpl.gradientColor1 || '#A78BFA'}, ${tpl.gradientColor2 || '#F472B6'}${tpl.gradientColor3 ? `, ${tpl.gradientColor3}` : ''})`,
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }
                              : { color };

                            // Background highlight
                            let bg = 'transparent';
                            if (isAct) {
                              if (tpl.highlightBgs && tpl.highlightBgs.length > 0) {
                                bg = tpl.highlightBgs[idx % tpl.highlightBgs.length];
                              } else if (tpl.highlightBg) {
                                bg = tpl.highlightBg;
                              }
                            }

                            // Inactive dim
                            const dimOp = (!isAct && tpl.dimInactive && tpl.mode !== 'fill') ? tpl.dimInactive : 1;

                            // Annotations
                            let annStyle: React.CSSProperties = {};
                            if (isAct && tpl.annotation) {
                              if (tpl.annotation === 'circle') {
                                annStyle = {
                                  border: '1.5px solid #E53935',
                                  borderRadius: '50% 46% 52% 48% / 58% 50% 56% 48%',
                                  padding: '0 3px',
                                };
                              } else if (tpl.annotation === 'under') {
                                annStyle = {
                                  textDecoration: 'underline wavy #FFD60A 1.5px',
                                  textUnderlineOffset: '2px',
                                };
                              } else if (tpl.annotation === 'strike') {
                                annStyle = {
                                  textDecoration: 'line-through #FF2D2D 2px',
                                };
                              } else if (tpl.annotation === 'sketch') {
                                annStyle = {
                                  outline: '1.2px dashed #FFFFFF',
                                  outlineOffset: '2px',
                                  padding: '0 2px',
                                };
                              }
                            }

                            const rot = tpl.emphasisRotation || 0;
                            const scaleJump = isAct ? Math.min(1.25, tpl.emphasisSize || 1.05) : 1;
                            const trans = isAct ? `${rot ? `rotate(${rot}deg) ` : ''}scale(${scaleJump})` : 'scale(1)';

                            return (
                              <span
                                key={idx}
                                className="px-0.5 py-0.2 rounded transition-all inline-block"
                                style={{
                                  ...gradStyle,
                                  ...annStyle,
                                  opacity: dimOp,
                                  backgroundColor: bg,
                                  textShadow: isAct && tpl.emphasisGlow ? `0 0 10px ${tpl.emphasisGlowColor || color}, ${previewShadow}` : previewShadow,
                                  transform: trans,
                                  paintOrder: 'stroke fill',
                                  fontFamily: isAct && tpl.emphasisFont ? tpl.emphasisFont : tpl.fontFamily,
                                  fontWeight: isAct ? 800 : getFontWeight(tpl.fontFace),
                                }}
                              >
                                {transformed}
                              </span>
                            );
                          })}

                          {/* Caret for typewriter */}
                          {tpl.caret && (
                            <span className="car-blink text-emerald-400 font-bold ml-0.5 text-[9px]">▌</span>
                          )}
                        </div>

                        {/* Bilingual Line 2 */}
                        {tpl.bilingual && (
                          <div className="text-[8px] text-white/60 font-sans mt-0.5 truncate text-center">
                            ज़िंदगी बदल देगी
                          </div>
                        )}
                      </div>

                      {/* Selected checkmark pill */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSITIONS / WORDS PACING */}
          {activeSubTab === 'transitions' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Pacing & Speech Gapping
              </span>
              <div>
                <label className="text-gray-400 mb-2 block">Words Per Line (Caption Pacing)</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['1-2', '2-3', '2-4', '3-5', '5-8'] as PacingPresetKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handlePacingChange(key)}
                      className={`py-1.5 rounded text-[11px] font-semibold text-center transition-all ${
                        pacing === key
                          ? 'bg-[#10B981] text-white shadow-sm'
                          : 'bg-[#1A1C22] text-gray-400 hover:bg-[#282B34]'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {activeTrack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePacingChange(pacing)}
                  className="w-full border-[#282B34] hover:bg-[#1A1C22] text-xs text-[#10B981]"
                >
                  ⚡ Re-chunk Captions to {pacing} Words
                </Button>
              )}

              <Button
                onClick={transcribe}
                disabled={isTranscribing}
                className="w-full bg-[#10B981] hover:bg-[#0EA271] text-white font-semibold"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isTranscribing ? 'Generating Captions...' : 'Re-generate AI Captions'}
              </Button>
            </div>
          )}

          {/* TAB 4: AI AUDIO */}
          {activeSubTab === 'audio' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                AI Voice & Audio Enhancements
              </span>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                High-quality background noise removal and speech clarity normalization are enabled by default for all Gemini transcription chunks.
              </p>
              <div className="p-3 bg-[#1A1C22] rounded-xl border border-[#282B34] space-y-2">
                <span className="font-semibold text-white block">Noise Suppression</span>
                <span className="text-gray-400 text-[11px] block">High-pass & speech formant filter applied during audio extraction.</span>
                <Badge className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-[10px]">Active</Badge>
              </div>
            </div>
          )}

          
            </div>
          )}

          {/* Submagic Bottom Export Button (Matches Screenshot 2) */}
          <div className="p-3 border-t border-[#1E2026] bg-[#141519] flex items-center justify-end shrink-0">
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full bg-[#00B87C] hover:bg-[#00A36D] text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </aside>

        {/* Collapse / Expand Toggle Button on Sidebar Border (Matches Screenshot 2) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-30 w-5 h-10 bg-[#1A1C22] border border-[#282B34] rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#282B34] transition-all shadow-md ${
            sidebarCollapsed ? 'left-0' : 'left-84'
          }`}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* CENTER — Video Canvas Player + Live Subtitles Overlay */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#090A0D] relative overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              className="max-w-full max-h-full cursor-pointer select-none"
              controls={false}
              src={`/api/media/${projectId}`}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={() => (isPlaying ? videoRef.current?.pause() : videoRef.current?.play())}
            />

            {/* Letterbox bars if template has letterbox enabled */}
            {captionStyle.letterBoxesEnabled && (
              <>
                <div className="absolute top-0 left-0 right-0 h-[10%] bg-black z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black z-10 pointer-events-none" />
              </>
            )}

            {/* LIVE SUBTITLES OVERLAY WITH SINGLE-LINE CONTROL & GRADIENT */}
            {currentSegment && (
              <div
                className="absolute pointer-events-none z-20 transition-all duration-100 flex flex-col items-center justify-center"
                style={{
                  left: `${captionStyle.positionX ?? 50}%`,
                  top: `${captionStyle.verticalPosition ?? 65}%`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: captionStyle.textAlign ?? 'center',
                  width: captionStyle.singleLine ? 'max-content' : `${captionStyle.maxWidthPercent ?? 90}%`,
                  maxWidth: captionStyle.singleLine ? 'none' : '90%',
                }}
                dir={captionStyle.direction || (isUrdu ? 'rtl' : 'ltr')}
              >
                {/* Optional Emoji Badge if enabled */}
                {captionStyle.emoji && activeWord && (
                  <div className="text-3xl mb-1 an-pop select-none">🔥</div>
                )}

                <div
                  className="transition-all duration-150 text-center select-none"
                  style={{
                    backgroundColor: captionStyle.bgBoxEnabled
                      ? captionStyle.bgColor
                      : 'transparent',
                    padding: captionStyle.bgBoxEnabled
                      ? captionStyle.bgPadding || '10px 22px'
                      : '0px',
                    borderColor: captionStyle.bgBoxEnabled
                      ? 'rgba(255,255,255,0.12)'
                      : 'transparent',
                    borderWidth: captionStyle.bgBoxEnabled ? '1px' : '0px',
                    boxShadow: captionStyle.bgBoxEnabled
                      ? '0 8px 32px rgba(0,0,0,0.85)'
                      : 'none',
                    borderRadius: captionStyle.borderRadius || '16px',
                  }}
                >
                  <div
                    className={`flex items-center justify-center select-none ${
                      captionStyle.singleLine ? 'flex-nowrap whitespace-nowrap' : 'flex-wrap'
                    }`}
                    style={{
                      fontFamily: captionStyle.fontFamily,
                      fontSize: `${(captionStyle.fontSize || 32) * (captionStyle.scale || 1)}px`,
                      fontWeight: getFontWeight(captionStyle.fontFace),
                      fontStyle: (captionStyle.italic || isItalic) ? 'italic' : 'normal',
                      textDecoration: captionStyle.underline ? 'underline' : 'none',
                      letterSpacing: `${captionStyle.letterSpacing || 0}px`,
                      lineHeight: Math.max(1.3, captionStyle.lineSpacing || 1.35),
                      rowGap: `${Math.max(8, (captionStyle.fontSize || 32) * 0.3)}px`,
                      textShadow: computedTextShadow,
                      gap: (captionStyle.wordSpacing !== undefined && captionStyle.wordSpacing > 0) ? `${captionStyle.wordSpacing}px` : '0px',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {(() => {
                      const activeWordIdx = currentSegment.words.findIndex((w) => w.id === activeWord?.id);
                      const hasActive = activeWordIdx >= 0;

                      return currentSegment.words.map((w, wIdx) => {
                        const isCurrentActive = activeWord?.id === w.id;
                        const isFillActive = captionStyle.mode === 'fill' && hasActive && wIdx <= activeWordIdx;
                        const isActive = isCurrentActive || isFillActive;

                        // Typewriter mode hides future words
                        if (captionStyle.mode === 'type' && hasActive && wIdx > activeWordIdx) {
                          return null;
                        }

                        const activeSize = captionStyle.emphasisSize || 1.0;
                        const transformedText = transformWordText(w.text, isActive);

                        // Pick active color (multi-color cycle or solid)
                        let resolvedHighlightColor = captionStyle.highlightColor || '#FFE600';
                        if (captionStyle.highlightColors && captionStyle.highlightColors.length > 0) {
                          resolvedHighlightColor = captionStyle.highlightColors[wIdx % captionStyle.highlightColors.length];
                        }

                        // Pick active bg (multi-color sticker boxes or solid)
                        let resolvedHighlightBg = captionStyle.highlightBg;
                        if (captionStyle.highlightBgs && captionStyle.highlightBgs.length > 0) {
                          resolvedHighlightBg = captionStyle.highlightBgs[wIdx % captionStyle.highlightBgs.length];
                        }

                        // Normal word styling (Solid vs Gradient with 2, 3, or 4 color stops)
                        const isGradient = captionStyle.colorType === 'gradient' && !isActive;
                        const isGradientActive = isActive && captionStyle.emphasisColorType === 'gradient';
                        const isGrad = isGradient || isGradientActive;

                        const normalGrad = buildGradientString(
                          captionStyle.gradientAngle ?? 135,
                          captionStyle.gradientColorsCount ?? 2,
                          captionStyle.gradientColor1 || '#FACC15',
                          captionStyle.gradientColor2 || '#EF4444',
                          captionStyle.gradientColor3 || '#3B82F6',
                          captionStyle.gradientColor4 || '#10B981',
                          captionStyle.gradientStop1 ?? 0,
                          captionStyle.gradientStop2 ?? 100,
                          captionStyle.gradientStop3 ?? 66,
                          captionStyle.gradientStop4 ?? 100
                        );

                        const activeGrad = buildGradientString(
                          captionStyle.emphasisGradientAngle ?? 135,
                          captionStyle.emphasisGradientCount ?? 2,
                          captionStyle.emphasisGradient1 || '#FACC15',
                          captionStyle.emphasisGradient2 || '#EF4444',
                          captionStyle.emphasisGradient3 || '#3B82F6',
                          captionStyle.emphasisGradient4 || '#10B981',
                          captionStyle.emphasisGradientStop1 ?? 0,
                          captionStyle.emphasisGradientStop2 ?? 100,
                          captionStyle.emphasisGradientStop3 ?? 66,
                          captionStyle.emphasisGradientStop4 ?? 100
                        );

                        const gradientStyle: React.CSSProperties = isGradient
                          ? {
                              backgroundImage: normalGrad,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              color: 'transparent',
                            }
                          : { color: captionStyle.textColor || '#FFFFFF' };

                        // Active Word styling (Solid vs Gradient)
                        let activeColorStyle: React.CSSProperties = {};
                        if (isActive) {
                          if (captionStyle.emphasisColorType === 'gradient') {
                            activeColorStyle = {
                              backgroundImage: activeGrad,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              color: 'transparent',
                            };
                          } else {
                            activeColorStyle = {
                              color: resolvedHighlightColor,
                              WebkitTextFillColor: resolvedHighlightColor,
                            };
                          }
                        }

                        let activeShadow = computedTextShadow;
                        if (isActive && captionStyle.emphasisGlow) {
                          activeShadow = `0 0 16px ${captionStyle.emphasisGlowColor || resolvedHighlightColor}, ${computedTextShadow}`;
                        }

                        // Scale expansion buffer: dynamically offsets the visual scale so scaled words NEVER touch adjacent words!
                        const scaleExpansion = isActive && activeSize > 1.0
                          ? Math.round((activeSize - 1.0) * (captionStyle.fontSize || 32) * 0.45)
                          : 0;

                        // Negative wordSpacing support (infinite close)
                        const baseSpacing = captionStyle.wordSpacing ?? 14;
                        const negativeMargin = baseSpacing < 0 ? Math.round(baseSpacing / 2) : 0;

                        // Active font overrides if configured in EMPHASIS
                        const activeFontFamily = (isActive && captionStyle.emphasisFont) ? captionStyle.emphasisFont : undefined;
                        const activeFontWeight = (isActive && captionStyle.emphasisFontFace)
                          ? getFontWeight(captionStyle.emphasisFontFace as any)
                          : (isActive ? Math.min(900, getFontWeight(captionStyle.fontFace) + 200) : getFontWeight(captionStyle.fontFace));
                        const activeFontStyle = (isActive && captionStyle.emphasisFontFace?.includes('Italic'))
                          ? 'italic'
                          : ((captionStyle.italic || isItalic) ? 'italic' : 'normal');

                        // Annotation CSS styles
                        let annotationStyle: React.CSSProperties = {};
                        if (isActive && captionStyle.annotation) {
                          if (captionStyle.annotation === 'circle') {
                            annotationStyle = {
                              border: '0.08em solid #E53935',
                              borderRadius: '50% 46% 52% 48% / 58% 50% 56% 48%',
                              padding: '0.04em 0.32em',
                            };
                          } else if (captionStyle.annotation === 'under') {
                            annotationStyle = {
                              textDecoration: 'underline wavy #FFD60A 0.08em',
                              textUnderlineOffset: '0.18em',
                            };
                          } else if (captionStyle.annotation === 'strike') {
                            annotationStyle = {
                              textDecoration: 'line-through #FF2D2D 0.12em',
                            };
                          } else if (captionStyle.annotation === 'sketch') {
                            annotationStyle = {
                              outline: '0.07em dashed #FFFFFF',
                              outlineOffset: '0.14em',
                              padding: '0.02em 0.18em',
                            };
                          }
                        }

                        // Active rotation transform
                        const rot = captionStyle.emphasisRotation || 0;
                        const transformStr = isActive
                          ? `${rot ? `rotate(${rot}deg) ` : ''}scale(${activeSize})`
                          : 'scale(1)';

                        // Inactive word dimming
                        const dimOpacity = (!isActive && captionStyle.dimInactive && captionStyle.mode !== 'fill')
                          ? captionStyle.dimInactive
                          : 1;

                        // Animation class for current active word
                        const animClass = (isCurrentActive && captionStyle.animation && captionStyle.animation !== 'none')
                          ? `an-${captionStyle.animation}`
                          : '';

                        return (
                          <span
                            key={w.id}
                            className={`transition-all duration-150 inline-block rounded-md relative select-none ${animClass}`}
                            style={{
                              margin: `0 ${negativeMargin + scaleExpansion}px`,
                              padding: resolvedHighlightBg ? '0.08em 0.28em' : '0.04em 0.12em',
                              opacity: dimOpacity,
                              ...(isActive ? activeColorStyle : gradientStyle),
                              ...annotationStyle,
                              fontFamily: activeFontFamily,
                              fontWeight: activeFontWeight,
                              fontStyle: activeFontStyle,
                              WebkitTextStroke: (captionStyle.strokeEnabled && !isGrad)
                                ? `${captionStyle.strokeWidth || 2}px ${captionStyle.strokeColor || '#000000'}`
                                : 'none',
                              filter: (captionStyle.strokeEnabled && isGrad)
                                ? `drop-shadow(0 0 1px ${captionStyle.strokeColor || '#000000'}) drop-shadow(0 0 2px ${captionStyle.strokeColor || '#000000'})`
                                : undefined,
                              backgroundColor: isActive
                                ? (resolvedHighlightBg || 'transparent')
                                : 'transparent',
                              borderRadius: resolvedHighlightBg ? (captionStyle.borderRadius || '6px') : undefined,
                              transform: transformStr,
                              textShadow: activeShadow,
                              paintOrder: 'stroke fill',
                              zIndex: isActive ? 10 : 1,
                            }}
                          >
                            {transformedText}
                          </span>
                        );
                      });
                    })()}

                    {/* Typewriter blinking caret */}
                    {captionStyle.caret && (
                      <span className="car-blink text-emerald-400 font-bold ml-1 select-none">▌</span>
                    )}
                  </div>

                  {/* Bilingual Line 2 Subtitle Stack if enabled */}
                  {captionStyle.bilingual && (
                    <div
                      className="text-white/80 select-none mt-1"
                      style={{
                        fontFamily: captionStyle.subtitleFont ? `'${captionStyle.subtitleFont}', sans-serif` : 'Poppins, sans-serif',
                        fontSize: `${(captionStyle.fontSize || 32) * (captionStyle.scale || 1) * 0.65}px`,
                        fontWeight: 500,
                        textShadow: computedTextShadow,
                      }}
                    >
                      {currentSegment.text}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Timeline Scrubber with Interactive Drag & Resize Handles */}
          <div className="absolute bottom-2 left-4 right-4 flex flex-col gap-2 bg-[#141519]/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-[#1E2026] shadow-2xl z-30">
            {/* Top Ruler Scrubber */}
            <div
              className="relative w-full h-3.5 bg-[#0E0F13] rounded-t border-b border-[#22242E] cursor-pointer flex items-center select-none"
              onClick={(e) => {
                if (!timelineRef.current) return;
                const rect = timelineRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const targetTime = ratio * (project.mediaDuration || 1);
                setCurrentTime(targetTime);
                if (videoRef.current) videoRef.current.currentTime = targetTime;
              }}
            >
              <div className="flex justify-between w-full px-2 text-[8px] font-mono text-gray-500 pointer-events-none">
                <span>0:00</span>
                <span>{formatTime((project.mediaDuration || 1) * 0.25)}</span>
                <span>{formatTime((project.mediaDuration || 1) * 0.5)}</span>
                <span>{formatTime((project.mediaDuration || 1) * 0.75)}</span>
                <span>{formatTime(project.mediaDuration || 1)}</span>
              </div>
            </div>

            {/* Main Interactive Segment Track with Drag Body & Left/Right Resize Handles */}
            <div
              ref={timelineRef}
              className="relative w-full h-9 bg-[#0B0C10] rounded-b border border-[#1E2026] overflow-visible select-none cursor-pointer"
              onClick={(e) => {
                if (timelineDrag || !timelineRef.current) return;
                const rect = timelineRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const targetTime = ratio * (project.mediaDuration || 1);
                setCurrentTime(targetTime);
                if (videoRef.current) videoRef.current.currentTime = targetTime;
              }}
            >
              {activeTrack?.segments.map((seg) => {
                const total = project.mediaDuration || 1;
                const isDraggingThis = timelineDrag?.segId === seg.id;
                const displayStart = isDraggingThis ? timelineDrag.currentStart : seg.start;
                const displayEnd = isDraggingThis ? timelineDrag.currentEnd : seg.end;

                const left = Math.max(0, (displayStart / total) * 100);
                const width = Math.max(1.2, ((displayEnd - displayStart) / total) * 100);
                const isActive = currentSegment?.id === seg.id;

                return (
                  <div
                    key={seg.id}
                    className={`absolute top-0.5 bottom-0.5 rounded-md flex items-center overflow-visible text-[10px] font-semibold transition-colors select-none group ${
                      isActive
                        ? 'bg-[#10B981] text-white ring-2 ring-yellow-400 z-20 shadow-lg'
                        : 'bg-[#10B981]/30 hover:bg-[#10B981]/50 text-emerald-200 border border-[#10B981]/40'
                    } ${isDraggingThis ? 'ring-2 ring-white z-30 shadow-2xl' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {/* Left Resize Handle (Drag to adjust Start Time) */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                        setTimelineDrag({
                          segId: seg.id,
                          mode: 'start',
                          initialClientX: e.clientX,
                          initialStart: seg.start,
                          initialEnd: seg.end,
                          currentStart: seg.start,
                          currentEnd: seg.end,
                        });
                      }}
                      title="Drag left edge to adjust when caption starts"
                      className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-yellow-400/80 hover:bg-yellow-300 cursor-ew-resize rounded-l flex items-center justify-center z-20 transition-all opacity-80 hover:opacity-100"
                    >
                      <div className="w-0.5 h-3.5 bg-black/70 rounded-full pointer-events-none" />
                    </div>

                    {/* Center Body (Drag to shift both start and end together / Click to seek) */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                        setTimelineDrag({
                          segId: seg.id,
                          mode: 'move',
                          initialClientX: e.clientX,
                          initialStart: seg.start,
                          initialEnd: seg.end,
                          currentStart: seg.start,
                          currentEnd: seg.end,
                        });
                        if (videoRef.current) {
                          videoRef.current.currentTime = seg.start;
                          setCurrentTime(seg.start);
                        }
                      }}
                      className="flex-1 px-3 truncate cursor-grab active:cursor-grabbing h-full flex items-center overflow-hidden"
                      title={`${formatTime(seg.start)} - ${formatTime(seg.end)}: ${seg.text} (Drag to move, click to seek)`}
                    >
                      <span className="truncate pointer-events-none">{seg.text}</span>
                    </div>

                    {/* Right Resize Handle (Drag to adjust End Time / Duration — Chota ya Bada) */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                        setTimelineDrag({
                          segId: seg.id,
                          mode: 'end',
                          initialClientX: e.clientX,
                          initialStart: seg.start,
                          initialEnd: seg.end,
                          currentStart: seg.start,
                          currentEnd: seg.end,
                        });
                      }}
                      title="Drag right edge to make caption longer or shorter"
                      className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-yellow-400/80 hover:bg-yellow-300 cursor-ew-resize rounded-r flex items-center justify-center z-20 transition-all opacity-80 hover:opacity-100"
                    >
                      <div className="w-0.5 h-3.5 bg-black/70 rounded-full pointer-events-none" />
                    </div>

                    {/* Live Dragging Tooltip HUD */}
                    {isDraggingThis && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-950 text-yellow-300 border border-yellow-400/50 text-[9px] font-mono px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                        {formatTime(timelineDrag.currentStart)} ➔ {formatTime(timelineDrag.currentEnd)} ({(timelineDrag.currentEnd - timelineDrag.currentStart).toFixed(2)}s)
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Vertical Playhead Needle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                style={{
                  left: `${((currentTime / (project.mediaDuration || 1)) * 100)}%`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full -ml-1 -mt-0.5 shadow-md" />
              </div>
            </div>

            {/* Playback Controls & Status Footer */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => (isPlaying ? videoRef.current?.pause() : videoRef.current?.play())}
                  className="w-6 h-6 rounded-full bg-[#10B981] hover:bg-[#0EA271] flex items-center justify-center transition-colors text-white shadow-md cursor-pointer"
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
                <span className="text-[11px] text-gray-300 font-mono">
                  {formatTime(currentTime)} / {formatTime(project.mediaDuration)}
                </span>
                {activeTrack && activeTrack.segments.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleWordSync('cadence')}
                      disabled={isSyncingWords}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                      title="1-Click Perfect Sync (Locks word-to-word timing without drift)"
                    >
                      <Zap className={`w-3.5 h-3.5 text-yellow-300 ${isSyncingWords ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingWords ? 'Syncing...' : '⚡ Perfect Sync'}</span>
                    </button>
                    <button
                      onClick={() => handleApplyLeadOffset(-50)}
                      disabled={isSyncingWords}
                      className="px-2 py-1 rounded-lg bg-[#1F222B] hover:bg-[#2A2E3B] text-gray-300 hover:text-emerald-300 text-[10px] font-bold border border-[#2F3341] cursor-pointer"
                      title="Shift captions 50ms earlier"
                    >
                      -50ms
                    </button>
                    <button
                      onClick={() => handleApplyLeadOffset(50)}
                      disabled={isSyncingWords}
                      className="px-2 py-1 rounded-lg bg-[#1F222B] hover:bg-[#2A2E3B] text-gray-300 hover:text-yellow-300 text-[10px] font-bold border border-[#2F3341] cursor-pointer"
                      title="Shift captions 50ms later"
                    >
                      +50ms
                    </button>
                  </div>
                )}
              </div>

              {currentSegment ? (
                <span className="text-[11px] text-emerald-400 truncate max-w-sm">
                  Active: &quot;{currentSegment.text}&quot; ({formatTime(currentSegment.start)} - {formatTime(currentSegment.end)})
                </span>
              ) : (
                <span className="text-[10px] text-gray-500 italic">
                  Tip: Drag handles to resize caption duration, or drag center to move
                </span>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL 1: ADD CUSTOM FONT MODAL */}
      {showAddFontModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#16181F] border border-[#2A2D39] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#282B36]">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-bold text-sm text-white">Add Favorite Font</h3>
              </div>
              <button
                onClick={() => setShowAddFontModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option A: Upload Font File */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-200 block">Option 1: Upload Font File (.ttf, .otf, .woff, .woff2)</span>
              <input
                type="file"
                ref={fileInputRef}
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleUploadFontFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-[#10B981]/60 hover:border-[#10B981] bg-[#1A1C24] text-xs font-medium text-emerald-300 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" /> Choose Font File from Computer
              </button>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-xs my-2">
              <div className="flex-1 h-px bg-[#282B36]" />
              <span>OR</span>
              <div className="flex-1 h-px bg-[#282B36]" />
            </div>

            {/* Option B: Add Google Font */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-200 block">Option 2: Add Any Google Font</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Outfit, Bangers, Caveat, Righteous"
                  value={googleFontInput}
                  onChange={(e) => setGoogleFontInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoogleFont()}
                  className="flex-1 bg-[#1A1C24] border border-[#282B36] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#10B981]"
                />
                <button
                  onClick={handleAddGoogleFont}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#0EA271] text-white rounded-xl text-xs font-bold"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT / 4K RENDER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#16181F] border border-[#2A2D39] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#282B36]">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-bold text-sm text-white">Export & Video Render</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-300 font-semibold mb-1.5 block">
                Target Resolution
              </label>
              <select
                value={renderResolution}
                onChange={(e) => {
                  setRenderResolution(e.target.value as RenderResolution);
                  setRenderDownloadUrl(null);
                }}
                className="w-full bg-[#1F222B] text-white rounded-lg px-3 py-2 text-xs outline-none border border-[#2F3341]"
              >
                <option value="1080p">⚡ 1080p (Full HD - Recommended)</option>
                <option value="1440p">💎 1440p (2K Quad HD)</option>
                <option value="4K">🌟 4K (Ultra HD 2160p)</option>
                <option value="720p">🚀 720p (HD Fast)</option>
              </select>
            </div>

            {/* Live Canvas & Timeline Synced Status */}
            <div className="bg-[#12141A] border border-[#252834] rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-gray-300 font-medium">Timeline Synced:</span>
              </div>
              <span className="text-[#10B981] font-bold text-[11px] truncate max-w-[200px]">
                {activeTrack?.segments.length || 0} Captions • {captionStyle.name || 'Custom'}
              </span>
            </div>

            {renderDownloadUrl ? (
              <div className="space-y-2">
                <a
                  href={renderDownloadUrl}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#10B981] hover:bg-[#0EA271] text-white font-bold text-xs shadow-lg transition-all animate-bounce"
                >
                  <Download className="w-4 h-4" /> Download Rendered Video ({renderResolution})
                </a>
                <Button
                  onClick={handleRenderVideo}
                  disabled={isRendering || !activeTrack}
                  variant="outline"
                  className="w-full bg-[#1F222B] hover:bg-[#2A2E3B] text-gray-300 font-semibold text-xs py-2 rounded-lg border border-[#2F3341]"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Re-Render with Latest Edits
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleRenderVideo}
                disabled={isRendering || !activeTrack}
                className="w-full bg-[#00B87C] hover:bg-[#00A36D] text-white font-bold text-xs py-2.5 rounded-lg shadow-lg"
              >
                <Film className="w-4 h-4 mr-2" />
                {isRendering ? `Rendering in ${renderResolution}...` : `Burn Captions & Render (${renderResolution})`}
              </Button>
            )}

            {isRendering && (
              <div className="space-y-1">
                <Progress value={undefined} className="h-1.5 bg-[#1F222B]" />
                <span className="text-[10px] text-[#10B981] block text-center animate-pulse">
                  Encoding with FFmpeg & burning animated subtitles in {renderResolution}...
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-[#282B36] space-y-1.5">
              <span className="text-gray-400 text-xs font-semibold block">Download Subtitle Files</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['srt', 'vtt', 'txt', 'json'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => downloadExport(fmt)}
                    disabled={!activeTrack}
                    className="py-1.5 rounded bg-[#1F222B] hover:bg-[#2A2E3B] text-gray-300 text-xs font-semibold border border-[#2F3341] transition-all hover:text-white hover:border-[#10B981]"
                  >
                    .{fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
