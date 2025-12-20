import React, { useState } from 'react';
import { youtubeAPI } from '../services/youtube';
import { playlistService } from '../services/storage';
import { X, Link as LinkIcon, Download, Loader2, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import './PlaylistModal.css';

const PlaylistModal = ({ onClose, onImportSuccess }) => {
    const [mode, setMode] = useState('import'); // 'import' or 'create'
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const extractPlaylistId = (link) => {
        try {
            const urlObj = new URL(link);
            return urlObj.searchParams.get('list');
        } catch (e) {
            return null;
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('loading');
        setErrorMsg('');

        if (mode === 'import') {
            const playlistId = extractPlaylistId(url);
            if (!playlistId) {
                setStatus('error');
                setErrorMsg('Invalid YouTube playlist link.');
                setLoading(false);
                return;
            }

            try {
                const data = await youtubeAPI.getPlaylistDetails(playlistId);
                if (!data.items || data.items.length === 0) throw new Error('Playlist not found');
                const ytPlaylist = data.items[0];
                const itemsData = await youtubeAPI.getPlaylistItems(playlistId, 50);
                const videoItems = itemsData.items || [];

                const newLocalPlaylist = playlistService.create(ytPlaylist.snippet.title, ytPlaylist.snippet.description);
                videoItems.forEach(item => {
                    playlistService.addVideo(newLocalPlaylist.id, {
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails?.medium?.url || '',
                        channelTitle: item.snippet.videoOwnerChannelTitle || '',
                    });
                });

                setStatus('success');
                setTimeout(() => {
                    if (onImportSuccess) onImportSuccess(newLocalPlaylist.id);
                    onClose();
                }, 1000);
            } catch (err) {
                setStatus('error');
                setErrorMsg('Failed to import playlist.');
            } finally {
                setLoading(false);
            }
        } else {
            // Create Mode
            if (!name.trim()) {
                setStatus('error');
                setErrorMsg('Please enter a playlist name.');
                setLoading(false);
                return;
            }
            try {
                const newPlaylist = playlistService.create(name.trim(), 'Local collection');
                setStatus('success');
                setTimeout(() => {
                    if (onImportSuccess) onImportSuccess(newPlaylist.id);
                    onClose();
                }, 1000);
            } catch (err) {
                setStatus('error');
                setErrorMsg('Could not create playlist.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="import-modal-content animate-fade" onClick={e => e.stopPropagation()}>
                <div className="import-modal-header">
                    <div className="header-title">
                        {mode === 'import' ? <Download size={20} className="accent-icon" /> : <PlusCircle size={20} className="accent-icon" />}
                        <h3>{mode === 'import' ? 'Import Playlist' : 'Create Playlist'}</h3>
                    </div>
                    <button className="btn-icon close-modal" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="playlist-modal-tabs">
                    <button type="button" className={mode === 'import' ? 'active' : ''} onClick={() => setMode('import')}>Import from YT</button>
                    <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Create New</button>
                </div>

                <div className="import-modal-body">
                    <form onSubmit={handleAction} className="import-form">
                        <div className="input-wrapper">
                            {mode === 'import' ? <LinkIcon size={18} className="input-icon" /> : <PlusCircle size={18} className="input-icon" />}
                            <input
                                type="text"
                                placeholder={mode === 'import' ? "Paste YouTube playlist link..." : "Enter playlist name..."}
                                value={mode === 'import' ? url : name}
                                onChange={(e) => mode === 'import' ? setUrl(e.target.value) : setName(e.target.value)}
                                disabled={loading || status === 'success'}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn-premium filled import-submit ${status}`}
                            disabled={loading || status === 'success'}
                        >
                            {status === 'loading' && <Loader2 size={18} className="spin" />}
                            {status === 'success' && <CheckCircle2 size={18} />}
                            {status === 'idle' && (mode === 'import' ? 'Start Import' : 'Create Now')}
                        </button>
                    </form>

                    {status === 'error' && (
                        <div className="import-error-box">
                            <AlertCircle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistModal;
