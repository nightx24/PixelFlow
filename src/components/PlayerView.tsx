import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X,
  Gauge,
  Sliders
} from 'lucide-react';
import { VideoEntry, PlayerSettings } from '../types.ts';
import { formatDuration } from '../utils.ts';

interface PlayerViewProps {
  video: VideoEntry | null;
  settings: PlayerSettings;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onEnded?: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  video,
  settings,
  onClose,
  onStatusChange,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(settings.volume);
  const [isMuted, setIsMuted] = useState<boolean>(settings.isMuted);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(settings.playbackSpeed);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'fit' | 'contain' | 'cover'>(settings.fitMode);

  const controlsTimeoutRef = useRef<number | null>(null);

  const hideControlsLater = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (!video) return;

    setIsLoading(true);
    onStatusChange('Loading video…');

    const v = videoRef.current;
    if (v) {
      v.playbackRate = playbackSpeed;
      v.volume = isMuted ? 0 : volume;
      v.loop = settings.loop;
      v.play()
        .then(() => {
          setIsPlaying(true);
          onStatusChange(`Now playing · ${video.name}`);
        })
        .catch(() => {
          setIsPlaying(false);
          onStatusChange('Ready to play');
        });
    }
  }, [video, onStatusChange]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
      onStatusChange(`Now playing · ${video?.name || 'video'}`);
    } else {
      v.pause();
      setIsPlaying(false);
      onStatusChange('Paused');
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + deltaSeconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const newTime = parseFloat(e.target.value);
    v.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    v.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    v.volume = newVol;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      v.muted = false;
    }
  };

  const handleSpeedSelect = (speed: number) => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleFitMode = () => {
    setFitMode(prev => (prev === 'contain' ? 'cover' : 'contain'));
  };

  if (!video) return null;

  const currentMs = currentTime * 1000;
  const durationMs = (duration || (video.durationMs / 1000)) * 1000;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[240px] sm:h-[320px] md:h-[400px]'
      }`}
      onMouseMove={() => {
        setShowControls(true);
        hideControlsLater();
      }}
      onClick={() => {
        setShowControls(true);
        hideControlsLater();
      }}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={video.url}
        className={`w-full h-full ${
          fitMode === 'cover' ? 'object-cover' : 'object-contain'
        }`}
        playsInline
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
          }
        }}
        onWaiting={() => {
          setIsLoading(true);
          onStatusChange('Buffering…');
        }}
        onCanPlay={() => {
          setIsLoading(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onStatusChange('Playback finished');
          if (onEnded) onEnded();
        }}
        onError={() => {
          setIsLoading(false);
          onStatusChange('Playback error: Unable to load media');
        }}
      />

      {/* Top bar overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-200 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-2 truncate pr-4">
          <span className="w-2 h-2 rounded-full bg-[#C4B5FD] animate-pulse" />
          <h3 className="text-sm sm:text-base font-medium text-[#F5F4FA] truncate">
            {video.name}
          </h3>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={toggleFitMode}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F4FA] text-xs transition"
            title={`Display mode: ${fitMode === 'cover' ? 'Fill' : 'Fit'}`}
          >
            {fitMode === 'cover' ? 'Fill' : 'Fit'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F4FA] transition"
            title="Close player"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Center play/pause & buffering indicator */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 border-4 border-[#C4B5FD]/30 border-t-[#C4B5FD] rounded-full animate-spin" />
        </div>
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center space-x-6 z-10 transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(-10);
            }}
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-[#F5F4FA] hover:text-[#C4B5FD] backdrop-blur-sm transition active:scale-95"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-4 sm:p-5 rounded-full bg-[#C4B5FD] text-[#241948] hover:bg-[#D8CCFF] shadow-lg shadow-[#C4B5FD]/20 transition active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(10);
            }}
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-[#F5F4FA] hover:text-[#C4B5FD] backdrop-blur-sm transition active:scale-95"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom control bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-200 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrub slider */}
        <div className="flex items-center space-x-3 mb-2 sm:mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C4B5FD]"
          />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#F5F4FA]">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-[#C4B5FD] transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Time display */}
            <span className="font-mono text-[11px] sm:text-xs text-[#A6A6B2]">
              {formatDuration(currentMs)} / {formatDuration(durationMs)}
            </span>

            {/* Volume control */}
            <div className="hidden sm:flex items-center space-x-2 group">
              <button
                onClick={toggleMute}
                className="hover:text-[#C4B5FD] transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C4B5FD]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Speed menu */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs flex items-center space-x-1 transition"
                title="Playback Speed"
              >
                <Gauge className="w-3.5 h-3.5 mr-1" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#1D1E23] border border-[#26272D] rounded-xl shadow-xl z-30 min-w-[90px]">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedSelect(s)}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#26272D] transition ${
                        playbackSpeed === s ? 'text-[#C4B5FD] font-semibold' : 'text-[#F5F4FA]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-[#C4B5FD] transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
