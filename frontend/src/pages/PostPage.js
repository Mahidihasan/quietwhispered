import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import MediaCard from '../shared/components/MediaCard.jsx';
import MarkdownRenderer from '../shared/components/MarkdownRenderer.jsx';
import SpotifyPlayer from '../shared/components/SpotifyPlayer.jsx';
import ThinkerLoader from '../shared/components/ThinkerLoader';
import { getEntryById, getPublicEntryById } from '../shared/services/journalService';
import { subscribeToMediaSettings } from '../shared/services/mediaSettingsService';
import useAuth from '../shared/hooks/useAuth';
import { resolvePostDate } from '../shared/utils/dateUtils';

const FALLBACK_IMAGE = '/images/posts/fallback.svg';

const buildAbsoluteUrl = (raw) => {
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }
    if (raw.startsWith('//')) {
        return `https:${raw}`;
    }
    return raw;
};

const setMetaTag = (attr, name, content) => {
    if (!content) return;
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
};

const setCanonical = (url) => {
    if (!url) return;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', url);
};

const PostPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, loading: authLoading } = useAuth();
    const [mediaSettings, setMediaSettings] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToMediaSettings((settings) => {
            setMediaSettings(settings);
        });
        return () => unsubscribe();
    }, []);

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const data = user ? await getEntryById(id) : await getPublicEntryById(id);
            if (!data) {
                setError('Post not found or has been deleted');
                setPost(null);
            } else {
                setPost(data);
            }
        } catch (err) {
            setError('Post not found or has been deleted');
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (authLoading) return;
        fetchPost();
    }, [authLoading, fetchPost]);

    useEffect(() => {
        if (!post) return;
        const base = process.env.REACT_APP_SITE_URL || window.location.origin;
        const absoluteImage = buildAbsoluteUrl(post.imageUrls?.[0] || post.media) || `${base}${FALLBACK_IMAGE}`;
        console.log('Post cover URL:', absoluteImage);
        const description = (post.content || '').split('\n').find(Boolean)?.slice(0, 180) || 'Read this journal entry.';
        const url = window.location.href;

        document.title = `${post.title} | Journal`;
        setCanonical(url);
        setMetaTag('property', 'og:title', post.title);
        setMetaTag('property', 'og:description', description);
        setMetaTag('property', 'og:image', absoluteImage);
        setMetaTag('property', 'og:url', url);
        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:title', post.title);
        setMetaTag('name', 'twitter:description', description);
        setMetaTag('name', 'twitter:image', absoluteImage);
    }, [post]);

    if (loading) {
        return (
            <div className="loading">
                <ThinkerLoader className="thinker-loader thinker-loader--lg" />
                <p>Loading post...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <h3>Oops!</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="error-state">
                <h3>Post Not Found</h3>
                <p>The post you're looking for doesn't exist.</p>
            </div>
        );
    }

    const activeFrame = (post.mediaFrame && post.mediaFrame !== 'polaroid') ? post.mediaFrame : (mediaSettings?.mediaFrame || 'polaroid');
    const activeFrameSize = (post.frameSize && post.frameSize !== 'md') ? post.frameSize : (mediaSettings?.frameSize || 'md');
    const activeTexture = (post.paperTexture && post.paperTexture !== 'none') ? post.paperTexture : (mediaSettings?.paperTexture || 'none');
    const activePaperColor = (post.paperColor && post.paperColor !== '#f8f5f0') ? post.paperColor : (mediaSettings?.paperColor || '#FAF8F5');
    /* Off-white - default entry background color */
    const postDate = resolvePostDate(post);

    const coverUrl = buildAbsoluteUrl(post.imageUrls?.[0] || post.media);
    const coverInContent = coverUrl && post.content && post.content.includes(post.imageUrls?.[0] || post.media);
    const shouldShowCover = coverUrl && post.type === 'image' && !coverInContent;
    const titleSizeValue = Number(post.titleSize);
    const titleSize = Number.isFinite(titleSizeValue)
        ? Math.min(56, Math.max(20, titleSizeValue))
        : null;
    const lineHeightValue = Number(post.lineHeight);
    const lineHeight = Number.isFinite(lineHeightValue)
        ? Math.min(2.6, Math.max(1.2, lineHeightValue))
        : null;

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
            <button className="back-button" onClick={() => window.history.back()}>
                <FiArrowLeft /> Back
            </button>

            <article className={`post-content ${activeTexture !== 'none' ? 'texture-applied' : ''}`.trim()}
                style={activeTexture !== 'none' && activePaperColor ? { backgroundColor: activePaperColor } : undefined}
            >
                {activeTexture !== 'none' && (
                    <div className={`post-texture texture-${activeTexture}`} aria-hidden="true" />
                )}
                <header className="post-page-header" style={{ borderBottomColor: mediaSettings?.dividerColor || 'var(--divider-color, var(--cg-light))' }}>
                    <h1 style={titleSize ? { fontSize: `${titleSize}px` } : undefined}>{post.title}</h1>
                    
                    <div className="post-page-meta">
                        <div className="meta-item">
                            <FiCalendar />
                        <span>{postDate ? format(postDate, 'MMMM dd, yyyy') : 'Undated'}</span>
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

                        <span className="type-badge">{post.type || 'entry'}</span>
                    </div>
                </header>

                {shouldShowCover && (
                    <div className="post-media">
                        <MediaCard src={coverUrl} alt={post.title} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
                    </div>
                )}
                {post.youtubeEmbedUrl && (
                    <div className="post-media">
                        <MediaCard src={post.youtubeEmbedUrl} alt={post.title} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
                    </div>
                )}

                <div className="post-body" style={lineHeight ? { lineHeight } : undefined}>
                    <MarkdownRenderer 
                      content={post.content} 
                      bulletStyle={post.bulletStyle}
                      quoteStyle={post.quoteStyle}
                    />
                </div>

                {post.spotifyUrl && (
                    <SpotifyPlayer url={post.spotifyUrl} entryId={post._id} />
                )}

                {post.customAudioUrl && (
                    <div className="post-media entry-custom-audio" style={{ marginTop: '16px' }}>
                        <audio controls style={{ width: '100%' }}>
                            <source src={post.customAudioUrl} type="audio/mpeg" />
                            <source src={post.customAudioUrl} type="audio/wav" />
                            <source src={post.customAudioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

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