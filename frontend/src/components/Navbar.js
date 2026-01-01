import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ onNewPost }) => {
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
                </div>
            </div>
        </nav>
    );
};

export default Navbar;