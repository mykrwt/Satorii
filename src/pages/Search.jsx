import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import VideoCard from '../components/VideoCard';
import { searchHistoryService } from '../services/storage';
import { Search as SearchIcon, X, Clock, History, TrendingUp } from 'lucide-react';
import './Search.css';

const Search = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q');

    const [results, setResults] = useState([]);

    // Loading State
    const [initialLoading, setInitialLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState(null);

    const [history, setHistory] = useState([]);
    const observer = useRef();

    useEffect(() => {
        setHistory(searchHistoryService.get());
    }, []);

    useEffect(() => {
        if (query) {
            // New search: reset everything
            setResults([]);
            setNextPageToken(null);
            setLoadingMore(false);
            performSearch(query, null);
        } else {
            setResults([]);
        }
    }, [query]);

    const performSearch = async (searchQuery, token = null) => {
        if (!searchQuery.trim()) return;

        if (token) {
            setLoadingMore(true);
        } else {
            setInitialLoading(true);
            // Save history on new search
            const currentHistory = searchHistoryService.get();
            if (!currentHistory.includes(searchQuery)) {
                searchHistoryService.add(searchQuery);
                setHistory(searchHistoryService.get());
            }
        }

        try {
            // 1. Fetch BASIC search results
            const data = await youtubeAPI.search(searchQuery, 'video', 20, token);
            const basicItems = data.items || [];

            if (basicItems.length === 0) {
                if (!token) setResults([]);
                setLoadingMore(false);
                setInitialLoading(false);
                return;
            }

            // 2. Extract Video IDs
            const videoIds = basicItems
                .map(item => item.id?.videoId || item.id)
                .filter(id => typeof id === 'string');

            let finalItems = basicItems;

            if (videoIds.length > 0) {
                // 3. ENRICH: Fetch FULL details
                let enrichmentSuccess = false;
                try {
                    const detailedData = await youtubeAPI.getVideosByIds(videoIds);
                    if (detailedData.items && detailedData.items.length > 0) {
                        finalItems = detailedData.items;
                        enrichmentSuccess = true;
                    }
                } catch (enrichError) {
                    console.warn('Video enrichment failed, using basic results:', enrichError);
                }

                if (!enrichmentSuccess) {
                    // Fallback to basic items if enrichment fails (or returns empty items) - transform to match expected structure
                    finalItems = basicItems.map(item => {
                        const videoId = item.id?.videoId || item.id;
                        // Create a structure that VideoCard expects
                        return {
                            id: typeof videoId === 'string' ? videoId : item.id,
                            snippet: item.snippet || {},
                            // These fields will be undefined but VideoCard handles that gracefully
                            contentDetails: undefined,
                            statistics: undefined
                        };
                    });
                }
            }

            if (token) {
                setResults(prev => [...prev, ...finalItems]);
            } else {
                setResults(finalItems);
            }

            setNextPageToken(data.nextPageToken);

        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            if (token) setLoadingMore(false);
            else setInitialLoading(false);
        }
    };

    const loadMore = () => {
        if (loadingMore || !nextPageToken) return;
        performSearch(query, nextPageToken);
    };

    const lastResultRef = useCallback(node => {
        if (initialLoading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageToken) {
                loadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [initialLoading, loadingMore, nextPageToken]);


    const clearHistory = () => {
        searchHistoryService.clear();
        setHistory([]);
    };

    const removeFromHistory = (e, item) => {
        e.stopPropagation();
        searchHistoryService.remove(item);
        setHistory(searchHistoryService.get());
    };

    return (
        <div className="search-page animate-fade">
            <div className="search-content">
                {initialLoading && results.length === 0 ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : query ? (
                    <div className="search-results-grid">
                        {results.map((item, index) => {
                            const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId;
                            const uniqueKey = videoId ? `${videoId}-${index}` : `search-result-${index}`;

                            if (index === results.length - 1) {
                                return (
                                    <div ref={lastResultRef} key={uniqueKey}>
                                        <VideoCard video={item} displayType="list" />
                                    </div>
                                );
                            } else {
                                return <VideoCard key={uniqueKey} video={item} displayType="list" />;
                            }
                        })}

                        {loadingMore && <div className="spinner-small" style={{ margin: '20px auto' }}></div>}

                        {results.length === 0 && !initialLoading && (
                            <div className="empty-state">
                                <SearchIcon size={48} className="empty-icon" />
                                <h3>No results found</h3>
                                <p>Try different keywords</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="search-suggestions">
                        {/* History Section */}
                        {history.length > 0 && (
                            <div className="history-section">
                                <div className="section-header">
                                    <div className="header-left">
                                        <History size={18} />
                                        <h3>Recent</h3>
                                    </div>
                                    <button className="clear-history-btn" onClick={clearHistory}>
                                        Clear
                                    </button>
                                </div>
                                <div className="history-list">
                                    {history.map((item, index) => (
                                        <div
                                            key={index}
                                            className="history-item"
                                            onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                                        >
                                            <Clock size={16} className="history-icon" />
                                            <span>{item}</span>
                                            <button
                                                className="remove-history-btn"
                                                onClick={(e) => removeFromHistory(e, item)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trending Tags */}
                        <div className="trending-tags-section">
                            <div className="section-header">
                                <TrendingUp size={18} />
                                <h3 style={{ color: 'var(--text-primary)' }}>Trending Topics</h3>
                            </div>
                            <div className="tags-cloud">
                                {['Music', 'Gaming', 'Live', 'News', 'Techno', 'Movies', 'React JS', 'Coding'].map(tag => (
                                    <button
                                        key={tag}
                                        className="tag-chip"
                                        onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
