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
    themeMode: 'material-you',
    accentColor: 'lavender',
    customAccentHex: '#C4B5FD',
    showFileExtension: true,
    compactPadding: false,
    enableGlassUI: true,
    glassIntensity: 'medium',
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
    equalizerEnabled: false,
    equalizerPreset: 'flat',
    equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preampGain: 0,
  },
  videoEffects: {
    enabled: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    gamma: 1.0,
    invert: false,
    sepia: false,
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

export const EQUALIZER_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQUALIZER_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [4.5, 3.5, 2.0, -1.0, -2.0, -0.5, 2.0, 4.0, 5.0, 5.5],
  pop: [-1.5, 1.0, 3.0, 3.5, 2.0, -1.0, -1.5, -1.0, 1.5, 2.0],
  classical: [4.5, 3.5, 3.0, 2.5, -1.5, -1.5, 0.0, 2.0, 3.0, 3.5],
  bass_boost: [7.0, 6.0, 5.0, 3.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  treble_boost: [0.0, 0.0, 0.0, 0.0, 0.0, 1.5, 3.5, 5.0, 6.5, 8.0],
  vocal: [-2.0, -3.0, -1.0, 2.5, 4.0, 4.0, 3.0, 1.0, -1.0, -2.0],
  techno: [5.0, 4.0, 2.0, 0.0, -2.0, 0.0, 2.0, 4.0, 5.0, 5.0],
  dance: [6.0, 5.0, 2.0, 0.0, 2.0, 3.0, 4.0, 3.5, 2.0, 0.0],
  live: [-3.0, 0.0, 2.5, 3.0, 3.5, 3.5, 2.0, 1.5, 1.5, 1.0],
  club: [0.0, 0.0, 2.0, 3.5, 3.5, 3.5, 2.0, 0.0, 0.0, 0.0],
  party: [4.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.0, 4.0],
  reggae: [0.0, 0.0, -1.0, -4.0, 0.0, 4.0, 4.0, 2.0, 0.0, 0.0],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export interface AccentPalette {
  primary: string;
  hover: string;
  ink: string;
  glow: string;
  surfaceTint: string;
  glassBg: string;
  glassBorder: string;
}

export const ACCENT_COLORS: Record<string, AccentPalette> = {
  lavender: {
    primary: '#C4B5FD',
    hover: '#D8CCFF',
    ink: '#241948',
    glow: 'rgba(196, 181, 253, 0.25)',
    surfaceTint: 'rgba(196, 181, 253, 0.08)',
    glassBg: 'rgba(29, 27, 39, 0.65)',
    glassBorder: 'rgba(196, 181, 253, 0.15)',
  },
  violet: {
    primary: '#A78BFA',
    hover: '#C4B5FD',
    ink: '#1E1B4B',
    glow: 'rgba(167, 139, 250, 0.25)',
    surfaceTint: 'rgba(167, 139, 250, 0.08)',
    glassBg: 'rgba(27, 25, 41, 0.65)',
    glassBorder: 'rgba(167, 139, 250, 0.15)',
  },
  emerald: {
    primary: '#6EE7B7',
    hover: '#A7F3D0',
    ink: '#064E3B',
    glow: 'rgba(110, 231, 183, 0.25)',
    surfaceTint: 'rgba(110, 231, 183, 0.08)',
    glassBg: 'rgba(20, 35, 30, 0.65)',
    glassBorder: 'rgba(110, 231, 183, 0.15)',
  },
  blue: {
    primary: '#93C5FD',
    hover: '#BFDBFE',
    ink: '#1E3A8A',
    glow: 'rgba(147, 197, 253, 0.25)',
    surfaceTint: 'rgba(147, 197, 253, 0.08)',
    glassBg: 'rgba(20, 28, 42, 0.65)',
    glassBorder: 'rgba(147, 197, 253, 0.15)',
  },
  amber: {
    primary: '#FCD34D',
    hover: '#FDE68A',
    ink: '#78350F',
    glow: 'rgba(252, 211, 77, 0.25)',
    surfaceTint: 'rgba(252, 211, 77, 0.08)',
    glassBg: 'rgba(38, 32, 20, 0.65)',
    glassBorder: 'rgba(252, 211, 77, 0.15)',
  },
  rose: {
    primary: '#FDA4AF',
    hover: '#FECDD3',
    ink: '#881337',
    glow: 'rgba(253, 164, 175, 0.25)',
    surfaceTint: 'rgba(253, 164, 175, 0.08)',
    glassBg: 'rgba(38, 22, 27, 0.65)',
    glassBorder: 'rgba(253, 164, 175, 0.15)',
  },
  coral: {
    primary: '#FB7185',
    hover: '#FDA4AF',
    ink: '#4C0519',
    glow: 'rgba(251, 113, 133, 0.25)',
    surfaceTint: 'rgba(251, 113, 133, 0.08)',
    glassBg: 'rgba(40, 20, 25, 0.65)',
    glassBorder: 'rgba(251, 113, 133, 0.15)',
  },
  cyan: {
    primary: '#67E8F9',
    hover: '#A5F3FC',
    ink: '#164E63',
    glow: 'rgba(103, 232, 249, 0.25)',
    surfaceTint: 'rgba(103, 232, 249, 0.08)',
    glassBg: 'rgba(18, 34, 40, 0.65)',
    glassBorder: 'rgba(103, 232, 249, 0.15)',
  },
  lime: {
    primary: '#A3E635',
    hover: '#BEF264',
    ink: '#365314',
    glow: 'rgba(163, 230, 53, 0.25)',
    surfaceTint: 'rgba(163, 230, 53, 0.08)',
    glassBg: 'rgba(28, 36, 18, 0.65)',
    glassBorder: 'rgba(163, 230, 53, 0.15)',
  },
};

/**
 * Dynamically computes a full themed palette from any arbitrary hex color code
 */
export function generateAccentPalette(hexInput: string): AccentPalette {
  let hex = (hexInput || '#C4B5FD').trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;

  // Validate format
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
    hex = '#C4B5FD';
  }

  // Expand short hex e.g. #abc -> #aabbcc
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Perceived relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const ink = luminance > 0.55 ? '#111016' : '#FFFFFF';

  // Lighter hover color
  const hoverR = Math.min(255, Math.round(r + (255 - r) * 0.25));
  const hoverG = Math.min(255, Math.round(g + (255 - g) * 0.25));
  const hoverB = Math.min(255, Math.round(b + (255 - b) * 0.25));
  const hover = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;

  const glow = `rgba(${r}, ${g}, ${b}, 0.25)`;
  const surfaceTint = `rgba(${r}, ${g}, ${b}, 0.08)`;
  const glassBg = `rgba(${Math.min(50, Math.round(r * 0.15 + 20))}, ${Math.min(50, Math.round(g * 0.15 + 20))}, ${Math.min(50, Math.round(b * 0.15 + 25))}, 0.65)`;
  const glassBorder = `rgba(${r}, ${g}, ${b}, 0.18)`;

  return {
    primary: hex,
    hover,
    ink,
    glow,
    surfaceTint,
    glassBg,
    glassBorder,
  };
}

export function getAccentPalette(accentColor: string, customHex?: string): AccentPalette {
  if (accentColor === 'custom' && customHex) {
    return generateAccentPalette(customHex);
  }
  if (ACCENT_COLORS[accentColor]) {
    return ACCENT_COLORS[accentColor];
  }
  if (customHex) {
    return generateAccentPalette(customHex);
  }
  return ACCENT_COLORS.lavender;
}

export interface MaterialYouSurfaces {
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
}

export function getMaterialYouSurfaces(accent: AccentPalette, isLight = false): MaterialYouSurfaces {
  let hex = accent.primary.replace('#', '').trim();
  if (hex.length === 3) hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  const r = parseInt(hex.slice(0, 2), 16) || 196;
  const g = parseInt(hex.slice(2, 4), 16) || 181;
  const b = parseInt(hex.slice(4, 6), 16) || 253;

  if (isLight) {
    return {
      background: `rgb(${Math.min(255, Math.round(246 + r * 0.03))}, ${Math.min(255, Math.round(246 + g * 0.03))}, ${Math.min(255, Math.round(248 + b * 0.03))})`,
      surface: `rgb(${Math.min(255, Math.round(238 + r * 0.05))}, ${Math.min(255, Math.round(238 + g * 0.05))}, ${Math.min(255, Math.round(242 + b * 0.05))})`,
      surfaceContainer: `rgb(${Math.min(255, Math.round(230 + r * 0.07))}, ${Math.min(255, Math.round(230 + g * 0.07))}, ${Math.min(255, Math.round(235 + b * 0.07))})`,
      surfaceBorder: `rgba(${r}, ${g}, ${b}, 0.20)`,
      textPrimary: '#1C1B1F',
      textSecondary: '#49454F',
    };
  }

  // Dark M3 dynamic surfaces heavily infused with the user's accent color
  return {
    background: `rgb(${Math.round(10 + r * 0.025)}, ${Math.round(10 + g * 0.025)}, ${Math.round(14 + b * 0.035)})`,
    surface: `rgb(${Math.round(17 + r * 0.045)}, ${Math.round(17 + g * 0.045)}, ${Math.round(23 + b * 0.055)})`,
    surfaceContainer: `rgb(${Math.round(23 + r * 0.07)}, ${Math.round(23 + g * 0.07)}, ${Math.round(31 + b * 0.08)})`,
    surfaceBorder: `rgba(${r}, ${g}, ${b}, 0.18)`,
    textPrimary: '#E6E1E5',
    textSecondary: '#CAC4D0',
  };
}
