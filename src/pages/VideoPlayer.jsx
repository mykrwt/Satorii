import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import { historyService, watchLaterService, playlistService, likeService, subscriptionService } from '../services/storage';
import VideoCard from '../components/VideoCard';
import ChannelAvatar from '../components/ChannelAvatar';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import {
    ArrowLeft,
    Clock,
    Share2,
    ListPlus,
    MessageSquare,
    CheckCircle2
} from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inWatchLater, setInWatchLater] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [channelIcon, setChannelIcon] = useState('');

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video?.snippet?.title || 'Satorii Video',
                    url: url
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    const handleSubscribe = () => {
        if (!video) return;
        const nowSubscribed = subscriptionService.toggle({
            id: video.snippet.channelId,
            title: video.snippet.channelTitle,
            thumbnail: channelIcon
        });
        setIsSubscribed(nowSubscribed);
    };
    const [showComments, setShowComments] = useState(false);
    const [error, setError] = useState(null);

    // Infinite Scroll State
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    useEffect(() => {
        if (videoId) {
            setVideo(null);
            setRelatedVideos([]);
            setComments([]);
            setNextPageToken(null);
            setShowDescription(false);
            setChannelIcon('');

            loadVideoData();
            setInWatchLater(watchLaterService.has(videoId));
            window.scrollTo(0, 0);
        }
    }, [videoId]);

    const loadVideoData = async () => {
        try {
            setLoading(true);

            // 1. Get Video Details
            const videoData = await youtubeAPI.getVideoDetails(videoId);
            let currentVideo = null;

            if (videoData.items && videoData.items.length > 0) {
                currentVideo = videoData.items[0];
                setVideo(currentVideo);
                setIsSubscribed(subscriptionService.isSubscribed(currentVideo.snippet.channelId));

                // Fetch Channel Icon for Subscribing
                try {
                    const icon = await youtubeAPI.getChannelIcon(currentVideo.snippet.channelId);
                    setChannelIcon(icon || '');
                } catch (err) {
                    console.log("Could not fetch channel icon for sub");
                }

                historyService.add({
                    id: videoId,
                    title: currentVideo.snippet.title,
                    thumbnail: currentVideo.snippet.thumbnails.medium.url,
                    channelTitle: currentVideo.snippet.channelTitle,
                    duration: currentVideo.contentDetails.duration,
                });
            }

            // 2. Get Related Videos (Smart Service Fallback)
            if (currentVideo) {
                try {
                    // Pass title for fallback search
                    let relatedData = await youtubeAPI.getRelatedVideos(videoId, 20, null, currentVideo.snippet.title);
                    let items = relatedData.items || [];

                    // ENRICH: Get full details (HD thumbs, duration)
                    if (items.length > 0) {
                        const ids = items.map(i => i.id.videoId || i.id).filter(id => typeof id === 'string');
                        if (ids.length > 0) {
                            const enriched = await youtubeAPI.getVideosByIds(ids);
                            if (enriched.items?.length > 0) {
                                items = enriched.items;
                            }
                        }
                    }

                    setRelatedVideos(items);
                    setNextPageToken(relatedData.nextPageToken);
                } catch (err) {
                    console.warn("Related fetch visual error", err);
                }
            }

            // 3. Get Comments
            try {
                const commentsData = await youtubeAPI.getComments(videoId, 20);
                setComments(commentsData.items || []);
            } catch (err) {
                console.warn("Comments are disabled or restricted");
            }

        } catch (err) {
            console.error('Error loading video page:', err);
            setError('Unable to load video');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="video-player-page error-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <h2>Video Unavailable</h2>
                <button className="btn-premium" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    const loadMoreRelated = async () => {
        if (loadingMore || !nextPageToken || !video) return;

        setLoadingMore(true);
        try {
            const data = await youtubeAPI.getRelatedVideos(videoId, 20, nextPageToken, video.snippet.title);
            let items = data.items || [];

            if (items.length > 0) {
                const ids = items.map(i => i.id.videoId || i.id).filter(id => typeof id === 'string');
                if (ids.length > 0) {
                    const enriched = await youtubeAPI.getVideosByIds(ids);
                    if (enriched.items?.length > 0) {
                        items = enriched.items;
                    }
                }
            }

            setRelatedVideos(prev => [...prev, ...items]);
            setNextPageToken(data.nextPageToken);
        } catch (err) {
            console.error("Error loading more related:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const lastVideoElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageToken) {
                loadMoreRelated();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingMore, nextPageToken]);

    // ... handleWatchLater, formatNumber same as before ...
    const handleWatchLater = () => {
        if (inWatchLater) {
            watchLaterService.remove(videoId);
            setInWatchLater(false);
        } else {
            if (video) {
                watchLaterService.add({
                    id: videoId,
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.medium.url,
                    channelTitle: video.snippet.channelTitle,
                    duration: video.contentDetails.duration,
                });
                setInWatchLater(true);
            }
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        const number = parseInt(num);
        if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
        if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
        return number.toString();
    };

    return (
        <div className="video-player-page">
            <div className="player-main-column">
                <div className="player-container">
                    <div className="player-wrapper">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
                            title="Video Player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>

                <div className="video-info-section">
                    {video ? (
                        <>
                            <h1 className="video-title-full">{video.snippet.title}</h1>

                            <div className="video-meta-row">
                                <div className="channel-info" onClick={() => navigate(`/channel/${video.snippet.channelId}`)}>
                                    <ChannelAvatar channelId={video.snippet.channelId} channelTitle={video.snippet.channelTitle} size={40} />
                                    <div className="channel-text">
                                        <h3 className="channel-name">{video.snippet.channelTitle}</h3>
                                        {video.statistics?.subscriberCount && (
                                            <span className="channel-subs" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                {formatNumber(video.statistics.subscriberCount)} subscribers
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className={`btn-premium subscribe-btn ${isSubscribed ? 'subscribed' : 'filled'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubscribe();
                                        }}
                                        style={isSubscribed ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : {}}
                                    >
                                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                                    </button>
                                </div>

                                <div className="video-actions-row">
                                    <button className="btn-premium action-btn" onClick={handleShare}>
                                        <Share2 size={18} />
                                        <span>Share</span>
                                    </button>

                                    <button
                                        className={`btn-premium action-btn ${inWatchLater ? 'active' : ''}`}
                                        onClick={handleWatchLater}
                                    >
                                        <Clock size={18} fill={inWatchLater ? "currentColor" : "none"} />
                                        <span>{inWatchLater ? 'Saved' : 'Watch Later'}</span>
                                    </button>

                                    <button className="btn-premium action-btn" onClick={() => setShowPlaylistModal(true)}>
                                        <ListPlus size={18} />
                                        <span>Save</span>
                                    </button>
                                </div>
                            </div>

                            <div className={`description-box ${showDescription ? 'expanded' : ''}`} onClick={() => setShowDescription(!showDescription)}>
                                <div className="description-stats">
                                    <span>{formatNumber(video.statistics.viewCount)} views</span>
                                    <span>{new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="description-text">
                                    {video.snippet.description}
                                </p>
                                <button className="show-more-btn">
                                    {showDescription ? 'Show less' : 'Show more'}
                                </button>
                            </div>

                            {/* Real Comments Section */}
                            <div className="comments-section">
                                <button
                                    className="comments-header-btn"
                                    onClick={() => setShowComments(!showComments)}
                                >
                                    <h3>{comments.length > 0 ? `${formatNumber(video.statistics.commentCount)} Comments` : 'Comments'}</h3>
                                    <span className={`chevron ${showComments ? 'up' : 'down'}`}>▼</span>
                                </button>

                                {!showComments && comments.length > 0 && (
                                    <div className="comments-preview" onClick={() => setShowComments(true)}>
                                        {comments.slice(0, 2).map(commentThread => {
                                            const comment = commentThread.snippet.topLevelComment.snippet;
                                            return (
                                                <div key={commentThread.id} className="comment-preview-item">
                                                    <span className="comment-author-preview">{comment.authorDisplayName}:</span>
                                                    <span className="comment-text-preview">{comment.textOriginal.slice(0, 60)}{comment.textOriginal.length > 60 ? '...' : ''}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="view-all-label">Tap to view all</div>
                                    </div>
                                )}

                                {showComments && (
                                    comments.length > 0 ? (
                                        <div className="comments-list animate-fade">
                                            {comments.map(commentThread => {
                                                const comment = commentThread.snippet.topLevelComment.snippet;
                                                return (
                                                    <div key={commentThread.id} className="comment-item">
                                                        <img src={comment.authorProfileImageUrl} alt="" className="comment-avatar" />
                                                        <div className="comment-content">
                                                            <div className="comment-header">
                                                                <span className="comment-author">{comment.authorDisplayName}</span>
                                                                <span className="comment-date">{new Date(comment.publishedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="comment-text">{comment.textOriginal}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="comments-placeholder">
                                            <MessageSquare size={24} />
                                            <p>Comments are turned off or unavailable.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="meta-loading">
                            <div className="skeleton" style={{ height: '28px', width: '80%', marginBottom: '16px' }} />
                            <div className="skeleton" style={{ height: '40px', width: '100%' }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="related-videos-section">
                <h3>Up Next</h3>
                <div className="video-list">
                    {relatedVideos.map((relatedVideo, index) => {
                        if (index === relatedVideos.length - 1) {
                            return (
                                <div ref={lastVideoElementRef} key={relatedVideo.id?.videoId || relatedVideo.id || index}>
                                    <VideoCard video={relatedVideo} displayType="list" />
                                </div>
                            );
                        } else {
                            return <VideoCard key={relatedVideo.id?.videoId || relatedVideo.id || index} video={relatedVideo} displayType="list" />;
                        }
                    })}
                    {loadingMore && <div className="spinner-small" style={{ margin: '20px auto' }}></div>}
                </div>
            </div>

            {showPlaylistModal && video && (
                <AddToPlaylistModal
                    video={video}
                    onClose={() => setShowPlaylistModal(false)}
                />
            )}
        </div>
    );
};

export default VideoPlayer;
