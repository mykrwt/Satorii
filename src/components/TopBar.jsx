import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, Settings, X } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ toggleNav }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const [isFocused, setIsFocused] = useState(false);

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
            <div className="top-bar-left">
                <button className="btn-icon menu-btn" onClick={toggleNav}>
                    <Menu size={22} />
                </button>
                <div className="logo-section" onClick={() => navigate('/')}>
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
                            placeholder="Search"
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
                        <Search size={20} />
                    </button>
                </form>
            </div>

            <div className="top-bar-right">
                <button className="btn-icon profile-btn" onClick={() => navigate('/settings')} title="Settings">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
};

export default TopBar;
