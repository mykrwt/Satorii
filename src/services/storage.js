// Local storage service for client-side data persistence

const STORAGE_KEYS = {
    PLAYLISTS: 'satorii_playlists',
    WATCH_HISTORY: 'satorii_watch_history',
    WATCH_LATER: 'satorii_watch_later',
    LIKED_VIDEOS: 'satorii_liked_videos',
    SUBSCRIPTIONS: 'satorii_subscriptions',
    PLAYBACK_POSITIONS: 'satorii_playback_positions',
    PREFERENCES: 'satorii_preferences',
    SEARCH_HISTORY: 'satorii_search_history',
};

// Helper functions
const getItem = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return defaultValue;
    }
};

const setItem = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing ${key}:`, error);
        return false;
    }
};

// Playlists management
export const playlistService = {
    getAll: () => getItem(STORAGE_KEYS.PLAYLISTS, []),

    create: (name, description = '') => {
        const playlists = playlistService.getAll();
        const newPlaylist = {
            id: `local_${Date.now()}`,
            name,
            description,
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        playlists.push(newPlaylist);
        setItem(STORAGE_KEYS.PLAYLISTS, playlists);
        return newPlaylist;
    },

    get: (id) => {
        const playlists = playlistService.getAll();
        return playlists.find(p => p.id === id);
    },

    update: (id, updates) => {
        const playlists = playlistService.getAll();
        const index = playlists.findIndex(p => p.id === id);
        if (index !== -1) {
            playlists[index] = {
                ...playlists[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            setItem(STORAGE_KEYS.PLAYLISTS, playlists);
            return playlists[index];
        }
        return null;
    },

    delete: (id) => {
        const playlists = playlistService.getAll();
        const filtered = playlists.filter(p => p.id !== id);
        setItem(STORAGE_KEYS.PLAYLISTS, filtered);
    },

    addVideo: (playlistId, video) => {
        const playlist = playlistService.get(playlistId);
        if (playlist) {
            // Check if video already exists
            if (!playlist.videos.find(v => v.id === video.id)) {
                playlist.videos.push({
                    id: video.id,
                    title: video.title,
                    thumbnail: video.thumbnail,
                    channelTitle: video.channelTitle,
                    duration: video.duration,
                    addedAt: new Date().toISOString(),
                });
                playlistService.update(playlistId, { videos: playlist.videos });
            }
        }
    },

    removeVideo: (playlistId, videoId) => {
        const playlist = playlistService.get(playlistId);
        if (playlist) {
            playlist.videos = playlist.videos.filter(v => v.id !== videoId);
            playlistService.update(playlistId, { videos: playlist.videos });
        }
    },

    reorderVideos: (playlistId, videoIds) => {
        const playlist = playlistService.get(playlistId);
        if (playlist) {
            const reordered = videoIds.map(id =>
                playlist.videos.find(v => v.id === id)
            ).filter(Boolean);
            playlistService.update(playlistId, { videos: reordered });
        }
    },
};

// Watch Later
export const watchLaterService = {
    getAll: () => getItem(STORAGE_KEYS.WATCH_LATER, []),

    add: (video) => {
        const videos = watchLaterService.getAll();
        if (!videos.find(v => v.id === video.id)) {
            videos.unshift({
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle,
                duration: video.duration,
                addedAt: new Date().toISOString(),
            });
            setItem(STORAGE_KEYS.WATCH_LATER, videos);
        }
    },

    remove: (videoId) => {
        const videos = watchLaterService.getAll();
        const filtered = videos.filter(v => v.id !== videoId);
        setItem(STORAGE_KEYS.WATCH_LATER, filtered);
    },

    has: (videoId) => {
        const videos = watchLaterService.getAll();
        return videos.some(v => v.id === videoId);
    },

    clear: () => setItem(STORAGE_KEYS.WATCH_LATER, []),
};

// Watch History
export const historyService = {
    getAll: () => getItem(STORAGE_KEYS.WATCH_HISTORY, []),

    add: (video) => {
        const history = historyService.getAll();
        // Remove if already exists
        const filtered = history.filter(v => v.id !== video.id);
        // Add to beginning
        filtered.unshift({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            channelTitle: video.channelTitle,
            duration: video.duration,
            watchedAt: new Date().toISOString(),
        });
        // Keep only last 100 videos
        const limited = filtered.slice(0, 100);
        setItem(STORAGE_KEYS.WATCH_HISTORY, limited);
    },

    remove: (videoId) => {
        const history = historyService.getAll();
        const filtered = history.filter(v => v.id !== videoId);
        setItem(STORAGE_KEYS.WATCH_HISTORY, filtered);
    },

    clear: () => setItem(STORAGE_KEYS.WATCH_HISTORY, []),
};

// Liked Videos
export const likeService = {
    getAll: () => getItem(STORAGE_KEYS.LIKED_VIDEOS, []),

    toggle: (videoId) => {
        const liked = likeService.getAll();
        const index = liked.indexOf(videoId);
        if (index !== -1) {
            liked.splice(index, 1);
        } else {
            liked.push(videoId);
        }
        setItem(STORAGE_KEYS.LIKED_VIDEOS, liked);
        return index === -1; // Return true if now liked
    },

    isLiked: (videoId) => {
        const liked = likeService.getAll();
        return liked.includes(videoId);
    },

    clear: () => setItem(STORAGE_KEYS.LIKED_VIDEOS, []),
};

// Subscriptions
export const subscriptionService = {
    getAll: () => getItem(STORAGE_KEYS.SUBSCRIPTIONS, []),

    toggle: (channel) => {
        const subscriptions = subscriptionService.getAll();
        const index = subscriptions.findIndex(s => s.id === channel.id);
        if (index !== -1) {
            subscriptions.splice(index, 1);
        } else {
            subscriptions.push({
                id: channel.id,
                title: channel.title,
                thumbnail: channel.thumbnail,
                subscribedAt: new Date().toISOString(),
            });
        }
        setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
        return index === -1; // Return true if now subscribed
    },

    isSubscribed: (channelId) => {
        const subscriptions = subscriptionService.getAll();
        return subscriptions.some(s => s.id === channelId);
    },

    clear: () => setItem(STORAGE_KEYS.SUBSCRIPTIONS, []),
};

// Playback positions (resume from last position)
export const playbackService = {
    getAll: () => getItem(STORAGE_KEYS.PLAYBACK_POSITIONS, {}),

    save: (videoId, position, duration) => {
        const positions = playbackService.getAll();
        positions[videoId] = {
            position,
            duration,
            updatedAt: new Date().toISOString(),
        };
        setItem(STORAGE_KEYS.PLAYBACK_POSITIONS, positions);
    },

    get: (videoId) => {
        const positions = playbackService.getAll();
        return positions[videoId];
    },

    remove: (videoId) => {
        const positions = playbackService.getAll();
        delete positions[videoId];
        setItem(STORAGE_KEYS.PLAYBACK_POSITIONS, positions);
    },

    clear: () => setItem(STORAGE_KEYS.PLAYBACK_POSITIONS, {}),
};

// User preferences
export const preferencesService = {
    get: () => getItem(STORAGE_KEYS.PREFERENCES, {
        autoplay: true,
        defaultQuality: 'auto',
        playbackSpeed: 1,
        theme: 'dark',
        region: 'US',
    }),

    update: (updates) => {
        const preferences = preferencesService.get();
        const updated = { ...preferences, ...updates };
        setItem(STORAGE_KEYS.PREFERENCES, updated);
        return updated;
    },

    reset: () => {
        const defaults = {
            autoplay: true,
            defaultQuality: 'auto',
            playbackSpeed: 1,
            theme: 'dark',
            region: 'US',
        };
        setItem(STORAGE_KEYS.PREFERENCES, defaults);
        return defaults;
    },
};

// Search history
export const searchHistoryService = {
    getAll: () => getItem(STORAGE_KEYS.SEARCH_HISTORY, []),

    add: (query) => {
        if (!query.trim()) return;
        const history = searchHistoryService.getAll();
        // Remove if already exists
        const filtered = history.filter(q => q.toLowerCase() !== query.toLowerCase());
        // Add to beginning
        filtered.unshift(query);
        // Keep only last 20 searches
        const limited = filtered.slice(0, 20);
        setItem(STORAGE_KEYS.SEARCH_HISTORY, limited);
    },

    remove: (query) => {
        const history = searchHistoryService.getAll();
        const filtered = history.filter(q => q !== query);
        setItem(STORAGE_KEYS.SEARCH_HISTORY, filtered);
    },

    clear: () => setItem(STORAGE_KEYS.SEARCH_HISTORY, []),
};

// Export all services
export default {
    playlists: playlistService,
    watchLater: watchLaterService,
    history: historyService,
    likes: likeService,
    subscriptions: subscriptionService,
    playback: playbackService,
    preferences: preferencesService,
    searchHistory: searchHistoryService,
};
