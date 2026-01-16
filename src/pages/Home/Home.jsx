import React, { useState, useEffect, useRef, useCallback } from 'react';
import { youtubeAPI } from '@services/youtube';
import VideoCard from '@components/common/VideoCard';
import { filterOutShortSearchItems, filterOutShorts, getVideoId } from '@utils/videoFilters';
import './Home.css';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Unified video list
    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);

    const [feedStrategy, setFeedStrategy] = useState({
        mode: 'trending',
        source: 'videos',
        query: null,
        categoryId: null,
    });

    // Loading states
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const observer = useRef();

    // 1. Initial Load (Categories + First Batch)
    useEffect(() => {
        loadInitialData();
    }, []);

    // 2. Category Switch -> Reset and Load
    useEffect(() => {
        if (!initialLoading) { // Don't double trigger on mount
            setVideos([]);
            setNextPageToken(null);
            setLoadingMore(false);
            loadVideos(null, selectedCategory);
        }
    }, [selectedCategory]);

    const normalizeToVideoItems = async (items) => {
        if (!items || items.length === 0) return [];

        // Search results need enrichment to get durations/statistics (so we can reliably hide Shorts)
        const looksLikeSearch = items.some(i => i?.id?.videoId);

        if (looksLikeSearch) {
            const searchItems = filterOutShortSearchItems(items);
            const ids = searchItems.map(i => i?.id?.videoId).filter(Boolean);
            if (ids.length === 0) return [];

            try {
                const detailed = await youtubeAPI.getVideosByIds(ids);
                if (detailed?.items?.length) {
                    return detailed.items;
                }
            } catch (err) {
                console.warn('Failed to enrich search fallback items', err);
            }

            return searchItems
                .map(i => ({
                    id: i.id?.videoId,
                    snippet: i.snippet,
                }))
                .filter(v => v && v.id);
        }

        return items.filter(v => v && v.id);
    };

    // Optimized Batch Fetch
    const fetchChannelIcons = async (videoItems) => {
        if (!videoItems || videoItems.length === 0) return;
        const channelIds = videoItems.map(v => v.snippet?.channelId).filter(Boolean);
        if (channelIds.length > 0) {
            try {
                // Prefetch and cache all icons in ONE call
                await youtubeAPI.getChannels(channelIds);
            } catch (err) {
                console.warn('Batch channel fetch failed (Quota?):', err);
            }
        }
    };

    const loadInitialData = async () => {
        setInitialLoading(true);
        setError(null);

        try {
            // 1. Fetch Categories (Non-blocking)
            try {
                const categoriesData = await youtubeAPI.getCategories('US');
                setCategories(categoriesData.items || []);
            } catch (catErr) {
                console.warn('Categories failed to load', catErr);
                // Continue without categories
            }

            // 2. Fetch Trending (Critical) - with robust fallback
            const fallbackQuery = 'popular videos';
            let trendingData;
            let nextStrategy = {
                mode: 'trending',
                source: 'videos',
                query: null,
                categoryId: null,
            };

            try {
                trendingData = await youtubeAPI.getTrending('US', 20);

                // If service caught an error, it returns empty items. Treat this as failure to trigger fallback.
                if (!trendingData?.items || trendingData.items.length === 0) {
                    throw new Error('Trending API returned empty items');
                }
            } catch (trendingErr) {
                console.warn('Trending API failed or empty, trying fallback search:', trendingErr);
                try {
                    trendingData = await youtubeAPI.search(fallbackQuery, 'video', 20);
                    nextStrategy = {
                        mode: 'trending',
                        source: 'search',
                        query: fallbackQuery,
                        categoryId: null,
                    };
                } catch (searchErr) {
                    console.error('Both trending and fallback search failed:', searchErr);
                    trendingData = { items: [], nextPageToken: null };
                }
            }

            setFeedStrategy(nextStrategy);

            let validVideos = await normalizeToVideoItems(trendingData?.items || []);
            validVideos = filterOutShorts(validVideos);

            if (validVideos.length > 0) {
                await fetchChannelIcons(validVideos);
            }

            setVideos(validVideos);
            setNextPageToken(trendingData?.nextPageToken);

            if (validVideos.length === 0) {
                setError('No videos available at the moment. Please try again later.');
            }

        } catch (err) {
            console.error('Home feed failed:', err);
            setError('Unable to load trending videos. Check your connection.');
        } finally {
            setInitialLoading(false);
        }
    };

    const loadVideos = async (token = null, categoryId = null) => {
        try {
            // If manual load (category switch), ensure consistent loading state
            if (!token) {
                setInitialLoading(true);
                setError(null);
            }

            let data;
            let nextStrategy = feedStrategy;

            const isPaginating = Boolean(token);
            const wantsCategory = Boolean(categoryId);

            if (!isPaginating) {
                // New feed request (initial load or category switch): determine a stable strategy
                if (wantsCategory) {
                    try {
                        data = await youtubeAPI.getVideosByCategory(categoryId, 'US', 20, null);
                        if (!data?.items || data.items.length === 0) {
                            throw new Error('Category API returned empty items');
                        }
                        nextStrategy = {
                            mode: 'category',
                            source: 'videos',
                            query: null,
                            categoryId,
                        };
                    } catch (apiErr) {
                        console.warn('Category API failed or empty, using search fallback:', apiErr);
                        const searchQuery = `category ${categoryId}`;
                        try {
                            data = await youtubeAPI.search(searchQuery, 'video', 20, null);
                            nextStrategy = {
                                mode: 'category',
                                source: 'search',
                                query: searchQuery,
                                categoryId,
                            };
                        } catch (searchErr) {
                            console.error('Category search fallback failed:', searchErr);
                            data = { items: [], nextPageToken: null };
                        }
                    }
                } else {
                    const fallbackQuery = 'popular videos';
                    try {
                        data = await youtubeAPI.getTrending('US', 20, null);
                        if (!data?.items || data.items.length === 0) {
                            throw new Error('Trending API returned empty items');
                        }
                        nextStrategy = {
                            mode: 'trending',
                            source: 'videos',
                            query: null,
                            categoryId: null,
                        };
                    } catch (apiErr) {
                        console.warn('Trending API failed or empty, using search fallback:', apiErr);
                        try {
                            data = await youtubeAPI.search(fallbackQuery, 'video', 20, null);
                            nextStrategy = {
                                mode: 'trending',
                                source: 'search',
                                query: fallbackQuery,
                                categoryId: null,
                            };
                        } catch (searchErr) {
                            console.error('Trending search fallback failed:', searchErr);
                            data = { items: [], nextPageToken: null };
                        }
                    }
                }

                setFeedStrategy(nextStrategy);
            } else {
                // Pagination: continue using the established strategy so the pageToken stays compatible
                if (wantsCategory && (nextStrategy.mode !== 'category' || nextStrategy.categoryId !== categoryId)) {
                    nextStrategy = {
                        mode: 'category',
                        source: 'videos',
                        query: null,
                        categoryId,
                    };
                    setFeedStrategy(nextStrategy);
                }

                if (!wantsCategory && nextStrategy.mode !== 'trending') {
                    nextStrategy = {
                        mode: 'trending',
                        source: 'videos',
                        query: null,
                        categoryId: null,
                    };
                    setFeedStrategy(nextStrategy);
                }

                if (nextStrategy.source === 'search') {
                    const query = nextStrategy.query || (wantsCategory ? `category ${categoryId}` : 'popular videos');
                    data = await youtubeAPI.search(query, 'video', 20, token);
                } else {
                    data = wantsCategory
                        ? await youtubeAPI.getVideosByCategory(categoryId, 'US', 20, token)
                        : await youtubeAPI.getTrending('US', 20, token);
                }
            }

            let newVideos = await normalizeToVideoItems(data?.items || []);
            newVideos = filterOutShorts(newVideos);

            if (newVideos.length > 0) {
                await fetchChannelIcons(newVideos);
            }

            if (token) {
                setVideos(prev => [...prev, ...newVideos]);
                setLoadingMore(false);
            } else {
                setVideos(newVideos);
                setInitialLoading(false);

                if (newVideos.length === 0) {
                    setError('No videos available for this category. Please try again later.');
                }
            }

            setNextPageToken(data?.nextPageToken);

        } catch (err) {
            console.error("Load videos error", err);
            if (!token) {
                setInitialLoading(false);
                setError('Failed to load videos. Please try again.');
            }
            if (token) setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (loadingMore || !nextPageToken) return;
        setLoadingMore(true);
        loadVideos(nextPageToken, selectedCategory);
    };

    const lastVideoRef = useCallback(node => {
        if (initialLoading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageToken) {
                loadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [initialLoading, loadingMore, nextPageToken]);


    // Show loading state to prevent black screen
    if (initialLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading trending videos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2 className="error-title">Content Unavailable</h2>
                <button className="btn-premium" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="home-page animate-fade">
            {/* Categories */}
            {categories.length > 0 && (
                <div className="categories-section">
                    <div className="categories-scroll">
                        <button
                            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(category.id)}
                            >
                                {category.snippet.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="videos-section">
                <div className="video-grid">
                    {videos.filter(video => video && video.id).map((video, index) => {
                        const videoId = getVideoId(video);
                        if (index === videos.length - 1) {
                            return (
                                <div ref={lastVideoRef} key={`${videoId || 'unknown'}-${index}`}>
                                    <VideoCard video={video} />
                                </div>
                            );
                        }
                        return <VideoCard key={`${videoId || 'unknown'}-${index}`} video={video} />;
                    })}
                </div>
                {loadingMore && <div className="spinner-small" style={{ margin: '40px auto' }}></div>}

                {/* Show message if no videos after filtering */}
                {videos.length === 0 && !initialLoading && !error && (
                    <div className="loading-container">
                        <p>No videos found</p>
                        <button className="btn-premium" onClick={() => window.location.reload()}>Refresh</button>
                    </div>
                )}
            </div>
        </div>
    );

    function handleCategoryClick(categoryId) {
        setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    }
};

export default Home;
