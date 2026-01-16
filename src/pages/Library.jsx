import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/storage';
import VideoCard from '../components/VideoCard';
import { youtubeAPI } from '../services/youtube';
import { filterOutShorts, isYouTubeShort } from '../utils/videoFilters';
import './Library.css';

const Library = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [enrichedVideos, setEnrichedVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const historyData = historyService.getAll();
        setHistory(historyData);

        if (historyData.length > 0) {
            try {
                const ids = historyData.map(v => v.id);
                const enriched = await youtubeAPI.getVideosByIds(ids);
                if (enriched.items) {
                    setEnrichedVideos(filterOutShorts(enriched.items));
                }
            } catch (err) {
                console.warn("Failed to enrich history metadata", err);
            }
        }
        setLoading(false);
    };

    const handleClearHistory = () => {
        if (confirm('Clear all watch history?')) {
            historyService.clear();
            setHistory([]);
            setEnrichedVideos([]);
        }
    };

    const visibleHistoryVideos = history
        .map((hVideo) => {
            const fullVideo = enrichedVideos.find(v => v.id === hVideo.id) || {
                id: hVideo.id,
                snippet: {
                    title: hVideo.title,
                    channelTitle: hVideo.channelTitle,
                    thumbnails: { medium: { url: hVideo.thumbnail } },
                    publishedAt: hVideo.watchedAt,
                },
                statistics: { viewCount: '0' },
            };

            return isYouTubeShort(fullVideo) ? null : fullVideo;
        })
        .filter(Boolean);

    return (
        <div className="page library-page animate-fade">
            <div className="content-header history-header-row">
                <h1 className="page-title">Watch History</h1>
                {history.length > 0 && (
                    <button className="btn-premium" onClick={handleClearHistory}>
                        Clear All History
                    </button>
                )}
            </div>

            <div className="library-content">
                {loading ? (
                    <div className="loading-container"><div className="spinner"></div></div>
                ) : visibleHistoryVideos.length > 0 ? (
                    <div className="video-grid">
                        {visibleHistoryVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                            />
                        ))}
                    </div>
                ) : history.length > 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-large">🚫</div>
                        <h2>No videos to show</h2>
                        <p>Shorts are hidden, and your history currently contains only Shorts.</p>
                        <button className="btn-premium filled" onClick={() => navigate('/')}>Explore Videos</button>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon-large">🕒</div>
                        <h2>Your history is empty</h2>
                        <p>Videos you watch will show up here.</p>
                        <button className="btn-premium filled" onClick={() => navigate('/')}>Explore Videos</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
