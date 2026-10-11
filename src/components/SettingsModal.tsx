import React, { useState } from 'react';
import { 
  Palette, 
  Film, 
  PlayCircle, 
  Hand, 
  Volume2, 
  Subtitles, 
  History, 
  Network, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  RefreshCw,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';
import { PixelFlowSettings, ThemeMode, AccentColor, SortField, SortOrder } from '../types.ts';
import { ACCENT_COLORS } from '../utils.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PixelFlowSettings;
  onUpdateSettings: (updater: (prev: PixelFlowSettings) => PixelFlowSettings) => void;
  onScanLibrary: () => void;
  onClearHistory: () => void;
  totalVideosCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onScanLibrary,
  onClearHistory,
  totalVideosCount,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAccent = ACCENT_COLORS[settings.appearance.accentColor] || ACCENT_COLORS.lavender;

  const sections = [
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Theme, accent palette, display density',
      icon: Palette,
      render: () => (
        <div className="space-y-5">
          {/* Theme Mode */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-2 font-medium">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'amoled', 'light'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, themeMode: mode },
                    }))
                  }
                  className={`py-2 px-3 rounded-2xl text-xs font-medium capitalize transition ${
                    settings.appearance.themeMode === mode
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {mode === 'amoled' ? 'Pure AMOLED' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-2 font-medium">
              Accent Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((colorKey) => {
                const color = ACCENT_COLORS[colorKey];
                const isSelected = settings.appearance.accentColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, accentColor: colorKey },
                      }))
                    }
                    className={`py-2.5 px-3 rounded-2xl text-xs font-medium capitalize flex items-center space-x-2 transition ${
                      isSelected
                        ? 'bg-[#26272D] border-2 border-white/60 text-[#F5F4FA]'
                        : 'bg-[#26272D] hover:bg-[#32333B] text-[#A6A6B2]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color.primary }}
                    />
                    <span>{colorKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Show File Extensions</span>
                <span className="text-xs text-[#A6A6B2]">e.g. .mp4, .mkv in library list</span>
              </div>
              <input
                type="checkbox"
                checked={settings.appearance.showFileExtension}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, showFileExtension: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Compact Padding</span>
                <span className="text-xs text-[#A6A6B2]">Denser list and grid spacing</span>
              </div>
              <input
                type="checkbox"
                checked={settings.appearance.compactPadding}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, compactPadding: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'library',
      title: 'Media Library',
      subtitle: 'Sorting, badges, scanning, and filters',
      icon: Film,
      render: () => (
        <div className="space-y-4">
          {/* Sorting */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Sort Media By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'dateAdded', label: 'Date Added' },
                  { id: 'name', label: 'Title / Name' },
                  { id: 'duration', label: 'Duration' },
                  { id: 'size', label: 'File Size' },
                ] as { id: SortField; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      library: { ...prev.library, sortField: opt.id },
                    }))
                  }
                  className={`py-2 px-3 rounded-2xl text-xs font-medium transition ${
                    settings.library.sortField === opt.id
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Sort Order
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'asc', label: 'Ascending (A-Z / Oldest)' },
                  { id: 'desc', label: 'Descending (Z-A / Newest)' },
                ] as { id: SortOrder; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      library: { ...prev.library, sortOrder: opt.id },
                    }))
                  }
                  className={`py-2 px-3 rounded-2xl text-xs font-medium transition ${
                    settings.library.sortOrder === opt.id
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Duration Badge</span>
                <span className="text-xs text-[#A6A6B2]">Show duration overlay on thumbnails</span>
              </div>
              <input
                type="checkbox"
                checked={settings.library.showDurationBadge}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, showDurationBadge: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Exclude Short Videos</span>
                <span className="text-xs text-[#A6A6B2]">Hide clips under 10 seconds</span>
              </div>
              <input
                type="checkbox"
                checked={settings.library.excludeShortVideos}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, excludeShortVideos: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Rescan library button */}
          <button
            type="button"
            onClick={onScanLibrary}
            className="w-full py-3 px-4 rounded-2xl bg-[#26272D] hover:bg-[#32333B] text-[#F5F4FA] text-xs font-semibold flex items-center justify-center space-x-2 transition mt-2"
          >
            <RefreshCw className="w-4 h-4 text-[#C4B5FD]" />
            <span>Rescan and Reload Sample Media</span>
          </button>
        </div>
      ),
    },
    {
      id: 'player',
      title: 'Player',
      subtitle: 'Resume playback, loop, aspect ratio, seek intervals',
      icon: PlayCircle,
      render: () => (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Resume Playback Position</span>
              <span className="text-xs text-[#A6A6B2]">Remember last played timestamp for all videos</span>
            </div>
            <input
              type="checkbox"
              checked={settings.player.resumePlayback}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, resumePlayback: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Auto-play Next Video</span>
              <span className="text-xs text-[#A6A6B2]">Continuously play next video in the folder</span>
            </div>
            <input
              type="checkbox"
              checked={settings.player.autoPlayNext}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, autoPlayNext: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Double-Tap Seek Interval
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      player: { ...prev.player, doubleTapSeekSeconds: sec },
                    }))
                  }
                  className={`py-2 px-2.5 rounded-2xl text-xs font-medium transition ${
                    settings.player.doubleTapSeekSeconds === sec
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  ±{sec}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Controller Auto-Hide Timeout
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 5, 10].map((sec) => (
                <button
                  key={sec}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      player: { ...prev.player, controllerTimeoutSec: sec },
                    }))
                  }
                  className={`py-2 px-2.5 rounded-2xl text-xs font-medium transition ${
                    settings.player.controllerTimeoutSec === sec
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'gestures',
      title: 'Gestures',
      subtitle: 'Swipe for brightness, volume, horizontal seek, 2x hold',
      icon: Hand,
      render: () => (
        <div className="space-y-4">
          <p className="text-xs text-[#A6A6B2] bg-[#26272D] p-3 rounded-2xl leading-relaxed">
            PixelFlow features intuitive on-screen touch and mouse gestures with real-time HUD meters for rapid control.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Vertical Swipe: Brightness</span>
                <span className="text-xs text-[#A6A6B2]">Drag left half of screen to adjust screen light</span>
              </div>
              <input
                type="checkbox"
                checked={settings.gestures.enableVerticalBrightness}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableVerticalBrightness: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Vertical Swipe: Volume</span>
                <span className="text-xs text-[#A6A6B2]">Drag right half of screen to adjust volume</span>
              </div>
              <input
                type="checkbox"
                checked={settings.gestures.enableVerticalVolume}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableVerticalVolume: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Horizontal Swipe: Scrub Seek</span>
                <span className="text-xs text-[#A6A6B2]">Drag horizontally to scrub through timeline</span>
              </div>
              <input
                type="checkbox"
                checked={settings.gestures.enableHorizontalSeek}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableHorizontalSeek: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Double-Tap to Seek</span>
                <span className="text-xs text-[#A6A6B2]">Tap left or right edge twice to skip seconds</span>
              </div>
              <input
                type="checkbox"
                checked={settings.gestures.enableDoubleTapSeek}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableDoubleTapSeek: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Long Press: 2x Fast-Forward</span>
                <span className="text-xs text-[#A6A6B2]">Hold down anywhere to temporarily accelerate</span>
              </div>
              <input
                type="checkbox"
                checked={settings.gestures.enableLongPressFastForward}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableLongPressFastForward: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'audio',
      title: 'Audio',
      subtitle: 'Volume boost up to 200%, Night mode speech clarity',
      icon: Volume2,
      render: () => (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Volume Boost (200%)</span>
              <span className="text-xs text-[#A6A6B2]">Amplifies quiet media tracks beyond normal max</span>
            </div>
            <input
              type="checkbox"
              checked={settings.audio.volumeBoost}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, volumeBoost: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Night Mode (Speech Clarity)</span>
              <span className="text-xs text-[#A6A6B2]">Compresses explosions while boosting spoken dialogues</span>
            </div>
            <input
              type="checkbox"
              checked={settings.audio.nightModeSpeechClarity}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, nightModeSpeechClarity: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Mute on Start</span>
              <span className="text-xs text-[#A6A6B2]">Always start new videos with sound muted</span>
            </div>
            <input
              type="checkbox"
              checked={settings.audio.muteOnStart}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, muteOnStart: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'subtitles',
      title: 'Subtitles',
      subtitle: 'Font size, color, background, outline, sync offset',
      icon: Subtitles,
      render: () => (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Enable Subtitles</span>
              <span className="text-xs text-[#A6A6B2]">Show subtitles automatically when available</span>
            </div>
            <input
              type="checkbox"
              checked={settings.subtitles.enabled}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  subtitles: { ...prev.subtitles, enabled: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      subtitles: { ...prev.subtitles, fontSize: sz },
                    }))
                  }
                  className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                    settings.subtitles.fontSize === sz
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Text Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['white', 'yellow', 'cyan', 'green'] as const).map((col) => (
                <button
                  key={col}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      subtitles: { ...prev.subtitles, textColor: col },
                    }))
                  }
                  className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                    settings.subtitles.textColor === col
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Background Box
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['transparent', 'semi-black', 'black'] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      subtitles: { ...prev.subtitles, backgroundColor: bg },
                    }))
                  }
                  className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                    settings.subtitles.backgroundColor === bg
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'history',
      title: 'Watch History',
      subtitle: 'Playback progress tracking and clearing',
      icon: History,
      render: () => (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D]">
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Track Watch History</span>
              <span className="text-xs text-[#A6A6B2]">Store watch progress and continue points</span>
            </div>
            <input
              type="checkbox"
              checked={settings.history.trackHistory}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  history: { ...prev.history, trackHistory: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            className="w-full py-3 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Watch History</span>
          </button>
        </div>
      ),
    },
    {
      id: 'network',
      title: 'Network & Streams',
      subtitle: 'HTTP/HTTPS stream URL bookmarks, storage',
      icon: Network,
      render: () => (
        <div className="space-y-4">
          <p className="text-xs text-[#A6A6B2] leading-relaxed">
            PixelFlow supports direct web video stream URLs (MP4, WebM, HLS streams) and local device documents.
          </p>

          <div className="p-3.5 rounded-2xl bg-[#26272D] space-y-2">
            <h4 className="text-sm font-semibold text-[#F5F4FA]">Network Storage Capabilities</h4>
            <p className="text-xs text-[#A6A6B2]">
              In addition to direct URLs, external network stream sources can be added to your library folders anytime using the + button.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'future',
      title: 'Future Features & About',
      subtitle: 'PixelFlow version, features, and roadmap',
      icon: Sparkles,
      render: () => (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#26272D] text-center">
            <h4 className="text-lg font-bold text-[#F5F4FA]">PixelFlow</h4>
            <p className="text-xs text-[#C4B5FD] mt-0.5 font-medium">Version 0.1.1</p>
            <p className="text-xs text-[#A6A6B2] mt-2 leading-relaxed">
              A modern, minimal video player and media space with gesture controls, audio boost, and advanced library browsing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#26272D] space-y-2.5">
            <h5 className="text-xs uppercase tracking-wider text-[#A6A6B2] font-semibold">
              Planned Features & Roadmap
            </h5>
            <ul className="text-xs text-[#A6A6B2] space-y-2">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Swipe gestures (brightness, volume, scrub seek)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Web Audio volume boost (200%) & speech clarity</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom SRT subtitle file loader & full styling</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Watch history & continue watching row</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD] shrink-0" />
                <span>OpenSubtitles.org online subtitle search & download</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD] shrink-0" />
                <span>SMB / WebDAV / SFTP remote credentials connector</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26272D] shrink-0">
          {activeSection ? (
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center space-x-1.5 text-xs text-[#C4B5FD] hover:text-[#D8CCFF] font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Settings</span>
            </button>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-[#F5F4FA]">Settings</h2>
              <p className="text-[11px] text-[#A6A6B2]">Preferences & media controls</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#26272D] hover:bg-[#34363F] text-[#A6A6B2] hover:text-[#F5F4FA] transition"
          >
            Close
          </button>
        </div>

        {/* Content list or detail */}
        <div className="overflow-y-auto py-3 space-y-1 flex-1 pr-1">
          {activeSection && currentSection ? (
            <div className="py-2">
              <h3 className="text-base font-semibold text-[#F5F4FA] mb-0.5">{currentSection.title}</h3>
              <p className="text-xs text-[#A6A6B2] mb-4">{currentSection.subtitle}</p>
              {currentSection.render()}
            </div>
          ) : (
            sections.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full p-3.5 rounded-2xl bg-transparent hover:bg-[#26272D] flex items-center text-left transition group"
                >
                  <div 
                    className="w-10 h-10 rounded-xl bg-[#26272D] group-hover:bg-[#32333B] flex items-center justify-center shrink-0 mr-3.5 transition"
                    style={{ color: currentAccent.primary }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-sm font-medium text-[#F5F4FA] truncate">{item.title}</h4>
                    <p className="text-xs text-[#A6A6B2] truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A6A6B2] group-hover:text-[#F5F4FA] shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
