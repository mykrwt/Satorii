import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Library, PlaySquare, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
            >
                <Home size={22} />
                <span>Home</span>
            </button>
            <button
                className={`nav-item ${isActive('/search') ? 'active' : ''}`}
                onClick={() => navigate('/search')}
            >
                <Compass size={22} />
                <span>Shorts</span>
            </button>
            <button
                className={`nav-item ${isActive('/library') ? 'active' : ''}`}
                onClick={() => navigate('/library')}
            >
                <Library size={22} />
                <span>Library</span>
            </button>
            <button
                className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
            >
                <User size={22} />
                <span>Profile</span>
            </button>
        </nav>
    );
};

export default BottomNav;
