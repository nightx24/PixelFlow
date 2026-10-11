# PixelFlow

A minimal, high-performance media player and video space built with React, TypeScript, and Tailwind CSS, supporting Web, Android, Linux (Ubuntu, Fedora, AppImage, Flatpak), and Windows.

## Desktop & Multi-Platform Support

PixelFlow packages natively for all major desktop operating systems:

### 1. Linux Ubuntu / Debian (`.deb`)
```bash
npm run build:deb
```
Outputs installable `.deb` packages for Ubuntu, Debian, and Linux Mint (`dist-desktop/PixelFlow_0.1.1_amd64.deb`).
Install via:
```bash
sudo dpkg -i dist-desktop/PixelFlow_0.1.1_amd64.deb
```

### 2. Linux Fedora / RHEL (`.rpm`)
```bash
npm run build:rpm
```
Outputs installable `.rpm` packages for Fedora, RHEL, openSUSE, and Rocky Linux (`dist-desktop/PixelFlow-0.1.1.x86_64.rpm`).
Install via:
```bash
sudo dnf install dist-desktop/PixelFlow-0.1.1.x86_64.rpm
```
A complete RPM packaging spec is also available in `packaging/rpm/pixelflow.spec`.

### 3. Linux Universal AppImage (`.AppImage`)
```bash
npm run build:appimage
```
Outputs standalone, zero-dependency executable AppImages compatible across any modern Linux distribution (`dist-desktop/PixelFlow-0.1.1.AppImage`).
Run directly:
```bash
chmod +x PixelFlow-0.1.1.AppImage
./PixelFlow-0.1.1.AppImage
```

### 4. Linux Flatpak
```bash
npm run build:flatpak
```
A Flathub-ready Flatpak manifest and AppStream metainfo are located in:
- `packaging/flatpak/app.pixelflow.PixelFlow.yml`
- `packaging/flatpak/app.pixelflow.PixelFlow.desktop`
- `packaging/flatpak/app.pixelflow.PixelFlow.metainfo.xml`
- `packaging/flatpak/app.pixelflow.PixelFlow.svg`

Build with `flatpak-builder`:
```bash
flatpak-builder --user --install --force-clean build-dir packaging/flatpak/app.pixelflow.PixelFlow.yml
flatpak run app.pixelflow.PixelFlow
```

### 5. Windows (`.exe` NSIS Installer & Portable)
```bash
npm run build:win
```
Outputs:
- **NSIS Setup Installer**: `dist-desktop/PixelFlow Setup 0.1.1.exe` (with desktop shortcuts and file associations for `.mp4`, `.mkv`, `.webm`, `.mov`, `.avi`)
- **Portable Executable**: `dist-desktop/PixelFlow 0.1.1.exe` (runs without installation)

### 6. Build All Platforms
```bash
npm run build:desktop
```

---

## Web & Development

Start local web server on port 3000:
```bash
npm run dev
```

Build web distribution:
```bash
npm run build
```

---

## Features

- **Gesture Controls**: Vertical swipe on left for brightness, right for volume, horizontal swipe for scrubbing, double-tap seek, 2x long-press fast forward.
- **Audio Clarity & 200% Boost**: Web Audio amplification node and dynamic speech compression.
- **Subtitles Engine**: Built-in multi-language tracks, external `.srt` / `.vtt` loader, size/color/background customization.
- **Library Organization**: Folders drilldown, all videos catalog, list and grid view layouts, multi-field sorting.
- **Watch History**: Continue Watching row with thumbnail progress bars.
- **File Association**: Automatic opening when videos are launched from file managers on Ubuntu, Fedora, or Windows.
