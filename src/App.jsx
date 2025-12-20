import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import VideoPlayer from './pages/VideoPlayer';
import Channel from './pages/Channel';
import Playlist from './pages/Playlist';
import Library from './pages/Library';
import Settings from './pages/Settings';
import SideNav from './components/SideNav';
import TopBar from './components/TopBar';
import './App.css';

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [navCollapsed, setNavCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

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
        <Router>
            <div className="app-container">
                <TopBar toggleNav={toggleNav} />

                <div className="app-layout">
                    <SideNav collapsed={navCollapsed} toggleNav={toggleNav} />

                    {/* Only render backdrop on mobile and when NOT collapsed */}
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
                                <Route path="/watch/:videoId" element={<VideoPlayer />} />
                                <Route path="/channel/:channelId" element={<Channel />} />
                                <Route path="/playlist/:playlistId" element={<Playlist />} />
                                <Route path="/library" element={<Library />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </main>
                </div>
            </div>
        </Router>
    );
}

export default App;
