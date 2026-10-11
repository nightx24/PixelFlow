import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Settings, 
  Grid, 
  Plus, 
  Folder as FolderIcon, 
  Play, 
  ChevronRight, 
  X, 
  Clock, 
  ArrowUpDown,
  Tv,
  Film
} from 'lucide-react';
import { 
  VideoEntry, 
  ViewTab, 
  ViewMode, 
  LayoutMode, 
  PixelFlowSettings, 
  WatchHistoryItem,
  SortField,
  SortOrder 
} from './types.ts';
import { INITIAL_VIDEOS } from './sampleVideos.ts';
import { 
  formatDuration, 
  formatSize, 
  DEFAULT_PIXELFLOW_SETTINGS, 
  getAccentPalette,
  getMaterialYouSurfaces
} from './utils.ts';
import { PlayerView } from './components/PlayerView.tsx';
import { QuickSettingsModal } from './components/QuickSettingsModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AddVideoModal } from './components/AddVideoModal.tsx';

export default function App() {
  // Settings profile
  const [settings, setSettings] = useState<PixelFlowSettings>(() => {
    const saved = localStorage.getItem('pixelflow_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PIXELFLOW_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_PIXELFLOW_SETTINGS;
  });

  // Watch History
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    const saved = localStorage.getItem('pixelflow_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Videos Library
  const [videos, setVideos] = useState<VideoEntry[]>(() => {
    const saved = localStorage.getItem('pixelflow_videos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_VIDEOS;
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('folders');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null);
  const [initialSeekSeconds, setInitialSeekSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Choose a video to start playback');

  // Modals
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Accent Palette & Material You (M3) calculation
  const accent = useMemo(() => {
    return getAccentPalette(settings.appearance.accentColor, settings.appearance.customAccentHex);
  }, [settings.appearance.accentColor, settings.appearance.customAccentHex]);

  const isLight = settings.appearance.themeMode === 'light';
  const isMaterialYou = settings.appearance.themeMode === 'material-you';
  const isAMOLED = settings.appearance.themeMode === 'amoled';
  const isGlass = settings.appearance.enableGlassUI;

  const m3Surfaces = useMemo(() => {
    return getMaterialYouSurfaces(accent, isLight);
  }, [accent, isLight]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('pixelflow_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist watch history
  useEffect(() => {
    localStorage.setItem('pixelflow_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  // Persist videos
  useEffect(() => {
    const serializable = videos.filter((v) => !v.url.startsWith('blob:'));
    if (serializable.length > 0) {
      localStorage.setItem('pixelflow_videos', JSON.stringify(serializable));
    }
  }, [videos]);

  // Focus search input
  useEffect(() => {
    if (searchVisible) {
      searchInputRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [searchVisible]);

  // Keyboard navigation & playback shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/' && !searchVisible) {
        e.preventDefault();
        setSearchVisible(true);
      } else if (e.key === 'Escape') {
        if (searchVisible) setSearchVisible(false);
        if (isQuickSettingsOpen) setIsQuickSettingsOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isAddVideoOpen) setIsAddVideoOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchVisible, isQuickSettingsOpen, isSettingsOpen, isAddVideoOpen]);

  // Listen to Electron file associations if packaged
  useEffect(() => {
    if (window.electronAPI?.onOpenVideo) {
      const cleanup = window.electronAPI.onOpenVideo((data) => {
        const ext = data.fileName.split('.').pop() || 'mp4';
        const newVideo: VideoEntry = {
          id: `ext-${Date.now()}`,
          name: data.fileName,
          url: data.filePath.startsWith('file://') ? data.filePath : `file://${data.filePath}`,
          durationMs: 60000,
          sizeBytes: 15000000,
          folder: 'External',
          dateAdded: Date.now(),
          isCustom: true,
        };
        setVideos((prev) => [newVideo, ...prev]);
        setActiveVideo(newVideo);
        setStatusMessage(`Opened ${data.fileName}`);
      });
      return cleanup;
    }
  }, []);

  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => {
      if (v.folder) set.add(v.folder);
    });
    return Array.from(set).sort();
  }, [videos]);

  // Filtered & Sorted Videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Filter by selected folder if in folder sub-view
    if (selectedFolder) {
      result = result.filter((v) => v.folder === selectedFolder);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.folder?.toLowerCase().includes(q)
      );
    }

    // Exclude short videos option
    if (settings.library.excludeShortVideos) {
      const minMs = (settings.library.shortVideoThresholdSec || 10) * 1000;
      result = result.filter((v) => v.durationMs >= minMs);
    }

    // Sort order & field
    const field = settings.library.sortField || 'dateAdded';
    const order = settings.library.sortOrder || 'desc';

    result.sort((a, b) => {
      let cmp = 0;
      if (field === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (field === 'duration') {
        cmp = a.durationMs - b.durationMs;
      } else if (field === 'size') {
        cmp = a.sizeBytes - b.sizeBytes;
      } else {
        cmp = (a.dateAdded || 0) - (b.dateAdded || 0);
      }
      return order === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [videos, selectedFolder, searchQuery, settings.library]);

  // Grouped Folders
  const folderGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const map = new Map<string, VideoEntry[]>();

    videos.forEach((v) => {
      const f = v.folder || 'Other';
      const matchesSearch = !q || v.name.toLowerCase().includes(q) || f.toLowerCase().includes(q);
      if (matchesSearch) {
        if (!map.has(f)) {
          map.set(f, []);
        }
        map.get(f)!.push(v);
      }
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [videos, searchQuery]);

  // Start playback with resume position check
  const handleStartPlayback = (video: VideoEntry, resumeSec?: number) => {
    let seekTo = resumeSec;
    if (seekTo === undefined && settings.player.resumePlayback) {
      const historyItem = watchHistory.find((h) => h.videoId === video.id);
      if (historyItem && historyItem.positionSeconds > 5 && historyItem.positionSeconds < (historyItem.durationSeconds - 5)) {
        seekTo = historyItem.positionSeconds;
      }
    }

    setInitialSeekSeconds(seekTo || 0);
    setActiveVideo(video);
    setStatusMessage(`Now playing · ${video.name}`);
  };

  const handleProgressUpdate = (positionSec: number, durationSec: number) => {
    if (!settings.history.trackHistory || !activeVideo) return;

    setWatchHistory((prev) => {
      const filtered = prev.filter((h) => h.videoId !== activeVideo.id);
      const updatedItem: WatchHistoryItem = {
        videoId: activeVideo.id,
        videoName: activeVideo.name,
        folder: activeVideo.folder,
        lastWatchedTimestamp: Date.now(),
        positionSeconds: positionSec,
        durationSeconds: durationSec,
        thumbnailUrl: activeVideo.thumbnailUrl,
      };
      return [updatedItem, ...filtered].slice(0, settings.history.maxHistoryItems || 50);
    });
  };

  const handleVideoEnded = () => {
    if (settings.player.autoPlayNext && activeVideo) {
      const currentIndex = filteredVideos.findIndex((v) => v.id === activeVideo.id);
      if (currentIndex >= 0 && currentIndex < filteredVideos.length - 1) {
        handleStartPlayback(filteredVideos[currentIndex + 1]);
      }
    }
  };

  const handleRescanLibrary = () => {
    setVideos(INITIAL_VIDEOS);
    setSelectedFolder(null);
    setStatusMessage('Library refreshed with sample videos');
    setIsSettingsOpen(false);
  };

  const handleClearHistory = () => {
    setWatchHistory([]);
    localStorage.removeItem('pixelflow_history');
    setStatusMessage('Watch history cleared');
  };

  const handleAddVideos = (newVideos: VideoEntry[]) => {
    setVideos((prev) => [...newVideos, ...prev]);
    setStatusMessage(`Added ${newVideos.length} new video${newVideos.length > 1 ? 's' : ''}`);
    if (newVideos.length > 0) {
      handleStartPlayback(newVideos[0]);
    }
  };

  const libraryCountLabel = useMemo(() => {
    if (activeTab === 'folders' && selectedFolder === null) {
      return `${folderGroups.length} folders`;
    }
    return `${filteredVideos.length} videos`;
  }, [activeTab, selectedFolder, folderGroups.length, filteredVideos.length]);

  // Background style dynamically reacting to Material You, AMOLED, Dark, or Light
  const getAppBg = () => {
    if (isAMOLED) return '#000000';
    if (isLight) return isMaterialYou ? m3Surfaces.background : '#F8F9FA';
    if (isMaterialYou) return m3Surfaces.background;
    return '#101114';
  };

  // Card / surface style dynamically reacting to Material You, AMOLED, Dark, Light, or Glass
  const getCardStyle = (isInteractive = true) => {
    if (isGlass) {
      return {
        backgroundColor: accent.glassBg,
        borderColor: accent.glassBorder,
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.36)`,
      };
    }
    if (isMaterialYou) {
      return {
        backgroundColor: m3Surfaces.surface,
        borderColor: m3Surfaces.surfaceBorder,
      };
    }
    if (isAMOLED) {
      return {
        backgroundColor: '#09090B',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      };
    }
    if (isLight) {
      return {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.08)',
      };
    }
    return {
      backgroundColor: '#1D1E23',
      borderColor: 'rgba(255, 255, 255, 0.05)',
    };
  };

  const getGlassCardClass = (isInteractive = true) => {
    const depthBlur = isGlass
      ? settings.appearance.glassIntensity === 'deep'
        ? 'backdrop-blur-2xl backdrop-saturate-150'
        : settings.appearance.glassIntensity === 'subtle'
        ? 'backdrop-blur-md backdrop-saturate-125'
        : 'backdrop-blur-xl backdrop-saturate-150'
      : '';

    return `border transition-all duration-200 ${depthBlur} ${
      isInteractive ? 'hover:scale-[1.008] active:scale-[0.99] cursor-pointer' : ''
    }`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans select-none transition-colors duration-300 relative overflow-x-hidden"
      style={{ 
        backgroundColor: getAppBg(), 
        color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' 
      }}
    >
      {/* Ambient Android Glass / Material You Backlight Orbs */}
      {(isGlass || isMaterialYou) && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div 
            className="absolute -top-[12%] -left-[10%] w-[440px] h-[440px] rounded-full blur-[110px] opacity-20 transition-all duration-700"
            style={{ backgroundColor: accent.primary }}
          />
          <div 
            className="absolute top-[35%] -right-[15%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 transition-all duration-700"
            style={{ backgroundColor: accent.hover }}
          />
          <div 
            className="absolute -bottom-[10%] left-[20%] w-[380px] h-[380px] rounded-full blur-[100px] opacity-15 transition-all duration-700"
            style={{ backgroundColor: accent.primary }}
          />
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-6 flex-1 flex flex-col relative z-10">
        {/* NextPlayer Material 3 Header Toolbar */}
        <header className="flex items-center justify-between py-2">
          {/* Brand title */}
          <div className="flex flex-col">
            <h1 
              className="text-[26px] font-bold tracking-tight leading-tight"
              style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
            >
              PixelFlow
            </h1>
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#A6A6B2] font-semibold mt-0.5">
              YOUR VIDEO SPACE
            </span>
          </div>

          {/* Action buttons (NextPlayer M3 circle action row) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={() => setSearchVisible((prev) => !prev)}
              aria-label="Search videos"
              title="Search videos"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xs"
              style={{ 
                backgroundColor: isMaterialYou ? accent.surfaceTint : isGlass ? accent.glassBg : '#26272D', 
                color: accent.primary,
                borderColor: isMaterialYou ? m3Surfaces.surfaceBorder : 'rgba(255,255,255,0.08)',
                borderWidth: 1
              }}
            >
              <Search className="w-4 h-4 stroke-[2.4]" />
            </button>

            <button
              type="button"
              onClick={() => setIsQuickSettingsOpen(true)}
              aria-label="Quick settings"
              title="Quick settings"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xs"
              style={{ 
                backgroundColor: isMaterialYou ? accent.surfaceTint : isGlass ? accent.glassBg : '#26272D', 
                color: accent.primary,
                borderColor: isMaterialYou ? m3Surfaces.surfaceBorder : 'rgba(255,255,255,0.08)',
                borderWidth: 1
              }}
            >
              <Grid className="w-4 h-4 stroke-[2.4]" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              title="Settings"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xs"
              style={{ 
                backgroundColor: isMaterialYou ? accent.surfaceTint : isGlass ? accent.glassBg : '#26272D', 
                color: accent.primary,
                borderColor: isMaterialYou ? m3Surfaces.surfaceBorder : 'rgba(255,255,255,0.08)',
                borderWidth: 1
              }}
            >
              <Settings className="w-4 h-4 stroke-[2.4]" />
            </button>

            <button
              type="button"
              onClick={() => setIsAddVideoOpen(true)}
              aria-label="Add videos"
              title="Add videos"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-md"
              style={{ backgroundColor: accent.primary, color: accent.ink }}
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
            </button>
          </div>
        </header>

        {/* Search input bar */}
        {searchVisible && (
          <div className="mt-2.5 relative animate-in fade-in duration-150">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, folders, and streams…"
              className="w-full h-11 px-4 pr-10 rounded-2xl text-xs sm:text-sm placeholder-[#A6A6B2] border focus:outline-none transition shadow-sm"
              style={{
                backgroundColor: isMaterialYou ? m3Surfaces.surfaceContainer : isLight ? '#FFFFFF' : '#1D1E23',
                color: isLight ? m3Surfaces.textPrimary : '#F5F4FA',
                borderColor: isMaterialYou ? accent.primary : 'rgba(255,255,255,0.1)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#A6A6B2] hover:text-[#F5F4FA] transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* NextPlayer Material 3 Segmented Pill Tabs: Folders vs Videos */}
        <div className="py-3.5">
          <div 
            className="p-1 rounded-2xl flex items-center space-x-1 border"
            style={{
              backgroundColor: isMaterialYou ? m3Surfaces.surfaceContainer : isLight ? '#EAE8ED' : '#1D1E23',
              borderColor: isMaterialYou ? m3Surfaces.surfaceBorder : 'rgba(255,255,255,0.06)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('folders');
                setSelectedFolder(null);
              }}
              className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2"
              style={{
                backgroundColor: activeTab === 'folders' ? accent.primary : 'transparent',
                color: activeTab === 'folders' ? accent.ink : isLight ? m3Surfaces.textSecondary : '#A6A6B2',
                boxShadow: activeTab === 'folders' ? `0 2px 8px ${accent.glow}` : undefined,
              }}
            >
              <FolderIcon className="w-4 h-4 stroke-[2.2]" />
              <span>Folders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('videos');
                setSelectedFolder(null);
              }}
              className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2"
              style={{
                backgroundColor: activeTab === 'videos' ? accent.primary : 'transparent',
                color: activeTab === 'videos' ? accent.ink : isLight ? m3Surfaces.textSecondary : '#A6A6B2',
                boxShadow: activeTab === 'videos' ? `0 2px 8px ${accent.glow}` : undefined,
              }}
            >
              <Film className="w-4 h-4 stroke-[2.2]" />
              <span>Videos</span>
            </button>
          </div>
        </div>

        {/* Folder navigation breadcrumb */}
        {selectedFolder && (
          <div className="pb-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedFolder(null);
                setActiveTab('folders');
              }}
              className="text-xs font-semibold flex items-center space-x-1.5 transition group px-2 py-1 rounded-lg"
              style={{ color: accent.primary }}
            >
              <span className="text-base font-bold">‹</span>
              <span className="group-hover:underline">Back to all folders</span>
            </button>
          </div>
        )}

        {/* Embedded Video Player */}
        {activeVideo && (
          <div className="mb-4">
            <PlayerView
              video={activeVideo}
              settings={settings}
              initialSeekSeconds={initialSeekSeconds}
              onClose={() => {
                setActiveVideo(null);
                setStatusMessage('Choose a video to start playback');
              }}
              onStatusChange={setStatusMessage}
              onEnded={handleVideoEnded}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        )}

        {/* Continue Watching Shelf (NextPlayer signature shelf) */}
        {watchHistory.length > 0 && !selectedFolder && (
          <div className="mb-4 pt-1 pb-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A6A6B2] flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                <span>Continue Watching</span>
              </span>
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-[#A6A6B2] hover:text-red-400 transition"
              >
                Clear
              </button>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {watchHistory.slice(0, 6).map((item) => {
                const targetVid = videos.find((v) => v.id === item.videoId);
                if (!targetVid) return null;
                const progressPct = Math.min(100, (item.positionSeconds / (item.durationSeconds || 1)) * 100);

                return (
                  <div
                    key={item.videoId}
                    onClick={() => handleStartPlayback(targetVid, item.positionSeconds)}
                    className={`shrink-0 w-36 sm:w-40 rounded-2xl p-2.5 ${getGlassCardClass()}`}
                    style={getCardStyle()}
                  >
                    <div className="w-full aspect-video rounded-xl bg-[#26272D] overflow-hidden relative shadow-xs">
                      {targetVid.thumbnailUrl ? (
                        <img src={targetVid.thumbnailUrl} alt={item.videoName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 opacity-80" style={{ color: accent.primary }} />
                        </div>
                      )}
                      {/* Red Progress bar underneath */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div 
                          className="h-full bg-red-500 rounded-r" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    <h5 
                      className="text-[11px] font-medium truncate mt-2"
                      style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
                    >
                      {item.videoName}
                    </h5>
                    <p className="text-[9px] text-[#A6A6B2] mt-0.5">
                      Resume · {formatDuration(item.positionSeconds * 1000)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Library section header & Quick Sort indicator */}
        <div className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center space-x-2">
            <h2 
              className="text-[18px] sm:text-[20px] font-bold tracking-tight" 
              style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
            >
              {selectedFolder ? selectedFolder : activeTab === 'folders' ? 'Media Folders' : 'All Videos'}
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#A6A6B2]">
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  library: {
                    ...prev.library,
                    sortOrder: prev.library.sortOrder === 'asc' ? 'desc' : 'asc',
                  },
                }))
              }
              className="flex items-center space-x-1.5 hover:text-[#F5F4FA] transition px-2 py-1 rounded-lg"
              title={`Sorting by ${settings.library.sortField} (${settings.library.sortOrder})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" style={{ color: accent.primary }} />
              <span className="capitalize font-medium">{settings.library.sortField}</span>
            </button>
            <span>·</span>
            <span className="font-medium">{libraryCountLabel}</span>
          </div>
        </div>

        {/* Main media content area */}
        <div className="flex-1 overflow-y-auto py-1">
          {videos.length === 0 ? (
            <div 
              className="py-12 px-4 text-center rounded-3xl border my-4"
              style={getCardStyle(false)}
            >
              <FolderIcon className="w-12 h-12 mx-auto mb-3 opacity-80" style={{ color: accent.primary }} />
              <p className="text-sm font-semibold" style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}>
                No videos found yet
              </p>
              <p className="text-xs text-[#A6A6B2] mt-1 max-w-sm mx-auto">
                Add a video to your device or tap + to open one from files or web streams.
              </p>
              <button
                type="button"
                onClick={() => setIsAddVideoOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition shadow-xs inline-flex items-center space-x-1.5"
                style={{ backgroundColor: accent.primary, color: accent.ink }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Videos</span>
              </button>
            </div>
          ) : activeTab === 'folders' && selectedFolder === null ? (
            /* Folders view (NextPlayer Android signature squircle cards) */
            <div className="space-y-2.5">
              {folderGroups.length === 0 ? (
                <p className="text-xs text-[#A6A6B2] py-6 text-center">
                  No matching folders. Try another search.
                </p>
              ) : (
                folderGroups.map(([folder, entries]) => (
                  <div
                    key={folder}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setActiveTab('videos');
                    }}
                    className={`w-full p-3.5 rounded-[22px] flex items-center ${getGlassCardClass()}`}
                    style={getCardStyle()}
                  >
                    {/* Squircle folder icon tile */}
                    <div 
                      className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 shadow-xs"
                      style={{ 
                        backgroundColor: isMaterialYou ? accent.surfaceTint : `${accent.primary}25`,
                        color: accent.primary 
                      }}
                    >
                      <FolderIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 min-w-0 pl-4 pr-2">
                      <h3 
                        className="text-[15px] font-semibold truncate leading-snug" 
                        style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
                      >
                        {folder}
                      </h3>
                      <p className="text-xs text-[#A6A6B2] mt-1 flex items-center space-x-1.5">
                        <span>{entries.length} {entries.length === 1 ? 'video' : 'videos'}</span>
                        <span>·</span>
                        <span>{formatSize(entries.reduce((acc, v) => acc + (v.sizeBytes || 0), 0))}</span>
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#A6A6B2] shrink-0" />
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Videos view (in List or Grid mode matching NextPlayer screenshots) */
            <>
              {filteredVideos.length === 0 ? (
                <p className="text-xs text-[#A6A6B2] py-6 text-center">
                  No matching videos. Try another search or adjust short video filters.
                </p>
              ) : settings.library.layoutMode === 'Grid' ? (
                /* Grid mode */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredVideos.map((video) => {
                    const isCurrent = activeVideo?.id === video.id;
                    const historyItem = watchHistory.find((h) => h.videoId === video.id);
                    const progressPct = historyItem ? Math.min(100, (historyItem.positionSeconds / (historyItem.durationSeconds || 1)) * 100) : 0;

                    return (
                      <div
                        key={video.id}
                        onClick={() => handleStartPlayback(video)}
                        className={`group relative rounded-[20px] overflow-hidden p-2.5 ${getGlassCardClass()} ${
                          isCurrent ? 'ring-2' : ''
                        }`}
                        style={{
                          ...getCardStyle(),
                          outlineColor: isCurrent ? accent.primary : undefined,
                        }}
                      >
                        <div className="w-full aspect-video rounded-xl bg-[#26272D] overflow-hidden relative flex items-center justify-center shadow-xs">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#26272D] to-[#1D1E23]">
                              <Play className="w-6 h-6 fill-current opacity-80" style={{ color: accent.primary }} />
                            </div>
                          )}

                          {settings.library.showDurationBadge && (
                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-medium text-[#F5F4FA]">
                              {formatDuration(video.durationMs)}
                            </span>
                          )}

                          {/* Watch progress indicator */}
                          {progressPct > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                              <div className="h-full bg-red-500" style={{ width: `${progressPct}%` }} />
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 px-0.5">
                          <h4 
                            className="text-xs font-semibold line-clamp-2 leading-snug transition"
                            style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
                          >
                            {video.name}
                          </h4>
                          <p className="text-[10px] text-[#A6A6B2] mt-1 truncate">
                            {formatSize(video.sizeBytes)} · {video.folder}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List mode */
                <div className="space-y-2.5">
                  {filteredVideos.map((video) => {
                    const isCurrent = activeVideo?.id === video.id;
                    const historyItem = watchHistory.find((h) => h.videoId === video.id);
                    const progressPct = historyItem ? Math.min(100, (historyItem.positionSeconds / (historyItem.durationSeconds || 1)) * 100) : 0;

                    return (
                      <div
                        key={video.id}
                        onClick={() => handleStartPlayback(video)}
                        className={`w-full p-2.5 sm:p-3 rounded-[20px] flex items-center ${getGlassCardClass()} ${
                          isCurrent ? 'ring-2' : ''
                        }`}
                        style={{
                          ...getCardStyle(),
                          outlineColor: isCurrent ? accent.primary : undefined,
                        }}
                      >
                        {/* 16:9 Thumbnail container */}
                        <div className="w-[104px] sm:w-[114px] h-[72px] sm:h-[76px] rounded-xl bg-[#26272D] overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#26272D] to-[#1D1E23]">
                              <Play className="w-5 h-5 fill-current opacity-80" style={{ color: accent.primary }} />
                            </div>
                          )}

                          {settings.library.showDurationBadge && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-medium text-[#F5F4FA]">
                              {formatDuration(video.durationMs)}
                            </span>
                          )}

                          {progressPct > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                              <div className="h-full bg-red-500" style={{ width: `${progressPct}%` }} />
                            </div>
                          )}
                        </div>

                        {/* Title and metadata */}
                        <div className="flex-1 min-w-0 pl-3.5 pr-2">
                          <h4 
                            className="text-sm font-semibold line-clamp-2 leading-snug" 
                            style={{ color: isLight ? m3Surfaces.textPrimary : '#F5F4FA' }}
                          >
                            {video.name}
                          </h4>
                          <p className="text-[11px] text-[#A6A6B2] mt-1 flex items-center space-x-1.5">
                            <span>{formatDuration(video.durationMs)}</span>
                            <span>·</span>
                            <span>{formatSize(video.sizeBytes)}</span>
                          </p>
                          <p className="text-[10px] text-[#A6A6B2] mt-0.5 truncate">
                            {video.folder}
                          </p>
                        </div>

                        {isCurrent && (
                          <div className="shrink-0 pr-1">
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
                              style={{ backgroundColor: accent.primary }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer status message */}
        <footer className="pt-3 pb-1 border-t border-white/5 text-[11px] text-[#A6A6B2] flex items-center justify-between">
          <span className="truncate">{statusMessage}</span>
          <span className="shrink-0 ml-2 font-mono text-[10px] uppercase">
            {settings.appearance.themeMode}
          </span>
        </footer>
      </div>

      {/* Modals */}
      <QuickSettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        viewMode={settings.library.viewMode}
        onViewModeChange={(m) => {
          setSettings((prev) => ({
            ...prev,
            library: { ...prev.library, viewMode: m },
          }));
          if (m === 'Videos') {
            setActiveTab('videos');
            setSelectedFolder(null);
          } else if (m === 'Folders') {
            setActiveTab('folders');
            setSelectedFolder(null);
          }
        }}
        layoutMode={settings.library.layoutMode}
        onLayoutModeChange={(l) =>
          setSettings((prev) => ({
            ...prev,
            library: { ...prev.library, layoutMode: l },
          }))
        }
        sortField={settings.library.sortField}
        onSortFieldChange={(f) =>
          setSettings((prev) => ({
            ...prev,
            library: { ...prev.library, sortField: f },
          }))
        }
        sortOrder={settings.library.sortOrder}
        onSortOrderChange={(o) =>
          setSettings((prev) => ({
            ...prev,
            library: { ...prev.library, sortOrder: o },
          }))
        }
        loopMode={settings.player.loopMode}
        onLoopModeChange={(loop) =>
          setSettings((prev) => ({
            ...prev,
            player: { ...prev.player, loopMode: loop },
          }))
        }
        enableGlassUI={settings.appearance.enableGlassUI}
        onGlassUIToggle={(enable) =>
          setSettings((prev) => ({
            ...prev,
            appearance: { ...prev.appearance, enableGlassUI: enable },
          }))
        }
        showFileExtension={settings.appearance.showFileExtension}
        onShowFileExtensionToggle={(show) =>
          setSettings((prev) => ({
            ...prev,
            appearance: { ...prev.appearance, showFileExtension: show },
          }))
        }
        showDurationBadge={settings.library.showDurationBadge}
        onShowDurationBadgeToggle={(show) =>
          setSettings((prev) => ({
            ...prev,
            library: { ...prev.library, showDurationBadge: show },
          }))
        }
        accentColor={accent.primary}
        accentInk={accent.ink}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onScanLibrary={handleRescanLibrary}
        onClearHistory={handleClearHistory}
        totalVideosCount={videos.length}
      />

      <AddVideoModal
        isOpen={isAddVideoOpen}
        onClose={() => setIsAddVideoOpen(false)}
        onAddVideos={handleAddVideos}
        folders={allFolderNames}
        accentColor={accent.primary}
        accentInk={accent.ink}
      />
    </div>
  );
}
