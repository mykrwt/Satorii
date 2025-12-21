# 50+ Ideas for Satorii

## Feature Implementations (Frontend)
1. **Light Mode Toggle**: Add a theme switcher for users who prefer light backgrounds.
2. **Watch History**: Store watched videos in local storage and display them in a "History" page.
3. **Liked Videos**: Allow users to "like" videos locally and save them to a list.
4. **Custom Playlists**: Enhance playlist creation with custom names and descriptions.
5. **Drag & Drop Reordering**: Allow users to reorder videos in their local playlists.
6. **Video Notes**: Add a feature to take timestamped notes on videos.
7. **Picture-in-Picture Button**: Add a dedicated button to toggle PiP mode.
8. **Keyboard Shortcuts**: Implement custom keyboard shortcuts for navigation and playback (e.g., 'F' for fullscreen).
9. **Voice Search**: Integrate Web Speech API for voice search functionality.
10. **Region Switcher**: Allow users to change the YouTube region (US, UK, IN, etc.) for trending content.
11. **Infinite Scroll**: Implement infinite scrolling on the search results page.
12. **Compact View**: Add a toggle for a denser video grid layout.
13. **Theater Mode**: Add a button to expand the video player to the full width of the window.
14. **Loop Button**: Add a loop toggle for the video player.
15. **Sleep Timer**: Stop playback after a set duration.
16. **Screenshot Tool**: Capture a frame from the current video.
17. **Share with Timestamp**: Generate share links with the current timestamp.
18. **Download Thumbnail**: Allow users to download the high-res thumbnail of the video.
19. **Audio Only Mode**: Toggle to hide the video track to save bandwidth (simulated).
20. **Mini Player Enhancements**: Add resize handles to the mini-player.
21. **Channel Blocking**: Allow users to hide videos from specific channels.
22. **Keyword Filtering**: Filter out videos containing specific keywords.
23. **Related Videos Filter**: Filter related videos by "From this channel" vs "From others".
24. **Autoplay Toggle**: Global toggle for autoplaying next video.
25. **Data Saver Mode**: Default to lower quality thumbnails and disable auto-hover previews.

## Integrations & Backend (Advanced)
26. **User Accounts (Firebase)**: Implement real user authentication.
27. **Sync Across Devices**: specific user settings and playlists synced to the cloud.
28. **PWA Support**: Make the app installable as a Progressive Web App.
29. **Push Notifications**: Notify users when a favorite channel uploads (requires polling).
30. **Discord RPC**: Show what you are watching on Discord (requires desktop wrapper).
31. **Chromecast Support**: Add Cast button to stream to TV.
32. **Spotify Integration**: Search for the song playing in the video on Spotify.
33. **Multi-language Support**: Translate the UI into Spanish, French, etc.
34. **Subtitle Customization**: Custom font, size, and color for captions (if using custom player).
35. **SponsorBlock**: Integrate SponsorBlock API to skip non-content segments.
36. **Return YouTube Dislike**: Integrate API to show dislike counts.
37. **Analytics Dashboard**: Show users their own viewing stats (time watched, top genres).
38. **Social Sharing Cards**: Generate pretty images for sharing on Twitter/X.
39. **Import/Export Data**: JSON export of all local playlists and settings.
40. **Proxy Support**: Allow users to configure a custom proxy server.

## UI/UX Polish
41. **Skeleton Loading**: Improve loading states with shimmering skeletons instead of spinners.
42. **Micro-interactions**: Add subtle animations to buttons (like hearts popping).
43. **Dynamic Background**: Change the app background color based on the current video's dominant color.
44. **Scroll-to-Top**: Add a button to quickly scroll back to the top of the feed.
45. **Focus Mode**: Hide all distractions (sidebar, comments) when watching.
46. **Custom Context Menu**: Right-click menu with app-specific actions.
47. **Onboarding Tour**: Walkthrough for new users explaining features.
48. **Volume Normalization**: Client-side audio gain control.
49. **Swipe Gestures**: Swipe left/right on mobile to change videos.
50. **Parallax Effects**: Add depth to the UI on scroll.

## Developer Experience
51. **Unit Tests**: Add Jest/Vitest for testing utility functions.
52. **E2E Tests**: Add Cypress/Playwright for critical user flows.
53. **Storybook**: Document components in isolation.
54. **Performance Monitoring**: Integrate Lighthouse CI to track performance scores.
55. **Accessibility Audit**: Ensure full keyboard navigation and screen reader support (ARIA).
