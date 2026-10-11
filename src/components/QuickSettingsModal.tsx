import React from 'react';
import { ViewMode, LayoutMode, SortField, SortOrder } from '../types.ts';
import { ToggleSwitch } from './ToggleSwitch.tsx';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (layout: LayoutMode) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  loopMode: 'off' | 'one' | 'all';
  onLoopModeChange: (loop: 'off' | 'one' | 'all') => void;
  enableGlassUI: boolean;
  onGlassUIToggle: (enable: boolean) => void;
  showFileExtension?: boolean;
  onShowFileExtensionToggle?: (show: boolean) => void;
  showDurationBadge?: boolean;
  onShowDurationBadgeToggle?: (show: boolean) => void;
  accentColor?: string;
  accentInk?: string;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  loopMode,
  onLoopModeChange,
  enableGlassUI,
  onGlassUIToggle,
  showFileExtension,
  onShowFileExtensionToggle,
  showDurationBadge,
  onShowDurationBadgeToggle,
  accentColor = '#C4B5FD',
  accentInk = '#241948',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#26272D] mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#F5F4FA]">Quick Settings</h2>
            <p className="text-[11px] text-[#A6A6B2]">Layout, view mode, and toggles</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#26272D] hover:bg-[#34363F] text-[#A6A6B2] hover:text-[#F5F4FA] transition"
          >
            Done
          </button>
        </div>

        {/* Media view mode */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
            Media view mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Tree', 'Folders', 'Videos'] as ViewMode[]).map((mode) => {
              const isSelected = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  className={`py-2 px-3 rounded-2xl text-xs font-medium text-center transition ${
                    isSelected ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? accentColor : undefined,
                    color: isSelected ? accentInk : undefined,
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media layout */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
            Media layout
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['List', 'Grid'] as LayoutMode[]).map((layout) => {
              const isSelected = layoutMode === layout;
              return (
                <button
                  key={layout}
                  type="button"
                  onClick={() => onLayoutModeChange(layout)}
                  className={`py-2 px-3 rounded-2xl text-xs font-medium text-center transition ${
                    isSelected ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? accentColor : undefined,
                    color: isSelected ? accentInk : undefined,
                  }}
                >
                  {layout}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Field */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
            Sort by
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'dateAdded', label: 'Date Added' },
              { id: 'name', label: 'Title / Name' },
              { id: 'duration', label: 'Duration' },
              { id: 'size', label: 'File Size' },
            ].map((f) => {
              const isSelected = sortField === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSortFieldChange(f.id as SortField)}
                  className={`py-2 px-2.5 rounded-2xl text-xs font-medium text-center transition ${
                    isSelected ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? accentColor : undefined,
                    color: isSelected ? accentInk : undefined,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Order */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
            Sort Order
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSortOrderChange('asc')}
              className={`py-2 px-3 rounded-2xl text-xs font-medium text-center transition ${
                sortOrder === 'asc' ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
              }`}
              style={{
                backgroundColor: sortOrder === 'asc' ? accentColor : undefined,
                color: sortOrder === 'asc' ? accentInk : undefined,
              }}
            >
              Ascending
            </button>
            <button
              type="button"
              onClick={() => onSortOrderChange('desc')}
              className={`py-2 px-3 rounded-2xl text-xs font-medium text-center transition ${
                sortOrder === 'desc' ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
              }`}
              style={{
                backgroundColor: sortOrder === 'desc' ? accentColor : undefined,
                color: sortOrder === 'desc' ? accentInk : undefined,
              }}
            >
              Descending
            </button>
          </div>
        </div>

        {/* Loop Mode */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
            Repeat / Loop Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['off', 'one', 'all'] as const).map((l) => {
              const isSelected = loopMode === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLoopModeChange(l)}
                  className={`py-2 px-2.5 rounded-2xl text-xs font-medium capitalize text-center transition ${
                    isSelected ? 'font-bold shadow-xs' : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? accentColor : undefined,
                    color: isSelected ? accentInk : undefined,
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Toggles Section */}
        <div className="pt-3 border-t border-[#26272D] space-y-2.5">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] font-medium">
            Quick Switches
          </label>

          {/* Android Glass UI Toggle */}
          <div 
            onClick={() => onGlassUIToggle(!enableGlassUI)}
            className="p-3 rounded-2xl bg-[#26272D] hover:bg-[#2D2E35] flex items-center justify-between cursor-pointer transition"
          >
            <div>
              <span className="text-xs font-semibold text-[#F5F4FA] block">Android Glass UI</span>
              <span className="text-[10px] text-[#A6A6B2]">Pixel ambient frosted diffusion</span>
            </div>
            <ToggleSwitch
              checked={enableGlassUI}
              onChange={onGlassUIToggle}
              accentColor={accentColor}
              accentInk={accentInk}
              size="sm"
              ariaLabel="Android Glass UI"
            />
          </div>

          {/* Show File Extension Toggle */}
          {onShowFileExtensionToggle && showFileExtension !== undefined && (
            <div 
              onClick={() => onShowFileExtensionToggle(!showFileExtension)}
              className="p-3 rounded-2xl bg-[#26272D] hover:bg-[#2D2E35] flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <span className="text-xs font-semibold text-[#F5F4FA] block">File Extensions</span>
                <span className="text-[10px] text-[#A6A6B2]">Display .mp4, .mkv in library</span>
              </div>
              <ToggleSwitch
                checked={showFileExtension}
                onChange={onShowFileExtensionToggle}
                accentColor={accentColor}
                accentInk={accentInk}
                size="sm"
                ariaLabel="File Extensions"
              />
            </div>
          )}

          {/* Show Duration Badge Toggle */}
          {onShowDurationBadgeToggle && showDurationBadge !== undefined && (
            <div 
              onClick={() => onShowDurationBadgeToggle(!showDurationBadge)}
              className="p-3 rounded-2xl bg-[#26272D] hover:bg-[#2D2E35] flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <span className="text-xs font-semibold text-[#F5F4FA] block">Duration Badges</span>
                <span className="text-[10px] text-[#A6A6B2]">Show duration timestamp pill</span>
              </div>
              <ToggleSwitch
                checked={showDurationBadge}
                onChange={onShowDurationBadgeToggle}
                accentColor={accentColor}
                accentInk={accentInk}
                size="sm"
                ariaLabel="Duration Badges"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
