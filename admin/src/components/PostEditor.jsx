import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEntry, updateEntry, uploadImage } from '../shared/services/journalService';
import MediaCard from '../shared/components/MediaCard.jsx';
import ThinkerLoader from '../shared/components/ThinkerLoader';
import EntryPreview from '../shared/components/EntryPreview.jsx';
import Icon from './Icon';
import { resolvePostDate } from '../shared/utils/dateUtils';
import { FiCalendar, FiSmile, FiMapPin, FiTag, FiImage, FiSettings, FiVideo, FiShare2, FiCheck, FiX, FiEye, FiEdit } from 'react-icons/fi';


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
  { value: 'Newsreader', label: 'Newsreader (Serif)' },
  { value: 'Source Serif 4', label: 'Source Serif' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'DM Serif Display', label: 'DM Serif Display' },
  { value: 'Inter', label: 'Inter (Sans)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono (Mono)' },
  { value: 'Caveat', label: 'Caveat (Cursive)' },
  { value: 'Kalam', label: 'Kalam (Script)' },
  { value: 'Patrick Hand', label: 'Patrick Hand (Print)' },
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
    const [bodySize, setBodySize] = useState('18');
    const [savedImageCaption] = useState('');
    const [isImageCaptionSaved] = useState(false);
    const [lineHeight, setLineHeight] = useState('1.75');
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [activeTab, setActiveTab] = useState('write');
    const [sidebarTab, setSidebarTab] = useState('meta'); // 'meta', 'appearance', 'media'
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [backupData, setBackupData] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [writingGoal, setWritingGoal] = useState(0);
    const [showGoalInput, setShowGoalInput] = useState(false);
    const contentRef = useRef(null);
    const autoSaveRef = useRef(null);
    const dropRef = useRef(null);

    const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
    const charCount = formData.content.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const goalProgress = writingGoal > 0 ? Math.min(100, (wordCount / writingGoal) * 100) : 0;

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

    // Check for backup on mount
    useEffect(() => {
        const backup = localStorage.getItem('journal_draft_backup');
        if (backup) {
            try {
                const parsed = JSON.parse(backup);
                // Only show if the backup content is different from current/loaded post content
                if (parsed && parsed.content && parsed.content !== formData.content && parsed.content !== post?.content) {
                    setBackupData(parsed);
                    setShowRestoreBackup(true);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, [post]);

    const handleRestoreBackup = () => {
        if (backupData) {
            setFormData(prev => ({
                ...prev,
                title: backupData.title || prev.title,
                content: backupData.content || prev.content,
                tags: backupData.tags || prev.tags,
                location: backupData.location || prev.location,
                mood: backupData.mood || prev.mood
            }));
            if (backupData.titleSize) setTitleSize(String(backupData.titleSize));
            if (backupData.bodySize) setBodySize(String(backupData.bodySize));
            if (backupData.lineHeight) setLineHeight(String(backupData.lineHeight));
            if (backupData.font) setSelectedFont(backupData.font);
        }
        setShowRestoreBackup(false);
    };

    const handleDiscardBackup = () => {
        localStorage.removeItem('journal_draft_backup');
        setShowRestoreBackup(false);
    };

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
            setBodySize(String(post.bodySize || 18));
            setLineHeight(String(Number(post.lineHeight) || 1.75));
            if (post.font) setSelectedFont(post.font);
        }
    }, [post]);

    // Local Auto-save backup hook
    useEffect(() => {
        if (!formData.title && !formData.content) return;
        
        const saveBackup = () => {
            localStorage.setItem('journal_draft_backup', JSON.stringify({
                title: formData.title,
                content: formData.content,
                tags: formData.tags,
                location: formData.location,
                mood: formData.mood,
                titleSize,
                bodySize,
                lineHeight,
                font: selectedFont
            }));
            setLastSaved(new Date());
        };

        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(saveBackup, 10000); // Back up every 10 seconds

        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [formData.title, formData.content, formData.tags, formData.location, formData.mood, titleSize, bodySize, lineHeight, selectedFont]);

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
        <div className={`writing-editor${focusMode ? ' focus-mode' : ''}`} ref={dropRef} onDragOver={handleDragOver} onDrop={handleDrop}>
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
                    <div className="sidebar-tabs">
                        <button
                            type="button"
                            className={`sidebar-tab-btn ${sidebarTab === 'meta' ? 'active' : ''}`}
                            onClick={() => setSidebarTab('meta')}
                        >
                            <FiCalendar />
                            <span>Info</span>
                        </button>
                        <button
                            type="button"
                            className={`sidebar-tab-btn ${sidebarTab === 'appearance' ? 'active' : ''}`}
                            onClick={() => setSidebarTab('appearance')}
                        >
                            <FiSettings />
                            <span>Style</span>
                        </button>
                        <button
                            type="button"
                            className={`sidebar-tab-btn ${sidebarTab === 'media' ? 'active' : ''}`}
                            onClick={() => setSidebarTab('media')}
                        >
                            <FiImage />
                            <span>Media</span>
                        </button>
                    </div>

                    <div className="sidebar-tab-content">
                        {sidebarTab === 'meta' && (
                            <>
                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiCalendar /> Date</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="sidebar-input" />
                                </div>

                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiSmile /> Mood</label>
                                    <div className="mood-trigger" onClick={() => setShowMoodPicker(!showMoodPicker)}>
                                        {formData.mood ? (
                                            <span className="mood-selected">
                                                <span className="mood-emoji"><Icon name={getMoodIcon(formData.mood)} /></span>
                                                <span>{formData.mood}</span>
                                                <span className="mood-change" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, mood: '' })); }}><FiX /></span>
                                            </span>
                                        ) : (
                                            <span className="mood-placeholder">Tap to set mood...</span>
                                        )}
                                    </div>
                                    {showMoodPicker && (
                                        <div className="mood-picker">
                                            <div className="mood-picker-header">
                                                <span><FiSmile /> Choose your mood</span>
                                                <button type="button" onClick={() => setShowMoodPicker(false)}><FiX /></button>
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
                                    <label className="sidebar-label"><FiMapPin /> Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="sidebar-input" placeholder="Where are you?" />
                                </div>

                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiTag /> Tags</label>
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
                                                    <button type="button" onClick={() => handleTagRemove(tag)} className="sidebar-tag-remove"><FiX /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {sidebarTab === 'appearance' && (
                            <>
                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiSettings /> Paper Texture</label>
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
                                    <label className="sidebar-label"><FiImage /> Media Frame</label>
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
                                    <label className="sidebar-label"><FiImage /> Frame Size</label>
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
                            </>
                        )}

                        {sidebarTab === 'media' && (
                            <>
                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiImage /> Cover Image</label>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverFileChange} className="sidebar-file-input" id="coverUpload" />
                                    <label htmlFor="coverUpload" className="sidebar-upload-btn">
                                        {coverFile ? <><FiCheck /> Image set</> : <><FiImage /> Upload cover...</>}
                                    </label>
                                    {isUploading && <div className="sidebar-upload-status">Uploading... {uploadProgress}%</div>}
                                </div>

                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiVideo /> YouTube Video</label>
                                    <input type="url" name="youtubeEmbedUrl" value={formData.youtubeEmbedUrl} onChange={handleChange} className="sidebar-input" placeholder="https://youtube.com/watch?v=..." />
                                    {formData.youtubeEmbedUrl && (
                                        <div className="video-preview">
                                            <div className="preview-label">Preview:</div>
                                            <MediaCard src={formData.youtubeEmbedUrl} alt="YouTube preview" />
                                        </div>
                                    )}
                                </div>

                                <div className="sidebar-section">
                                    <label className="sidebar-label"><FiShare2 /> Share Options</label>
                                    {post?._id ? (
                                        <>
                                            <input type="text" readOnly className="sidebar-input" value={buildShareUrl(post._id)} onFocus={(e) => e.target.select()} style={{ fontSize: '11px' }} />
                                            <div className="sidebar-share-actions" style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                                <button type="button" className="sidebar-btn" onClick={handleCopyShareUrl} style={{ flex: 1, padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><FiShare2 size={12} /> Copy</button>
                                                <a className="sidebar-btn" href={buildShareUrl(post._id)} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Open</a>
                                            </div>
                                            {!formData.isPublished && (
                                                <div className="sidebar-hint" style={{ fontSize: '11px', marginTop: '4px' }}>Only visible after publishing.</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="sidebar-hint" style={{ fontSize: '11px' }}>Save first to get a share link.</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="sidebar-section sidebar-publish">
                        <label className="sidebar-publish-label">
                            <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} />
                            <span>{formData.isPublished ? <><FiCheck /> Published</> : <><FiX /> Draft</>}</span>
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
                            ) : (post ? <><FiEdit /> Update</> : <><FiCheck /> Save</>)}
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
                            <div className="toolbar-group toolbar-extras">
                                <button
                                    type="button"
                                    className={`toolbar-btn ${focusMode ? 'is-active' : ''}`}
                                    onClick={() => setFocusMode(!focusMode)}
                                    title="Focus mode"
                                >
                                    <span className="focus-icon">{focusMode ? '◉' : '◯'}</span>
                                </button>
                                {showGoalInput ? (
                                    <div className="goal-input-popup">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10000"
                                            placeholder="Word goal"
                                            className="toolbar-input"
                                            style={{ width: '80px' }}
                                            value={writingGoal || ''}
                                            onChange={(e) => setWritingGoal(Math.max(0, parseInt(e.target.value) || 0))}
                                            onKeyDown={(e) => e.key === 'Enter' && setShowGoalInput(false)}
                                            autoFocus
                                        />
                                        <button type="button" className="toolbar-btn" onClick={() => setShowGoalInput(false)} title="Set goal">
                                            <FiCheck size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={`toolbar-btn ${writingGoal > 0 ? 'is-active' : ''}`}
                                        onClick={() => setShowGoalInput(true)}
                                        title={writingGoal > 0 ? `${wordCount}/${writingGoal} words` : 'Set writing goal'}
                                    >
                                        {writingGoal > 0 ? (
                                            <span className="goal-badge">{Math.round(goalProgress)}%</span>
                                        ) : (
                                            <span className="goal-icon">🎯</span>
                                        )}
                                    </button>
                                )}
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

                        {writingGoal > 0 && (
                            <div className="writing-progress-row">
                                <div className="writing-progress-bar">
                                    <div className="writing-progress-fill" style={{ width: `${Math.min(100, goalProgress)}%` }} />
                                </div>
                                <span className={`writing-progress-label ${goalProgress >= 100 ? 'goal-met' : ''}`}>
                                    {goalProgress >= 100 ? '🎉 Goal met!' : `${wordCount} / ${writingGoal} words`}
                                </span>
                            </div>
                        )}

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
                            <div className="preview-content-wrapper" style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '5px', border: '2px solid var(--border)' }}>
                                <EntryPreview 
                                    post={{
                                        ...formData,
                                        titleSize,
                                        lineHeight,
                                        font: selectedFont,
                                        type: formData.youtubeEmbedUrl ? 'video' : (coverFile || formData.coverImage) ? 'image' : 'story'
                                    }} 
                                    mediaSettings={null} 
                                />
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
