# PixelFlow

A minimal, elegant video player and media space inspired by NextPlayer and mpv, rewritten in React + TypeScript with Tailwind CSS.

## Features

- **Your Video Space**: Clean dark aesthetic (`#101114`) with lavender accent styling (`#C4B5FD`).
- **Media Library & Organization**:
  - **Folders View**: Categorized video folders with video counts and drill-down navigation.
  - **Videos View**: Full catalog with instant playback.
  - **Grid & List Layouts**: Configurable media display layouts.
  - **Instant Search**: Real-time filtering across video names and folder titles.
- **Responsive Video Player**:
  - Custom on-screen playback controls (play/pause, seek slider, ±10s jump, speed menu, volume, fit/fill mode, fullscreen).
  - Status updates (`Now playing`, `Buffering…`, `Playback finished`).
- **Flexible Media Sources**:
  - Sample library with high-definition videos across categories.
  - Device file upload (supports local `.mp4`, `.webm`, `.mov`, `.mkv`).
  - Direct web video stream URL addition.
- **Settings & Quick Settings**:
  - Quick modal for switching between View modes (Tree, Folders, Videos) and Layout modes (List, Grid).
  - Detailed settings panel for appearance, playback options, gesture guides, audio, and privacy info.

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
