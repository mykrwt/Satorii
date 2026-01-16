import React, { useState, useEffect } from 'react';
import { youtubeAPI } from '../services/youtube';
import { User, Monitor } from 'lucide-react';
import './ChannelAvatar.css';

const ChannelAvatar = ({ channelId, channelTitle, size = 36 }) => {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    const avatarStyle = {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`
    };

    useEffect(() => {
        let mounted = true;
        const fetchAvatar = async () => {
            if (!channelId) {
                setLoading(false);
                return;
            }

            try {
                const url = await youtubeAPI.getChannelIcon(channelId);
                if (mounted && url) {
                    setAvatarUrl(url);
                }
            } catch (err) {
                // ignore
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchAvatar();
        return () => { mounted = false; };
    }, [channelId]);

    if (loading) {
        return (
            <div className="channel-avatar-s placeholder pulse" style={avatarStyle}>
            </div>
        );
    }

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={channelTitle}
                className="channel-avatar-s real"
                style={avatarStyle}
            />
        );
    }

    return (
        <div className="channel-avatar-s placeholder" style={avatarStyle}>
            <span style={{ fontSize: `${size / 3}px` }}>📺</span>
        </div>
    );
};

export default ChannelAvatar;
