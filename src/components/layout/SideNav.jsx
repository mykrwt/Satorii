import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Search,
    History,
    Menu,
    Clock,
    ListVideo,
    Plus,
    Settings
} from 'lucide-react';
import { playlistService, subscriptionService } from '@services/storage';
import PlaylistModal from '@components/modals/PlaylistModal';
import './SideNav.css';

const SideNav = ({ collapsed, toggleNav }) => {
    const [playlists, setPlaylists] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        setPlaylists(playlistService.getAll());
        setSubscriptions(subscriptionService.getAll());

        const interval = setInterval(() => {
            const currentP = playlistService.getAll();
            const currentS = subscriptionService.getAll();

            setPlaylists(prev => {
                if (JSON.stringify(currentP) !== JSON.stringify(prev)) return currentP;
                return prev;
            });
            setSubscriptions(prev => {
                if (JSON.stringify(currentS) !== JSON.stringify(prev)) return currentS;
                return prev;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
    ];

    const secondaryItems = [
        { path: '/playlist/later', icon: Clock, label: 'Watch Later' },
        { path: '/library?tab=history', icon: History, label: 'History' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const [expandedSubs, setExpandedSubs] = useState(false);
    const displayedSubs = expandedSubs ? subscriptions : subscriptions.slice(0, 4);

    const [showImportModal, setShowImportModal] = useState(false);

    const handleNavItemClick = () => {
        if (window.innerWidth < 1024 && !collapsed) {
            toggleNav();
        }
    };

    return (
        <nav className={`side-nav ${collapsed ? 'collapsed' : ''}`}>
            {!collapsed && (
                <div className="nav-header">
                    <button className="btn-icon menu-toggle" onClick={toggleNav}>
                        <Menu size={22} />
                    </button>
                    <div className="logo-container">
                        <img src="/satorii.png" alt="Logo" className="logo-img" />
                        <span className="logo-text">Satorii</span>
                    </div>
                </div>
            )}

            <div className="nav-section">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavItemClick}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={22} strokeWidth={2} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="nav-divider"></div>

            <div className="nav-section">
                {secondaryItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavItemClick}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={22} strokeWidth={2} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="nav-divider"></div>

            {subscriptions.length > 0 && (
                <div className="nav-section">
                    {!collapsed && <h4 className="nav-section-title">Subscriptions</h4>}
                    {displayedSubs.map((sub) => (
                        <NavLink
                            key={sub.id}
                            to={`/channel/${sub.id}`}
                            onClick={handleNavItemClick}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            title={sub.title}
                        >
                            {sub.thumbnail ? (
                                <img src={sub.thumbnail} alt="" className="sub-avatar-img" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                            ) : (
                                <div className="sub-avatar-mini" style={{ width: '24px', height: '24px', minWidth: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                    {sub.title.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {!collapsed && <span className="nav-label">{sub.title}</span>}
                        </NavLink>
                    ))}
                    {!collapsed && subscriptions.length > 4 && (
                        <button className="nav-item show-more-subs" onClick={() => setExpandedSubs(!expandedSubs)}>
                            <div className="sub-avatar-mini" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {expandedSubs ? <Menu size={16} /> : <div style={{ fontSize: '14px' }}>+</div>}
                            </div>
                            <span className="nav-label">{expandedSubs ? 'Show Less' : `Show ${subscriptions.length - 4} More`}</span>
                        </button>
                    )}
                </div>
            )}

            <div className="nav-divider"></div>

            <div className="nav-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}>
                    {!collapsed && <h4 className="nav-section-title">Playlists</h4>}
                    {!collapsed && (
                        <button
                            className="btn-icon mini-btn"
                            title="Import from YT"
                            onClick={() => {
                                setShowImportModal(true);
                                if (window.innerWidth < 1024) toggleNav();
                            }}
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
                {playlists.map((playlist) => (
                    <NavLink
                        key={playlist.id}
                        to={`/playlist/${playlist.id}`}
                        onClick={handleNavItemClick}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <ListVideo size={22} strokeWidth={2} />
                        <span className="nav-label">{playlist.name}</span>
                    </NavLink>
                ))}
            </div>

            {showImportModal && (
                <PlaylistModal
                    onClose={() => setShowImportModal(false)}
                    onImportSuccess={(newId) => {
                        // Optional: Navigate to new playlist
                    }}
                />
            )}
        </nav>
    );
};

export default SideNav;
