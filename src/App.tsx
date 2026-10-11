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
  History,
  RotateCcw,
  Clock,
  ArrowUpDown
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
  ACCENT_COLORS 
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

  const accent = ACCENT_COLORS[settings.appearance.accentColor] || ACCENT_COLORS.lavender;

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

  // Desktop integration (Ubuntu, Fedora, AppImage, Windows)
  useEffect(() => {
    if (window.electronAPI?.onOpenVideo) {
      const cleanup = window.electronAPI.onOpenVideo((data) => {
        const desktopVideo: VideoEntry = {
          id: `desktop-${Date.now()}`,
          name: data.fileName,
          url: data.filePath.startsWith('file:') ? data.filePath : `file://${data.filePath}`,
          durationMs: 0,
          sizeBytes: 0,
          folder: 'Local Files',
          isCustom: true,
        };
        setVideos((prev) => [desktopVideo, ...prev]);
        setActiveVideo(desktopVideo);
        setStatusMessage(`Now playing · ${data.fileName}`);
      });
      return cleanup;
    }
  }, []);

  // Unique folders
  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => set.add(v.folder || 'Other'));
    return Array.from(set).sort();
  }, [videos]);

  // Filtered and Sorted Videos
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = videos.filter((v) => {
      const folderMatches = selectedFolder === null || v.folder === selectedFolder;
      const queryMatches = !q || v.name.toLowerCase().includes(q) || v.folder.toLowerCase().includes(q);
      const durationMatches = !settings.library.excludeShortVideos || v.durationMs >= (settings.library.shortVideoThresholdSec * 1000);
      return folderMatches && queryMatches && durationMatches;
    });

    // Apply sorting
    const field = settings.library.sortField;
    const order = settings.library.sortOrder === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      if (field === 'name') {
        return a.name.localeCompare(b.name) * order;
      }
      if (field === 'duration') {
        return (a.durationMs - b.durationMs) * order;
      }
      if (field === 'size') {
        return (a.sizeBytes - b.sizeBytes) * order;
      }
      // default: dateAdded
      return ((a.dateAdded || 0) - (b.dateAdded || 0)) * order;
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

  // Background style based on theme
  const getAppBg = () => {
    if (settings.appearance.themeMode === 'amoled') return '#000000';
    if (settings.appearance.themeMode === 'light') return '#F8F9FA';
    return '#101114';
  };

  const isLight = settings.appearance.themeMode === 'light';

  return (
    <div 
      className="min-h-screen text-[#F5F4FA] flex flex-col font-sans select-none transition-colors duration-200"
      style={{ backgroundColor: getAppBg(), color: isLight ? '#1A1C1E' : '#F5F4FA' }}
    >
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex-1 flex flex-col">
        {/* Header Toolbar */}
        <header className="flex items-center justify-between py-2">
          {/* Brand title */}
          <div className="flex flex-col">
            <h1 
              className="text-[27px] font-semibold tracking-[-0.025em] leading-tight"
              style={{ color: isLight ? '#1A1C1E' : '#F5F4FA' }}
            >
              PixelFlow
            </h1>
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#A6A6B2] font-medium mt-0.5">
              YOUR VIDEO SPACE
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSearchVisible((prev) => !prev)}
              aria-label="Search videos"
              title="Search videos"
              className="w-[42px] h-[46px] rounded-2xl flex items-center justify-center active:scale-95 transition shadow-xs"
              style={{ backgroundColor: accent.primary, color: accent.ink }}
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsQuickSettingsOpen(true)}
              aria-label="Quick settings"
              title="Quick settings"
              className="w-[42px] h-[46px] rounded-2xl flex items-center justify-center active:scale-95 transition shadow-xs"
              style={{ backgroundColor: accent.primary, color: accent.ink }}
            >
              <Grid className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              title="Settings"
              className="w-[42px] h-[46px] rounded-2xl flex items-center justify-center active:scale-95 transition shadow-xs"
              style={{ backgroundColor: accent.primary, color: accent.ink }}
            >
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => setIsAddVideoOpen(true)}
              aria-label="Add videos"
              title="Add videos"
              className="w-[42px] h-[46px] rounded-2xl flex items-center justify-center active:scale-95 transition shadow-xs"
              style={{ backgroundColor: accent.primary, color: accent.ink }}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Search input bar */}
        {searchVisible && (
          <div className="mt-4 relative animate-in fade-in duration-150">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, folders, and streams"
              className={`w-full h-[50px] px-4 pr-10 rounded-2xl text-sm placeholder-[#A6A6B2] border border-transparent focus:outline-none transition ${
                isLight ? 'bg-white shadow-xs border-black/10 text-gray-900' : 'bg-[#1D1E23] text-[#F5F4FA]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#A6A6B2] hover:text-[#F5F4FA] transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tabs: Videos vs Folders */}
        <div className="flex items-center space-x-2 py-3.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('videos');
              setSelectedFolder(null);
            }}
            className={`flex-1 h-10 rounded-[14px] text-sm font-medium transition flex items-center justify-center ${
              activeTab === 'videos'
                ? isLight
                  ? 'bg-black/10 font-bold'
                  : 'bg-[#26272D] font-bold'
                : 'text-[#A6A6B2] hover:text-white'
            }`}
            style={{ color: activeTab === 'videos' ? accent.primary : undefined }}
          >
            Videos
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('folders');
              setSelectedFolder(null);
            }}
            className={`flex-1 h-10 rounded-[14px] text-sm font-medium transition flex items-center justify-center ${
              activeTab === 'folders'
                ? isLight
                  ? 'bg-black/10 font-bold'
                  : 'bg-[#26272D] font-bold'
                : 'text-[#A6A6B2] hover:text-white'
            }`}
            style={{ color: activeTab === 'folders' ? accent.primary : undefined }}
          >
            Folders
          </button>
        </div>

        {/* Folder navigation breadcrumb */}
        {selectedFolder && (
          <div className="pb-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFolder(null);
                setActiveTab('folders');
              }}
              className="text-xs font-medium flex items-center space-x-1 transition group"
              style={{ color: accent.primary }}
            >
              <span className="text-sm">‹</span>
              <span className="group-hover:underline">All folders</span>
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

        {/* Continue Watching Shelf */}
        {watchHistory.length > 0 && !selectedFolder && (
          <div className="mb-4 pt-1 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A6A6B2] flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
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
              {watchHistory.slice(0, 5).map((item) => {
                const targetVid = videos.find((v) => v.id === item.videoId);
                if (!targetVid) return null;
                const progressPct = Math.min(100, (item.positionSeconds / (item.durationSeconds || 1)) * 100);

                return (
                  <div
                    key={item.videoId}
                    onClick={() => handleStartPlayback(targetVid, item.positionSeconds)}
                    className="shrink-0 w-36 sm:w-40 rounded-2xl bg-[#1D1E23] p-2 cursor-pointer hover:bg-[#25262C] transition group"
                  >
                    <div className="w-full aspect-video rounded-xl bg-[#26272D] overflow-hidden relative">
                      {targetVid.thumbnailUrl ? (
                        <img src={targetVid.thumbnailUrl} alt={item.videoName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-[#C4B5FD] opacity-75" />
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
                    <h5 className="text-[11px] font-medium text-[#F5F4FA] truncate mt-1.5 group-hover:text-[#C4B5FD]">
                      {item.videoName}
                    </h5>
                    <p className="text-[9px] text-[#A6A6B2]">
                      Resume at {formatDuration(item.positionSeconds * 1000)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Library section header & Quick Sort indicator */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-[19px] font-medium" style={{ color: isLight ? '#1A1C1E' : '#F5F4FA' }}>
              {selectedFolder ? selectedFolder : 'Your library'}
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
              className="flex items-center space-x-1 hover:text-[#F5F4FA] transition p-1 rounded-md"
              title={`Sorting by ${settings.library.sortField} (${settings.library.sortOrder})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="capitalize">{settings.library.sortField}</span>
            </button>
            <span>·</span>
            <span>{libraryCountLabel}</span>
          </div>
        </div>

        {/* Main media content area */}
        <div className="flex-1 overflow-y-auto py-1">
          {videos.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#1D1E23]/40 border border-[#26272D] my-4">
              <FolderIcon className="w-12 h-12 text-[#C4B5FD] mx-auto mb-3 opacity-80" />
              <p className="text-sm font-medium text-[#F5F4FA]">No videos found yet</p>
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
            /* Folders view */
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
                    className={`w-full p-3.5 sm:p-4 rounded-[17px] flex items-center cursor-pointer transition active:scale-[0.99] border border-transparent hover:border-[#26272D] ${
                      isLight ? 'bg-white shadow-xs' : 'bg-[#1D1E23] hover:bg-[#25262C]'
                    }`}
                  >
                    <div 
                      className="w-[52px] h-[52px] rounded-[13px] bg-[#26272D] flex items-center justify-center text-xl font-bold shrink-0"
                      style={{ color: accent.primary }}
                    >
                      ▰
                    </div>

                    <div className="flex-1 min-w-0 pl-3.5 pr-2">
                      <h3 className="text-[15px] font-medium truncate" style={{ color: isLight ? '#1A1C1E' : '#F5F4FA' }}>
                        {folder}
                      </h3>
                      <p className="text-xs text-[#A6A6B2] mt-1">
                        {entries.length} {entries.length === 1 ? 'video' : 'videos'}
                      </p>
                    </div>

                    <span className="text-[#A6A6B2] text-2xl font-light shrink-0">
                      ›
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Videos view (in List or Grid mode) */
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
                        className={`group relative rounded-[17px] overflow-hidden p-2.5 cursor-pointer transition active:scale-[0.98] border ${
                          isLight ? 'bg-white shadow-xs' : 'bg-[#1D1E23] hover:bg-[#25262C]'
                        } ${
                          isCurrent ? 'border-[#C4B5FD]' : 'border-transparent'
                        }`}
                      >
                        <div className="w-full aspect-video rounded-xl bg-[#26272D] overflow-hidden relative flex items-center justify-center">
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
                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-[#F5F4FA]">
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

                        <div className="mt-2">
                          <h4 
                            className="text-xs font-medium line-clamp-2 leading-snug transition"
                            style={{ color: isLight ? '#1A1C1E' : '#F5F4FA' }}
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
                        className={`w-full p-2.5 sm:p-3 rounded-[17px] flex items-center cursor-pointer transition active:scale-[0.99] border ${
                          isLight ? 'bg-white shadow-xs' : 'bg-[#1D1E23] hover:bg-[#25262C]'
                        } ${
                          isCurrent ? 'border-[#C4B5FD]' : 'border-transparent'
                        }`}
                      >
                        <div className="w-[104px] h-[72px] rounded-xl bg-[#26272D] overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
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
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#F5F4FA]">
                              {formatDuration(video.durationMs)}
                            </span>
                          )}

                          {progressPct > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                              <div className="h-full bg-red-500" style={{ width: `${progressPct}%` }} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pl-3 pr-1">
                          <h4 className="text-sm font-medium line-clamp-2 leading-snug" style={{ color: isLight ? '#1A1C1E' : '#F5F4FA' }}>
                            {video.name}
                          </h4>
                          <p className="text-[11px] text-[#A6A6B2] mt-1">
                            {formatDuration(video.durationMs)} · {formatSize(video.sizeBytes)}
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
        <footer className="py-2.5 text-center shrink-0">
          <p className="text-[11px] text-[#A6A6B2]">
            {statusMessage}
          </p>
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
      />
    </div>
  );
}
