import axios from 'axios';

// YouTube Data API v3 configuration
const API_KEYS = [
    'AIzaSyCZr5hLowxIZfACJON4IRCUruoelK5AEx4', // Default
    'AIzaSyCVGJ7BMf8kfljknnw12vX_P1mb3Vap-XQ', // Backup 1
    'AIzaSyAR_FlsSpfCCnlDTtP5Mx-QA5yiGyC6xmQ'  // Backup 2
];
let currentKeyIndex = 0;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const api = axios.create({
    baseURL: BASE_URL,
});

// Request Interceptor: Inject current key
api.interceptors.request.use(config => {
    config.params = config.params || {};
    config.params.key = API_KEYS[currentKeyIndex];
    return config;
});

// Response Interceptor: Handle 403 (Quota Exceeded)
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // If 403 and we haven't retried all keys yet
        if (error.response?.status === 403 && !originalRequest._retry) {
            if (currentKeyIndex < API_KEYS.length - 1) {
                originalRequest._retry = true;
                currentKeyIndex++;
                console.log(`⚠️ Quota exceeded. Switching to API Key ${currentKeyIndex + 1}/${API_KEYS.length}`);

                // Update key for retry
                originalRequest.params.key = API_KEYS[currentKeyIndex];
                return api(originalRequest);
            } else {
                console.error("❌ All API keys exhausted.");
            }
        }
        return Promise.reject(error);
    }
);

// Cache management (Optimized: 15 minutes)
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000;

const getCached = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

