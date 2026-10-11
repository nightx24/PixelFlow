import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Settings, 
  Grid, 
  Plus, 
  Folder as FolderIcon, 
  Play, 
  ChevronRight, 
  X
} from 'lucide-react';
import { VideoEntry, ViewTab, ViewMode, LayoutMode, PlayerSettings } from './types.ts';
import { INITIAL_VIDEOS } from './sampleVideos.ts';
import { formatDuration, formatSize } from './utils.ts';
import { PlayerView } from './components/PlayerView.tsx';
import { QuickSettingsModal } from './components/QuickSettingsModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AddVideoModal } from './components/AddVideoModal.tsx';

export default function App() {
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
  const [viewMode, setViewMode] = useState<ViewMode>('Folders');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('List');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Choose a video to start playback');

  // Modals
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState<boolean>(false);

  // Player settings
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>({
    playbackSpeed: 1.0,
    loop: false,
    autoPlayNext: true,
    volume: 1.0,
    isMuted: false,
    doubleTapSeekSeconds: 10,
    fitMode: 'contain',
    audioBoost: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync videos to localStorage (excluding blob URLs which expire across sessions)
  useEffect(() => {
    const serializable = videos.filter((v) => !v.url.startsWith('blob:'));
    if (serializable.length > 0) {
      localStorage.setItem('pixelflow_videos', JSON.stringify(serializable));
    }
  }, [videos]);

  // Focus search input when toggled open
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

  // List of unique folders
  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => set.add(v.folder || 'Other'));
    return Array.from(set).sort();
  }, [videos]);

  // Filtered videos based on folder and search query
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      const folderMatches = selectedFolder === null || v.folder === selectedFolder;
      const queryMatches = !q || v.name.toLowerCase().includes(q) || v.folder.toLowerCase().includes(q);
      return folderMatches && queryMatches;
    });
  }, [videos, selectedFolder, searchQuery]);

  // Grouped folders for the folders tab
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

  const handleStartPlayback = (video: VideoEntry) => {
    setActiveVideo(video);
    setStatusMessage(`Now playing · ${video.name}`);
  };

  const handleVideoEnded = () => {
    if (playerSettings.autoPlayNext && activeVideo) {
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

  const handleAddVideos = (newVideos: VideoEntry[]) => {
    setVideos((prev) => [...newVideos, ...prev]);
    setStatusMessage(`Added ${newVideos.length} new video${newVideos.length > 1 ? 's' : ''}`);
    if (newVideos.length > 0) {
      handleStartPlayback(newVideos[0]);
    }
  };

  // Determine count label in the header
  const libraryCountLabel = useMemo(() => {
    if (activeTab === 'folders' && selectedFolder === null) {
      return `${folderGroups.length} folders`;
    }
    return `${filteredVideos.length} videos`;
  }, [activeTab, selectedFolder, folderGroups.length, filteredVideos.length]);

  return (
    <div className="min-h-screen bg-[#101114] text-[#F5F4FA] flex flex-col font-sans select-none">
      {/* Main container with standard mobile/desktop bounds */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex-1 flex flex-col">
        {/* Header Toolbar */}
        <header className="flex items-center justify-between py-2">
          {/* Brand title */}
          <div className="flex flex-col">
            <h1 className="text-[27px] font-semibold tracking-[-0.025em] text-[#F5F4FA] leading-tight">
              PixelFlow
            </h1>
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#A6A6B2] font-medium mt-0.5">
              YOUR VIDEO SPACE
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Search button */}
            <button
              type="button"
              onClick={() => setSearchVisible((prev) => !prev)}
              aria-label="Search videos"
              title="Search videos"
              className="w-[42px] h-[46px] rounded-2xl bg-[#C4B5FD] text-[#241948] flex items-center justify-center hover:bg-[#D8CCFF] active:scale-95 transition shadow-xs"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Quick settings button */}
            <button
              type="button"
              onClick={() => setIsQuickSettingsOpen(true)}
              aria-label="Quick settings"
              title="Quick settings"
              className="w-[42px] h-[46px] rounded-2xl bg-[#C4B5FD] text-[#241948] flex items-center justify-center hover:bg-[#D8CCFF] active:scale-95 transition shadow-xs"
            >
              <Grid className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              title="Settings"
              className="w-[42px] h-[46px] rounded-2xl bg-[#C4B5FD] text-[#241948] flex items-center justify-center hover:bg-[#D8CCFF] active:scale-95 transition shadow-xs"
            >
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Add video button */}
            <button
              type="button"
              onClick={() => setIsAddVideoOpen(true)}
              aria-label="Add videos"
              title="Add videos"
              className="w-[42px] h-[46px] rounded-2xl bg-[#C4B5FD] text-[#241948] flex items-center justify-center hover:bg-[#D8CCFF] active:scale-95 transition shadow-xs"
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
              placeholder="Search videos and folders"
              className="w-full h-[50px] px-4 pr-10 rounded-2xl bg-[#1D1E23] text-sm text-[#F5F4FA] placeholder-[#A6A6B2] border border-transparent focus:border-[#C4B5FD]/40 focus:outline-none transition"
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
                ? 'bg-[#26272D] text-[#C4B5FD] font-semibold'
                : 'bg-[#101114] text-[#A6A6B2] hover:text-[#F5F4FA]'
            }`}
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
                ? 'bg-[#26272D] text-[#C4B5FD] font-semibold'
                : 'bg-[#101114] text-[#A6A6B2] hover:text-[#F5F4FA]'
            }`}
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
              className="text-xs text-[#C4B5FD] hover:text-[#D8CCFF] font-medium flex items-center space-x-1 transition group"
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
              settings={playerSettings}
              onClose={() => {
                setActiveVideo(null);
                setStatusMessage('Choose a video to start playback');
              }}
              onStatusChange={setStatusMessage}
              onEnded={handleVideoEnded}
            />
          </div>
        )}

        {/* Library section header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-[19px] font-medium text-[#F5F4FA]">
              {selectedFolder ? selectedFolder : 'Your library'}
            </h2>
          </div>
          <span className="text-xs text-[#A6A6B2]">
            {libraryCountLabel}
          </span>
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
                className="mt-4 px-4 py-2 rounded-xl bg-[#C4B5FD] text-[#241948] text-xs font-semibold hover:bg-[#D8CCFF] transition shadow-xs inline-flex items-center space-x-1.5"
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
                    className="w-full p-3.5 sm:p-4 rounded-[17px] bg-[#1D1E23] hover:bg-[#25262C] flex items-center cursor-pointer transition active:scale-[0.99] border border-transparent hover:border-[#26272D]"
                  >
                    {/* Folder squircle icon matching Android ▰ layout */}
                    <div className="w-[52px] h-[52px] rounded-[13px] bg-[#26272D] flex items-center justify-center text-[#C4B5FD] text-xl font-bold shrink-0">
                      ▰
                    </div>

                    {/* Folder info */}
                    <div className="flex-1 min-w-0 pl-3.5 pr-2">
                      <h3 className="text-[15px] font-medium text-[#F5F4FA] truncate">
                        {folder}
                      </h3>
                      <p className="text-xs text-[#A6A6B2] mt-1">
                        {entries.length} {entries.length === 1 ? 'video' : 'videos'}
                      </p>
                    </div>

                    {/* Right chevron › */}
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
                  No matching videos. Try another search.
                </p>
              ) : layoutMode === 'Grid' ? (
                /* Grid mode */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredVideos.map((video) => {
                    const isCurrent = activeVideo?.id === video.id;
                    return (
                      <div
                        key={video.id}
                        onClick={() => handleStartPlayback(video)}
                        className={`group relative rounded-[17px] bg-[#1D1E23] overflow-hidden p-2.5 cursor-pointer hover:bg-[#25262C] transition active:scale-[0.98] border ${
                          isCurrent ? 'border-[#C4B5FD]' : 'border-transparent'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-full aspect-video rounded-xl bg-[#26272D] overflow-hidden relative flex items-center justify-center">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#26272D] to-[#1D1E23]">
                              <Play className="w-6 h-6 text-[#C4B5FD] fill-current opacity-80" />
                            </div>
                          )}
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-[#F5F4FA]">
                            {formatDuration(video.durationMs)}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-[#F5F4FA] line-clamp-2 leading-snug group-hover:text-[#C4B5FD] transition">
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
                /* List mode matching Android addVideoRow() */
                <div className="space-y-2.5">
                  {filteredVideos.map((video) => {
                    const isCurrent = activeVideo?.id === video.id;
                    return (
                      <div
                        key={video.id}
                        onClick={() => handleStartPlayback(video)}
                        className={`w-full p-2.5 sm:p-3 rounded-[17px] bg-[#1D1E23] hover:bg-[#25262C] flex items-center cursor-pointer transition active:scale-[0.99] border ${
                          isCurrent ? 'border-[#C4B5FD]' : 'border-transparent'
                        }`}
                      >
                        {/* Video Thumbnail (104x72 on Android) */}
                        <div className="w-[104px] h-[72px] rounded-xl bg-[#26272D] overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#26272D] to-[#1D1E23]">
                              <Play className="w-5 h-5 text-[#C4B5FD] fill-current opacity-80" />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#F5F4FA]">
                            {formatDuration(video.durationMs)}
                          </span>
                        </div>

                        {/* Video info */}
                        <div className="flex-1 min-w-0 pl-3 pr-1">
                          <h4 className="text-sm font-medium text-[#F5F4FA] line-clamp-2 leading-snug">
                            {video.name}
                          </h4>
                          <p className="text-[11px] text-[#A6A6B2] mt-1">
                            {formatDuration(video.durationMs)} · {formatSize(video.sizeBytes)}
                          </p>
                          <p className="text-[10px] text-[#A6A6B2] mt-0.5 truncate">
                            {video.folder}
                          </p>
                        </div>

                        {/* Playing badge or indicator */}
                        {isCurrent && (
                          <div className="shrink-0 pr-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C4B5FD] inline-block animate-pulse" />
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
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          if (m === 'Videos') {
            setActiveTab('videos');
            setSelectedFolder(null);
          } else if (m === 'Folders') {
            setActiveTab('folders');
            setSelectedFolder(null);
          }
        }}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onScanLibrary={handleRescanLibrary}
        playerSettings={playerSettings}
        onUpdatePlayerSettings={(patch) =>
          setPlayerSettings((prev) => ({ ...prev, ...patch }))
        }
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
