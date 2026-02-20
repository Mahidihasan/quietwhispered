import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import MediaCard from '../components/MediaCard';
import { getEntryById, getPublicEntryById } from '../services/journalService';
import useAuth from '../hooks/useAuth';

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

const renderInline = (text) => {
    const escapeHtml = (raw) => {
        return raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    let safe = escapeHtml(text);
    safe = safe.replace(/\[u\]/gi, '<u>').replace(/\[\/u\]/gi, '</u>');
    safe = safe.replace(/\[mark=([^\]]+)\]/gi, (match, color) => {
        const sanitized = color.trim();
        return `<span style="background:${sanitized};padding:0 2px;border-radius:2px">`;
    });
    safe = safe.replace(/\[\/mark\]/gi, '</span>');
    safe = safe.replace(/\[color=([^\]]+)\]/gi, (match, color) => {
        const sanitized = color.trim();
        return `<span style="color:${sanitized}">`;
    });
    safe = safe.replace(/\[\/color\]/gi, '</span>');
    safe = safe.replace(/\[size=([^\]]+)\]/gi, (match, size) => {
        const numeric = size.trim().replace(/[^\d.]/g, '');
        const value = numeric ? `${numeric}px` : 'inherit';
        return `<span style="font-size:${value}">`;
    });
    safe = safe.replace(/\[\/size\]/gi, '</span>');
    safe = safe.replace(/\[font=([^\]]+)\]/gi, (match, font) => {
        const normalized = font.trim();
        return `<span style="font-family:${normalized}">`;
    });
    safe = safe.replace(/\[\/font\]/gi, '</span>');
    return safe;
};

const parseContentBlocks = (content) => {
    const lines = (content || '').split('\n');
    const blocks = [];
    let listBlock = null;

    const flushList = () => {
        if (listBlock) {
            blocks.push(listBlock);
            listBlock = null;
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            return;
        }

        const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)$/);
        if (listMatch) {
            const indent = Math.floor((listMatch[1] || '').length / 2);
            const marker = listMatch[2];
            const listType = /\d+\./.test(marker) ? 'ol' : 'ul';
            if (!listBlock || listBlock.listType !== listType) {
                flushList();
                listBlock = { type: 'list', listType, items: [], key: `list-${index}` };
            }
            listBlock.items.push({
                html: renderInline(listMatch[3]),
                indent,
                key: `li-${index}-${listBlock.items.length}`
            });
            return;
        }

        flushList();

        const alignMatch = trimmed.match(/^\[align=(left|center|right)\](.*)\[\/align\]$/i);
        if (alignMatch) {
            blocks.push({
                type: 'text',
                align: alignMatch[1].toLowerCase(),
                html: renderInline(alignMatch[2]),
                key: `txt-${index}`
            });
            return;
        }

        blocks.push({ type: 'text', align: null, html: renderInline(line), key: `txt-${index}` });
    });

    flushList();
    return blocks;
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

    const coverUrl = buildAbsoluteUrl(post.imageUrls?.[0] || post.media);
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
            <button className="back-button pixel-button" onClick={() => window.history.back()}>
                <FiArrowLeft /> Back
            </button>

            <article className="post-content">
                <header className="post-page-header">
                    <h1 style={titleSize ? { fontSize: `${titleSize}px` } : undefined}>{post.title}</h1>
                    
                    <div className="post-page-meta">
                        <div className="meta-item">
                            <FiCalendar />
                        <span>{format(new Date(post.date || post.createdAt), 'MMMM dd, yyyy')}</span>
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

                {coverUrl && (
                    <div className="post-media">
                        <img 
                            src={coverUrl} 
                            alt={post.title}
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                display: 'block',
                                margin: '0 auto'
                            }}
                            onError={(e) => {
                                console.error('Image failed to load:', coverUrl);
                                e.target.src = '/images/posts/fallback.svg';
                            }}
                        />
                    </div>
                )}
                {post.youtubeEmbedUrl && (
                    <div className="post-media">
                        <MediaCard src={post.youtubeEmbedUrl} alt={post.title} />
                    </div>
                )}

                <div className="post-body" style={lineHeight ? { lineHeight } : undefined}>
                    {parseContentBlocks(post.content).map((block) => {
                        if (block.type === 'list') {
                            const ListTag = block.listType === 'ol' ? 'ol' : 'ul';
                            return (
                                <ListTag key={block.key} className={`entry-list ${block.listType}`}>
                                    {block.items.map((item) => (
                                        <li
                                            key={item.key}
                                            style={{ marginLeft: `${item.indent * 16}px` }}
                                            dangerouslySetInnerHTML={{ __html: item.html }}
                                        />
                                    ))}
                                </ListTag>
                            );
                        }
                        const alignClass = block.align ? `align-${block.align}` : '';
                        return (
                            <p
                                key={block.key}
                                className={`entry-paragraph ${alignClass}`.trim()}
                                dangerouslySetInnerHTML={{ __html: block.html }}
                            />
                        );
                    })}
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
