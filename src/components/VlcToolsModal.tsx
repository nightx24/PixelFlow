import React, { useState } from 'react';
import { 
  Sliders, 
  Sun, 
  RotateCcw, 
  Repeat, 
  Clock, 
  Volume2, 
  X, 
  Check, 
  Sparkles,
  Zap
} from 'lucide-react';
import { EqualizerPreset, ABRepeat, PixelFlowSettings } from '../types.ts';
import { EQUALIZER_FREQUENCIES, EQUALIZER_PRESETS, formatDuration } from '../utils.ts';
import { ToggleSwitch } from './ToggleSwitch.tsx';

interface VlcToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  accentInk: string;

  // Equalizer
  equalizerEnabled: boolean;
  onToggleEqualizer: (enabled: boolean) => void;
  equalizerPreset: EqualizerPreset;
  onSelectPreset: (preset: EqualizerPreset) => void;
  equalizerGains: number[];
  onChangeBandGain: (index: number, gain: number) => void;
  preampGain: number;
  onChangePreampGain: (gain: number) => void;
  onResetEqualizer: () => void;

  // Video Effects
  videoEffects: PixelFlowSettings['videoEffects'];
  onUpdateVideoEffects: (updater: (prev: PixelFlowSettings['videoEffects']) => PixelFlowSettings['videoEffects']) => void;
  onResetVideoEffects: () => void;

  // Audio / Subtitle Sync
  audioDelayMs: number;
  onChangeAudioDelay: (ms: number) => void;
  subtitleSyncOffsetMs: number;
  onChangeSubtitleSyncOffset: (ms: number) => void;

  // A-B Repeat
  abRepeat: ABRepeat;
  onSetPointA: () => void;
  onSetPointB: () => void;
  onClearAB: () => void;
  onToggleAB: () => void;
  currentTime: number;

  // Sleep Timer
  sleepTimerRemainingSec: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
}

type TabType = 'equalizer' | 'effects' | 'sync' | 'ab_repeat' | 'sleep_timer';

