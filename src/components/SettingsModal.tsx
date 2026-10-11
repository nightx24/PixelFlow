import React, { useState } from 'react';
import { 
  Palette, 
  Film, 
  PlayCircle, 
  Hand, 
  Volume2, 
  Subtitles, 
  ShieldCheck, 
  Info,
  ChevronRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { PlayerSettings } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanLibrary: () => void;
  playerSettings: PlayerSettings;
  onUpdatePlayerSettings: (newSettings: Partial<PlayerSettings>) => void;
  totalVideosCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onScanLibrary,
  playerSettings,
  onUpdatePlayerSettings,
  totalVideosCount,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const settingItems = [
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Adjust the app to your liking',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[#A6A6B2]">
            PixelFlow uses a dark theme with a lavender accent.
          </p>
          <div className="p-4 rounded-2xl bg-[#26272D] flex items-center justify-between">
            <span className="text-sm font-medium">Color Palette</span>
            <div className="flex space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#101114] border border-[#26272D]" title="Background" />
              <span className="w-5 h-5 rounded-full bg-[#1D1E23] border border-[#3B3D47]" title="Surface" />
              <span className="w-5 h-5 rounded-full bg-[#C4B5FD]" title="Lavender Accent" />
            </div>
          </div>
          <p className="text-xs text-[#A6A6B2]">
            Designed for low eye strain with high contrast readable typography.
          </p>
        </div>
      )
    },
    {
      id: 'library',
      title: 'Media library',
      subtitle: 'Scan and manage media library',
      icon: Film,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[#A6A6B2]">
            Currently tracking {totalVideosCount} videos in your library.
          </p>
          <button
            type="button"
            onClick={() => {
              onScanLibrary();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#26272D] hover:bg-[#34363F] text-[#F5F4FA] text-sm font-medium flex items-center justify-center space-x-2 transition"
          >
            <RefreshCw className="w-4 h-4 text-[#C4B5FD]" />
            <span>Rescan and Refresh Library</span>
          </button>
          <p className="text-xs text-[#A6A6B2]">
            You can also import local video files or streams anytime via the + button.
          </p>
        </div>
      )
    },
    {
      id: 'player',
      title: 'Player',
      subtitle: 'Player appearance, playback controls',
      icon: PlayCircle,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[#A6A6B2]">
            Playback controls are available on the video player.
          </p>
          <div className="p-3 rounded-2xl bg-[#26272D] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Auto-play Next Video</span>
              <input
                type="checkbox"
                checked={playerSettings.autoPlayNext}
                onChange={(e) => onUpdatePlayerSettings({ autoPlayNext: e.target.checked })}
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Loop Playback</span>
              <input
                type="checkbox"
                checked={playerSettings.loop}
                onChange={(e) => onUpdatePlayerSettings({ loop: e.target.checked })}
                className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'gestures',
      title: 'Gestures',
      subtitle: 'Configure player touch gestures',
      icon: Hand,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[#A6A6B2]">
            Touch gestures and keyboard shortcuts:
          </p>
          <ul className="text-xs text-[#A6A6B2] space-y-2 bg-[#26272D] p-3 rounded-2xl">
            <li>• <strong className="text-[#F5F4FA]">Double tap or arrow keys:</strong> Seek ±10 seconds</li>
            <li>• <strong className="text-[#F5F4FA]">Space bar:</strong> Play / Pause toggle</li>
            <li>• <strong className="text-[#F5F4FA]">F key:</strong> Fullscreen toggle</li>
            <li>• <strong className="text-[#F5F4FA]">M key:</strong> Mute / Unmute</li>
          </ul>
        </div>
      )
    },
    {
      id: 'audio',
      title: 'Audio',
      subtitle: 'Audio playback options',
      icon: Volume2,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[#A6A6B2]">
            Audio playback and volume normalization.
          </p>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#26272D] text-sm">
            <span>Audio Boost</span>
            <input
              type="checkbox"
              checked={playerSettings.audioBoost}
              onChange={(e) => onUpdatePlayerSettings({ audioBoost: e.target.checked })}
              className="w-4 h-4 accent-[#C4B5FD] rounded cursor-pointer"
            />
          </div>
        </div>
      )
    },
    {
      id: 'subtitle',
      title: 'Subtitle',
      subtitle: 'Subtitle appearance, playback options',
      icon: Subtitles,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-[#A6A6B2]">
            Subtitle controls are integrated into video playback. SubRip (.srt) and WebVTT (.vtt) files are supported.
          </p>
        </div>
      )
    },
    {
      id: 'general',
      title: 'General',
      subtitle: 'User data options',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#26272D]">
            <h4 className="text-sm font-semibold text-[#F5F4FA] mb-1">Local Privacy First</h4>
            <p className="text-xs text-[#A6A6B2]">
              Your media stays on your device. PixelFlow does not track, upload, or index your personal media files to any external cloud.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'Version, support, credits',
      icon: Info,
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#26272D] text-center">
            <h4 className="text-lg font-bold text-[#F5F4FA]">PixelFlow</h4>
            <p className="text-xs text-[#C4B5FD] mt-0.5 font-medium">Version 0.1.1</p>
            <p className="text-xs text-[#A6A6B2] mt-3 leading-relaxed">
              A minimal video-player project targeting Linux, Android, and Web, inspired by NextPlayer and mpv.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentItem = settingItems.find((s) => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
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
            <h2 className="text-xl font-semibold text-[#F5F4FA]">Settings</h2>
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
          {activeSection && currentItem ? (
            <div className="py-2">
              <h3 className="text-base font-semibold text-[#F5F4FA] mb-1">{currentItem.title}</h3>
              <p className="text-xs text-[#A6A6B2] mb-4">{currentItem.subtitle}</p>
              {currentItem.content}
            </div>
          ) : (
            settingItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full p-3.5 rounded-2xl bg-transparent hover:bg-[#26272D] flex items-center text-left transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#26272D] group-hover:bg-[#32333B] flex items-center justify-center text-[#C4B5FD] shrink-0 mr-3.5 transition">
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
