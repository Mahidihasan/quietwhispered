import React from 'react';
import { Link } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';

const Navbar = ({ onNewPost, onToggleTheme, theme }) => {
    return (
        <nav className="navbar">
            <div className="nav-content">
                <Link to="/" className="logo">
                    <h1>Quietwhispered</h1>
                </Link>
                <div className="nav-links">
                    {onNewPost && (
                        <button 
                            className="nav-button" 
                            onClick={onNewPost}
                            aria-label="Write new entry"
                        >
                            Write
                        </button>
                    )}
                    {onToggleTheme && (
                        <button
                            className="theme-switch"
                            onClick={onToggleTheme}
                            aria-label="Toggle theme"
                            type="button"
                            data-theme={theme}
                        >
                            <span className="theme-switch-track">
                                <span className="theme-switch-icon sun">
                                    <FiSun />
                                </span>
                                <span className="theme-switch-icon moon">
                                    <FiMoon />
                                </span>
                                <span className="theme-switch-thumb" />
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
