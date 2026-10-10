# PixelFlow

A minimal dark video-player project targeting Linux and Android, inspired by NextPlayer and intended to use mpv/libmpv.

## Current status
This is the first scaffold, not a completed media player. The Android build produces a UI prototype APK; video playback, subtitle controls, resume position, playlists, media library, and native libmpv packaging still need implementation. No successful build is claimed until GitHub Actions completes.

## Android
Requires JDK 17 and Android SDK 35. Run `gradle assembleDebug` or open in Android Studio.

## References
- mpv/libmpv: https://github.com/mpv-player/mpv
- UI inspiration: https://github.com/anilbeesetti/nextplayer

Before redistribution, review mpv's licensing and choose a license for PixelFlow itself.
