import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import VideoCard from '../components/VideoCard';
import { searchHistoryService } from '../services/storage';
import { generateRelatedTags } from '../utils/searchHelpers';
import { Search as SearchIcon, X, Clock, History, TrendingUp, Sparkles } from 'lucide-react';
import './Search.css';

const Search = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q');

    const [results, setResults] = useState([]);
    const [relatedTags, setRelatedTags] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [error, setError] = useState(null);

    const [history, setHistory] = useState([]);
    const observer = useRef();

    // Load history on mount
    useEffect(() => {
        setHistory(searchHistoryService.get());
    }, []);

    // Main Search Effect
    useEffect(() => {
        if (!query) {
            setResults([]);
            setRelatedTags([]);
            return;
        }

        const executeSearch = async () => {
            setIsSearching(true);
            setError(null);
            setNextPageToken(null);
            // DON'T clear results - we'll set them at the end to prevent flicker
            
            // Save to history
            if (!searchHistoryService.get().includes(query)) {
                searchHistoryService.add(query);
                setHistory(searchHistoryService.get());
            }

            try {
                console.log(`🔍 Starting search for: "${query}"`);

                // 1. Basic Search - this is our fallback source
                const searchData = await youtubeAPI.search(query, 'video', 20);
                console.log(`📊 Search API response:`, searchData);

                let finalItems = [];
                let token = searchData.nextPageToken || null;

                if (searchData.items && searchData.items.length > 0) {
                    token = searchData.nextPageToken;
                    console.log(`🎬 Found ${searchData.items.length} items`);

                    // 2. Extract IDs for enrichment
                    const videoIds = searchData.items
                        .map(item => item.id?.videoId)
                        .filter(Boolean);

                    console.log(`🔑 Extracted ${videoIds.length} video IDs for enrichment`);

                    // 3. Enrich with details (View counts, durations) if we have IDs
                    let detailsData = { items: [] };
                    if (videoIds.length > 0) {
                        try {
                            detailsData = await youtubeAPI.getVideosByIds(videoIds);
                            console.log(`✨ Enriched ${detailsData.items?.length || 0} videos with details`);
                        } catch (enrichErr) {
                            console.warn("⚠️ Enrichment failed, using basic results", enrichErr);
                        }
                    }

                    // 4. Merge or Fallback - most robust pattern
                    finalItems = searchData.items.map((item, index) => {
                        const vidId = item.id?.videoId;
                        const detailedItem = detailsData.items?.find(d => d.id === vidId);

                        // Return enriched if available, otherwise transform basic result
                        return detailedItem || {
                            ...item,
                            id: vidId || item.id
                        };
                    }).filter(Boolean); // Remove any null/undefined items that might crash VideoCard

                    console.log(`📝 Final results count: ${finalItems.length}`);

                    // Generate Related Tags only if we have items
                    const generatedTags = generateRelatedTags(finalItems, query);
                    setRelatedTags(generatedTags);
                } else {
                    console.log(`❌ No items found in search response`);
                }

                // Always set results, even if empty array (shows "No results"
                setResults(finalItems);
                setNextPageToken(token);
                console.log(`✅ Search completed for: "${query}"`);

            } catch (err) {
                console.error("💥 Search failed:", err);
                setError("Something went wrong. Please try again.");
                // Ensure we show empty results, not a blank screen
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        executeSearch();
        window.scrollTo(0, 0);

    }, [query]);

    // Load More (Infinite Scroll)
    const loadMore = async () => {
        if (isLoadingMore || !nextPageToken) return;

        console.log(`📜 Loading more results for: "${query}"`);
        setIsLoadingMore(true);
        try {
            const searchData = await youtubeAPI.search(query, 'video', 20, nextPageToken);
            console.log(`📊 Load more response: ${searchData.items?.length || 0} items`);

            if (searchData.items && searchData.items.length > 0) {
                let newItems = [];
                const videoIds = searchData.items
                    .map(item => item.id?.videoId)
                    .filter(Boolean);

                // Enrich or fallback - same robust pattern as main search
                let detailsData = { items: [] };
                if (videoIds.length > 0) {
                    try {
                        detailsData = await youtubeAPI.getVideosByIds(videoIds);
                        console.log(`✨ Load more enriched ${detailsData.items?.length || 0} videos`);
                    } catch (err) {
                        console.warn("⚠️ Load more enrichment failed", err);
                    }
                }

                newItems = searchData.items.map(item => {
                    const vidId = item.id?.videoId;
                    const detailedItem = detailsData.items?.find(d => d.id === vidId);
                    return detailedItem || {
                        ...item,
                        id: vidId || item.id
                    };
                }).filter(Boolean); // Filter out invalid items that might crash VideoCard

                console.log(`📝 Adding ${newItems.length} new items to results`);
                setResults(prev => [...prev, ...newItems]);
                setNextPageToken(searchData.nextPageToken);
            }
        } catch (err) {
            console.error("💥 Load more failed:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Intersection Observer for Infinite Scroll
    const lastResultRef = useCallback(node => {
        if (isSearching || isLoadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageToken) {
                loadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [isSearching, isLoadingMore, nextPageToken]);


    // History Actions
    const clearHistory = () => {
        searchHistoryService.clear();
        setHistory([]);
    };

    const removeFromHistory = (e, item) => {
        e.stopPropagation();
        searchHistoryService.remove(item);
        setHistory(searchHistoryService.get());
    };

    const handleTagClick = (tag) => {
        // If clicking a related tag, search for "Original Query + Tag" or just "Tag"?
        // Usually "Tag" is better if it's a topic.
        // Let's try combining if it makes sense, but replacing is standard behavior for "Related searches" links.
        navigate(`/search?q=${encodeURIComponent(tag)}`);
    };

    return (
        <div className="search-page animate-fade">
            <div className="search-content">
                
                {/* 1. Loading State */}
                {isSearching && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Searching for "{query}"...</p>
                    </div>
                )}

                {/* 2. Error State */}
                {!isSearching && error && (
                    <div className="error-state">
                        <SearchIcon size={48} className="error-icon" />
                        <h3>Search Error</h3>
                        <p>{error}</p>
                        <p>We're having trouble connecting to the search service.</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                )}

                {/* 3. Results State */}
                {!isSearching && !error && query && (
                    <>
                        {/* Related Tags Bar */}
                        {relatedTags.length > 0 && (
                            <div className="related-tags-bar">
                                <div className="related-label">
                                    <Sparkles size={16} />
                                    <span>Related:</span>
                                </div>
                                <div className="related-chips">
                                    {relatedTags.map((tag, idx) => (
                                        <button
                                            key={idx}
                                            className="related-chip"
                                            onClick={() => handleTagClick(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Video Grid */}
                        {results.length > 0 ? (
                            <div className="search-results-grid">
                                {results.map((item, index) => {
                                    if (!item) return null;

                                    // Generate stable key
                                    const videoId = item.id?.videoId || (typeof item.id === 'string' ? item.id : null);
                                    const key = videoId ? `${videoId}-${index}` : `item-${index}`;

                                    if (index === results.length - 1) {
                                        return (
                                            <div ref={lastResultRef} key={key}>
                                                <VideoCard video={item} displayType="list" />
                                            </div>
                                        );
                                    }
                                    return <VideoCard key={key} video={item} displayType="list" />;
                                })}

                                {isLoadingMore && (
                                    <div className="loading-more">
                                        <div className="spinner-small"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <SearchIcon size={48} className="empty-icon" />
                                <h3>No results found for "{query}"</h3>
                                <p>Try checking your spelling or use different keywords</p>
                                <div className="suggestions-section">
                                    <h4>Suggestions:</h4>
                                    <ul>
                                        <li>Make sure all words are spelled correctly</li>
                                        <li>Try different keywords</li>
                                        <li>Try more general keywords</li>
                                        <li>Try fewer keywords</li>
                                    </ul>
                                </div>
                                <button
                                    className="try-again-btn"
                                    onClick={() => window.location.reload()}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* 4. No Query / Dashboard State */}
                {!query && (
                    <div className="search-suggestions">
                        {/* History Section */}
                        {history.length > 0 && (
                            <div className="history-section">
                                <div className="section-header">
                                    <div className="header-left">
                                        <History size={18} />
                                        <h3>Recent Searches</h3>
                                    </div>
                                    <button className="clear-history-btn" onClick={clearHistory}>
                                        Clear All
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
                                                title="Remove from history"
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
                                <h3>Trending Topics</h3>
                            </div>
                            <div className="tags-cloud">
                                {['New Music', 'Gaming 2025', 'Live News', 'Tech Reviews', 'Movie Trailers', 'React Tutorials', 'Funny Cats', 'ASMR'].map(tag => (
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
