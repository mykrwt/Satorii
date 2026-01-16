import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../../services/youtube';
import { Play, Eye, ThumbsUp, Calendar, X } from 'lucide-react';
import ChannelAvatar from './ChannelAvatar';
import './VideoPreview.css';

const VideoPreview = ({ videoId, onClose, anchorRect }) => {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!videoId) return;

        const loadVideoPreview = async () => {
            try {
                setLoading(true);
                const data = await youtubeAPI.getVideoDetails(videoId);
                if (data.items && data.items.length > 0) {
                    setVideo(data.items[0]);
                }
            } catch (error) {
                console.error('Error loading video preview:', error);
            } finally {
                setLoading(false);
            }
        };

        // Delay to prevent accidental hovers
        const timer = setTimeout(loadVideoPreview, 300);
        return () => clearTimeout(timer);
    }, [videoId]);

    const formatNumber = (num) => {
        if (!num) return '0';
        const number = parseInt(num);
        if (number >= 1000000000) return `${(number / 1000000000).toFixed(1)}B`;
        if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
        if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
        return number.toString();
    };

    const formatDuration = (duration) => {
        if (!duration) return '';
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '';

        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');

        let formatted = '';
        if (hours) formatted += `${hours}:`;
        formatted += `${(minutes || '0').padStart(hours ? 2 : 1, '0')}:`;
        formatted += (seconds || '0').padStart(2, '0');

        return formatted;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePlayVideo = () => {
        navigate(`/watch/${videoId}`);
        onClose();
    };

    if (!video || loading) return null;

    const snippet = video.snippet;
    const stats = video.statistics;
    const contentDetails = video.contentDetails;

    const thumbnail = snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url;

    // Position the preview based on anchor
    const previewStyle = anchorRect ? {
        position: 'fixed',
        top: `${Math.min(anchorRect.top, window.innerHeight - 400)}px`,
        left: `${Math.min(anchorRect.left, window.innerWidth - 380)}px`,
    } : {};

    const modalContent = (
        <>
            <div className="video-preview-backdrop" onClick={onClose} />
            <div className="video-preview-card" style={previewStyle}>
                <button className="preview-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>

                <div className="preview-thumbnail-container" onClick={handlePlayVideo}>
                    <img src={thumbnail} alt={snippet.title} className="preview-thumbnail" />
                    <div className="preview-play-overlay">
                        <Play size={48} fill="white" />
                    </div>
                    {contentDetails?.duration && (
                        <span className="preview-duration">{formatDuration(contentDetails.duration)}</span>
                    )}
                </div>

                <div className="preview-content">
                    <h3 className="preview-title" onClick={handlePlayVideo}>{snippet.title}</h3>

                    <div className="preview-channel" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/channel/${snippet.channelId}`);
                        onClose();
                    }}>
                        <ChannelAvatar
                            channelId={snippet.channelId}
                            channelTitle={snippet.channelTitle}
                            size={32}
                        />
                        <span className="preview-channel-name">{snippet.channelTitle}</span>
                    </div>

                    <div className="preview-stats">
                        {stats?.viewCount && (
                            <div className="preview-stat">
                                <Eye size={16} />
                                <span>{formatNumber(stats.viewCount)} views</span>
                            </div>
                        )}
                        {stats?.likeCount && (
                            <div className="preview-stat">
                                <ThumbsUp size={16} />
                                <span>{formatNumber(stats.likeCount)}</span>
                            </div>
                        )}
                        {snippet?.publishedAt && (
                            <div className="preview-stat">
                                <Calendar size={16} />
                                <span>{formatDate(snippet.publishedAt)}</span>
                            </div>
                        )}
                    </div>

                    <div className="preview-description">
                        {snippet.description?.slice(0, 150)}
                        {snippet.description?.length > 150 && '...'}
                    </div>

                    <button className="preview-watch-btn" onClick={handlePlayVideo}>
                        <Play size={18} />
                        Watch Now
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
};

export default VideoPreview;
