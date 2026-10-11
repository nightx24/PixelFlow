export interface VideoEntry {
  id: string;
  name: string;
  url: string;
  durationMs: number;
  sizeBytes: number;
  folder: string;
  thumbnailUrl?: string;
  dateAdded?: number;
  lastPositionMs?: number;
  isCustom?: boolean;
  subtitles?: SubtitleTrack[];
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src?: string;
  cues?: SubtitleCue[];
}

export interface SubtitleCue {
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface WatchHistoryItem {
  videoId: string;
  videoName: string;
  folder: string;
  lastWatchedTimestamp: number;
  positionSeconds: number;
  durationSeconds: number;
  thumbnailUrl?: string;
}

export type ViewTab = 'folders' | 'videos';
export type ViewMode = 'Tree' | 'Folders' | 'Videos';
export type LayoutMode = 'List' | 'Grid';

export type SortField = 'name' | 'dateAdded' | 'duration' | 'size';
export type SortOrder = 'asc' | 'desc';

export type ThemeMode = 'dark' | 'material-you' | 'amoled' | 'light';
export type AccentColor = 'lavender' | 'violet' | 'emerald' | 'blue' | 'amber' | 'rose' | 'coral' | 'cyan' | 'lime' | 'custom';

export interface PixelFlowSettings {
  // Appearance
  appearance: {
    themeMode: ThemeMode;
    accentColor: AccentColor;
    customAccentHex?: string;
    showFileExtension: boolean;
    compactPadding: boolean;
    enableGlassUI: boolean;
    glassIntensity: 'subtle' | 'medium' | 'deep';
  };

  // Media Library
  library: {
    viewMode: ViewMode;
    layoutMode: LayoutMode;
    sortField: SortField;
    sortOrder: SortOrder;
    excludeShortVideos: boolean;
    shortVideoThresholdSec: number;
    showDurationBadge: boolean;
    showSizeBadge: boolean;
    rememberFolder: boolean;
  };

  // Player
  player: {
    resumePlayback: boolean;
    autoPlayNext: boolean;
    loopMode: 'off' | 'one' | 'all';
    fitMode: 'fit' | 'contain' | 'cover' | 'stretch' | '16:9' | '4:3';
    defaultPlaybackSpeed: number;
    controllerTimeoutSec: number;
    doubleTapSeekSeconds: number;
    backgroundAudio: boolean;
    enablePiP: boolean;
    rememberBrightness: boolean;
  };

  // Gestures
  gestures: {
    enableVerticalBrightness: boolean;
    enableVerticalVolume: boolean;
    enableHorizontalSeek: boolean;
    enableDoubleTapSeek: boolean;
    enableLongPressFastForward: boolean;
    fastForwardSpeed: number; // e.g. 2.0x
  };

  // Audio & VLC Equalizer
  audio: {
    volumeBoost: boolean; // Up to 200%
    nightModeSpeechClarity: boolean; // DynamicsCompressor
    audioDelayMs: number;
    muteOnStart: boolean;
    equalizerEnabled: boolean;
    equalizerPreset: EqualizerPreset;
    equalizerGains: number[]; // 10 bands
    preampGain: number; // in dB
  };

  // VLC Video Effects (Post-processing)
  videoEffects: {
    enabled: boolean;
    brightness: number; // 50 to 200% (default 100)
    contrast: number; // 50 to 200% (default 100)
    saturation: number; // 0 to 300% (default 100)
    hueRotate: number; // -180 to 180 deg (default 0)
    gamma: number; // 0.5 to 2.0 (default 1.0)
    invert: boolean;
    sepia: boolean;
  };

  // Subtitles
  subtitles: {
    enabled: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    textColor: 'white' | 'yellow' | 'cyan' | 'green';
    backgroundColor: 'transparent' | 'semi-black' | 'black';
    textShadow: 'none' | 'outline' | 'shadow';
    syncOffsetMs: number;
  };

  // History
  history: {
    trackHistory: boolean;
    maxHistoryItems: number;
  };
}

export type EqualizerPreset = 
  | 'flat' 
  | 'rock' 
  | 'pop' 
  | 'classical' 
  | 'techno' 
  | 'dance' 
  | 'bass_boost' 
  | 'treble_boost' 
  | 'vocal' 
  | 'club' 
  | 'live' 
  | 'party' 
  | 'reggae' 
  | 'custom';

export interface ABRepeat {
  pointA: number | null; // seconds
  pointB: number | null; // seconds
  enabled: boolean;
}

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      getPlatform: () => Promise<string>;
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      onOpenVideo: (callback: (data: { filePath: string; fileName: string }) => void) => () => void;
    };
  }
}
