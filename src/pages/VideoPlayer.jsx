import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtube';
import { historyService, watchLaterService, subscriptionService } from '../services/storage';
import VideoCard from '../components/VideoCard';
import ChannelAvatar from '../components/ChannelAvatar';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { filterOutShorts, isYouTubeShort } from '../utils/videoFilters';
import {
    Clock,
    Share2,
    ListPlus,
    MessageSquare,
    X,
    PictureInPicture
} from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ mini = false, videoId: propVideoId, onClose }) => {
    const { videoId: routeVideoId } = useParams();
    const videoId = propVideoId || routeVideoId;

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
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    // Infinite Scroll State
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    const iframeRef = useRef(null);

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
            // Only scroll to top if not in mini mode
            if (!mini) window.scrollTo(0, 0);
        }
    }, [videoId, mini]);

    const loadVideoData = async () => {
        try {
            setLoading(true);

            // 1. Get Video Details
            const videoData = await youtubeAPI.getVideoDetails(videoId);
            let currentVideo = null;

            if (videoData.items && videoData.items.length > 0) {
                currentVideo = videoData.items[0];

                if (isYouTubeShort(currentVideo)) {
                    setError('YouTube Shorts are not supported in this app.');
                    try {
                        window.keepAliveAudio?.pause?.();
                        if ('mediaSession' in navigator) {
                            navigator.mediaSession.playbackState = 'none';
                        }
                    } catch { }
                    return;
                }

                setVideo(currentVideo);
                setIsSubscribed(subscriptionService.isSubscribed(currentVideo.snippet.channelId));

                // Fetch Channel Icon for Subscribing
                try {
                    const icon = await youtubeAPI.getChannelIcon(currentVideo.snippet.channelId);
                    setChannelIcon(icon || '');
                } catch (err) {
                    // Silently fail if icon not found
                }

                // Media Session API for Background Play/Controls
                if ('mediaSession' in navigator && 'MediaMetadata' in window) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: currentVideo.snippet.title,
                        artist: currentVideo.snippet.channelTitle,
                        artwork: [
                            { src: currentVideo.snippet.thumbnails.high.url, sizes: '480x360', type: 'image/jpeg' },
                            { src: currentVideo.snippet.thumbnails.medium.url, sizes: '320x180', type: 'image/jpeg' }
                        ]
                    });

                    const sendPlayerCommand = (func) => {
                        const iframe = iframeRef.current;
                        iframe?.contentWindow?.postMessage(`{"event":"command","func":"${func}","args":""}`, '*');
                    };

                    const setHandler = (action, handler) => {
                        try {
                            navigator.mediaSession.setActionHandler(action, handler);
                        } catch {
                            // Some browsers throw for unsupported actions
                        }
                    };

                    const startBackgroundAudio = () => {
                        const audio = window.keepAliveAudio;
                        if (!audio) return;
                        audio.play().catch(() => { });
                        navigator.mediaSession.playbackState = 'playing';
                    };

                    setHandler('play', () => {
                        sendPlayerCommand('playVideo');
                        window.keepAliveAudio?.play?.().catch(() => { });
                        navigator.mediaSession.playbackState = 'playing';
                    });

                    setHandler('pause', () => {
                        sendPlayerCommand('pauseVideo');
                        window.keepAliveAudio?.pause?.();
                        navigator.mediaSession.playbackState = 'paused';
                    });

                    setHandler('stop', () => {
                        sendPlayerCommand('pauseVideo');
                        window.keepAliveAudio?.pause?.();
                        navigator.mediaSession.playbackState = 'none';
                    });

                    startBackgroundAudio();
                }

                historyService.add({
                    id: videoId,
                    title: currentVideo.snippet.title,
                    thumbnail: currentVideo.snippet.thumbnails.medium.url,
                    channelTitle: currentVideo.snippet.channelTitle,
                    duration: currentVideo.contentDetails.duration,
                });
            }

            // ONLY fetch more data if NOT in mini mode
            if (!mini && currentVideo) {
                // 2. Get Related Videos
                try {
                    let relatedData = await youtubeAPI.getRelatedVideos(videoId, 20, null, currentVideo.snippet.title);
                    let items = relatedData.items || [];
                    if (items.length > 0) {
                        const ids = items.map(i => i.id.videoId || i.id).filter(id => typeof id === 'string');
                        if (ids.length > 0) {
                            const enriched = await youtubeAPI.getVideosByIds(ids);
                            if (enriched.items?.length > 0) items = enriched.items;
                        }
                    }
                    setRelatedVideos(filterOutShorts(items));
                    setNextPageToken(relatedData.nextPageToken);
                } catch (err) { console.warn("Related fetch error", err); }

                // 3. Get Comments
                try {
                    const commentsData = await youtubeAPI.getComments(videoId, 20);
                    setComments(commentsData.items || []);
                } catch (err) { console.warn("Comments restricted"); }
            }

        } catch (err) {
            console.error('Error loading video page:', err);
            setError('Unable to load video');
        } finally {
            setLoading(false);
        }
    };

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

            const filtered = filterOutShorts(items);
            setRelatedVideos(prev => [...prev, ...filtered]);
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

    if (error) {
        return (
            <div className="video-player-page error-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '12px' }}>
                <h2>Video Unavailable</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '520px', lineHeight: '1.5' }}>{error}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-premium filled" onClick={() => navigate('/')}>Go Home</button>
                    <button className="btn-premium" onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    if (mini) {
        return (
            <div className="mini-player-contents">
                <div className="mini-player-iframe">
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                        title="Video Player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </div>
                <div className="mini-player-info">
                    <div className="mini-text-stack">
                        <span className="mini-video-title">{video?.snippet?.title || 'Loading...'}</span>
                        <span className="mini-video-channel">{video?.snippet?.channelTitle}</span>
                    </div>
                    <button className="mini-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-player-page">
            <div className={`player-main-column ${isTheaterMode ? 'theater' : ''}`}>
                <div className="player-container">
                    <div className="player-wrapper">
                        <iframe
                            ref={iframeRef}
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                            title={video?.snippet?.title || "Video Player"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                        <button
                            className="theater-mode-toggle"
                            onClick={() => setIsTheaterMode(!isTheaterMode)}
                            title={isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
                        >
                            <div className="theater-icon-box"></div>
                        </button>
                    </div>
                </div>

                <div className="video-info-section">
                    {video ? (
                        <>
                            <h1 className="video-title-full">{video.snippet.title}</h1>

                            <div className="video-meta-row">
                                <div className="channel-info" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/channel/${video.snippet.channelId}`);
                                }}>
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
                                    <button className="btn-premium action-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                                        <Share2 size={18} />
                                        <span>Share</span>
                                    </button>

                                    <button
                                        className={`btn-premium action-btn ${inWatchLater ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleWatchLater(); }}
                                    >
                                        <Clock size={18} fill={inWatchLater ? "currentColor" : "none"} />
                                        <span>{inWatchLater ? 'Saved' : 'Watch Later'}</span>
                                    </button>

                                    <button
                                        className="btn-premium action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (document.pictureInPictureElement) {
                                                document.exitPictureInPicture();
                                            } else if (iframeRef.current) {
                                                // Note: Standard iframe doesn't support requestPictureInPicture directly easily without hacky workarounds or API
                                                // But we can trigger it if the browser supports it for the video element inside
                                                alert("To use PiP, please right-click the video (twice) and select 'Picture in Picture'");
                                            }
                                        }}
                                    >
                                        <PictureInPicture size={18} />
                                        <span>PiP</span>
                                    </button>

                                    <button className="btn-premium action-btn" onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}>
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
                                    onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
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
