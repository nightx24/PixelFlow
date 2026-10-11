import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  Sun,
  Tv,
  Subtitles as SubtitlesIcon,
  FastForward,
  Zap,
  Mic,
  Repeat
} from 'lucide-react';
import { VideoEntry, PixelFlowSettings, SubtitleTrack, SubtitleCue } from '../types.ts';
import { formatDuration, parseSRT, ACCENT_COLORS, getAccentPalette } from '../utils.ts';

interface PlayerViewProps {
  video: VideoEntry | null;
  settings: PixelFlowSettings;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onEnded?: () => void;
  onProgressUpdate?: (positionSec: number, durationSec: number) => void;
  initialSeekSeconds?: number;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  video,
  settings,
  onClose,
  onStatusChange,
  onEnded,
  onProgressUpdate,
  initialSeekSeconds,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(settings.audio.muteOnStart);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(settings.player.defaultPlaybackSpeed);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<typeof settings.player.fitMode>(settings.player.fitMode);
  const [loopMode, setLoopMode] = useState<typeof settings.player.loopMode>(settings.player.loopMode);

  // Subtitles
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState<string | null>(
    video?.subtitles && video.subtitles.length > 0 && settings.subtitles.enabled ? video.subtitles[0].id : null
  );
  const [customSubtitleCues, setCustomSubtitleCues] = useState<SubtitleCue[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showFitMenu, setShowFitMenu] = useState<boolean>(false);

  // Gesture HUD State
  const [hudType, setHudType] = useState<'brightness' | 'volume' | 'seek' | 'fastforward' | 'doubletap' | null>(null);
  const [hudValue, setHudValue] = useState<string | number>('');
  const [hudSide, setHudSide] = useState<'left' | 'right' | 'center'>('center');
  const hudTimeoutRef = useRef<number | null>(null);

  // Gesture Tracking Refs
  const isDraggingRef = useRef<boolean>(false);
  const gestureTypeRef = useRef<'left_vertical' | 'right_vertical' | 'horizontal' | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartXRef = useRef<number>(0);
  const startBrightnessRef = useRef<number>(1.0);
  const startVolumeRef = useRef<number>(1.0);
  const startSeekTimeRef = useRef<number>(0);
  const isLongPressingRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Web Audio Context for Volume Boost & Speech Clarity
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const accent = useMemo(() => {
    return getAccentPalette(settings.appearance.accentColor, settings.appearance.customAccentHex);
  }, [settings.appearance.accentColor, settings.appearance.customAccentHex]);

  const triggerHud = useCallback((type: 'brightness' | 'volume' | 'seek' | 'fastforward' | 'doubletap', value: string | number, side: 'left' | 'right' | 'center' = 'center') => {
    setHudType(type);
    setHudValue(value);
    setHudSide(side);
    if (hudTimeoutRef.current) window.clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = window.setTimeout(() => {
      setHudType(null);
    }, 1200);
  }, []);

