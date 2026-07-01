import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArchiveSlideout from './ArchiveSlideout';

const Navbar = ({ onNewPost, posts = [] }) => {
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const archiveRef = useRef(null);

    // Close archive on click outside
    useEffect(() => {
        if (!isArchiveOpen) return;
        const handleClick = (e) => {
            if (archiveRef.current && !archiveRef.current.contains(e.target)) {
                setIsArchiveOpen(false);
            }
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') setIsArchiveOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isArchiveOpen]);

    return (
        <nav className="navbar">
            <div className="nav-content">
                <Link to="/" className="logo">
                    <h1>quietwhispered</h1>
                </Link>
                <div className="nav-links">
                    {posts.length > 0 && (
                        <button
                            className="nav-button-archive"
                            onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                            aria-label="Toggle archive"
                            aria-expanded={isArchiveOpen}
                        >
                            Archive
                        </button>
                    )}
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
            {/* Archive slide-out panel */}
            {posts.length > 0 && (
                <div ref={archiveRef}>
                    <ArchiveSlideout 
                        posts={posts} 
                        isOpen={isArchiveOpen} 
                        onClose={() => setIsArchiveOpen(false)}
                    />
                </div>
            )}
            {isArchiveOpen && <div className="archive-overlay" onClick={() => setIsArchiveOpen(false)} />}
        </nav>
    );
};

export default Navbar;