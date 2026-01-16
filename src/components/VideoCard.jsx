import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import ChannelAvatar from './ChannelAvatar';
import VideoPreview from './VideoPreview';
import './VideoCard.css';

const VideoCard = ({ video, showChannel = true, displayType = 'grid' }) => {
    const navigate = useNavigate();
    const [showPreview, setShowPreview] = useState(false);
    const [anchorRect, setAnchorRect] = useState(null);
    const hoverTimeoutRef = useRef(null);
    const cardRef = useRef(null);

    if (!video) return null;

    // Safely access video properties with defaults
    const snippet = video.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    const contentDetails = video.contentDetails || {};
    const statistics = video.statistics || {};
    
    // Extract videoId - handle both string and object formats
    const videoId = typeof video.id === 'string' ? video.id : video.id?.videoId;

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
        if (videoId) {
            // User-gesture: kickstart keep-alive audio so MediaSession can show OS controls/notification.
            try {
                window.keepAliveAudio?.play?.().catch(() => { });
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            } catch { }

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

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        
        // Only show preview on desktop (wider screens)
        if (window.innerWidth >= 1024) {
            hoverTimeoutRef.current = setTimeout(() => {
                if (cardRef.current) {
                    const rect = cardRef.current.getBoundingClientRect();
                    setAnchorRect({
                        top: rect.top,
                        left: rect.right + 10,
                        bottom: rect.bottom,
                        right: rect.right
                    });
                    setShowPreview(true);
                }
            }, 800); // Show preview after 800ms hover
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowPreview(false);
    };

    const handleTouchStart = (e) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        
        hoverTimeoutRef.current = setTimeout(() => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                setAnchorRect({
                    top: rect.top,
                    left: rect.right + 10,
                    bottom: rect.bottom,
                    right: rect.right
                });
                setShowPreview(true);
            }
        }, 500); // Show preview after 500ms long-press
    };

    const handleTouchEnd = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const thumbnail = thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url;

    const duration = contentDetails.duration;
    const views = statistics.viewCount;
    const publishedAt = snippet.publishedAt;
    const title = snippet.title || 'Untitled Video';
    const channelTitle = snippet.channelTitle || 'Unknown Channel';
    const videoIdForPreview = videoId;

    return (
        <>
            <div 
                ref={cardRef}
                className={`video-card ${displayType}`} 
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
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
                                {views && publishedAt && <span className="meta-separator">•</span>}
                                {publishedAt && <span>{formatPublishedAt(publishedAt)}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPreview && videoIdForPreview && (
                <VideoPreview 
                    videoId={videoIdForPreview}
                    onClose={() => setShowPreview(false)}
                    anchorRect={anchorRect}
                />
            )}
        </>
    );
};

export default VideoCard;
