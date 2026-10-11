import React, { useState, useRef } from 'react';
import { Upload, Link, Plus, FileVideo, Check } from 'lucide-react';
import { VideoEntry } from '../types.ts';
import { generateVideoThumbnail } from '../utils.ts';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideos: (videos: VideoEntry[]) => void;
  folders: string[];
  accentColor?: string;
  accentInk?: string;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onAddVideos,
  folders,
  accentColor = '#C4B5FD',
  accentInk = '#241948',
}) => {
  const [tab, setTab] = useState<'files' | 'url'>('files');
  const [url, setUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlFolder, setUrlFolder] = useState('Downloads');
  const [selectedFolder, setSelectedFolder] = useState('Downloads');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newVideos: VideoEntry[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let thumbnail = '';
      let durationMs = 0;

      try {
        const metadata = await generateVideoThumbnail(file);
        thumbnail = metadata.thumbnailUrl;
        durationMs = metadata.durationMs;
      } catch {
        thumbnail = '';
      }

      newVideos.push({
        id: `local-${Date.now()}-${i}`,
        name: file.name,
        url: URL.createObjectURL(file),
        durationMs: durationMs || 30000,
        sizeBytes: file.size,
        folder: selectedFolder || 'Videos',
        thumbnailUrl: thumbnail,
        dateAdded: Date.now(),
        isCustom: true,
      });
    }

    onAddVideos(newVideos);
    setIsProcessing(false);
    onClose();
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const name = urlName.trim() || url.split('/').pop()?.split('?')[0] || 'Web Video';
    const newVideo: VideoEntry = {
      id: `url-${Date.now()}`,
      name: name.endsWith('.mp4') || name.endsWith('.webm') ? name : `${name}.mp4`,
      url: url.trim(),
      durationMs: 60000,
      sizeBytes: 25000000,
      folder: urlFolder || 'Downloads',
      dateAdded: Date.now(),
      isCustom: true,
    };

    onAddVideos([newVideo]);
    setUrl('');
    setUrlName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#1D1E23] rounded-3xl p-6 shadow-2xl border border-[#26272D] text-[#F5F4FA] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#26272D] mb-4">
          <h2 className="text-xl font-semibold text-[#F5F4FA]">Add Videos</h2>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#26272D] hover:bg-[#34363F] text-[#A6A6B2] hover:text-[#F5F4FA] transition"
          >
            Close
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`py-2 px-3 rounded-2xl text-xs font-medium transition flex items-center justify-center space-x-2 ${
              tab === 'files'
                ? 'font-semibold shadow-xs'
                : 'bg-[#26272D] text-[#A6A6B2] hover:text-[#F5F4FA]'
            }`}
            style={{
              backgroundColor: tab === 'files' ? accentColor : undefined,
              color: tab === 'files' ? accentInk : undefined,
            }}
          >
            <Upload className="w-4 h-4" />
            <span>Local Device Files</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`py-2 px-3 rounded-2xl text-xs font-medium transition flex items-center justify-center space-x-2 ${
              tab === 'url'
                ? 'font-semibold shadow-xs'
                : 'bg-[#26272D] text-[#A6A6B2] hover:text-[#F5F4FA]'
            }`}
            style={{
              backgroundColor: tab === 'url' ? accentColor : undefined,
              color: tab === 'url' ? accentInk : undefined,
            }}
          >
            <Link className="w-4 h-4" />
            <span>Direct Video URL</span>
          </button>
        </div>

        {tab === 'files' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
                Save to Folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#26272D] border border-[#3B3D47] text-xs text-[#F5F4FA] focus:outline-none focus:border-white/40"
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="Custom Imports">Custom Imports</option>
              </select>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#3B3D47] hover:border-white/40 rounded-2xl p-6 text-center cursor-pointer transition bg-[#101114]/50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={handleFilesSelected}
              />
              <FileVideo className="w-10 h-10 mx-auto mb-2 group-hover:scale-110 transition duration-200" style={{ color: accentColor }} />
              <p className="text-sm font-medium text-[#F5F4FA]">
                {isProcessing ? 'Processing video metadata…' : 'Tap to browse or drop videos'}
              </p>
              <p className="text-xs text-[#A6A6B2] mt-1">
                MP4, WebM, MKV, MOV supported
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddUrl} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
                Video URL (.mp4 or stream)
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#26272D] border border-[#3B3D47] text-xs text-[#F5F4FA] focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="My Video Name"
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#26272D] border border-[#3B3D47] text-xs text-[#F5F4FA] focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6A6B2] mb-1.5 font-medium">
                Folder
              </label>
              <select
                value={urlFolder}
                onChange={(e) => setUrlFolder(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#26272D] border border-[#3B3D47] text-xs text-[#F5F4FA] focus:outline-none focus:border-white/40"
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="Online Streams">Online Streams</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-2 active:scale-98"
              style={{ backgroundColor: accentColor, color: accentInk }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Video to Library</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
