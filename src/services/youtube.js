import axios from 'axios';

// YouTube Data API v3 configuration
const API_KEYS = [
    'AIzaSyCZr5hLowxIZfACJON4IRCUruoelK5AEx4', // Default
    'AIzaSyCVGJ7BMf8kfljknnw12vX_P1mb3Vap-XQ', // Backup 1
    'AIzaSyAR_FlsSpfCCnlDTtP5Mx-QA5yiGyC6xmQ', // Backup 2
    'AIzaSyCQE7nxqXNvJo1N1LCfLx0i5I2Yd2Mbqn8'  // Backup 3
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
                originalRequest.params = { ...originalRequest.params, key: API_KEYS[currentKeyIndex] };
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
            console.log(`🔎 YouTube API Search: query="${query}", type="${type}", maxResults=${maxResults}`);
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
            console.log(`📊 YouTube API Search Response: ${response.data.items?.length || 0} items, nextPageToken: ${response.data.nextPageToken || 'none'}`);
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('💥 YouTube API Search Error:', error);
            if (error.response) {
                console.error('📋 Error details:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            }

            const ytError = error.response?.data?.error;
            return {
                items: [],
                nextPageToken: null,
                ...(ytError ? { error: ytError } : { error: { message: 'YouTube API request failed' } })
            };
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

    // Get channel playlists
    getChannelPlaylists: async (channelId, maxResults = 20, pageToken = null) => {
        const cacheKey = `channel_playlists_${channelId}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await api.get('/playlists', {
                params: {
                    part: 'snippet,contentDetails',
                    channelId,
                    maxResults,
                    pageToken,
                },
            });
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Get channel playlists error:', error);
            return { items: [], nextPageToken: null };
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
        const cacheKey = `related_${videoId}_${pageToken}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        // 1. Try strict relation first (YouTube Data API v3 has deprecated/restricted this significantly)
        try {
            console.log(`🔗 Attempting strict related search for ${videoId}`);
            const response = await api.get('/search', {
                params: {
                    part: 'snippet',
                    relatedToVideoId: videoId,
                    type: 'video',
                    maxResults,
                    pageToken,
                },
            });

            if (response.data.items && response.data.items.length >= 10) {
                setCache(cacheKey, response.data);
                return response.data;
            }

            console.log('⚠️ Strict related search returned low results, trying title fallback');
        } catch (error) {
            console.warn('❌ Strict related fetch failed (Deprecated/Quota/Restricted):', error.message);
        }

        // 2. Fallback to Title Search (Much more reliable)
        if (titleFallback) {
            try {
                console.log(`🔎 Falling back to title search: "${titleFallback}"`);
                const searchResp = await api.get('/search', {
                    params: {
                        part: 'snippet',
                        q: titleFallback,
                        type: 'video',
                        maxResults,
                        pageToken,
                    },
                });

                // Mix in the videoId to help it be more relevant if it's a series
                if (searchResp.data.items) {
                    setCache(cacheKey, searchResp.data);
                    return searchResp.data;
                }
            } catch (err) {
                console.error('💥 Title fallback search also failed:', err);
            }
        }

        return { items: [], nextPageToken: null };
    },

    // Get detailed video data for a list of IDs (Enrichment)
    getVideosByIds: async (videoIds) => {
        // No caching for batch yet or per-id caching could be complex, simple fetch for now
        try {
            console.log(`🔍 YouTube API Batch Details: ${videoIds.length} video IDs`);
            const response = await api.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoIds.join(','),
                },
            });
            console.log(`📊 YouTube API Batch Response: ${response.data.items?.length || 0} items`);
            return response.data;
        } catch (error) {
            console.error('💥 YouTube API Batch Details Error:', error);
            if (error.response) {
                console.error('📋 Batch error details:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            return { items: [] };
        }
    },

    // Get comments for a video
    getComments: async (videoId, maxResults = 20) => {
        const cacheKey = `comments_${videoId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
            console.log(`💬 Fetching comments for ${videoId}`);
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
            console.warn('⚠️ Comments fetch failed (Disabled/Quota/Restricted):', error.message);
            return { items: [], nextPageToken: null };
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

    // 🔍 YouTube Search Suggestions (Autocomplete)
    getSearchSuggestions: async (query) => {
        if (!query || query.trim().length === 0) return [];

        try {
            // Using the public suggestqueries endpoint
            // Note: This endpoint is technically JSONP but axios handles the string response
            const response = await axios.get(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`);

            // The response format is window.google.ac.h(["query", [["suggestion1", 0], ["suggestion2", 0]]])
            // We need to extract the suggestions array
            const dataStr = response.data;
            const match = dataStr.match(/\((.*)\)/);
            if (match && match[1]) {
                const parsed = JSON.parse(match[1]);
                if (Array.isArray(parsed) && parsed[1]) {
                    return parsed[1].map(item => item[0]);
                }
            }
            return [];
        } catch (error) {
            console.warn('Autocomplete fetch failed:', error);
            return [];
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
