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

export type ThemeMode = 'dark' | 'amoled' | 'light';
export type AccentColor = 'lavender' | 'violet' | 'emerald' | 'blue' | 'amber' | 'rose';

export interface PixelFlowSettings {
  // Appearance
  appearance: {
    themeMode: ThemeMode;
    accentColor: AccentColor;
    showFileExtension: boolean;
    compactPadding: boolean;
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

  // Audio
  audio: {
    volumeBoost: boolean; // Up to 200%
    nightModeSpeechClarity: boolean; // DynamicsCompressor
    audioDelayMs: number;
    muteOnStart: boolean;
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
