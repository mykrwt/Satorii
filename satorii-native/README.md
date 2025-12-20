# Satorii Native - Pure Android Media App

This is a **pure native Android application** built from the ground up using **Kotlin** and **Jetpack Compose**. Unlike the previous version, this app **does not use WebView**. It communicates directly with APIs and uses native media engines for a premium, high-performance experience.

## 🚀 Accomplishments So Far

### 1. Pure Native Architecture
- **Framework**: Built with Modern Android standards (Jetpack Compose, Kotlin Coroutines, Material 3).
- **No WebView**: Video streams are extracted and played natively using **Media3 (ExoPlayer)**.
- **Background Playback**: Implemented a `MediaSessionService` that keeps audio playing when the app is minimized or the screen is locked.

### 2. Premium UI/UX (Spotify Style)
- **Dark Mode**: High-contrast, premium dark theme with Spotify-green accents.
- **Material You**: Dynamic color support for Android 12+.
- **Mini Player**: Floating mini-player that allows browsing the app while music continues.
- **Smooth Navigation**: Bottom navigation with seamless transitions between Home, Search, and Library.

### 3. Smart Logic
- **YouTube Integration**: Native Retrofit-based API client with **API Key Rotation** to prevent quota issues.
- **Stream Extraction**: Integrated a native extractor to get direct media URLs for high-quality playback.
- **Caching**: Implemented a **500MB LRU Media Cache** so frequently played songs/videos load instantly and save data.

### 4. System Integration
- **Media Controls**: Full integration with System Notification controls (Play/Pause/Next/Prev).
- **Splash Screen**: Modern Android SplashScreen API for a professional app startup.

---

## 🛠️ How It Works

1. **Discovery**: The `HomeViewModel` fetches trending videos from the YouTube API.
2. **Extraction**: When you tap a video, the `YoutubeExtractor` finds the direct MP4/WebM stream URL (using a proxied backend like Piped).
3. **Playback**: The URL is handed to `PlaybackService`, which runs on a **Foreground Service** to ensure it isn't killed by the OS.
4. **Performance**: Images are loaded efficiently using **Coil**, and navigation uses the **Compose Navigation** component.

---

## ⏳ What's Next / To-Do

- [ ] **Room Database**: Move "Likes" and "History" from memory to local storage (SQlite).
- [ ] **Search Refinement**: Real-time search suggestions.
- [ ] **Player UI Details**: Add seek bar, playback speed, and quality selector.
- [ ] **Signed APK**: Configure build flavors and signing keys for Play Store release.
- [ ] **Offline Mode**: Expand the caching logic to allow manual "Download for Offline".

---

## 📦 How to Build/Install (For Developers)

1. Open the project in **Android Studio Hedgehog** or newer.
2. Sync Gradle.
3. Run `.\gradlew assembleDebug` to generate the APK.
4. The APK will be located at `app\build\outputs\apk\debug\app-debug.apk`.

**Note**: This is a high-performance native app designed to compete with industry-standard players.
