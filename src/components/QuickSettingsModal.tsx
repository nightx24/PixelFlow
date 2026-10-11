import React from 'react';
import { ViewMode, LayoutMode, SortField, SortOrder } from '../types.ts';

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#26272D] mb-4">
          <h2 className="text-xl font-semibold text-[#F5F4FA]">Quick Settings</h2>
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
                    isSelected
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
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
                    isSelected
                      ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                      : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                  }`}
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
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSortFieldChange(f.id as SortField)}
                className={`py-2 px-2.5 rounded-2xl text-xs font-medium text-center transition ${
                  sortField === f.id
                    ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                    : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                }`}
              >
                {f.label}
              </button>
            ))}
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
                sortOrder === 'asc'
                  ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                  : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
              }`}
            >
              Ascending
            </button>
            <button
              type="button"
              onClick={() => onSortOrderChange('desc')}
              className={`py-2 px-3 rounded-2xl text-xs font-medium text-center transition ${
                sortOrder === 'desc'
                  ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                  : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
              }`}
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
            {(['off', 'one', 'all'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLoopModeChange(l)}
                className={`py-2 px-2.5 rounded-2xl text-xs font-medium capitalize text-center transition ${
                  loopMode === l
                    ? 'bg-[#C4B5FD] text-[#241948] font-bold shadow-xs'
                    : 'bg-[#26272D] text-[#F5F4FA] hover:bg-[#2F3038]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