const setCache = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// API Methods
export const youtubeAPI = {
    // Search videos, channels, playlists
    search: async (query, type = 'video', maxResults = 20, pageToken = null) => {
        const cacheKey = `search_${query}_${type}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    type,
                    maxResults,
                    pageToken,
                    order: 'relevance',
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Search error:', error);
            // Return empty structure instead of throwing to prevent crashes
            return { items: [], nextPageToken: null };
        }
    },

    // Get video details
    getVideoDetails: async (videoId) => {
        const cacheKey = `video_${videoId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoId,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get video details error:', error);
            throw error;
        }
    },

    // Get multiple videos
    getVideos: async (videoIds) => {
        const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
        const cacheKey = `videos_${ids}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: ids,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get videos error:', error);
            throw error;
        }
    },

    // Get trending videos
    getTrending: async (regionCode = 'US', maxResults = 20, pageToken = null) => {
        const cacheKey = `trending_${regionCode}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    chart: 'mostPopular',
                    regionCode,
                    maxResults,
                    pageToken,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get trending error:', error);
            // Return empty structure instead of throwing to prevent crashes
            return { items: [], nextPageToken: null };
        }
    },

    // Get channel details
    getChannelDetails: async (channelId) => {
        const cacheKey = `channel_${channelId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/channels', {
                params: {
                    part: 'snippet,statistics,brandingSettings',
                    id: channelId,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get channel details error:', error);
            throw error;
        }
    },

    // Get channel videos
    getChannelVideos: async (channelId, maxResults = 20, pageToken = null) => {
        const cacheKey = `channel_videos_${channelId}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/search', {
                params: {
                    part: 'snippet',
                    channelId,
                    maxResults,
                    pageToken,
                    order: 'date',
                    type: 'video',
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get channel videos error:', error);
            throw error;
        }
    },

    // Get playlist details
    getPlaylistDetails: async (playlistId) => {
        const cacheKey = `playlist_${playlistId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/playlists', {
                params: {
                    part: 'snippet,contentDetails',
                    id: playlistId,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get playlist details error:', error);
            throw error;
        }
    },

    // Get playlist items
    getPlaylistItems: async (playlistId, maxResults = 50, pageToken = null) => {
        const cacheKey = `playlist_items_${playlistId}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/playlistItems', {
                params: {
                    part: 'snippet,contentDetails',
                    playlistId,
                    maxResults,
                    pageToken,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get playlist items error:', error);
            throw error;
        }
    },

    // Get video categories
    getCategories: async (regionCode = 'US') => {
        const cacheKey = `categories_${regionCode}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/videoCategories', {
                params: {
                    part: 'snippet',
                    regionCode,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    },

    // Get videos by category
    getVideosByCategory: async (categoryId, regionCode = 'US', maxResults = 20, pageToken = null) => {
        const cacheKey = `category_videos_${categoryId}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    chart: 'mostPopular',
                    videoCategoryId: categoryId,
                    regionCode,
                    maxResults,
                    pageToken,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get videos by category error:', error);
            // Return empty structure instead of throwing to prevent crashes
            return { items: [], nextPageToken: null };
        }
    },

    // Get related videos (Smart Fallback)
    getRelatedVideos: async (videoId, maxResults = 20, pageToken = null, titleFallback = '') => {
        // Try strict relation first
        try {
            const response = await api.get('/search', {
                params: {
                    part: 'snippet',
                    relatedToVideoId: videoId,
                    type: 'video',
                    maxResults,
                    pageToken,
                },
            });

            // If strict returns ample results, return them
            if (response.data.items && response.data.items.length > 5) {
                return response.data;
            }

            // Otherwise, combine or fallback to title search if provided
            if (titleFallback) {
                const searchResp = await api.get('/search', {
                    params: {
                        part: 'snippet',
                        q: titleFallback,
                        type: 'video',
                        maxResults,
                    },
                });
                return searchResp.data;
            }

            return response.data;
        } catch (error) {
            console.warn('Strict related fetch failed, failing over to search if possible.', error);
            if (titleFallback) {
                try {
                    const searchResp = await api.get('/search', {
                        params: {
                            part: 'snippet',
                            q: titleFallback,
                            type: 'video',
                            maxResults,
                        },
                    });
                    return searchResp.data;
                } catch (err) {
                    throw err;
                }
            }
            throw error;
        }
    },

    // Get detailed video data for a list of IDs (Enrichment)
    getVideosByIds: async (videoIds) => {
        // No caching for batch yet or per-id caching could be complex, simple fetch for now
        try {
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoIds.join(','),
                },
            });
            return response.data;
        } catch (error) {
            console.error('Batch video details fetch failed:', error);
            return { items: [] };
        }
    },

    // Get comments for a video
    getComments: async (videoId, maxResults = 20) => {
        const cacheKey = `comments_${videoId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/commentThreads', {
                params: {
                    part: 'snippet',
                    videoId,
                    maxResults,
                    order: 'relevance',
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Comments fetch failed:', error);
            throw error;
        }
    },

    // Get just the channel icon (Cached)
    getChannelIcon: async (channelId) => {
        if (!channelId) return null;
        const cacheKey = `channel_icon_${channelId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/channels', {
                params: {
                    part: 'snippet',
                    id: channelId,
                },
            });
            if (response.data.items?.length > 0) {
                const url = response.data.items[0].snippet.thumbnails.default.url;
                setCache(cacheKey, url);
                return url;
            }
            return null;
        } catch (error) {
            console.warn('Channel icon fetch failed', error);
            return null;
        }
    },

    // ⚡ BATCH OPTIMIZATION: Get multiple channels at once
    getChannels: async (channelIds) => {
        if (!channelIds || channelIds.length === 0) return { items: [] };

        // Remove duplicates and join
        const ids = Array.isArray(channelIds) ? [...new Set(channelIds)].join(',') : channelIds;
        const cacheKey = `channels_batch_${ids}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/channels', {
                params: {
                    part: 'snippet',
                    id: ids,
                },
            });

            // Cache individual items for future single lookups too
            if (response.data.items) {
                response.data.items.forEach(item => {
                    const iconKey = `channel_icon_${item.id}`;
                    setCache(iconKey, item.snippet.thumbnails.default.url);
                });
            }

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Batch channels fetch failed:', error);
            throw error;
        }
    },

    // Extract playlist ID from URL
    extractPlaylistId: (url) => {
        const patterns = [
            /[?&]list=([^&]+)/,
            /youtube\.com\/playlist\?list=([^&]+)/,
            /youtube\.com\/watch\?v=[^&]+&list=([^&]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    },

    // Extract video ID from URL
    extractVideoId: (url) => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /youtube\.com\/embed\/([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    },
};

export default youtubeAPI;
