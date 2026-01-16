import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    preferencesService,
    historyService,
    watchLaterService,
    playlistService,
    likeService,
    subscriptionService,
    searchHistoryService
} from '../../services/storage';
import {
    Settings as SettingsIcon,
    Trash2,
    Globe,
    Play,
    Zap,
    Info,
    ShieldCheck,
    ChevronRight,
    Monitor,
    LogOut
} from 'lucide-react';
import { authService } from '../../services/firebase';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [preferences, setPreferences] = useState(preferencesService.get());
    const [showClearConfirm, setShowClearConfirm] = useState(null);
    const [user, setUser] = useState(authService.getCurrentUser());

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const handlePreferenceChange = (key, value) => {
        const updated = preferencesService.update({ [key]: value });
        setPreferences(updated);
    };

    const handleClearData = (type) => {
        switch (type) {
            case 'history': historyService.clear(); break;
            case 'searchHistory': searchHistoryService.clear(); break;
            case 'watchLater': watchLaterService.clear(); break;
            case 'playlists': playlistService.getAll().forEach(p => playlistService.delete(p.id)); break;
            case 'likes': likeService.clear(); break;
            case 'subscriptions': subscriptionService.clear(); break;
            case 'all':
                historyService.clear();
                watchLaterService.clear();
                playlistService.getAll().forEach(p => playlistService.delete(p.id));
                likeService.clear();
                subscriptionService.clear();
                searchHistoryService.clear();
                break;
        }
        setShowClearConfirm(null);
    };

    return (
        <div className="settings-page animate-fade">
            <div className="settings-container">
                <header className="settings-hero">
                    <div className="hero-icon">
                        <SettingsIcon size={32} />
                    </div>
                    <h1>Settings</h1>
                    <p>Manage your Satorii experience and local data</p>
                </header>

                <div className="settings-grid">
                    {/* Appearance & Playback */}
                    <div className="settings-card">
                        <div className="card-header">
                            <Play size={20} />
                            <h2>Playback & Experience</h2>
                        </div>

                        <div className="setting-control">
                            <div className="control-info">
                                <h3>Autoplay</h3>
                                <p>Play the next video automatically</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={preferences.autoplay}
                                    onChange={(e) => handlePreferenceChange('autoplay', e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="setting-control">
                            <div className="control-info">
                                <h3>Preferred Quality</h3>
                                <p>Default quality for all videos</p>
                            </div>
                            <select
                                value={preferences.defaultQuality}
                                onChange={(e) => handlePreferenceChange('defaultQuality', e.target.value)}
                                className="premium-select"
                            >
                                <option value="auto">Auto</option>
                                <option value="1080p">1080p</option>
                                <option value="720p">720p</option>
                                <option value="480p">480p</option>
                            </select>
                        </div>
                    </div>

                    {/* Regional */}
                    <div className="settings-card">
                        <div className="card-header">
                            <Globe size={20} />
                            <h2>Regional Settings</h2>
                        </div>

                        <div className="setting-control">
                            <div className="control-info">
                                <h3>Content Region</h3>
                                <p>Used for trending results</p>
                            </div>
                            <select
                                value={preferences.region}
                                onChange={(e) => handlePreferenceChange('region', e.target.value)}
                                className="premium-select"
                            >
                                <option value="US">United States</option>
                                <option value="GB">United Kingdom</option>
                                <option value="IN">India</option>
                                <option value="JP">Japan</option>
                                <option value="CA">Canada</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="settings-card span-two">
                        <div className="card-header">
                            <Trash2 size={20} />
                            <h2>Data management</h2>
                        </div>
                        <p className="section-desc">All data is stored locally on your device. Clearing it is permanent.</p>

                        <div className="data-actions-grid">
                            <button className="btn-data" onClick={() => setShowClearConfirm('history')}>
                                <span className="label">Watch History</span>
                                <ChevronRight size={16} />
                            </button>
                            <button className="btn-data" onClick={() => setShowClearConfirm('searchHistory')}>
                                <span className="label">Search history</span>
                                <ChevronRight size={16} />
                            </button>
                            <button className="btn-data" onClick={() => setShowClearConfirm('subscriptions')}>
                                <span className="label">Subscriptions</span>
                                <ChevronRight size={16} />
                            </button>
                            <button className="btn-data danger" onClick={() => setShowClearConfirm('all')}>
                                <Zap size={16} />
                                <span className="label">Clear All Local Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Account Section */}
                    {user && (
                        <div className="settings-card span-two">
                            <div className="card-header">
                                <LogOut size={20} />
                                <h2>Account</h2>
                            </div>
                            <div className="account-settings">
                                <div className="user-profile-large">
                                    <img
                                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                        alt="Profile"
                                        className="profile-img-lg"
                                    />
                                    <div className="user-text-lg">
                                        <h3>{user.displayName || user.email?.split('@')[0]}</h3>
                                        <p>{user.email}</p>
                                    </div>
                                    <button className="btn-premium danger" onClick={handleLogout}>
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* About */}
                    <div className="settings-card span-two">
                        <div className="card-header">
                            <ShieldCheck size={20} />
                            <h2>Privacy & About</h2>
                        </div>
                        <div className="about-grid">
                            <div className="about-branding">
                                <img src="/satorii.png" alt="Satorii" />
                                <div>
                                    <h3>Satorii v1.0.0</h3>
                                    <p>Your minimalist, nature-inspired YouTube client.</p>
                                </div>
                            </div>
                            <div className="api-config">
                                <Info size={16} />
                                <p>Satorii runs entirely on your local machine using the public YouTube Data API. No personal data ever leaves your device.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showClearConfirm && (
                <div className="modal-backdrop" onClick={() => setShowClearConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <Trash2 size={24} className="danger-icon" />
                            <h3>Are you sure?</h3>
                        </div>
                        <p>This will permanently delete your {showClearConfirm === 'all' ? 'entire local profile' : showClearConfirm}. This action is irreversible.</p>
                        <div className="modal-buttons">
                            <button className="btn-premium" onClick={() => setShowClearConfirm(null)}>Cancel</button>
                            <button className="btn-premium filled danger" onClick={() => handleClearData(showClearConfirm)}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
