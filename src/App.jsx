import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Home from './pages/Home';
import Search from './pages/Search';
import VideoPlayer from './pages/VideoPlayer';
import Channel from './pages/Channel';
import Playlist from './pages/Playlist';
import Library from './pages/Library';
import Settings from './pages/Settings';
import HardTestSearch from './pages/HardTestSearch';
import SideNav from './components/SideNav';
import TopBar from './components/TopBar';
import './App.css';

// Global Player State & Persistent Rendering
function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [navCollapsed, setNavCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Persistent Player State
    const [activeVideoId, setActiveVideoId] = useState(null);
    const [miniPlayerClosed, setMiniPlayerClosed] = useState(false);

    const isWatchPage = location.pathname.startsWith('/watch/');
    const currentPathVideoId = isWatchPage ? location.pathname.split('/watch/')[1] : null;

    useEffect(() => {
        if (currentPathVideoId && currentPathVideoId !== activeVideoId) {
            setActiveVideoId(currentPathVideoId);
            setMiniPlayerClosed(false); // Reset closed state when a new video starts
        }
    }, [currentPathVideoId, activeVideoId]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleResize = () => setIsMobile(window.innerWidth < 1024);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('resize', handleResize);

        if (window.innerWidth < 1024) {
            setNavCollapsed(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleNav = () => setNavCollapsed(!navCollapsed);

    return (
        <div className={`app-container ${activeVideoId && !isWatchPage && !miniPlayerClosed ? 'has-mini-player' : ''} ${isMobile ? 'is-mobile' : ''}`}>
            <Analytics />
            <TopBar toggleNav={toggleNav} />

            <div className="app-layout">
                <SideNav collapsed={navCollapsed} toggleNav={toggleNav} />

                {!navCollapsed && isMobile && (
                    <div className="nav-backdrop" onClick={() => setNavCollapsed(true)}></div>
                )}

                <main className="main-content">
                    {!isOnline && (
                        <div className="offline-banner">
                            <span>⚠️ You're offline. Some features may not work.</span>
                        </div>
                    )}

                    <div className="page-scroll-container">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/watch/:videoId" element={<VideoPlayer persistent={true} />} />
                            <Route path="/channel/:channelId" element={<Channel />} />
                            <Route path="/playlist/:playlistId" element={<Playlist />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/hard-test-search" element={<HardTestSearch />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </main>
            </div>

            {/* Global Mini-Player - only shows when playing but NOT on watch page */}
            {activeVideoId && !isWatchPage && !miniPlayerClosed && (
                <div className="mini-player-dock animate-fade" onClick={() => navigate(`/watch/${activeVideoId}`)}>
                    <VideoPlayer
                        mini={true}
                        videoId={activeVideoId}
                        onClose={(e) => {
                            e.stopPropagation();
                            setMiniPlayerClosed(true);
                            setActiveVideoId(null); // Completely stop if requested, or just hide

                            try {
                                window.keepAliveAudio?.pause?.();
                                if ('mediaSession' in navigator) {
                                    navigator.mediaSession.playbackState = 'none';
                                    navigator.mediaSession.metadata = null;
                                }
                            } catch { }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
