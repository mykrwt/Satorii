import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/search', icon: '🔍', label: 'Search' },
        { path: '/library', icon: '📚', label: 'Library' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <nav className="bottom-nav safe-area-bottom">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
