# Satorii Premium Music & Video

A sleek, forest-themed YouTube client built for seamless background listening and a premium user experience.

## ✨ Features
- **Spotify-style Persistent Player**: Browse the entire app while your music/video keeps playing in a docked mini-player.
- **Background Playback**: Continues audio when the screen is off or the app is minimized (supported via Media Session API & PWA/APK).
- **Import & Create Playlists**: Build your own library from local lists or import entire YT playlists.
- **No Ad-Clutter**: Stripped down to essential features for a focus on content.

---

## 📱 Mobile App (APK) Build Instructions

I have already initialized **Capacitor** in this project to turn Satorii into a native Android app. To build the APK, follow these steps:

### 1. Prerequisites
- **Android Studio** must be installed on your machine.
- **Java JDK 21+** must be installed.

### 2. Build Steps
1. Open PowerShell/Terminal in the project root.
2. Build the latest web assets:
   ```bash
   npm run build
   npx cap sync android
   ```
3. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
4. In Android Studio, wait for Gradle to sync, then go to:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
5. Once finished, a notification will appear. Click **Locate** to find your `app-debug.apk`. 

---

## 🌐 PWA (Progressive Web App) Installation

Satorii is a full PWA. You don't need an APK to get an app-like experience:
1. Open Satorii in Chrome on your phone.
2. Tap the **three dots** (menu) and select **"Install App"** or **"Add to Home Screen"**.
3. It will appear on your home screen with its own icon and support background media controls like Spotify.

---

## 📂 Project Structure

```text
satorii/
├── docs/               # Project documentation & ideas
├── public/             # Static assets (icons, manifest)
├── release/            # Compiled builds (APKs)
├── scripts/            # Utility scripts (icon generation)
└── src/
    ├── assets/         # App-specific images/assets
    ├── components/
    │   ├── common/     # Reusable UI components
    │   ├── layout/     # TopBar, SideNav
    │   └── modals/     # Dialogs and modals
    ├── pages/          # Page components with scoped CSS
    ├── services/       # API and Storage logic
    ├── styles/         # Global styles (App.css, index.css)
    └── utils/          # Helper functions & filters
```

---

## 🛠 Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Forest Noir Theme)
- **API**: YouTube Data API v3
- **Mobile**: Capacitor
- **PWA**: Vite-PWA with Workbox Caching
- **Aliases**: `@` (src), `@components`, `@pages`, etc.

---

## 🛡️ Background Play Optimization
To ensure background play works perfectly like YouTube Premium:
- **On Android**: Disable "Battery Optimization" for Satorii/Chrome so the OS doesn't kill the background process.
- **Media Controls**: Use the lock-screen play/pause buttons created by the Media Session API.
- **Silent Audio**: The app uses a silent audio loop to keep the process alive in the background.