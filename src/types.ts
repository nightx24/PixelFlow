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
}

export type ViewTab = 'folders' | 'videos';
export type ViewMode = 'Tree' | 'Folders' | 'Videos';
export type LayoutMode = 'List' | 'Grid';

export interface PlayerSettings {
  playbackSpeed: number;
  loop: boolean;
  autoPlayNext: boolean;
  volume: number;
  isMuted: boolean;
  doubleTapSeekSeconds: number;
  fitMode: 'fit' | 'contain' | 'cover';
  audioBoost: boolean;
}

export interface QuickSettingsState {
  viewMode: ViewMode;
  layoutMode: LayoutMode;
}
