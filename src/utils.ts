import { PixelFlowSettings, SubtitleCue } from './types.ts';

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function parseSRT(srtContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Time line is usually the 2nd line, or 1st if index missing
    const timeLineIndex = lines[0].includes('-->') ? 0 : 1;
    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.join('\n').replace(/<[^>]*>/g, ''); // strip HTML tags if any

    if (!isNaN(startTime) && !isNaN(endTime)) {
      cues.push({ startTime, endTime, text });
    }
  }

  return cues;
}

function parseTimestamp(timestamp: string): number {
  if (!timestamp) return 0;
  // formats: 00:01:23,456 or 00:01:23.456
  const parts = timestamp.split(':');
  if (parts.length < 3) return 0;

  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const secondsParts = parts[2].replace(',', '.');
  const seconds = parseFloat(secondsParts);

  return hours * 3600 + minutes * 60 + seconds;
}

export function generateVideoThumbnail(file: File): Promise<{ thumbnailUrl: string; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.0, video.duration / 4 || 0.5);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve({ thumbnailUrl, durationMs: (video.duration || 0) * 1000 });
        } else {
          resolve({ thumbnailUrl: '', durationMs: (video.duration || 0) * 1000 });
        }
      } catch {
        resolve({ thumbnailUrl: '', durationMs: (video.duration || 0) * 1000 });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
  });
}

export const DEFAULT_PIXELFLOW_SETTINGS: PixelFlowSettings = {
  appearance: {
    themeMode: 'dark',
    accentColor: 'lavender',
    showFileExtension: true,
    compactPadding: false,
  },
  library: {
    viewMode: 'Folders',
    layoutMode: 'List',
    sortField: 'dateAdded',
    sortOrder: 'desc',
    excludeShortVideos: false,
    shortVideoThresholdSec: 10,
    showDurationBadge: true,
    showSizeBadge: true,
    rememberFolder: true,
  },
  player: {
    resumePlayback: true,
    autoPlayNext: true,
    loopMode: 'off',
    fitMode: 'contain',
    defaultPlaybackSpeed: 1.0,
    controllerTimeoutSec: 3,
    doubleTapSeekSeconds: 10,
    backgroundAudio: true,
    enablePiP: true,
    rememberBrightness: true,
  },
  gestures: {
    enableVerticalBrightness: true,
    enableVerticalVolume: true,
    enableHorizontalSeek: true,
    enableDoubleTapSeek: true,
    enableLongPressFastForward: true,
    fastForwardSpeed: 2.0,
  },
  audio: {
    volumeBoost: false,
    nightModeSpeechClarity: false,
    audioDelayMs: 0,
    muteOnStart: false,
  },
  subtitles: {
    enabled: true,
    fontSize: 'medium',
    textColor: 'white',
    backgroundColor: 'semi-black',
    textShadow: 'outline',
    syncOffsetMs: 0,
  },
  history: {
    trackHistory: true,
    maxHistoryItems: 50,
  },
};

export const ACCENT_COLORS = {
  lavender: {
    primary: '#C4B5FD',
    hover: '#D8CCFF',
    ink: '#241948',
    glow: 'rgba(196, 181, 253, 0.25)',
  },
  violet: {
    primary: '#A78BFA',
    hover: '#C4B5FD',
    ink: '#1E1B4B',
    glow: 'rgba(167, 139, 250, 0.25)',
  },
  emerald: {
    primary: '#6EE7B7',
    hover: '#A7F3D0',
    ink: '#064E3B',
    glow: 'rgba(110, 231, 183, 0.25)',
  },
  blue: {
    primary: '#93C5FD',
    hover: '#BFDBFE',
    ink: '#1E3A8A',
    glow: 'rgba(147, 197, 253, 0.25)',
  },
  amber: {
    primary: '#FCD34D',
    hover: '#FDE68A',
    ink: '#78350F',
    glow: 'rgba(252, 211, 77, 0.25)',
  },
  rose: {
    primary: '#FDA4AF',
    hover: '#FECDD3',
    ink: '#881337',
    glow: 'rgba(253, 164, 175, 0.25)',
  },
};
