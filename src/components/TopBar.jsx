import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ toggleNav }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (location.pathname === '/search') {
            setSearchInput(searchParams.get('q') || '');
        }
    }, [location.pathname, searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    const clearInput = () => {
        setSearchInput('');
    };

    return (
        <header className="top-bar">
            {/* Notch and status bar protection */}
            <div className="safe-area-top" />

            <div className="top-bar-left">
                <button className="btn-icon menu-btn-mobile" onClick={toggleNav}>
                    <Menu size={22} />
                </button>
                <div className="logo-section mobile-hidden" onClick={() => navigate('/')}>
                    <img src="/satorii.png" alt="Satorii" className="logo-icon" />
                    <span className="logo-text">Satorii</span>
                </div>
            </div>

            <div className="top-bar-center">
                <form className={`search-container ${isFocused ? 'focused' : ''}`} onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        {isFocused && <Search size={18} className="search-icon-focused" />}
                        <input
                            type="text"
                            placeholder="Search Satorii"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        {searchInput && (
                            <button type="button" className="clear-search" onClick={clearInput}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="search-submit" title="Search">
                        <Search size={22} />
                    </button>
                </form>
            </div>

            <div className="top-bar-right desktop-only">
                {/* Space for future desktop items or user avatar */}
            </div>
        </header>
    );
};

export default TopBar;
