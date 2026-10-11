import React from 'react';
import { ViewMode, LayoutMode } from '../types.ts';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (layout: LayoutMode) => void;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-[#F5F4FA]">Quick Settings</h2>

        {/* Media view mode */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-2 font-medium">
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
                  className={`py-2.5 px-3 rounded-2xl text-xs font-medium text-center transition ${
                    isSelected
                      ? 'bg-[#C4B5FD] text-[#241948] font-semibold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media layout */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-2 font-medium">
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
                  className={`py-2.5 px-3 rounded-2xl text-xs font-medium text-center transition ${
                    isSelected
                      ? 'bg-[#C4B5FD] text-[#241948] font-semibold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
                >
                  {layout}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-[#26272D]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-[#A6A6B2] hover:text-[#F5F4FA] hover:bg-[#26272D] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#C4B5FD] text-[#241948] hover:bg-[#D8CCFF] transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
