import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import MediaCard from '../components/MediaCard';

const PostPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/posts/public/${id}`
            );
            if (response.data.success) {
                setPost(response.data.data);
            }
        } catch (err) {
            setError('Post not found or has been deleted');
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    if (loading) {
        return (
            <div className="loading">
                <div className="pixel-spinner"></div>
                <p>Loading post...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state pixel-card">
                <h3>Oops!</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="error-state pixel-card">
                <h3>Post Not Found</h3>
                <p>The post you're looking for doesn't exist.</p>
            </div>
        );
    }

    const getMoodColor = (mood) => {
        const moodColors = {
            happy: '#4CAF50',
            sad: '#2196F3',
            excited: '#FF9800',
            calm: '#9C27B0',
            reflective: '#607D8B',
            adventurous: '#FF5722'
        };
        return moodColors[mood] || '#666';
    };

    return (
        <div className="post-page">
            <button className="back-button pixel-button" onClick={() => window.history.back()}>
                <FiArrowLeft /> Back
            </button>

            <article className="post-content">
                <header className="post-page-header">
                    <h1>{post.title}</h1>
                    
                    <div className="post-page-meta">
                        <div className="meta-item">
                            <FiCalendar />
                            <span>{format(new Date(post.date), 'MMMM dd, yyyy')}</span>
                        </div>

                        {post.location && (
                            <div className="meta-item">
                                <FiMapPin />
                                <span>{post.location}</span>
                            </div>
                        )}

                        {post.mood && (
                            <div className="meta-item">
                                <span className="mood-badge" style={{ backgroundColor: getMoodColor(post.mood) }}>
                                    {post.mood}
                                </span>
                            </div>
                        )}

                        <span className="type-badge">{post.type}</span>
                    </div>
                </header>

                {post.media && (
                    <div className="post-media">
                        <MediaCard 
                            src={post.media} 
                            alt={post.title}
                        />
                    </div>
                )}

                <div className="post-body">
                    {post.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>

                {post.tags && post.tags.length > 0 && (
                    <div className="post-tags-container">
                        <h4>Tags</h4>
                        <div className="tags-list">
                            {post.tags.map(tag => (
                                <span key={tag} className="tag-pill">#{tag}</span>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
};

export default PostPage;
