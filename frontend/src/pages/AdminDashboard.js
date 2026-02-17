import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PostEditor from '../components/PostEditor';
import { getAllEntries, deleteEntry, uploadImage } from '../services/journalService';
import { getQuote, saveQuote } from '../services/quoteService';
import { signOutUser } from '../services/authService';
import { FiLogOut, FiFilter, FiImage, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState({ text: '', author: '', imageUrl: '', useImageCover: false });
    const [quoteFontSize, setQuoteFontSize] = useState(18);
    const [quoteSaving, setQuoteSaving] = useState(false);
    const [quoteUploadProgress, setQuoteUploadProgress] = useState(0);
    const [isQuoteUploading, setIsQuoteUploading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const filtersRef = useRef(null);
    const { user, loading: authLoading } = useAuth();
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
            setLoadError('');
            const entries = await getAllEntries();
            setPosts(entries);
            setFilteredPosts(entries);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setLoadError(error?.message || 'Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadQuote = useCallback(async () => {
        try {
            const data = await getQuote();
            if (data) {
                setQuote(prev => ({
                    ...prev,
                    ...data,
                    imageUrl: data.imageUrl || '',
                    useImageCover: Boolean(data.useImageCover)
                }));
                setQuoteFontSize(Number(data.fontSize) || 18);
            }
        } catch (error) {
            console.error('Error loading quote:', error);
            // Set default quote on error
                setQuote({
                    text: 'The pen is mightier than the sword.',
                    author: '- Edward Bulwer-Lytton',
                    imageUrl: '',
                    useImageCover: false
                });
                setQuoteFontSize(18);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/admin/login');
            return;
        }
        fetchAllPosts();
        loadQuote();
    }, [authLoading, user, fetchAllPosts, loadQuote, navigate]);

    useEffect(() => {
        let filtered = [...posts];

        if (filters.year) {
            filtered = filtered.filter(post => 
                new Date(post.date || post.createdAt).getFullYear() === parseInt(filters.year)
            );
        }

        if (filters.month) {
            filtered = filtered.filter(post => 
                new Date(post.date || post.createdAt).toLocaleString('default', { month: 'long' }) === filters.month
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

    useEffect(() => {
        if (!showFilters) return;

        const handleClickOutside = (event) => {
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showFilters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ year: '', month: '', title: '', mood: '' });
    };

    const getUniqueYears = () => {
        const years = posts.map(post => new Date(post.date || post.createdAt).getFullYear());
        return [...new Set(years)].sort((a, b) => b - a);
    };

    const handleSaveQuote = async (e) => {
        e.preventDefault();
        setQuoteSaving(true);
        try {
            await saveQuote({ ...quote, fontSize: quoteFontSize });
            alert('Quote saved successfully! All devices will see the updated quote.');
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Failed to save quote. Please try again.');
        } finally {
            setQuoteSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOutUser();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate('/');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deleteEntry(id);
                fetchAllPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete post');
            }
        }
    };

    const handleQuoteImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setIsQuoteUploading(true);
            setQuoteUploadProgress(0);
            const url = await uploadImage(file, {
                folder: 'quote-images',
                onProgress: setQuoteUploadProgress
            });
            setQuote(prev => ({
                ...prev,
                imageUrl: url,
                useImageCover: true
            }));
        } catch (error) {
            console.error('Error uploading quote image:', error);
            alert('Failed to upload image.');
        } finally {
            setIsQuoteUploading(false);
            setQuoteUploadProgress(0);
            event.target.value = '';
        }
    };

    const handleRemoveQuoteImage = () => {
        setQuote(prev => ({
            ...prev,
            imageUrl: '',
            useImageCover: false
        }));
    };

    const publishedCount = posts.filter((post) => post.isPublished).length;
    const draftCount = posts.filter((post) => !post.isPublished).length;
    const mediaCount = posts.filter((post) => post.media).length;

    return (
        <div className="admin-dashboard">
            <header className="admin-hero">
                <div className="admin-hero-left">
                    <div className="admin-kicker">Dashboard</div>
                    <h1>Journal Studio</h1>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="btn-secondary" onClick={handleLogout}>
                        <FiLogOut />
                        Log out
                    </button>
                    <button 
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                            setEditingPost(null);
                            setShowEditor(true);
                        }}
                    >
                        + New Entry
                    </button>
                </div>
            </header>

            {loadError && (
                <div className="error-message">
                    <p>{loadError}</p>
                </div>
            )}

            <section className="admin-stats">
                <div className="stat-card">
                    <div className="stat-label">Total posts</div>
                    <div className="stat-value">{posts.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Published</div>
                    <div className="stat-value">{publishedCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Drafts</div>
                    <div className="stat-value">{draftCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">With media</div>
                    <div className="stat-value">{mediaCount}</div>
                </div>
            </section>

            <section className="admin-grid">
                <div className="admin-left-column">
                    <div className="posts-list">
                        <div className="posts-header" ref={filtersRef}>
                            <div>
                                <h3>All Posts ({filteredPosts.length})</h3>
                                <span className="panel-note">Sorted newest first.</span>
                            </div>
                            <div className="filter-popover">
                                <button
                                    type="button"
                                    className="filter-icon-only"
                                    onClick={() => setShowFilters(!showFilters)}
                                    aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                                    aria-expanded={showFilters}
                                >
                                    <FiFilter />
                                </button>
                                {showFilters && (
                                    <div className="filter-panel" role="dialog" aria-label="Filter posts">
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
                                                    placeholder="Search by title"
                                                />
                                            </div>
                                            <div className="filter-field">
                                                <label>Mood</label>
                                                <input
                                                    type="text"
                                                    value={filters.mood}
                                                    onChange={(e) => handleFilterChange('mood', e.target.value)}
                                                    placeholder="Calm, reflective..."
                                                />
                                            </div>
                                        </div>
                                        {(filters.year || filters.month || filters.title || filters.mood) && (
                                            <button className="filter-clear" onClick={handleClearFilters}>
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="posts-scroll">
                            {loading ? (
                                <div className="loading minimal">
                                <div className="minimal-loader"><span></span></div>
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
                                                <span>{format(new Date(post.date || post.createdAt), 'MMMM d, yyyy')}</span>
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
                </div>

                <div className="admin-panel admin-quote-panel">
                    <div className="panel-header">
                        <h3>Homepage Quote</h3>
                        <span className="panel-note">Updates the front page instantly.</span>
                    </div>
                    <form className="quote-form" onSubmit={handleSaveQuote}>
                        <div className="quote-media-row">
                            <input
                                type="file"
                                id="quote-image-upload"
                                accept="image/jpeg,image/png,image/webp"
                                className="visually-hidden"
                                onChange={handleQuoteImageUpload}
                            />
                            <label className="quote-attach" htmlFor="quote-image-upload" title="Attach image">
                                <FiImage />
                            </label>
                            {isQuoteUploading && (
                                <span className="quote-upload-status">
                                    Uploading... {quoteUploadProgress}%
                                </span>
                            )}
                            {quote.imageUrl && (
                                <button type="button" className="quote-remove" onClick={handleRemoveQuoteImage}>
                                    <FiX />
                                    Remove
                                </button>
                            )}
                        </div>
                        {quote.imageUrl && (
                            <div className="quote-image-preview">
                                <img src={quote.imageUrl} alt="Quote cover preview" />
                            </div>
                        )}
                        {!quote.useImageCover && (
                            <>
                                <label className="quote-size-row">
                                    Quote Size
                                    <input
                                        type="range"
                                        min="14"
                                        max="28"
                                        value={quoteFontSize}
                                        onChange={(e) => setQuoteFontSize(Number(e.target.value))}
                                    />
                                    <span className="quote-size-value">{quoteFontSize}px</span>
                                </label>
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
                                        placeholder="- Author Name"
                                        required
                                    />
                                </label>
                            </>
                        )}
                        <button type="submit" className="btn-primary" disabled={quoteSaving}>
                            {quoteSaving ? 'Saving...' : 'Save Quote'}
                        </button>
                    </form>
                </div>
            </section>

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

        </div>
    );
};

export default AdminDashboard;
