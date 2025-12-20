import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import { playlistService, watchLaterService, likeService } from '../services/storage';
import { Play, Shuffle, MoreVertical, Trash2, ArrowLeft, Clock, ListVideo, Film } from 'lucide-react';
import './Playlist.css';

import VideoCard from '../components/VideoCard';

const Playlist = () => {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlaylist();
    }, [playlistId]);

    const loadPlaylist = async () => {
        setLoading(true);
        let items = [];
        let info = null;

        if (playlistId === 'later') {
            items = watchLaterService.getAll();
            info = { name: 'Watch Later', type: 'system' };
        } else {
            const localPlaylist = playlistService.get(playlistId);
            if (localPlaylist) {
                info = localPlaylist;
                items = localPlaylist.videos || [];
            }
        }

        if (info) {
            setPlaylist(info);
            // Fetch full metadata for local items
            if (items.length > 0) {
                try {
                    const ids = items.map(v => v.id);
                    const enriched = await youtubeAPI.getVideosByIds(ids);
                    if (enriched.items) {
                        setVideos(enriched.items);
                    } else {
                        setVideos(items.map(v => ({
                            id: v.id,
                            snippet: {
                                title: v.title,
                                channelTitle: v.channelTitle,
                                thumbnails: { medium: { url: v.thumbnail } }
                            }
                        })));
                    }
                } catch (err) {
                    console.warn("Failed to enrich playlist items", err);
                    setVideos(items.map(v => ({
                        id: v.id,
                        snippet: {
                            title: v.title,
                            channelTitle: v.channelTitle,
                            thumbnails: { medium: { url: v.thumbnail } }
                        }
                    })));
                }
            } else {
                setVideos([]);
            }
            setLoading(false);
            return;
        }

        // Try YouTube Playlist
        try {
            const data = await youtubeAPI.getPlaylistDetails(playlistId);
            if (data.items && data.items.length > 0) {
                const result = data.items[0];
                setPlaylist({
                    name: result.snippet.title,
                    description: result.snippet.description,
                    thumbnail: result.snippet.thumbnails?.high?.url
                });

                const playlistItems = await youtubeAPI.getPlaylistItems(playlistId);
                const videoIds = playlistItems.items.map(item => item.snippet.resourceId.videoId);
                const fullVideos = await youtubeAPI.getVideosByIds(videoIds);
                setVideos(fullVideos.items || []);
            }
        } catch (err) {
            console.error("Playlist load error", err);
        } finally {
            setLoading(false);
        }
    };

    const playPlaylist = (index = 0) => {
        if (videos.length > 0) {
            navigate(`/watch/${videos[index].id}`);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    if (!playlist) return <div className="error-container">Playlist not found</div>;

    return (
        <div className="playlist-page animate-fade">
            <div className="playlist-header">
                <div className="playlist-cover">
                    {videos.length > 0 ? (
                        <img
                            src={videos[0].snippet?.thumbnails?.maxres?.url || videos[0].snippet?.thumbnails?.high?.url || videos[0].snippet?.thumbnails?.medium?.url}
                            alt="Cover"
                        />
                    ) : (
                        <div className="empty-cover">
                            <ListVideo size={48} />
                        </div>
                    )}
                </div>

                <div className="playlist-info">
                    <h1 className="playlist-title">{playlist.name}</h1>
                    <div className="playlist-stats">
                        <span>{videos.length} videos</span>
                        <span>• Updated Recently</span>
                    </div>

                    <div className="playlist-actions">
                        <button className="btn-premium filled" onClick={() => playPlaylist(0)}>
                            <Play size={18} fill="currentColor" /> Play All
                        </button>
                    </div>
                </div>
            </div>

            <div className="playlist-content">
                {videos.length > 0 ? (
                    <div className="video-grid list-view">
                        {videos.map((video, index) => (
                            <div key={`${video.id}-${index}`} className="playlist-item-wrapper">
                                <span className="item-index-ref">{index + 1}</span>
                                <VideoCard
                                    video={video}
                                    displayType="list"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Film size={48} className="empty-icon" />
                        <h3>No videos yet</h3>
                        <p>Videos you add will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist;
