import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';

import { youtubeAPI } from '@services/youtube';
import { subscriptionService } from '@services/storage';
import { filterOutShorts } from '@utils/videoFilters';

import VideoCard from '@components/common/VideoCard';
import './Channel.css';

const Channel = () => {
    const { channelId } = useParams();
    const navigate = useNavigate();

    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);

    const [playlists, setPlaylists] = useState([]);
    const [playlistsNextToken, setPlaylistsNextToken] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);

    const [activeTab, setActiveTab] = useState('home');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const tabs = useMemo(() => ([
        { key: 'home', label: 'Home' },
        { key: 'playlists', label: 'Playlists' },
        { key: 'about', label: 'About' },
    ]), []);

    const loadChannelData = useCallback(async () => {
        try {
            setLoading(true);

            const channelData = await youtubeAPI.getChannelDetails(channelId);

            if (channelData.items && channelData.items.length > 0) {
                const currentChannel = channelData.items[0];
                setChannel(currentChannel);
                setIsSubscribed(subscriptionService.isSubscribed(channelId));

                const videosSearch = await youtubeAPI.getChannelVideos(channelId, 24);
                if (videosSearch.items && videosSearch.items.length > 0) {
                    const videoIds = videosSearch.items.map(item => item?.id?.videoId).filter(Boolean);
                    if (videoIds.length > 0) {
                        const enriched = await youtubeAPI.getVideosByIds(videoIds);
                        setVideos(filterOutShorts(enriched.items || []));
                    } else {
                        setVideos([]);
                    }
                } else {
                    setVideos([]);
                }
            } else {
                setChannel(null);
                setVideos([]);
            }
        } catch (error) {
            console.error('Error loading channel:', error);
            setChannel(null);
            setVideos([]);
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    const loadPlaylists = useCallback(async (pageToken = null) => {
        try {
            setLoadingPlaylists(true);
            const data = await youtubeAPI.getChannelPlaylists(channelId, 24, pageToken);

            const newItems = data.items || [];
            setPlaylists(prev => (pageToken ? [...prev, ...newItems] : newItems));
            setPlaylistsNextToken(data.nextPageToken || null);
        } catch (error) {
            console.error('Error loading channel playlists:', error);
        } finally {
            setLoadingPlaylists(false);
        }
    }, [channelId]);

    useEffect(() => {
        setActiveTab('home');
        setPlaylists([]);
        setPlaylistsNextToken(null);
        loadChannelData();
    }, [channelId, loadChannelData]);

    useEffect(() => {
        if (activeTab === 'playlists' && playlists.length === 0 && !loadingPlaylists) {
            loadPlaylists();
        }
    }, [activeTab, playlists.length, loadingPlaylists, loadPlaylists]);

    const handleSubscribe = () => {
        if (!channel) return;
        const nowSubscribed = subscriptionService.toggle({
            id: channel.id,
            title: channel.snippet?.title,
            thumbnail: channel.snippet?.thumbnails?.default?.url,
        });
        setIsSubscribed(nowSubscribed);
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        const number = parseInt(num);
        if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
        if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
        return number.toString();
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (!channel) {
        return <div className="error-container">Channel not found</div>;
    }

    const bannerUrl = channel.brandingSettings?.image?.bannerExternalUrl;
    const description = channel.snippet?.description || '';
    const joinedAt = channel.snippet?.publishedAt ? new Date(channel.snippet.publishedAt).toLocaleDateString() : null;

    return (
        <div className="channel-page animate-fade">
            <div className="channel-banner">
                {bannerUrl ? (
                    <img
                        src={`${bannerUrl}=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`}
                        alt="Channel Banner"
                    />
                ) : (
                    <div className="banner-placeholder" />
                )}
            </div>

            <div className="channel-header">
                <div className="channel-header-content">
                    <div className="channel-avatar-xl">
                        <img
                            src={channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url}
                            alt={channel.snippet?.title}
                        />
                    </div>

                    <div className="channel-details-main">
                        <h1 className="channel-title-xl">{channel.snippet?.title}</h1>
                        <div className="channel-meta-text">
                            {channel.snippet?.customUrl && (
                                <>
                                    <span className="channel-handle">{channel.snippet.customUrl}</span>
                                    <span className="meta-dot">•</span>
                                </>
                            )}
                            <span>{formatNumber(channel.statistics?.subscriberCount)} subscribers</span>
                            <span className="meta-dot">•</span>
                            <span>{formatNumber(channel.statistics?.videoCount)} videos</span>
                        </div>

                        {description && (
                            <p className="channel-desc-short">
                                {description.substring(0, 150)}
                                {description.length > 150 && '...'}
                            </p>
                        )}

                        <div className="channel-actions-xl">
                            <button
                                className={`btn-premium subscribe-btn-xl ${isSubscribed ? 'subscribed' : 'filled'}`}
                                onClick={handleSubscribe}
                            >
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                            <button className="btn-premium btn-notification" title="Notifications">
                                <Bell size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="channel-tabs-sticky">
                <div className="channel-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="channel-content">
                {activeTab === 'home' && (
                    <>
                        <div className="section-heading">
                            <h3>Latest Videos</h3>
                        </div>
                        {videos.length > 0 ? (
                            <div className="video-grid">
                                {videos.map(video => (
                                    <VideoCard key={video.id} video={video} showChannel={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-tab-state">
                                <div className="empty-icon-large">📺</div>
                                <h3>No videos found</h3>
                                <p>This channel has no videos available to display.</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'playlists' && (
                    <>
                        <div className="section-heading">
                            <h3>Playlists</h3>
                        </div>

                        {loadingPlaylists && playlists.length === 0 ? (
                            <div className="loading-container"><div className="spinner"></div></div>
                        ) : playlists.length > 0 ? (
                            <div className="channel-playlists-grid">
                                {playlists.map((pl) => {
                                    const thumb = pl.snippet?.thumbnails?.high?.url || pl.snippet?.thumbnails?.medium?.url || pl.snippet?.thumbnails?.default?.url;
                                    return (
                                        <button
                                            key={pl.id}
                                            className="channel-playlist-card"
                                            onClick={() => navigate(`/playlist/${pl.id}`)}
                                            type="button"
                                        >
                                            <div className="channel-playlist-thumb">
                                                {thumb ? (
                                                    <img src={thumb} alt={pl.snippet?.title} loading="lazy" />
                                                ) : (
                                                    <div className="playlist-thumb-placeholder" />
                                                )}
                                            </div>
                                            <div className="channel-playlist-meta">
                                                <h4 className="channel-playlist-title">{pl.snippet?.title || 'Untitled Playlist'}</h4>
                                                <p className="channel-playlist-count">
                                                    {pl.contentDetails?.itemCount ?? 0} videos
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-tab-state">
                                <div className="empty-icon-large">📂</div>
                                <h3>No public playlists</h3>
                                <p>This channel has no playlists available to display.</p>
                            </div>
                        )}

                        {playlistsNextToken && (
                            <div className="channel-load-more-row">
                                <button
                                    className="btn-premium filled"
                                    onClick={() => loadPlaylists(playlistsNextToken)}
                                    disabled={loadingPlaylists}
                                >
                                    {loadingPlaylists ? 'Loading…' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'about' && (
                    <div className="channel-about">
                        <div className="channel-about-section">
                            <h3>About</h3>
                            {description ? (
                                <p className="channel-about-description">{description}</p>
                            ) : (
                                <p className="channel-about-muted">No description provided.</p>
                            )}
                        </div>

                        <div className="channel-about-section">
                            <h3>Stats</h3>
                            <div className="channel-about-stats">
                                {joinedAt && (
                                    <div className="about-stat-row">
                                        <span className="about-stat-label">Joined</span>
                                        <span className="about-stat-value">{joinedAt}</span>
                                    </div>
                                )}
                                <div className="about-stat-row">
                                    <span className="about-stat-label">Total views</span>
                                    <span className="about-stat-value">{formatNumber(channel.statistics?.viewCount)}</span>
                                </div>
                                <div className="about-stat-row">
                                    <span className="about-stat-label">Country</span>
                                    <span className="about-stat-value">{channel.snippet?.country || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="channel-about-section">
                            <button
                                className="btn-premium"
                                type="button"
                                onClick={() => window.open(`https://www.youtube.com/channel/${channelId}`, '_blank', 'noopener,noreferrer')}
                            >
                                Open on YouTube
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Channel;
