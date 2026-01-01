import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostEditor from '../components/PostEditor';
import { postsAPI, authAPI, quoteAPI } from '../api';
import { FiLogOut, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState({ text: '', author: '' });
    const [quoteSaving, setQuoteSaving] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        year: '',
        month: '',
        title: '',
        mood: ''
    });
    const navigate = useNavigate();

    const fetchAllPosts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await postsAPI.getAdminAll();
            setPosts(response.data.data);
            setFilteredPosts(response.data.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.response?.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const loadQuote = useCallback(async () => {
        try {
            const response = await quoteAPI.get();
            if (response.data.success) {
                setQuote(response.data.data);
            }
        } catch (error) {
            console.error('Error loading quote:', error);
            // Set default quote on error
            setQuote({
                text: "The pen is mightier than the sword.",
                author: "— Edward Bulwer-Lytton"
            });
        }
    }, []);

    useEffect(() => {
        fetchAllPosts();
        loadQuote();
    }, [fetchAllPosts, loadQuote]);

    useEffect(() => {
        let filtered = [...posts];

        if (filters.year) {
            filtered = filtered.filter(post => 
                new Date(post.date).getFullYear() === parseInt(filters.year)
            );
        }

        if (filters.month) {
            filtered = filtered.filter(post => 
                new Date(post.date).toLocaleString('default', { month: 'long' }) === filters.month
            );
        }

        if (filters.title) {
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(filters.title.toLowerCase())
            );
        }

        if (filters.mood) {
            filtered = filtered.filter(post =>
                post.mood && post.mood.toLowerCase().includes(filters.mood.toLowerCase())
            );
        }

        setFilteredPosts(filtered);
    }, [filters, posts]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ year: '', month: '', title: '', mood: '' });
    };

    const getUniqueYears = () => {
        const years = posts.map(post => new Date(post.date).getFullYear());
        return [...new Set(years)].sort((a, b) => b - a);
    };

    const handleSaveQuote = async (e) => {
        e.preventDefault();
        setQuoteSaving(true);
        try {
            const response = await quoteAPI.update(quote);
            if (response.data.success) {
                alert('Quote saved successfully! All devices will see the updated quote.');
            }
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Failed to save quote. Please try again.');
        } finally {
            setQuoteSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            navigate('/');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await postsAPI.delete(id);
                fetchAllPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete post');
            }
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>Admin Dashboard</h2>
            </div>

            {/* Quote Management Section */}
            <div className="quote-section">
                <h3>Homepage Quote</h3>
                <form className="quote-form" onSubmit={handleSaveQuote}>
                    <label>
                        Quote Text
                        <textarea
                            value={quote.text}
                            onChange={(e) => setQuote({ ...quote, text: e.target.value })}
                            placeholder="Enter quote text..."
                            required
                        />
                    </label>
                    <label>
                        Author
                        <input
                            type="text"
                            value={quote.author}
                            onChange={(e) => setQuote({ ...quote, author: e.target.value })}
                            placeholder="— Author Name"
                            required
                        />
                    </label>
                    <button type="submit" className="btn-primary" disabled={quoteSaving}>
                        {quoteSaving ? 'Saving...' : 'Save Quote'}
                    </button>
                </form>
            </div>

            <button 
                className="btn-primary new-post-btn"
                onClick={() => {
                    setEditingPost(null);
                    setShowEditor(true);
                }}
            >
                + New Entry
            </button>

            {/* Filter Section */}
            <div className="filter-section">
                <h3 onClick={() => setShowFilters(!showFilters)} style={{ cursor: 'pointer' }}>
                    <FiFilter style={{ fontSize: '18px' }} />
                </h3>
                {showFilters && (
                    <>
                        <div className="filter-grid">
                            <div className="filter-field">
                                <label>Year</label>
                                <select 
                                    value={filters.year} 
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                >
                                    <option value="">All years</option>
                                    {getUniqueYears().map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label>Month</label>
                                <select 
                                    value={filters.month} 
                                    onChange={(e) => handleFilterChange('month', e.target.value)}
                                >
                                    <option value="">All months</option>
                                    {['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={filters.title}
                                    onChange={(e) => handleFilterChange('title', e.target.value)}
                                    placeholder="search..."
                                />
                            </div>
                            <div className="filter-field">
                                <label>Mood</label>
                                <input
                                    type="text"
                                    value={filters.mood}
                                    onChange={(e) => handleFilterChange('mood', e.target.value)}
                                    placeholder="calm, reflective..."
                                />
                            </div>
                        </div>
                        {(filters.year || filters.month || filters.title || filters.mood) && (
                            <button className="filter-clear" onClick={handleClearFilters}>
                                Clear filters
                            </button>
                        )}
                    </>
                )}
            </div>

            {showEditor && (
                <PostEditor 
                    post={editingPost}
                    onClose={() => {
                        setShowEditor(false);
                        setEditingPost(null);
                    }}
                    onSave={() => {
                        setShowEditor(false);
                        setEditingPost(null);
                        fetchAllPosts();
                    }}
                />
            )}

            <div className="posts-list">
                <h3>All Posts ({filteredPosts.length})</h3>
                {loading ? (
                    <div className="loading">
                        <div className="pixel-spinner"></div>
                        <p>Loading posts...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="empty-state">
                        <p>No posts found.</p>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div key={post._id} className="admin-post-item">
                            <div className="post-info">
                                <h4>{post.title}</h4>
                                <div className="post-meta">
                                    <span>{format(new Date(post.date), 'MMMM d, yyyy')}</span>
                                    {post.mood && <span>{post.mood}</span>}
                                    <span>{post.isPublished ? 'Published' : 'Draft'}</span>
                                    {post.media && (
                                        <span>{post.type === 'video' ? 'Video' : 'Image'}</span>
                                    )}
                                </div>
                            </div>
                            <div className="post-actions">
                                <button 
                                    onClick={() => {
                                        setEditingPost(post);
                                        setShowEditor(true);
                                    }}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="delete"
                                    onClick={() => handleDelete(post._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;