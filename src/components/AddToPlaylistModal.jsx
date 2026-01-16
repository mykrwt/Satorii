import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';
import { playlistService } from '../services/storage';
import './AddToPlaylistModal.css';

const AddToPlaylistModal = ({ video, onClose }) => {
    const [playlists, setPlaylists] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = () => {
        setPlaylists(playlistService.getAll());
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (newPlaylistName.trim()) {
            playlistService.create(newPlaylistName);
            setNewPlaylistName('');
            setIsCreating(false);
            loadPlaylists();
        }
    };

    const toggleVideoInPlaylist = (playlistId) => {
        const playlist = playlistService.get(playlistId);
        if (!playlist) return;

        const exists = playlist.videos.some(v => v.id === video.id || v.id === video.id?.videoId);

        // Normalize video object for storage
        const videoData = {
            id: video.id?.videoId || video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails?.medium?.url,
            channelTitle: video.snippet.channelTitle,
            duration: video.contentDetails?.duration || '0:00'
        };

        if (exists) {
            playlistService.removeVideo(playlistId, videoData.id);
        } else {
            playlistService.addVideo(playlistId, videoData);
        }
        loadPlaylists(); // Refresh state
    };

    const isVideoInPlaylist = (playlist) => {
        const vidId = video.id?.videoId || video.id;
        return playlist.videos.some(v => v.id === vidId);
    };

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Save to playlist</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="playlists-list">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            className="playlist-option"
                            onClick={() => toggleVideoInPlaylist(playlist.id)}
                        >
                            <div className={`checkbox ${isVideoInPlaylist(playlist) ? 'checked' : ''}`}>
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span>{playlist.name}</span>
                        </div>
                    ))}
                </div>

                {isCreating ? (
                    <form onSubmit={handleCreate} className="create-playlist-form">
                        <input
                            type="text"
                            placeholder="Playlist name..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" disabled={!newPlaylistName.trim()}>Create</button>
                    </form>
                ) : (
                    <button className="create-btn" onClick={() => setIsCreating(true)}>
                        <Plus size={18} /> Create new playlist
                    </button>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AddToPlaylistModal;