export const VlcToolsModal: React.FC<VlcToolsModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  accentInk,
  equalizerEnabled,
  onToggleEqualizer,
  equalizerPreset,
  onSelectPreset,
  equalizerGains,
  onChangeBandGain,
  preampGain,
  onChangePreampGain,
  onResetEqualizer,
  videoEffects,
  onUpdateVideoEffects,
  onResetVideoEffects,
  audioDelayMs,
  onChangeAudioDelay,
  subtitleSyncOffsetMs,
  onChangeSubtitleSyncOffset,
  abRepeat,
  onSetPointA,
  onSetPointB,
  onClearAB,
  onToggleAB,
  currentTime,
  sleepTimerRemainingSec,
  onSetSleepTimer,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('equalizer');

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'equalizer', label: 'Equalizer', icon: Sliders },
    { id: 'effects', label: 'Video Effects', icon: Sun },
    { id: 'sync', label: 'Track Sync', icon: Clock },
    { id: 'ab_repeat', label: 'A-B Loop', icon: Repeat },
    { id: 'sleep_timer', label: 'Sleep Timer', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#18191E] rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 text-[#F5F4FA] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <span 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h3 className="text-base sm:text-lg font-bold">VLC Player Tools</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[#A6A6B2] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection pill bar */}
        <div className="flex space-x-1.5 py-3 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
          {tabs.map((t) => {
            const isCurrent = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center space-x-1.5 transition ${
                  isCurrent ? 'font-bold shadow-xs' : 'bg-white/5 text-[#A6A6B2] hover:text-white hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: isCurrent ? accentColor : undefined,
                  color: isCurrent ? accentInk : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* EQUALIZER TAB */}
          {activeTab === 'equalizer' && (
            <div className="space-y-4">
              {/* Toggle & Preset row */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                <div>
                  <span className="text-sm font-semibold block">10-Band Graphic Equalizer</span>
                  <span className="text-xs text-[#A6A6B2]">Hardware Web Audio audio shaping</span>
                </div>
                <ToggleSwitch
                  checked={equalizerEnabled}
                  onChange={onToggleEqualizer}
                  accentColor={accentColor}
                  accentInk={accentInk}
                  size="sm"
                  ariaLabel="Enable Equalizer"
                />
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
                  VLC Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {Object.keys(EQUALIZER_PRESETS).filter(p => p !== 'custom').map((p) => {
                    const isSelected = equalizerPreset === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onSelectPreset(p as EqualizerPreset)}
                        className={`py-1.5 px-2 rounded-xl text-xs capitalize text-center transition ${
                          isSelected ? 'font-bold shadow-xs' : 'bg-white/5 text-[#A6A6B2] hover:text-white'
                        }`}
                        style={{
                          backgroundColor: isSelected ? accentColor : undefined,
                          color: isSelected ? accentInk : undefined,
                        }}
                      >
                        {p.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preamp slider */}
              <div className="p-3 rounded-2xl bg-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#A6A6B2]">Pre-Amplifier Gain</span>
                  <span className="font-mono font-bold" style={{ color: accentColor }}>
                    {preampGain > 0 ? `+${preampGain.toFixed(1)}` : preampGain.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={preampGain}
                  disabled={!equalizerEnabled}
                  onChange={(e) => onChangePreampGain(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor }}
                />
              </div>

              {/* 10 Vertical/Horizontal Frequency Sliders */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#A6A6B2]">Frequencies</span>
                  <button
                    type="button"
                    onClick={onResetEqualizer}
                    className="text-xs text-[#A6A6B2] hover:text-white flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center">
                  {EQUALIZER_FREQUENCIES.map((freq, idx) => {
                    const gain = equalizerGains[idx] || 0;
                    const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                    return (
                      <div key={freq} className="flex flex-col items-center space-y-1.5">
                        <span className="text-[10px] font-mono text-[#A6A6B2]">
                          {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                        </span>
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={gain}
                          disabled={!equalizerEnabled}
                          onChange={(e) => onChangeBandGain(idx, parseFloat(e.target.value))}
                          className="h-20 w-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                          style={{ accentColor }}
                        />
                        <span className="text-[10px] font-mono font-semibold text-[#F5F4FA]">
                          {freqLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIDEO EFFECTS TAB */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                <div>
                  <span className="text-sm font-semibold block">VLC Video Post-Processing</span>
                  <span className="text-xs text-[#A6A6B2]">Hardware-accelerated color grading</span>
                </div>
                <ToggleSwitch
                  checked={videoEffects.enabled}
                  onChange={(enabled) => onUpdateVideoEffects((prev) => ({ ...prev, enabled }))}
                  accentColor={accentColor}
                  accentInk={accentInk}
                  size="sm"
                  ariaLabel="Enable Video Effects"
                />
              </div>

              {/* Sliders */}
              <div className="space-y-3.5 p-3.5 rounded-2xl bg-white/5">
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A6A6B2]">Brightness</span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>
                      {videoEffects.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={1}
                    value={videoEffects.brightness}
                    disabled={!videoEffects.enabled}
                    onChange={(e) =>
                      onUpdateVideoEffects((prev) => ({ ...prev, brightness: parseInt(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor }}
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A6A6B2]">Contrast</span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>
                      {videoEffects.contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={1}
                    value={videoEffects.contrast}
                    disabled={!videoEffects.enabled}
                    onChange={(e) =>
                      onUpdateVideoEffects((prev) => ({ ...prev, contrast: parseInt(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor }}
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A6A6B2]">Saturation</span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>
                      {videoEffects.saturation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    step={2}
                    value={videoEffects.saturation}
                    disabled={!videoEffects.enabled}
                    onChange={(e) =>
                      onUpdateVideoEffects((prev) => ({ ...prev, saturation: parseInt(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor }}
                  />
                </div>

                {/* Hue Rotate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A6A6B2]">Hue Rotation</span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>
                      {videoEffects.hueRotate}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={5}
                    value={videoEffects.hueRotate}
                    disabled={!videoEffects.enabled}
                    onChange={(e) =>
                      onUpdateVideoEffects((prev) => ({ ...prev, hueRotate: parseInt(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor }}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVideoEffects((prev) => ({ ...prev, invert: !prev.invert }))
                  }
                  disabled={!videoEffects.enabled}
                  className={`py-2 px-3 rounded-2xl text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                    videoEffects.invert ? 'font-bold shadow-xs' : 'bg-white/5 text-[#A6A6B2] hover:text-white'
                  }`}
                  style={{
                    backgroundColor: videoEffects.invert ? accentColor : undefined,
                    color: videoEffects.invert ? accentInk : undefined,
                  }}
                >
                  <span>Invert Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateVideoEffects((prev) => ({ ...prev, sepia: !prev.sepia }))
                  }
                  disabled={!videoEffects.enabled}
                  className={`py-2 px-3 rounded-2xl text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                    videoEffects.sepia ? 'font-bold shadow-xs' : 'bg-white/5 text-[#A6A6B2] hover:text-white'
                  }`}
                  style={{
                    backgroundColor: videoEffects.sepia ? accentColor : undefined,
                    color: videoEffects.sepia ? accentInk : undefined,
                  }}
                >
                  <span>Vintage Sepia</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onResetVideoEffects}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#A6A6B2] hover:text-white transition flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Video Adjustments</span>
              </button>
            </div>
          )}

          {/* TRACK SYNC TAB */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <p className="text-xs text-[#A6A6B2] leading-relaxed">
                Fine-tune synchronization between media audio, video playback, and subtitle tracks in real time.
              </p>

              {/* Audio Delay */}
              <div className="p-4 rounded-2xl bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Audio Delay</span>
                  <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                    {audioDelayMs > 0 ? `+${(audioDelayMs / 1000).toFixed(2)}s` : `${(audioDelayMs / 1000).toFixed(2)}s`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onChangeAudioDelay(Math.max(-5000, audioDelayMs - 50))}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold"
                  >
                    -50ms
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAudioDelay(0)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-[#A6A6B2]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAudioDelay(Math.min(5000, audioDelayMs + 50))}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold"
                  >
                    +50ms
                  </button>
                </div>
              </div>

              {/* Subtitle Delay */}
              <div className="p-4 rounded-2xl bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Subtitle Delay</span>
                  <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                    {subtitleSyncOffsetMs > 0 ? `+${(subtitleSyncOffsetMs / 1000).toFixed(2)}s` : `${(subtitleSyncOffsetMs / 1000).toFixed(2)}s`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onChangeSubtitleSyncOffset(Math.max(-5000, subtitleSyncOffsetMs - 50))}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold"
                  >
                    -50ms
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeSubtitleSyncOffset(0)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-[#A6A6B2]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeSubtitleSyncOffset(Math.min(5000, subtitleSyncOffsetMs + 50))}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold"
                  >
                    +50ms
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* A-B REPEAT TAB */}
          {activeTab === 'ab_repeat' && (
            <div className="space-y-4">
              <p className="text-xs text-[#A6A6B2] leading-relaxed">
                VLC A-B loop lets you select two points in the video and loop continuously between them. Ideal for studying, music analysis, and tutorials.
              </p>

              <div className="p-4 rounded-2xl bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Loop Status</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    abRepeat.enabled && abRepeat.pointA !== null && abRepeat.pointB !== null
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-[#A6A6B2]'
                  }`}>
                    {abRepeat.enabled && abRepeat.pointA !== null && abRepeat.pointB !== null ? 'Looping Active' : 'Idle'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[11px] text-[#A6A6B2] block">Point A (Start)</span>
                    <span className="text-base font-mono font-bold mt-1 block" style={{ color: accentColor }}>
                      {abRepeat.pointA !== null ? formatDuration(abRepeat.pointA * 1000) : '--:--'}
                    </span>
                    <button
                      type="button"
                      onClick={onSetPointA}
                      className="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
                    >
                      Set A ({formatDuration(currentTime * 1000)})
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[11px] text-[#A6A6B2] block">Point B (End)</span>
                    <span className="text-base font-mono font-bold mt-1 block" style={{ color: accentColor }}>
                      {abRepeat.pointB !== null ? formatDuration(abRepeat.pointB * 1000) : '--:--'}
                    </span>
                    <button
                      type="button"
                      onClick={onSetPointB}
                      className="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
                    >
                      Set B ({formatDuration(currentTime * 1000)})
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={onToggleAB}
                    disabled={abRepeat.pointA === null || abRepeat.pointB === null}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                      abRepeat.enabled
                        ? 'bg-amber-400 text-amber-950 font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-40'
                    }`}
                  >
                    {abRepeat.enabled ? 'Pause A-B Loop' : 'Start A-B Loop'}
                  </button>

                  <button
                    type="button"
                    onClick={onClearAB}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-[#A6A6B2] hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SLEEP TIMER TAB */}
          {activeTab === 'sleep_timer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Sleep Timer</span>
                  {sleepTimerRemainingSec !== null ? (
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Stopping in {Math.floor(sleepTimerRemainingSec / 60)}m {sleepTimerRemainingSec % 60}s
                    </span>
                  ) : (
                    <span className="text-xs text-[#A6A6B2]">Off</span>
                  )}
                </div>
                <p className="text-xs text-[#A6A6B2]">
                  Automatically pause media playback when the sleep timer expires.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[10, 15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onSetSleepTimer(mins)}
                    className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/15 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#A6A6B2]" />
                    <span>{mins} minutes</span>
                  </button>
                ))}
              </div>

              {sleepTimerRemainingSec !== null && (
                <button
                  type="button"
                  onClick={() => onSetSleepTimer(null)}
                  className="w-full py-2.5 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs font-semibold hover:bg-red-900/50 transition"
                >
                  Cancel Sleep Timer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