  // Web Audio initialization
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Only hook Web Audio if boost or clarity is active to prevent cross-origin issues with remote streams
    if (settings.audio.volumeBoost || settings.audio.nightModeSpeechClarity) {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(v);
            gainNodeRef.current = audioContextRef.current.createGain();
            compressorNodeRef.current = audioContextRef.current.createDynamicsCompressor();

            // Connect graph
            sourceNodeRef.current.connect(compressorNodeRef.current);
            compressorNodeRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContextRef.current.destination);
          }
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = settings.audio.volumeBoost ? 2.0 : 1.0;
        }

        if (compressorNodeRef.current) {
          if (settings.audio.nightModeSpeechClarity) {
            compressorNodeRef.current.threshold.value = -30;
            compressorNodeRef.current.knee.value = 20;
            compressorNodeRef.current.ratio.value = 8;
            compressorNodeRef.current.attack.value = 0.005;
            compressorNodeRef.current.release.value = 0.2;
          } else {
            compressorNodeRef.current.threshold.value = 0;
            compressorNodeRef.current.ratio.value = 1;
          }
        }
      } catch {
        // Fallback for CORS protected streams
      }
    }
  }, [settings.audio.volumeBoost, settings.audio.nightModeSpeechClarity]);

  const hideControlsLater = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    const timeout = (settings.player.controllerTimeoutSec || 3) * 1000;
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, timeout);
  }, [isPlaying, settings.player.controllerTimeoutSec]);

  // Load Video & Initial Seek
  useEffect(() => {
    if (!video) return;

    setIsLoading(true);
    onStatusChange('Loading video…');

    const v = videoRef.current;
    if (v) {
      v.playbackRate = playbackSpeed;
      v.volume = isMuted ? 0 : volume;
      v.loop = loopMode === 'one';

      if (initialSeekSeconds && initialSeekSeconds > 1 && settings.player.resumePlayback) {
        v.currentTime = initialSeekSeconds;
        setCurrentTime(initialSeekSeconds);
        triggerHud('seek', `Resumed at ${formatDuration(initialSeekSeconds * 1000)}`, 'center');
      }

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
  }, [video, initialSeekSeconds]);

  // Fullscreen change listener
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
    const target = Math.max(0, Math.min(v.duration || 0, v.currentTime + deltaSeconds));
    v.currentTime = target;
    setCurrentTime(target);
    triggerHud('doubletap', `${deltaSeconds > 0 ? '+' : ''}${deltaSeconds}s`, deltaSeconds > 0 ? 'right' : 'left');
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
    triggerHud('volume', newMuted ? 'Muted' : `${Math.round(volume * 100)}%`, 'right');
  };

  const handleVolumeChange = (newVol: number) => {
    const v = videoRef.current;
    if (!v) return;
    const bounded = Math.max(0, Math.min(1.0, newVol));
    setVolume(bounded);
    v.volume = bounded;
    if (bounded > 0 && isMuted) {
      setIsMuted(false);
      v.muted = false;
    }
    triggerHud('volume', `${Math.round(bounded * 100)}%`, 'right');
  };

  const handleBrightnessChange = (newBright: number) => {
    const bounded = Math.max(0.2, Math.min(1.8, newBright));
    setBrightness(bounded);
    triggerHud('brightness', `${Math.round(bounded * 100)}%`, 'left');
  };

  const handleSpeedSelect = (speed: number) => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedMenu(false);
    triggerHud('fastforward', `${speed}x Speed`, 'center');
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or failed
    }
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

  // Touch / Mouse Gestures Implementation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const widthRatio = x / rect.width;

    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    startBrightnessRef.current = brightness;
    startVolumeRef.current = volume;
    startSeekTimeRef.current = videoRef.current?.currentTime || 0;
    gestureTypeRef.current = null;

    // Double tap detector
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300 && settings.gestures.enableDoubleTapSeek) {
      const seekSec = settings.player.doubleTapSeekSeconds || 10;
      if (widthRatio < 0.4) {
        seekRelative(-seekSec);
      } else if (widthRatio > 0.6) {
        seekRelative(seekSec);
      } else {
        togglePlay();
      }
      lastTapTimeRef.current = 0;
      return;
    }
    lastTapTimeRef.current = now;

    // Long press 2x fast forward detector
    if (settings.gestures.enableLongPressFastForward) {
      longPressTimerRef.current = window.setTimeout(() => {
        if (isDraggingRef.current && !gestureTypeRef.current && videoRef.current) {
          isLongPressingRef.current = true;
          videoRef.current.playbackRate = settings.gestures.fastForwardSpeed || 2.0;
          triggerHud('fastforward', `${settings.gestures.fastForwardSpeed || 2.0}x Fast Forward`, 'center');
        }
      }, 500);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = e.clientY - dragStartYRef.current;

    // Detect direction
    if (!gestureTypeRef.current) {
      if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        const startWidthRatio = (dragStartXRef.current - rect.left) / rect.width;
        if (startWidthRatio < 0.5 && settings.gestures.enableVerticalBrightness) {
          gestureTypeRef.current = 'left_vertical';
        } else if (startWidthRatio >= 0.5 && settings.gestures.enableVerticalVolume) {
          gestureTypeRef.current = 'right_vertical';
        }
      } else if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY) && settings.gestures.enableHorizontalSeek) {
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        gestureTypeRef.current = 'horizontal';
      }
    }

    if (gestureTypeRef.current === 'left_vertical') {
      const sensitivity = 0.005;
      const newBright = startBrightnessRef.current - deltaY * sensitivity;
      handleBrightnessChange(newBright);
    } else if (gestureTypeRef.current === 'right_vertical') {
      const sensitivity = 0.005;
      const newVol = startVolumeRef.current - deltaY * sensitivity;
      handleVolumeChange(newVol);
    } else if (gestureTypeRef.current === 'horizontal') {
      const sensitivity = 0.2; // seconds per pixel
      const seekDelta = deltaX * sensitivity;
      const v = videoRef.current;
      if (v) {
        const target = Math.max(0, Math.min(v.duration || 0, startSeekTimeRef.current + seekDelta));
        v.currentTime = target;
        setCurrentTime(target);
        const sign = seekDelta >= 0 ? '+' : '';
        triggerHud('seek', `${sign}${Math.round(seekDelta)}s (${formatDuration(target * 1000)})`, 'center');
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    gestureTypeRef.current = null;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);

    if (isLongPressingRef.current) {
      isLongPressingRef.current = false;
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed;
      }
      setHudType(null);
    }
  };

  // Subtitle cue matching
  const currentSubtitleCue = useMemo(() => {
    if (!settings.subtitles.enabled || !activeSubtitleTrack) return null;

    let cues: SubtitleCue[] = [];
    if (activeSubtitleTrack === 'custom') {
      cues = customSubtitleCues;
    } else {
      const track = video?.subtitles?.find((t) => t.id === activeSubtitleTrack);
      if (track?.cues) cues = track.cues;
    }

    const offsetSec = (settings.subtitles.syncOffsetMs || 0) / 1000;
    const adjustedTime = currentTime - offsetSec;

    return cues.find((c) => adjustedTime >= c.startTime && adjustedTime <= c.endTime);
  }, [currentTime, activeSubtitleTrack, customSubtitleCues, video?.subtitles, settings.subtitles]);

  // Handle external subtitle file upload
  const handleUploadSubtitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseSRT(content);
        setCustomSubtitleCues(parsed);
        setActiveSubtitleTrack('custom');
        triggerHud('seek', `Loaded ${parsed.length} subtitles from ${file.name}`, 'center');
      }
    };
    reader.readAsText(file);
    setShowSubtitleMenu(false);
  };

  if (!video) return null;

  const currentMs = currentTime * 1000;
  const durationMs = (duration || (video.durationMs / 1000)) * 1000;

  // Fit mode class
  const getFitStyle = () => {
    switch (fitMode) {
      case 'cover':
        return 'object-cover';
      case 'stretch':
        return 'object-fill';
      case '16:9':
        return 'aspect-video object-cover';
      case '4:3':
        return 'aspect-4/3 object-cover';
      default:
        return 'object-contain';
    }
  };

  // Subtitle styling classes based on settings
  const getSubtitleClasses = () => {
    const size = {
      small: 'text-xs sm:text-sm',
      medium: 'text-sm sm:text-base',
      large: 'text-base sm:text-xl',
      xlarge: 'text-lg sm:text-2xl',
    }[settings.subtitles.fontSize] || 'text-base';

    const color = {
      white: 'text-white',
      yellow: 'text-yellow-300',
      cyan: 'text-cyan-300',
      green: 'text-emerald-300',
    }[settings.subtitles.textColor] || 'text-white';

    const bg = {
      transparent: 'bg-transparent',
      'semi-black': 'bg-black/75 px-3 py-1 rounded-md backdrop-blur-2xs',
      black: 'bg-black px-3.5 py-1.5 rounded-md',
    }[settings.subtitles.backgroundColor] || 'bg-black/70';

    const shadow = {
      none: '',
      outline: '[text-shadow:_0_1px_3px_rgb(0_0_0_/_90%),_0_-1px_3px_rgb(0_0_0_/_90%)]',
      shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
    }[settings.subtitles.textShadow] || '';

    return `${size} ${color} ${bg} ${shadow} font-medium text-center max-w-[90%] leading-relaxed`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl transition-all duration-300 select-none ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[250px] sm:h-[340px] md:h-[420px]'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseMove={() => {
        setShowControls(true);
        hideControlsLater();
      }}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.url}
        crossOrigin="anonymous"
        className={`w-full h-full ${getFitStyle()} transition-filter duration-75`}
        style={{ filter: `brightness(${brightness})` }}
        playsInline
        onTimeUpdate={() => {
          if (videoRef.current) {
            const cur = videoRef.current.currentTime;
            setCurrentTime(cur);
            if (onProgressUpdate) {
              onProgressUpdate(cur, videoRef.current.duration || 0);
            }
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
          if (loopMode === 'one' && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
          } else if (onEnded) {
            onEnded();
          }
        }}
        onError={() => {
          setIsLoading(false);
          onStatusChange('Playback error: Unable to load media stream');
        }}
      />

      {/* On-Screen HUD Overlay for Gestures */}
      {hudType && (
        <div
          className={`absolute pointer-events-none z-40 transition-all duration-150 animate-in fade-in zoom-in-90 ${
            hudSide === 'left'
              ? 'top-1/2 left-8 -translate-y-1/2'
              : hudSide === 'right'
              ? 'top-1/2 right-8 -translate-y-1/2'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          }`}
        >
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-black/85 border border-white/10 backdrop-blur-md shadow-2xl min-w-[90px] text-white">
            {hudType === 'brightness' && (
              <>
                <Sun className="w-8 h-8 mb-2 animate-spin-slow" style={{ color: accent.primary }} />
                <span className="text-xs font-semibold text-[#A6A6B2] uppercase">Brightness</span>
                <span className="text-lg font-bold font-mono mt-0.5">{hudValue}</span>
              </>
            )}
            {hudType === 'volume' && (
              <>
                <Volume2 className="w-8 h-8 mb-2" style={{ color: accent.primary }} />
                <span className="text-xs font-semibold text-[#A6A6B2] uppercase">Volume</span>
                <span className="text-lg font-bold font-mono mt-0.5">{hudValue}</span>
              </>
            )}
            {hudType === 'seek' && (
              <>
                <FastForward className="w-8 h-8 mb-2" style={{ color: accent.primary }} />
                <span className="text-sm font-semibold font-mono text-center">{hudValue}</span>
              </>
            )}
            {hudType === 'doubletap' && (
              <>
                <div 
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono mb-1 animate-ping"
                  style={{ borderColor: accent.primary, color: accent.primary }}
                >
                  {hudValue}
                </div>
              </>
            )}
            {hudType === 'fastforward' && (
              <>
                <Zap className="w-8 h-8 text-yellow-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold text-yellow-300">{hudValue}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Subtitles Overlay */}
      {currentSubtitleCue && (
        <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none z-20 transition-all duration-100">
          <p className={getSubtitleClasses()}>
            {currentSubtitleCue.text}
          </p>
        </div>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between transition-opacity duration-200 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-2 truncate pr-4">
          <span 
            className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" 
            style={{ backgroundColor: accent.primary }}
          />
          <h3 className="text-sm sm:text-base font-medium text-[#F5F4FA] truncate">
            {video.name}
          </h3>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Subtitle Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
              className={`p-1.5 sm:p-2 rounded-xl transition text-xs flex items-center space-x-1 ${
                activeSubtitleTrack
                  ? 'font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-[#F5F4FA]'
              }`}
              style={{
                backgroundColor: activeSubtitleTrack ? accent.primary : undefined,
                color: activeSubtitleTrack ? accent.ink : undefined,
              }}
              title="Subtitles"
            >
              <SubtitlesIcon className="w-4 h-4" />
            </button>

            {showSubtitleMenu && (
              <div 
                className="absolute top-full right-0 mt-2 py-2 bg-[#1D1E23] border border-[#26272D] rounded-2xl shadow-2xl z-40 min-w-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A6A6B2]">
                  Subtitles
                </div>
                <button
                  onClick={() => {
                    setActiveSubtitleTrack(null);
                    setShowSubtitleMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition ${
                    activeSubtitleTrack === null ? 'font-semibold' : 'text-[#F5F4FA] hover:bg-[#26272D]'
                  }`}
                  style={{
                    color: activeSubtitleTrack === null ? accent.primary : undefined,
                  }}
                >
                  Off
                </button>
                {video.subtitles?.map((s: SubtitleTrack) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSubtitleTrack(s.id);
                      setShowSubtitleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition ${
                      activeSubtitleTrack === s.id ? 'font-semibold' : 'text-[#F5F4FA] hover:bg-[#26272D]'
                    }`}
                    style={{
                      color: activeSubtitleTrack === s.id ? accent.primary : undefined,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                {customSubtitleCues.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveSubtitleTrack('custom');
                      setShowSubtitleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition ${
                      activeSubtitleTrack === 'custom' ? 'font-semibold' : 'text-[#F5F4FA] hover:bg-[#26272D]'
                    }`}
                    style={{
                      color: activeSubtitleTrack === 'custom' ? accent.primary : undefined,
                    }}
                  >
                    Custom Uploaded SRT ({customSubtitleCues.length} cues)
                  </button>
                )}

                <div className="border-t border-[#26272D] my-1 pt-1 px-3">
                  <label 
                    className="block text-xs hover:underline cursor-pointer py-1"
                    style={{ color: accent.primary }}
                  >
                    Upload .SRT File…
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      className="hidden"
                      onChange={handleUploadSubtitle}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Aspect Ratio / Fit Menu */}
          <div className="relative">
            <button
              onClick={() => setShowFitMenu(!showFitMenu)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F4FA] text-xs transition flex items-center space-x-1"
              title="Aspect ratio and scale"
            >
              <Tv className="w-4 h-4" />
            </button>

            {showFitMenu && (
              <div 
                className="absolute top-full right-0 mt-2 py-1.5 bg-[#1D1E23] border border-[#26272D] rounded-2xl shadow-2xl z-40 min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                {(['contain', 'cover', 'stretch', '16:9', '4:3'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setFitMode(mode);
                      setShowFitMenu(false);
                      triggerHud('seek', `Scale: ${mode.toUpperCase()}`, 'center');
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs uppercase font-medium transition ${
                      fitMode === mode ? 'font-bold' : 'text-[#F5F4FA] hover:bg-[#26272D]'
                    }`}
                    style={{
                      color: fitMode === mode ? accent.primary : undefined,
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Picture in Picture */}
          {document.pictureInPictureEnabled && (
            <button
              onClick={togglePiP}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F4FA] transition"
              title="Picture in Picture"
            >
              <Tv className="w-4 h-4 rotate-12" />
            </button>
          )}

          {/* Close Player */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F4FA] transition"
            title="Close player"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 border-4 border-[#C4B5FD]/30 border-t-[#C4B5FD] rounded-full animate-spin" />
        </div>
      ) : (
        /* Center Play/Pause & Skip Controls */
        <div
          className={`absolute inset-0 flex items-center justify-center space-x-6 z-10 transition-opacity duration-200 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(-(settings.player.doubleTapSeekSeconds || 10));
            }}
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-[#F5F4FA] hover:text-[#C4B5FD] backdrop-blur-sm transition active:scale-95"
            title={`Rewind ${settings.player.doubleTapSeekSeconds || 10} seconds`}
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-4 sm:p-5 rounded-full text-[#241948] shadow-lg transition active:scale-95"
            style={{ backgroundColor: accent.primary }}
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
              seekRelative(settings.player.doubleTapSeekSeconds || 10);
            }}
            className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-[#F5F4FA] hover:text-[#C4B5FD] backdrop-blur-sm transition active:scale-95"
            title={`Forward ${settings.player.doubleTapSeekSeconds || 10} seconds`}
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-200 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrub Slider */}
        <div className="flex items-center space-x-3 mb-2 sm:mb-2.5">
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

        {/* Action Row */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#F5F4FA]">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-[#C4B5FD] transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => {
                const nextMode = loopMode === 'off' ? 'one' : loopMode === 'one' ? 'all' : 'off';
                setLoopMode(nextMode);
                triggerHud('seek', `Loop: ${nextMode.toUpperCase()}`, 'center');
              }}
              className={`p-1 rounded-md transition ${
                loopMode !== 'off' ? 'text-[#C4B5FD] bg-[#C4B5FD]/10' : 'text-[#A6A6B2] hover:text-[#F5F4FA]'
              }`}
              title={`Loop Mode: ${loopMode}`}
            >
              <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Time Display */}
            <span className="font-mono text-[11px] sm:text-xs text-[#A6A6B2]">
              {formatDuration(currentMs)} / {formatDuration(durationMs)}
            </span>

            {/* Volume Control */}
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
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C4B5FD]"
              />
            </div>

            {/* Audio Boost / Clarity Badges */}
            {settings.audio.volumeBoost && (
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                Boost 200%
              </span>
            )}
            {settings.audio.nightModeSpeechClarity && (
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-semibold space-x-0.5">
                <Mic className="w-3 h-3 mr-0.5" />
                Clarity
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Speed Menu */}
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
                <div 
                  className="absolute bottom-full right-0 mb-2 py-1 bg-[#1D1E23] border border-[#26272D] rounded-xl shadow-xl z-40 min-w-[90px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map((s) => (
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

            {/* Fullscreen Button */}
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
