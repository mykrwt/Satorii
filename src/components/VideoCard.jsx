import React from 'react';
import { useNavigate } from 'react-router-dom';

import ChannelAvatar from './ChannelAvatar';
import './VideoCard.css';

const VideoCard = ({ video, showChannel = true, displayType = 'grid' }) => {
    const navigate = useNavigate();

    if (!video) return null;

    const formatDuration = (duration) => {
        if (!duration) return '';
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '';

        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');

        let formatted = '';
        if (hours) formatted += `${hours}:`;

        // If hours present, pad minutes, else don't padding if single digit minutes? 
        // YouTube usually pads unless < 10min total. Let's strict pad.
        formatted += `${(minutes || '0').padStart(hours ? 2 : 1, '0')}:`;
        formatted += (seconds || '0').padStart(2, '0');

        return formatted;
    };

    const formatViews = (count) => {
        if (count === undefined || count === null) return '';
        const num = parseInt(count);
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
        return `${num} ${num === 1 ? 'view' : 'views'}`;
    };

    const formatPublishedAt = (date) => {
        if (!date) return '';
        const now = new Date();
        const published = new Date(date);
        const diffMs = now - published;

        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const handleClick = () => {
        // Robust ID handling
        const videoId = video.id?.videoId || (typeof video.id === 'string' ? video.id : null);
        if (videoId) {
            navigate(`/watch/${videoId}`);
        } else {
            console.warn('VideoCard: No valid video ID found', video);
        }
    };

    const handleChannelClick = (e) => {
        e.stopPropagation();
        const channelId = video.snippet?.channelId;
        if (channelId) {
            navigate(`/channel/${channelId}`);
        }
    };

    const thumbnail = video.snippet?.thumbnails?.maxres?.url ||
        video.snippet?.thumbnails?.standard?.url ||
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.medium?.url ||
        video.snippet?.thumbnails?.default?.url;

    const duration = video.contentDetails?.duration;
    const views = video.statistics?.viewCount;
    const publishedAt = video.snippet?.publishedAt;
    const title = video.snippet?.title || 'Untitled Video';
    const channelTitle = video.snippet?.channelTitle || 'Unknown Channel';

    return (
        <div className={`video-card ${displayType}`} onClick={handleClick}>
            <div className="video-thumbnail">
                {thumbnail && <img src={thumbnail} alt={title} loading="lazy" />}
                {duration && (
                    <span className="video-duration">{formatDuration(duration)}</span>
                )}
            </div>

            <div className="video-info">
                <h3 className="video-title" title={title}>{title}</h3>

                <div className="video-meta-container">
                    {showChannel && displayType === 'grid' && (
                        <div className="video-avatar-wrapper" onClick={handleChannelClick}>
                            <ChannelAvatar channelId={video.snippet?.channelId} channelTitle={channelTitle} size={32} />
                        </div>
                    )}

                    <div className="video-meta-text">
                        {showChannel && (
                            <div className="video-channel" onClick={handleChannelClick}>
                                {channelTitle}
                            </div>
                        )}

                        <div className="video-meta">
                            {views && <span>{formatViews(views)}</span>}
                            {(views || publishedAt) && <span className="meta-separator">•</span>}
                            {publishedAt && <span>{formatPublishedAt(publishedAt)}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
