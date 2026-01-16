import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, X, User, LogIn, LogOut } from 'lucide-react';
import { youtubeAPI } from '../services/youtube';
import { authService } from '../services/firebase';
import './TopBar.css';

const TopBar = ({ toggleNav }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const unsubscribe = authService.subscribe((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        if (!showUserMenu) return;
        const closeMenu = () => setShowUserMenu(false);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [showUserMenu]);

    useEffect(() => {
        if (location.pathname === '/search') {
            setSearchInput(searchParams.get('q') || '');
        }
    }, [location.pathname, searchParams]);

    // Fetch suggestions as user types
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchInput.trim().length > 1 && isFocused) {
                const results = await youtubeAPI.getSearchSuggestions(searchInput);
                setSuggestions(results);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchInput, isFocused]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const handleSearch = (e, customQuery = null) => {
        if (e) e.preventDefault();
        const finalQuery = customQuery || searchInput;
        if (finalQuery.trim()) {
            // Check if it's a Satorii URL
            const isSatoriiUrl = finalQuery.includes('satorii-black.vercel.app') || finalQuery.includes('localhost');
            const videoId = youtubeAPI.extractVideoId(finalQuery);

            if (videoId && (isSatoriiUrl || !finalQuery.includes('http'))) {
                navigate(`/watch/${videoId}`);
            } else {
                navigate(`/search?q=${encodeURIComponent(finalQuery.trim())}`);
            }

            setShowSuggestions(false);
            setIsFocused(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (selectedIndex > -1 && suggestions[selectedIndex]) {
                e.preventDefault();
                handleSearch(null, suggestions[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const clearInput = () => {
        setSearchInput('');
        setSuggestions([]);
    };

    return (
        <header className="top-bar">
            {/* Notch and status bar protection */}
            <div className="safe-area-top" />

            <div className="top-bar-left">
                <button className="btn-icon menu-btn-mobile" onClick={toggleNav}>
                    <Menu size={22} />
                </button>
                <div className="logo-section" onClick={() => navigate('/')}>
                    <img src="/satorii.png" alt="Satorii" className="logo-icon" />
                    <span className="logo-text">Satorii</span>
                </div>
            </div>

            <div className="top-bar-center">
                <div className="search-section-wrapper">
                    <form className={`search-container ${isFocused ? 'focused' : ''}`} onSubmit={handleSearch}>
                        <div className="search-input-wrapper">
                            {isFocused && <Search size={18} className="search-icon-focused" />}
                            <input
                                type="text"
                                placeholder="Search Satorii"
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setSelectedIndex(-1);
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => {
                                    // Delay hiding so clicks on suggestions work
                                    setTimeout(() => setShowSuggestions(false), 200);
                                    setIsFocused(false);
                                }}
                                onKeyDown={handleKeyDown}
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

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="search-suggestions-dropdown">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                                    onClick={() => handleSearch(null, suggestion)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <Search size={16} className="suggestion-icon" />
                                    <span>{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="top-bar-right">
                {user ? (
                    <div className="user-menu-wrapper">
                        <div
                            className="user-profile-mini active"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUserMenu(!showUserMenu);
                            }}
                            title={user.email}
                        >
                            <User size={20} />
                        </div>

                        {showUserMenu && (
                            <div className="user-dropdown-menu animate-pop">
                                <div className="user-dropdown-info">
                                    <span className="user-email">{user.email}</span>
                                </div>
                                <div className="user-dropdown-divider"></div>
                                <button className="dropdown-item" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="btn-icon" onClick={() => navigate('/login')} title="Sign In">
                        <LogIn size={20} />
                    </button>
                )}
            </div>
        </header>
    );
};

export default TopBar;
