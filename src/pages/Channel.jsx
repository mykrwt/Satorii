import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import { historyService, watchLaterService, playlistService, likeService, subscriptionService } from '../services/storage';
import VideoCard from '../components/VideoCard';
import { Users, Video, Eye, Bell } from 'lucide-react';
import './Channel.css';

const Channel = () => {
    const { channelId } = useParams();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        loadChannelData();
    }, [channelId]);

    const loadChannelData = async () => {
        try {
            setLoading(true);
            const channelData = await youtubeAPI.getChannelDetails(channelId);

            if (channelData.items && channelData.items.length > 0) {
                const currentChannel = channelData.items[0];
                setChannel(currentChannel);
                setIsSubscribed(subscriptionService.isSubscribed(channelId));

                // Fetch latest videos and enrich them for views/dates
                const videosSearch = await youtubeAPI.getChannelVideos(channelId, 24);
                if (videosSearch.items && videosSearch.items.length > 0) {
                    const videoIds = videosSearch.items.map(item => item.id.videoId);
                    const enriched = await youtubeAPI.getVideosByIds(videoIds);
                    setVideos(enriched.items || []);
                }
            }
        } catch (error) {
            console.error('Error loading channel:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = () => {
        if (!channel) return;
        const nowSubscribed = subscriptionService.toggle({
            id: channel.id,
            title: channel.snippet.title,
            thumbnail: channel.snippet.thumbnails.default.url
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

    return (
        <div className="channel-page animate-fade">
            {/* Banner */}
            <div className="channel-banner">
                {bannerUrl ? (
                    <img src={`${bannerUrl}=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`} alt="Channel Banner" />
                ) : (
                    <div className="banner-placeholder" />
                )}
            </div>

            {/* Header Info */}
            <div className="channel-header">
                <div className="channel-header-content">
                    <div className="channel-avatar-xl">
                        <img src={channel.snippet.thumbnails.high.url} alt={channel.snippet.title} />
                    </div>

                    <div className="channel-details-main">
                        <h1 className="channel-title-xl">{channel.snippet.title}</h1>
                        <div className="channel-meta-text">
                            <span className="channel-handle">{channel.snippet.customUrl}</span>
                            <span className="meta-dot">•</span>
                            <span>{formatNumber(channel.statistics.subscriberCount)} subscribers</span>
                            <span className="meta-dot">•</span>
                            <span>{formatNumber(channel.statistics.videoCount)} videos</span>
                        </div>
                        <p className="channel-desc-short">
                            {channel.snippet.description.substring(0, 150)}
                            {channel.snippet.description.length > 150 && "..."}
                        </p>

                        <div className="channel-actions-xl">
                            <button
                                className={`btn-premium subscribe-btn-xl ${isSubscribed ? 'subscribed' : 'filled'}`}
                                onClick={handleSubscribe}
                            >
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                            <button className="btn-premium btn-notification"><Bell size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="channel-tabs-sticky">
                <div className="channel-tabs">
                    {['Home', 'Shorts', 'Playlists', 'About'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-item ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="channel-content">
                {activeTab === 'home' ? (
                    <>
                        <div className="section-heading">
                            <h3>Latest Videos</h3>
                        </div>
                        <div className="video-grid">
                            {videos.map((video) => (
                                <VideoCard key={video.id} video={video} showChannel={false} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="empty-tab-state">
                        <div className="empty-icon-large">📺</div>
                        <h3>Section Coming Soon</h3>
                        <p>We're polishing this part of the channel experience.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Channel;
