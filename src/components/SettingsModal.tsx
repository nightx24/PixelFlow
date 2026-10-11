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
  Check,
  Pipette
} from 'lucide-react';
import { PixelFlowSettings, ThemeMode, AccentColor, SortField, SortOrder } from '../types.ts';
import { ACCENT_COLORS, getAccentPalette, generateAccentPalette } from '../utils.ts';
import { ToggleSwitch } from './ToggleSwitch.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PixelFlowSettings;
  onUpdateSettings: (updater: (prev: PixelFlowSettings) => PixelFlowSettings) => void;
  onScanLibrary: () => void;
  onClearHistory: () => void;
  totalVideosCount: number;
}

const PRESET_ACCENTS: AccentColor[] = [
  'lavender',
  'violet',
  'emerald',
  'blue',
  'amber',
  'rose',
  'coral',
  'cyan',
  'lime',
];

const QUICK_CUSTOM_PALETTES = [
  { name: 'Neon Aqua', hex: '#00F2FE' },
  { name: 'Cyber Violet', hex: '#8B5CF6' },
  { name: 'Electric Pink', hex: '#EC4899' },
  { name: 'Tangerine', hex: '#F97316' },
  { name: 'Vivid Mint', hex: '#10B981' },
  { name: 'Crimson Glow', hex: '#F43F5E' },
  { name: 'Deep Sky', hex: '#0284C7' },
  { name: 'Sunny Gold', hex: '#F59E0B' },
];

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
  const [customHexInput, setCustomHexInput] = useState<string>(
    settings.appearance.customAccentHex || '#C4B5FD'
  );

  if (!isOpen) return null;

  const currentAccent = getAccentPalette(
    settings.appearance.accentColor,
    settings.appearance.customAccentHex
  );

  const handleApplyCustomColor = (hex: string) => {
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith('#')) cleanHex = `#${cleanHex}`;
    setCustomHexInput(cleanHex);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cleanHex)) {
      onUpdateSettings((prev) => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          accentColor: 'custom',
          customAccentHex: cleanHex,
        },
      }));
    }
  };

  const sections = [
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Theme, custom accent palette, display density',
      icon: Palette,
      render: () => (
        <div className="space-y-5">
          {/* Theme Mode */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-2 font-medium">
              Theme Mode & Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'material-you', label: 'Material You (M3)' },
                { id: 'dark', label: 'Dark Slate' },
                { id: 'amoled', label: 'Pure AMOLED' },
                { id: 'light', label: 'M3 Light' },
              ].map((m) => {
                const isSelected = settings.appearance.themeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, themeMode: m.id as ThemeMode },
                      }))
                    }
                    className={`py-2 px-2.5 rounded-2xl text-xs font-medium text-center transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Android Glass UI Toggle & Options */}
          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                appearance: { ...prev.appearance, enableGlassUI: !prev.appearance.enableGlassUI },
              }))
            }
            className="p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2B2C33] border border-white/5 space-y-3 cursor-pointer transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-[#F5F4FA] flex items-center space-x-1.5">
                  <span 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: currentAccent.primary }}
                  />
                  <span>Android Glass UI</span>
                </span>
                <span className="text-xs text-[#A6A6B2] block mt-0.5">
                  Pixel-style ambient frosted blur with dynamic theme glow (not Apple glass)
                </span>
              </div>
              <ToggleSwitch
                checked={settings.appearance.enableGlassUI}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, enableGlassUI: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Android Glass UI"
              />
            </div>

            {settings.appearance.enableGlassUI && (
              <div 
                className="pt-2 border-t border-white/5 space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="block text-[11px] uppercase tracking-wider text-[#A6A6B2] font-medium">
                  Glass Diffusion Depth
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['subtle', 'medium', 'deep'] as const).map((depth) => {
                    const isSelected = settings.appearance.glassIntensity === depth;
                    return (
                      <button
                        key={depth}
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            appearance: { ...prev.appearance, glassIntensity: depth },
                          }))
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize transition ${
                          isSelected ? 'font-bold' : 'bg-[#1D1E23] text-[#A6A6B2] hover:text-white'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentAccent.primary : undefined,
                          color: isSelected ? currentAccent.ink : undefined,
                        }}
                      >
                        {depth}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accent Color Customization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] font-medium">
                Accent Color Palette
              </label>
              <div className="flex items-center space-x-1.5">
                <span 
                  className="w-3 h-3 rounded-full shadow-xs" 
                  style={{ backgroundColor: currentAccent.primary }}
                />
                <span className="text-[11px] text-[#A6A6B2] capitalize font-mono">
                  {settings.appearance.accentColor === 'custom' 
                    ? settings.appearance.customAccentHex || currentAccent.primary 
                    : settings.appearance.accentColor}
                </span>
              </div>
            </div>

            {/* Presets Grid with Round Rectangles & Precision Alignment */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ACCENTS.map((colorKey) => {
                const color = ACCENT_COLORS[colorKey];
                const isSelected = settings.appearance.accentColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, accentColor: colorKey },
                      }))
                    }
                    className={`h-11 px-3 rounded-2xl text-xs font-medium capitalize flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'text-[#F5F4FA] shadow-md shadow-black/30'
                        : 'border-white/5 bg-[#26272D] hover:bg-[#32333B] text-[#A6A6B2]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : undefined,
                      borderColor: isSelected ? color.primary : undefined,
                      boxShadow: isSelected ? `0 0 10px ${color.glow}` : undefined,
                    }}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center transition-transform"
                        style={{ backgroundColor: color.primary }}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" style={{ color: color.ink }} />
                        )}
                      </span>
                      <span className="truncate">{colorKey}</span>
                    </div>
                    {isSelected && (
                      <span 
                        className="w-1.5 h-1.5 rounded-full shrink-0 ml-1"
                        style={{ backgroundColor: color.primary }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Selector Round Rectangle Card */}
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { 
                      ...prev.appearance, 
                      accentColor: 'custom',
                      customAccentHex: customHexInput || currentAccent.primary
                    },
                  }))
                }
                className={`h-11 px-3 rounded-2xl text-xs font-medium capitalize flex items-center justify-between transition-all cursor-pointer border ${
                  settings.appearance.accentColor === 'custom'
                    ? 'text-[#F5F4FA] shadow-md shadow-black/30'
                    : 'border-white/5 bg-[#26272D] hover:bg-[#32333B] text-[#A6A6B2]'
                }`}
                style={{
                  backgroundColor: settings.appearance.accentColor === 'custom' ? 'rgba(255, 255, 255, 0.08)' : undefined,
                  borderColor: settings.appearance.accentColor === 'custom' ? currentAccent.primary : undefined,
                  boxShadow: settings.appearance.accentColor === 'custom' ? `0 0 10px ${currentAccent.glow}` : undefined,
                }}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center transition-transform bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400"
                    style={{
                      backgroundColor: settings.appearance.accentColor === 'custom' ? currentAccent.primary : undefined,
                    }}
                  >
                    {settings.appearance.accentColor === 'custom' && (
                      <Check className="w-2.5 h-2.5 stroke-[3.5]" style={{ color: currentAccent.ink }} />
                    )}
                  </span>
                  <span className="truncate font-semibold">Custom</span>
                </div>
                <Pipette className="w-3.5 h-3.5 text-[#A6A6B2] shrink-0 ml-1" />
              </button>
            </div>

            {/* Custom Accent Color Palette Editor */}
            <div className="mt-3 p-3.5 rounded-2xl bg-[#26272D] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F5F4FA] block">
                    Custom Color Picker & Hex Code
                  </span>
                  <span className="text-[11px] text-[#A6A6B2]">
                    Pick any custom shade or enter a hex code to theme PixelFlow
                  </span>
                </div>
                <div className="relative flex items-center">
                  <label 
                    className="w-8 h-8 rounded-xl cursor-pointer flex items-center justify-center shadow-md transition hover:scale-105 border border-white/10"
                    style={{ backgroundColor: currentAccent.primary }}
                    title="Click to open color picker"
                  >
                    <Pipette className="w-4 h-4 stroke-[2.5]" style={{ color: currentAccent.ink }} />
                    <input
                      type="color"
                      value={currentAccent.primary}
                      onChange={(e) => handleApplyCustomColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Hex Code Input Bar */}
              <div className="flex items-center space-x-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#A6A6B2]">
                    #
                  </span>
                  <input
                    type="text"
                    value={customHexInput.replace('#', '')}
                    onChange={(e) => {
                      const val = `#${e.target.value.trim()}`;
                      setCustomHexInput(val);
                      if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                        handleApplyCustomColor(val);
                      }
                    }}
                    placeholder="C4B5FD"
                    maxLength={7}
                    className="w-full h-9 pl-7 pr-3 rounded-xl bg-[#1D1E23] border border-white/10 text-xs font-mono text-[#F5F4FA] focus:outline-none focus:border-white/30 transition uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyCustomColor(customHexInput)}
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold transition flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
                  style={{ backgroundColor: currentAccent.primary, color: currentAccent.ink }}
                >
                  Apply
                </button>
              </div>

              {/* Curated Quick Palette Swatches */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-[#A6A6B2] block mb-2 font-medium">
                  Quick Palette Suggestions
                </span>
                <div className="flex items-center flex-wrap gap-1.5">
                  {QUICK_CUSTOM_PALETTES.map((p) => {
                    const isCurrent = currentAccent.primary.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => handleApplyCustomColor(p.hex)}
                        className={`h-7 px-2.5 rounded-xl text-[11px] font-medium flex items-center space-x-1.5 transition border ${
                          isCurrent
                            ? 'border-white/40 bg-white/10 text-white font-bold'
                            : 'border-white/5 bg-[#1D1E23] text-[#A6A6B2] hover:text-[#F5F4FA] hover:bg-[#222329]'
                        }`}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                          style={{ backgroundColor: p.hex }} 
                        />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Density Toggles */}
          <div className="space-y-3 pt-2">
            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, showFileExtension: !prev.appearance.showFileExtension },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Show File Extensions</span>
                <span className="text-xs text-[#A6A6B2]">e.g. .mp4, .mkv in library list</span>
              </div>
              <ToggleSwitch
                checked={settings.appearance.showFileExtension}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, showFileExtension: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Show File Extensions"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, compactPadding: !prev.appearance.compactPadding },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Compact Padding</span>
                <span className="text-xs text-[#A6A6B2]">Denser list and grid spacing</span>
              </div>
              <ToggleSwitch
                checked={settings.appearance.compactPadding}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, compactPadding: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Compact Padding"
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
              ).map((opt) => {
                const isSelected = settings.library.sortField === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        library: { ...prev.library, sortField: opt.id },
                      }))
                    }
                    className={`py-2 px-3 rounded-2xl text-xs font-medium transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
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
              ).map((opt) => {
                const isSelected = settings.library.sortOrder === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        library: { ...prev.library, sortOrder: opt.id },
                      }))
                    }
                    className={`py-2 px-3 rounded-2xl text-xs font-medium transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges and Filter Toggles */}
          <div className="space-y-3 pt-2">
            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  library: { ...prev.library, showDurationBadge: !prev.library.showDurationBadge },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Duration Badge</span>
                <span className="text-xs text-[#A6A6B2]">Show duration overlay pill on thumbnails</span>
              </div>
              <ToggleSwitch
                checked={settings.library.showDurationBadge}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, showDurationBadge: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Duration Badge"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  library: { ...prev.library, showSizeBadge: !prev.library.showSizeBadge },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">File Size Badge</span>
                <span className="text-xs text-[#A6A6B2]">Display file size (MB / KB) in media items</span>
              </div>
              <ToggleSwitch
                checked={settings.library.showSizeBadge}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, showSizeBadge: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="File Size Badge"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  library: { ...prev.library, excludeShortVideos: !prev.library.excludeShortVideos },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Exclude Short Videos</span>
                <span className="text-xs text-[#A6A6B2]">Hide clips under 10 seconds</span>
              </div>
              <ToggleSwitch
                checked={settings.library.excludeShortVideos}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, excludeShortVideos: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Exclude Short Videos"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  library: { ...prev.library, rememberFolder: !prev.library.rememberFolder },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Remember Last Folder</span>
                <span className="text-xs text-[#A6A6B2]">Reopen your last active folder upon returning</span>
              </div>
              <ToggleSwitch
                checked={settings.library.rememberFolder}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    library: { ...prev.library, rememberFolder: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Remember Last Folder"
              />
            </div>
          </div>

          {/* Rescan library button */}
          <button
            type="button"
            onClick={onScanLibrary}
            className="w-full py-3 px-4 rounded-2xl bg-[#26272D] hover:bg-[#32333B] text-[#F5F4FA] text-xs font-semibold flex items-center justify-center space-x-2 transition mt-2 active:scale-98"
          >
            <RefreshCw className="w-4 h-4" style={{ color: currentAccent.primary }} />
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
          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                player: { ...prev.player, resumePlayback: !prev.player.resumePlayback },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Resume Playback Position</span>
              <span className="text-xs text-[#A6A6B2]">Remember last played timestamp for all videos</span>
            </div>
            <ToggleSwitch
              checked={settings.player.resumePlayback}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, resumePlayback: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Resume Playback Position"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                player: { ...prev.player, autoPlayNext: !prev.player.autoPlayNext },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Auto-play Next Video</span>
              <span className="text-xs text-[#A6A6B2]">Continuously play next video in the folder</span>
            </div>
            <ToggleSwitch
              checked={settings.player.autoPlayNext}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, autoPlayNext: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Auto-play Next Video"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                player: { ...prev.player, backgroundAudio: !prev.player.backgroundAudio },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Background Audio Playback</span>
              <span className="text-xs text-[#A6A6B2]">Keep audio playing when app window is unfocused</span>
            </div>
            <ToggleSwitch
              checked={settings.player.backgroundAudio}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, backgroundAudio: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Background Audio Playback"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                player: { ...prev.player, enablePiP: !prev.player.enablePiP },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Picture-in-Picture Quick Icon</span>
              <span className="text-xs text-[#A6A6B2]">Show floating PiP button in player header</span>
            </div>
            <ToggleSwitch
              checked={settings.player.enablePiP}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, enablePiP: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Picture-in-Picture Quick Icon"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                player: { ...prev.player, rememberBrightness: !prev.player.rememberBrightness },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Remember Brightness Level</span>
              <span className="text-xs text-[#A6A6B2]">Maintain your custom screen brightness per video</span>
            </div>
            <ToggleSwitch
              checked={settings.player.rememberBrightness}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  player: { ...prev.player, rememberBrightness: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Remember Brightness Level"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Double-Tap Seek Interval
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((sec) => {
                const isSelected = settings.player.doubleTapSeekSeconds === sec;
                return (
                  <button
                    key={sec}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        player: { ...prev.player, doubleTapSeekSeconds: sec },
                      }))
                    }
                    className={`py-2 px-2.5 rounded-2xl text-xs font-medium transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    ±{sec}s
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Controller Auto-Hide Timeout
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 5, 10].map((sec) => {
                const isSelected = settings.player.controllerTimeoutSec === sec;
                return (
                  <button
                    key={sec}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        player: { ...prev.player, controllerTimeoutSec: sec },
                      }))
                    }
                    className={`py-2 px-2.5 rounded-2xl text-xs font-medium transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {sec}s
                  </button>
                );
              })}
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
            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  gestures: { ...prev.gestures, enableVerticalBrightness: !prev.gestures.enableVerticalBrightness },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Vertical Swipe: Brightness</span>
                <span className="text-xs text-[#A6A6B2]">Drag left half of screen to adjust screen light</span>
              </div>
              <ToggleSwitch
                checked={settings.gestures.enableVerticalBrightness}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableVerticalBrightness: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Vertical Swipe: Brightness"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  gestures: { ...prev.gestures, enableVerticalVolume: !prev.gestures.enableVerticalVolume },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Vertical Swipe: Volume</span>
                <span className="text-xs text-[#A6A6B2]">Drag right half of screen to adjust volume</span>
              </div>
              <ToggleSwitch
                checked={settings.gestures.enableVerticalVolume}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableVerticalVolume: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Vertical Swipe: Volume"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  gestures: { ...prev.gestures, enableHorizontalSeek: !prev.gestures.enableHorizontalSeek },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Horizontal Swipe: Scrub Seek</span>
                <span className="text-xs text-[#A6A6B2]">Drag horizontally to scrub through timeline</span>
              </div>
              <ToggleSwitch
                checked={settings.gestures.enableHorizontalSeek}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableHorizontalSeek: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Horizontal Swipe: Scrub Seek"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  gestures: { ...prev.gestures, enableDoubleTapSeek: !prev.gestures.enableDoubleTapSeek },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Double-Tap to Seek</span>
                <span className="text-xs text-[#A6A6B2]">Tap left or right edge twice to skip seconds</span>
              </div>
              <ToggleSwitch
                checked={settings.gestures.enableDoubleTapSeek}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableDoubleTapSeek: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Double-Tap to Seek"
              />
            </div>

            <div 
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  gestures: { ...prev.gestures, enableLongPressFastForward: !prev.gestures.enableLongPressFastForward },
                }))
              }
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
            >
              <div>
                <span className="text-sm font-medium text-[#F5F4FA] block">Long Press: 2x Fast-Forward</span>
                <span className="text-xs text-[#A6A6B2]">Hold down anywhere to temporarily accelerate</span>
              </div>
              <ToggleSwitch
                checked={settings.gestures.enableLongPressFastForward}
                onChange={(checked) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    gestures: { ...prev.gestures, enableLongPressFastForward: checked },
                  }))
                }
                accentColor={currentAccent.primary}
                accentInk={currentAccent.ink}
                ariaLabel="Long Press: 2x Fast-Forward"
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
          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                audio: { ...prev.audio, volumeBoost: !prev.audio.volumeBoost },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Volume Boost (200%)</span>
              <span className="text-xs text-[#A6A6B2]">Amplifies quiet media tracks beyond normal max</span>
            </div>
            <ToggleSwitch
              checked={settings.audio.volumeBoost}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, volumeBoost: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Volume Boost (200%)"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                audio: { ...prev.audio, nightModeSpeechClarity: !prev.audio.nightModeSpeechClarity },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Night Mode (Speech Clarity)</span>
              <span className="text-xs text-[#A6A6B2]">Compresses explosions while boosting spoken dialogues</span>
            </div>
            <ToggleSwitch
              checked={settings.audio.nightModeSpeechClarity}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, nightModeSpeechClarity: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Night Mode (Speech Clarity)"
            />
          </div>

          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                audio: { ...prev.audio, muteOnStart: !prev.audio.muteOnStart },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Mute on Start</span>
              <span className="text-xs text-[#A6A6B2]">Always start new videos with sound muted</span>
            </div>
            <ToggleSwitch
              checked={settings.audio.muteOnStart}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, muteOnStart: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Mute on Start"
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
          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                subtitles: { ...prev.subtitles, enabled: !prev.subtitles.enabled },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Enable Subtitles</span>
              <span className="text-xs text-[#A6A6B2]">Show subtitles automatically when available</span>
            </div>
            <ToggleSwitch
              checked={settings.subtitles.enabled}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  subtitles: { ...prev.subtitles, enabled: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Enable Subtitles"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((sz) => {
                const isSelected = settings.subtitles.fontSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        subtitles: { ...prev.subtitles, fontSize: sz },
                      }))
                    }
                    className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Text Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['white', 'yellow', 'cyan', 'green'] as const).map((col) => {
                const isSelected = settings.subtitles.textColor === col;
                return (
                  <button
                    key={col}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        subtitles: { ...prev.subtitles, textColor: col },
                      }))
                    }
                    className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
              Background Box
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['transparent', 'semi-black', 'black'] as const).map((bg) => {
                const isSelected = settings.subtitles.backgroundColor === bg;
                return (
                  <button
                    key={bg}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        subtitles: { ...prev.subtitles, backgroundColor: bg },
                      }))
                    }
                    className={`py-2 px-2 rounded-2xl text-xs font-medium capitalize transition ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#32333B]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? currentAccent.primary : undefined,
                      color: isSelected ? currentAccent.ink : undefined,
                    }}
                  >
                    {bg}
                  </button>
                );
              })}
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
          <div 
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                history: { ...prev.history, trackHistory: !prev.history.trackHistory },
              }))
            }
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#26272D] hover:bg-[#2F3038] cursor-pointer transition"
          >
            <div>
              <span className="text-sm font-medium text-[#F5F4FA] block">Track Watch History</span>
              <span className="text-xs text-[#A6A6B2]">Store watch progress and continue points</span>
            </div>
            <ToggleSwitch
              checked={settings.history.trackHistory}
              onChange={(checked) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  history: { ...prev.history, trackHistory: checked },
                }))
              }
              accentColor={currentAccent.primary}
              accentInk={currentAccent.ink}
              ariaLabel="Track Watch History"
            />
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            className="w-full py-3 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center justify-center space-x-2 transition active:scale-98"
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
            <p className="text-xs mt-0.5 font-medium" style={{ color: currentAccent.primary }}>
              Version 0.1.1
            </p>
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
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: currentAccent.primary }}
                />
                <span>OpenSubtitles.org online subtitle search & download</span>
              </li>
              <li className="flex items-center space-x-2">
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: currentAccent.primary }}
                />
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
              className="flex items-center space-x-1.5 text-xs font-medium transition"
              style={{ color: currentAccent.primary }}
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
