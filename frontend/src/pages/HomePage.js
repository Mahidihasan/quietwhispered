import React, { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard';
import TimelineArchive from '../components/TimelineArchive';
import { postsAPI } from '../api';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await postsAPI.getAll({ sort: 'newest', page });
            setPosts(response.data.posts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePageChange = (p) => setPage(p);

    return (
        <div>
            {/* Filter removed for minimal retro dashboard */}

            {loading ? (
                <div className="loading">
                    <div className="pixel-spinner"></div>
                    <p>Loading stories...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="empty-state pixel-card">
                    <h3>No stories yet</h3>
                    <p>Check back later for new entries!</p>
                </div>
            ) : (
                <div className="home-content">
                    <div className="posts-column">
                        <div className="posts-grid">
                            {posts.map(post => (
                                <PostCard key={post._id} post={post} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                    <button
                                        key={pg}
                                        className={`pixel-button ${page === pg ? 'active' : ''}`}
                                        onClick={() => handlePageChange(pg)}
                                    >
                                        {pg}
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>

                    {posts.length > 0 && (
                        <div className="archive-column">
                            <TimelineArchive posts={posts} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;