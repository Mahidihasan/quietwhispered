import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEntry, updateEntry, uploadImage } from '../shared/services/journalService';
import MediaCard from '../shared/components/MediaCard.jsx';
import ThinkerLoader from '../shared/components/ThinkerLoader';
import Icon from './Icon';
import { resolvePostDate } from '../shared/utils/dateUtils';

const MOOD_OPTIONS = [
  { icon: 'smile', label: 'Calm' },
  { icon: 'cloud', label: 'Peaceful' },
  { icon: 'star', label: 'Grateful' },
  { icon: 'messageSquare', label: 'Reflective' },
  { icon: 'moon', label: 'Melancholy' },
  { icon: 'heart', label: 'Passionate' },
  { icon: 'smile', label: 'Happy' },
  { icon: 'cloud', label: 'Sad' },
  { icon: 'info', label: 'Thoughtful' },
  { icon: 'star', label: 'Inspired' },
  { icon: 'moon', label: 'Dreamy' },
  { icon: 'heart', label: 'Determined' },
];

const FONT_OPTIONS = [
  { value: 'Newsreader', label: 'Serif' },
  { value: 'Source Serif 4', label: 'Source Serif' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Inter', label: 'Sans' },
  { value: 'Caveat', label: 'Handwriting' },
  { value: 'Playfair Display', label: 'Display' },
];

const PostEditor = ({ post, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: [],
        location: '',
        date: new Date().toISOString().split('T')[0],
        isPublished: true,
        coverImage: '',
        youtubeEmbedUrl: '',
        mood: '',
        imageUrls: [],
        lineHeight: 1.75,
        paperTexture: 'none',
        mediaFrame: 'polaroid',
        frameSize: 'md'
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [selectedFont, setSelectedFont] = useState('Newsreader');
    const [markColor, setMarkColor] = useState('#d7c7a5');
    const [fontColor, setFontColor] = useState('#1f1b16');
    const [titleSize, setTitleSize] = useState('32');
    const [savedImageCaption] = useState('');
    const [isImageCaptionSaved] = useState(false);
    const [lineHeight, setLineHeight] = useState('1.75');
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [activeTab, setActiveTab] = useState('write');
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const contentRef = useRef(null);
    const autoSaveRef = useRef(null);
    const dropRef = useRef(null);

    const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
    const charCount = formData.content.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const TEXTURE_OPTIONS = [
        { value: 'none', label: 'None' },
        { value: 'vellum', label: 'Vellum' },
        { value: 'linen', label: 'Linen' },
        { value: 'laid', label: 'Laid' },
        { value: 'wove', label: 'Wove' },
        { value: 'parchment', label: 'Parchment' },
        { value: 'canvas', label: 'Canvas' },
        { value: 'grid', label: 'Grid' },
        { value: 'lines', label: 'Lines' },
        { value: 'marble', label: 'Marble' },
    ];

    const FRAME_OPTIONS = [
        { value: 'polaroid', label: 'Polaroid' },
        { value: 'border', label: 'Border' },
        { value: 'double', label: 'Double' },
        { value: 'shadow', label: 'Shadow' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'rounded', label: 'Rounded' },
        { value: 'filmstrip', label: 'Filmstrip' },
    ];

    const FRAME_SIZE_OPTIONS = [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Full width' },
    ];

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                date: resolvePostDate(post) ? resolvePostDate(post).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                coverImage: post.media || post.imageUrls?.[0] || '',
                youtubeEmbedUrl: post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '') || '',
                mood: post.mood || '',
                imageUrls: post.imageUrls || [],
                lineHeight: Number(post.lineHeight) || 1.75,
                paperTexture: post.paperTexture || 'none',
                mediaFrame: post.mediaFrame || 'polaroid',
                frameSize: post.frameSize || 'md'
            });
            setImageUrls(post.imageUrls || []);
            setTitleSize(String(post.titleSize || 32));
            setLineHeight(String(Number(post.lineHeight) || 1.75));
            if (post.font) setSelectedFont(post.font);
        }
    }, [post]);

    useEffect(() => {
        if (!formData.title && !formData.content) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            setLastSaved(new Date());
        }, 30000);
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [formData.title, formData.content]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTagAdd = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleTagRemove = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleCoverFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) setCoverFile(file);
        else setCoverFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let uploadedCover = formData.coverImage;
            if (coverFile) {
                setIsUploading(true);
                setUploadProgress(0);
                uploadedCover = await uploadImage(coverFile, {
                    folder: 'journal-images',
                    onProgress: setUploadProgress
                });
                setIsUploading(false);
            }

            const uniqueImages = new Set(imageUrls);
            if (uploadedCover) uniqueImages.add(uploadedCover);
            const finalImageUrls = Array.from(uniqueImages);

            const youtubeEmbedUrl = formData.youtubeEmbedUrl?.trim() || '';
            const postType = youtubeEmbedUrl ? 'video' : uploadedCover ? 'image' : 'story';
            const mediaUrl = youtubeEmbedUrl || uploadedCover || '';

            const payload = {
                title: formData.title,
                content: formData.content,
                tags: formData.tags,
                location: formData.location,
                date: formData.date,
                isPublished: formData.isPublished,
                mood: formData.mood || null,
                type: postType,
                media: mediaUrl,
                imageUrls: finalImageUrls,
                youtubeEmbedUrl,
                titleSize: Number(titleSize) || 32,
                lineHeight: Number(lineHeight) || 1.75,
                font: selectedFont,
                paperTexture: formData.paperTexture || 'none',
                mediaFrame: formData.mediaFrame || 'polaroid',
                frameSize: formData.frameSize || 'md'
            };

            if (post) {
                await updateEntry(post._id, payload);
            } else {
                await createEntry(payload);
            }
            onSave();
        } catch (err) {
            setError(err.message || 'Error saving post');
        } finally {
            setIsUploading(false);
            setLoading(false);
        }
    };

    const applyWrap = useCallback((openTag, closeTag) => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart ?? formData.content.length;
        const end = textarea.selectionEnd ?? formData.content.length;
        const before = formData.content.slice(0, start);
        const selected = formData.content.slice(start, end);
        const after = formData.content.slice(end);
        const nextValue = `${before}${openTag}${selected}${closeTag}${after}`;
        setFormData(prev => ({ ...prev, content: nextValue }));
        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = selected
                ? start + openTag.length + selected.length + closeTag.length
                : start + openTag.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    }, [formData.content]);

    const applyBold = () => applyWrap('[b]', '[/b]');
    const applyItalic = () => applyWrap('[i]', '[/i]');
    const applyUnderline = () => applyWrap('[u]', '[/u]');
    const applyStrikethrough = () => applyWrap('[s]', '[/s]');
    const applyMark = () => applyWrap(`[mark=${markColor}]`, '[/mark]');
    const applyColor = () => applyWrap(`[color=${fontColor}]`, '[/color]');
    const applyHeading = (level) => applyWrap(`[h${level}]`, `[/h${level}]`);
    const applyBlockquote = () => applyWrap('[quote]', '[/quote]');
    const applyCode = () => applyWrap('[code]', '[/code]');
    const applyAlignment = (align) => applyWrap(`[align=${align}]`, '[/align]');
    const insertHorizontalRule = () => insertAtCursor('\n---\n');

    const insertAtCursor = (textToInsert) => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart ?? formData.content.length;
        const end = textarea.selectionEnd ?? formData.content.length;
        const before = formData.content.slice(0, start);
        const after = formData.content.slice(end);
        const nextValue = `${before}${textToInsert}${after}`;
        setFormData(prev => ({ ...prev, content: nextValue }));
        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + textToInsert.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const insertLink = () => {
        const url = window.prompt('Enter URL:');
        if (!url) return;
        const textarea = contentRef.current;
        if (!textarea) return;
        const selected = formData.content.slice(textarea.selectionStart, textarea.selectionEnd);
        const linkText = selected || url;
        insertAtCursor(`[link=${url}]${linkText}[/link]`);
    };

    const insertList = (type) => {
        if (type === 'ul') insertAtCursor('\n- item 1\n- item 2\n- item 3\n');
        else insertAtCursor('\n1. item 1\n2. item 2\n3. item 3\n');
    };

    const replaceRange = (start, end, replacement) => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const before = formData.content.slice(0, start);
        const after = formData.content.slice(end);
        const nextValue = `${before}${replacement}${after}`;
        setFormData(prev => ({ ...prev, content: nextValue }));
        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + replacement.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const getLineInfo = () => {
        const textarea = contentRef.current;
        if (!textarea) return null;
        const value = formData.content;
        const cursor = textarea.selectionStart ?? value.length;
        const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
        const lineEndIndex = value.indexOf('\n', cursor);
        const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
        const line = value.slice(lineStart, lineEnd);
        const offset = cursor - lineStart;
        return { line, lineStart, lineEnd, offset };
    };

    const handleEditorKeyDown = (event) => {
        const info = getLineInfo();
        if (!info) return;
        const { line, lineStart, lineEnd, offset } = info;
        const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)$/);
        const listPrefixMatch = line.match(/^(\s*)([-*•]|\d+\.)\s*$/);

        if (event.key === 'Tab') {
            event.preventDefault();
            replaceRange(lineStart + offset, lineStart + offset, '  ');
            return;
        }
        if (event.key === 'Enter') {
            if (listPrefixMatch) {
                event.preventDefault();
                const value = formData.content;
                const before = value.slice(0, lineStart);
                let after = value.slice(lineEnd);
                if (after.startsWith('\n')) after = after.slice(1);
                setFormData(prev => ({ ...prev, content: `${before}\n${after}` }));
                requestAnimationFrame(() => {
                    const ta = contentRef.current;
                    if (ta) { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); }
                });
                return;
            }
            if (listMatch) {
                event.preventDefault();
                const indent = listMatch[1] || '';
                const marker = listMatch[2];
                const isOrdered = /\d+\./.test(marker);
                const nextMarker = isOrdered ? `${Math.max(1, parseInt(marker, 10) + 1)}.` : marker;
                replaceRange(lineStart + offset, lineStart + offset, `\n${indent}${nextMarker} `);
            }
        }
    };

    const handleInlineImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            setUploadProgress(0);
            const url = await uploadImage(file, {
                folder: 'journal-images',
                onProgress: setUploadProgress
            });
            setImageUrls(prev => (prev.includes(url) ? prev : [...prev, url]));
            const caption = isImageCaptionSaved ? savedImageCaption.trim() : '';
            const captionPart = caption ? ` | ${caption}` : '';
            insertAtCursor(`\n[image: ${url}${captionPart}]\n`);
        } catch (err) {
            setError('Error uploading image');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            event.target.value = '';
        }
    };

    const handleEmbedInsert = () => {
        const url = window.prompt('Enter embed URL (YouTube/Vimeo)');
        if (!url) return;
        insertAtCursor(`\n[embed: ${url}]\n`);
    };

    const buildShareUrl = (postId) => {
        if (!postId || typeof window === 'undefined') return '';
        return new URL(`/post/${postId}`, window.location.origin).href;
    };

    const handleCopyShareUrl = async () => {
        if (!post?._id) return;
        const url = buildShareUrl(post._id);
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                return;
            }
        } catch (err) {}
        try {
            const el = document.createElement('textarea');
            el.value = url;
            el.setAttribute('readonly', '');
            el.style.position = 'fixed';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        } catch (err) {
            setError('Could not copy URL.');
        }
    };

    const handleNativeShare = async () => {
        if (!post?._id) return;
        const url = buildShareUrl(post._id);
        if (!navigator?.share) return;
        try {
            await navigator.share({ title: formData.title || 'Journal entry', url });
        } catch (err) {}
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('inlineImageUpload');
            if (input) {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                handleInlineImageUpload({ target: input });
            }
        }
    };

    const handleMoodSelect = (mood) => {
        setFormData(prev => ({ ...prev, mood: prev.mood === mood ? '' : mood }));
        setShowMoodPicker(false);
    };

    const getMoodIcon = (mood) => {
        const found = MOOD_OPTIONS.find(m => m.label.toLowerCase() === mood?.toLowerCase());
        return found ? found.icon : 'smile';
    };

    return (
        <div className="writing-editor" ref={dropRef} onDragOver={handleDragOver} onDrop={handleDrop}>
            <div className="editor-header">
                <div className="editor-header-left">
                    <span className="editor-kicker">
                        {post ? <><Icon name="edit" size="sm" /> Edit entry</> : <><Icon name="write" size="sm" /> New entry</>}
                    </span>
                    <h2 className="editor-title">
                        {post ? 'Refine your story' : 'Write something'}
                    </h2>
                </div>
                <div className="editor-header-right">
                    {lastSaved && (
                        <span className="editor-autosave" title="Auto-saved">
                            <Icon name="check" size="sm" /> just now
                        </span>
                    )}
                    <button className="editor-close" onClick={onClose} title="Close">
                        <Icon name="close" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="editor-error">
                    <p><Icon name="alertTriangle" size="sm" /> {error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="writing-layout">
                <aside className="writing-sidebar">
                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="calendar" size="sm" /> Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="sidebar-input" />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="smile" size="sm" /> Mood</label>
                        <div className="mood-trigger" onClick={() => setShowMoodPicker(!showMoodPicker)}>
                            {formData.mood ? (
                                <span className="mood-selected">
                                    <span className="mood-emoji"><Icon name={getMoodIcon(formData.mood)} /></span>
                                    <span>{formData.mood}</span>
                                    <span className="mood-change"><Icon name="close" /></span>
                                </span>
                            ) : (
                                <span className="mood-placeholder">Tap to set mood...</span>
                            )}
                        </div>
                        {showMoodPicker && (
                            <div className="mood-picker">
                                <div className="mood-picker-header">
                                    <span><Icon name="smile" size="sm" /> Choose your mood</span>
                                    <button type="button" onClick={() => setShowMoodPicker(false)}><Icon name="close" /></button>
                                </div>
                                <div className="mood-grid">
                                    {MOOD_OPTIONS.map(m => (
                                        <button
                                            key={m.label}
                                            type="button"
                                            className={`mood-option ${formData.mood === m.label.toLowerCase() ? 'active' : ''}`}
                                            onClick={() => handleMoodSelect(m.label.toLowerCase())}
                                            title={m.label}
                                        >
                                            <span className="mood-emoji"><Icon name={m.icon} size="lg" /></span>
                                            <span className="mood-label">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="mapPin" size="sm" /> Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="sidebar-input" placeholder="Where are you?" />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="tag" size="sm" /> Tags</label>
                        <div className="sidebar-tags-input">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                className="sidebar-input"
                                placeholder="Add tag..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                            />
                            <button type="button" className="sidebar-tag-add" onClick={handleTagAdd}>+</button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="sidebar-tags-display">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="sidebar-tag">
                                        <span>#</span>{tag}
                                        <button type="button" onClick={() => handleTagRemove(tag)} className="sidebar-tag-remove"><Icon name="close" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="image" size="sm" /> Cover</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverFileChange} className="sidebar-file-input" id="coverUpload" />
                        <label htmlFor="coverUpload" className="sidebar-upload-btn">
                            {coverFile ? <><Icon name="check" size="sm" /> Image set</> : <><Icon name="image" size="sm" /> Upload cover...</>}
                        </label>
                        {isUploading && <div className="sidebar-upload-status">Uploading... {uploadProgress}%</div>}
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="paper" size="sm" /> Paper Texture</label>
                        <div className="texture-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {TEXTURE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`texture-option ${formData.paperTexture === opt.value ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, paperTexture: opt.value }))}
                                    style={{ padding: '2px 6px', fontSize: '10px', border: '1px solid var(--border-light)', borderRadius: '3px', background: formData.paperTexture === opt.value ? 'var(--accent)' : 'transparent', color: formData.paperTexture === opt.value ? '#fff' : 'inherit', cursor: 'pointer' }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="image" size="sm" /> Media Frame</label>
                        <select
                            name="mediaFrame"
                            value={formData.mediaFrame}
                            onChange={handleChange}
                            className="sidebar-input"
                        >
                            {FRAME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="image" size="sm" /> Frame Size</label>
                        <select
                            name="frameSize"
                            value={formData.frameSize}
                            onChange={handleChange}
                            className="sidebar-input"
                        >
                            {FRAME_SIZE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="video" size="sm" /> YouTube</label>
                        <input type="url" name="youtubeEmbedUrl" value={formData.youtubeEmbedUrl} onChange={handleChange} className="sidebar-input" placeholder="https://youtube.com/watch?v=..." />
                        {formData.youtubeEmbedUrl && (
                            <div className="video-preview">
                                <div className="preview-label">Preview:</div>
                                <MediaCard src={formData.youtubeEmbedUrl} alt="YouTube preview" />
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label"><Icon name="share" size="sm" /> Share</label>
                        {post?._id ? (
                            <>
                                <input type="text" readOnly className="sidebar-input" value={buildShareUrl(post._id)} onFocus={(e) => e.target.select()} />
                                <div className="sidebar-share-actions">
                                    <button type="button" className="sidebar-btn" onClick={handleCopyShareUrl}><Icon name="copy" size="sm" /> Copy</button>
                                    <a className="sidebar-btn" href={buildShareUrl(post._id)} target="_blank" rel="noreferrer"><Icon name="externalLink" size="sm" /> Open</a>
                                    {typeof navigator !== 'undefined' && navigator.share && (
                                        <button type="button" className="sidebar-btn" onClick={handleNativeShare}><Icon name="share" size="sm" /> Share</button>
                                    )}
                                </div>
                                {!formData.isPublished && (
                                    <div className="sidebar-hint">Only visible after publishing.</div>
                                )}
                            </>
                        ) : (
                            <div className="sidebar-hint">Save first to get a share link.</div>
                        )}
                    </div>

                    <div className="sidebar-section sidebar-publish">
                        <label className="sidebar-publish-label">
                            <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} />
                            <span>{formData.isPublished ? <><Icon name="published" size="sm" /> Published</> : <><Icon name="draft" size="sm" /> Draft</>}</span>
                        </label>
                    </div>

                    <div className="sidebar-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
                            {loading ? (
                                <span className="btn-loading">
                                    <ThinkerLoader />
                                    <span>Saving</span>
                                </span>
                            ) : (post ? <><Icon name="edit" size="sm" /> Update</> : <><Icon name="save" size="sm" /> Save</>)}
                        </button>
                    </div>
                </aside>

                <div className="writing-content">
                    <div className="editor-tabs">
                        <button
                            type="button"
                            className={`editor-tab ${activeTab === 'write' ? 'active' : ''}`}
                            onClick={() => setActiveTab('write')}
                        >
                            <Icon name="pen" size="sm" /> Write
                        </button>
                        <button
                            type="button"
                            className={`editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preview')}
                        >
                            <Icon name="eye" size="sm" /> Preview
                        </button>
                        <button
                            type="button"
                            className={`editor-tab ${activeTab === 'meta' ? 'active' : ''}`}
                            onClick={() => setActiveTab('meta')}
                        >
                            <Icon name="settings" size="sm" /> Meta
                        </button>
                    </div>

                    <div className={`editor-panel ${activeTab === 'write' ? 'active' : ''}`}>
                        <div className="writing-toolbar">
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={applyBold} title="Bold"><strong>B</strong></button>
                                <button type="button" className="toolbar-btn" onClick={applyItalic} title="Italic"><em>I</em></button>
                                <button type="button" className="toolbar-btn" onClick={applyUnderline} title="Underline"><u>U</u></button>
                                <button type="button" className="toolbar-btn" onClick={applyStrikethrough} title="Strikethrough"><s>S</s></button>
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={() => applyHeading(1)} title="Heading 1">H1</button>
                                <button type="button" className="toolbar-btn" onClick={() => applyHeading(2)} title="Heading 2">H2</button>
                                <button type="button" className="toolbar-btn" onClick={() => applyHeading(3)} title="Heading 3">H3</button>
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={applyBlockquote} title="Quote"><Icon name="quote" size="sm" /></button>
                                <button type="button" className="toolbar-btn" onClick={() => insertList('ul')} title="Bullet list"><Icon name="list" size="sm" /></button>
                                <button type="button" className="toolbar-btn" onClick={insertHorizontalRule} title="Horizontal rule">—</button>
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={insertLink} title="Insert link"><Icon name="link" size="sm" /></button>
                                <button type="button" className="toolbar-btn" onClick={applyCode} title="Code">{'</>'}</button>
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={() => applyAlignment('left')} title="Align left">≡</button>
                                <button type="button" className="toolbar-btn" onClick={() => applyAlignment('center')} title="Align center">≡</button>
                                <button type="button" className="toolbar-btn" onClick={() => applyAlignment('right')} title="Align right">≡</button>
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={applyMark} title="Highlight" style={{ background: markColor }}>Mark</button>
                                <input type="color" className="toolbar-color" value={markColor} onChange={(e) => setMarkColor(e.target.value)} title="Mark color" />
                            </div>
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={applyColor} title="Text color" style={{ color: fontColor }}>A</button>
                                <input type="color" className="toolbar-color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} title="Text color" />
                            </div>
                            <div className={`toolbar-group font-selector ${showFontPanel ? 'active' : ''}`}>
                                <button type="button" className="toolbar-btn" onClick={() => setShowFontPanel(!showFontPanel)} title="Font settings">
                                    {selectedFont === 'Newsreader' ? 'Aa' : 'Tt'}
                                </button>
                                {showFontPanel && (
                                    <div className="font-panel">
                                        <div className="font-panel-header">
                                            <span>Typography</span>
                                            <button type="button" onClick={() => setShowFontPanel(false)}><Icon name="close" /></button>
                                        </div>
                                        <div className="font-panel-body">
                                            <label>Font</label>
                                            <select value={selectedFont} onChange={(e) => { setSelectedFont(e.target.value); }}>
                                                {FONT_OPTIONS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>
                                            <label>Title size</label>
                                            <select value={titleSize} onChange={(e) => setTitleSize(e.target.value)}>
                                                {[20,24,28,32,36,40,44,48].map(s => (
                                                    <option key={s} value={s}>{s}px</option>
                                                ))}
                                            </select>
                                            <label>Line spacing</label>
                                            <select value={lineHeight} onChange={(e) => setLineHeight(e.target.value)}>
                                                {[1.2,1.4,1.6,1.75,2,2.2].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="toolbar-group">
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" id="inlineImageUpload" onChange={handleInlineImageUpload} />
                                <label className="toolbar-btn" htmlFor="inlineImageUpload" title="Drop or click to add image"><Icon name="image" size="sm" /></label>
                                {isUploading && <span className="toolbar-upload-status">{uploadProgress}%</span>}
                                <button type="button" className="toolbar-btn" onClick={handleEmbedInsert} title="Embed video"><Icon name="play" size="sm" /></button>
                            </div>
                        </div>

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="writing-title"
                            placeholder="Your story begins with a title..."
                            style={{
                                fontSize: `${Number(titleSize) || 32}px`,
                                fontFamily: selectedFont === 'Newsreader' ? 'var(--font-body)' : `'${selectedFont}', serif`
                            }}
                            required
                        />

                        <textarea
                            ref={contentRef}
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            onKeyDown={handleEditorKeyDown}
                            className="writing-textarea"
                            style={{
                                lineHeight: Number(lineHeight) || 1.75,
                                fontFamily: selectedFont === 'Newsreader' ? 'var(--font-body)' : `'${selectedFont}', serif`
                            }}
                            placeholder="Write freely. Your thoughts, your voice..."
                            rows="20"
                            required
                        />

                        <div className="writing-footer">
                            <span className="writing-stats">
                                <span title="Words"><Icon name="pen" size="sm" /> {wordCount} words</span>
                                <span className="stat-sep">·</span>
                                <span title="Characters">{charCount} chars</span>
                                <span className="stat-sep">·</span>
                                <span title="Reading time"><Icon name="book" size="sm" /> {readingTime} min read</span>
                            </span>
                            <div className="writing-actions">
                                <button type="button" className="writing-btn" onClick={() => setFormData(prev => ({ ...prev, content: '' }))} title="Clear">
                                    <Icon name="trash" size="sm" /> Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`editor-panel preview-panel ${activeTab === 'preview' ? 'active' : ''}`}>
                        {formData.content ? (
                            <div className="preview-content">
                                <h3 className="preview-title" style={{ fontSize: `${Number(titleSize) || 32}px`, fontFamily: `'${selectedFont}', serif` }}>
                                    {formData.title || 'Untitled'}
                                </h3>
                                <div className="preview-meta">
                                    <span><Icon name="calendar" size="sm" /> {formData.date}</span>
                                    {formData.mood && <span>· <Icon name={getMoodIcon(formData.mood)} size="sm" /> {formData.mood}</span>}
                                    {formData.location && <span>· <Icon name="mapPin" size="sm" /> {formData.location}</span>}
                                </div>
                                <div className="preview-body" style={{ lineHeight: Number(lineHeight) || 1.75, fontFamily: selectedFont === 'Newsreader' ? 'var(--font-body)' : `'${selectedFont}', serif` }}>
                                    {formData.content.split('\n').map((line, i) => (
                                        <p key={i}>{line || '\u00A0'}</p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="preview-empty">
                                <span className="preview-empty-icon"><Icon name="pen" size="xl" /></span>
                                <p>Write something to see a preview</p>
                            </div>
                        )}
                    </div>

                    <div className={`editor-panel meta-panel ${activeTab === 'meta' ? 'active' : ''}`}>
                        <div className="meta-panel-stats">
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Words</span>
                                <span className="meta-stat-value">{wordCount}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Characters</span>
                                <span className="meta-stat-value">{charCount}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Reading time</span>
                                <span className="meta-stat-value">{readingTime} min</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Tags</span>
                                <span className="meta-stat-value">{formData.tags.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostEditor;
