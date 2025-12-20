import React, { useState, useEffect, useRef, useCallback } from 'react';
import { youtubeAPI } from '../services/youtube';
import VideoCard from '../components/VideoCard';
import './Home.css';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Unified video list
    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);

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

    // Helper: Duration to Seconds
    const getDurationInSeconds = (duration) => {
        if (!duration) return -1;
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;
        const hours = (parseInt(match[1]) || 0);
        const minutes = (parseInt(match[2]) || 0);
        const seconds = (parseInt(match[3]) || 0);
        return hours * 3600 + minutes * 60 + seconds;
    };

    const filterVideos = (items) => {
        return (items || []).filter(item => {
            const seconds = getDurationInSeconds(item.contentDetails?.duration);
            return seconds > 60 || seconds === -1;
        });
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

            // 2. Fetch Trending (Critical)
            const trendingData = await youtubeAPI.getTrending('US', 20);
            const validVideos = filterVideos(trendingData.items);

            // Prefetch icons prevents cascading 20 requests
            await fetchChannelIcons(validVideos);

            setVideos(validVideos);
            setNextPageToken(trendingData.nextPageToken);

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
            if (!token) setInitialLoading(true);

            let data;
            if (categoryId) {
                data = await youtubeAPI.getVideosByCategory(categoryId, 'US', 20, token);
            } else {
                data = await youtubeAPI.getTrending('US', 20, token);
            }

            const newVideos = filterVideos(data.items);

            await fetchChannelIcons(newVideos);

            if (token) {
                setVideos(prev => [...prev, ...newVideos]);
                setLoadingMore(false);
            } else {
                setVideos(newVideos);
                setInitialLoading(false);
            }

            setNextPageToken(data.nextPageToken);

        } catch (err) {
            console.error("Load videos error", err);
            if (!token) setInitialLoading(false);
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


    if (initialLoading && videos.length === 0) {
        return (
            <div className="loading-container">
                <div className="logo-loading">
                    <img src="/satorii.png" alt="Satorii" />
                </div>
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
                    {videos.map((video, index) => {
                        if (index === videos.length - 1) {
                            return (
                                <div ref={lastVideoRef} key={video.id + index}>
                                    <VideoCard video={video} />
                                </div>
                            );
                        } else {
                            return <VideoCard key={video.id + index} video={video} />;
                        }
                    })}
                </div>
                {loadingMore && <div className="spinner-small" style={{ margin: '40px auto' }}></div>}
            </div>
        </div>
    );

    function handleCategoryClick(categoryId) {
        setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    }
};

export default Home;
