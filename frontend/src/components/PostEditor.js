import React, { useState, useEffect, useRef } from 'react';
import { createEntry, updateEntry, uploadImage } from '../services/journalService';
import MediaCard from './MediaCard';

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
        imageUrls: []
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [selectedFont, setSelectedFont] = useState('EB Garamond');
    const [markColor, setMarkColor] = useState('#d7c7a5');
    const [fontColor, setFontColor] = useState('#1f1b16');
    const [imageCaption, setImageCaption] = useState('');
    const [savedImageCaption, setSavedImageCaption] = useState('');
    const [isImageCaptionSaved, setIsImageCaptionSaved] = useState(false);
    const [fontSize, setFontSize] = useState('18');
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                date: post.date ? new Date(post.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                coverImage: post.media || post.imageUrls?.[0] || '',
                youtubeEmbedUrl: post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '') || '',
                mood: post.mood || '',
                imageUrls: post.imageUrls || []
            });
            setImageUrls(post.imageUrls || []);
        }
    }, [post]);

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
        if (file) {
            setCoverFile(file);
        } else {
            setCoverFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let uploadedCover = formData.coverImage;

            // Handle cover image upload
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
            if (uploadedCover) {
                uniqueImages.add(uploadedCover);
            }
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
                youtubeEmbedUrl
            };

            console.log('[PostEditor] Full payload:', JSON.stringify(payload, null, 2));

            if (post) {
                await updateEntry(post._id, payload);
            } else {
                await createEntry(payload);
            }

            onSave();
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Error saving post');
            setIsUploading(false);
            setLoading(false);
        }
    };

    const applyWrap = (openTag, closeTag) => {
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
    };

    const applyAlignment = (align) => applyWrap(`[align=${align}]`, `[/align]`);
    const applyUnderline = () => applyWrap('[u]', '[/u]');
    const applyMark = () => applyWrap(`[mark=${markColor}]`, '[/mark]');
    const applyColor = () => applyWrap(`[color=${fontColor}]`, '[/color]');
    const applyFont = (font) => {
        setSelectedFont(font);
        applyWrap(`[font=${font}]`, `[/font]`);
    };
    const applyFontSize = (size) => {
        setFontSize(size);
        applyWrap(`[size=${size}]`, `[/size]`);
    };

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

    return (
        <div className="writing-editor">
            <div className="editor-header">
                <div className="editor-header-left">
                    <div className="editor-kicker">{post ? 'Edit entry' : 'New entry'}</div>
                    <h2 className="editor-title">Writing Studio</h2>
                </div>
                <button className="editor-close" onClick={onClose} title="Close">X</button>
            </div>

            {error && (
                <div className="editor-error">
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="writing-layout">
                {/* LEFT COLUMN: Metadata & Settings */}
                <aside className="writing-sidebar">
                    <div className="sidebar-section">
                        <label className="sidebar-label">When</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="sidebar-input"
                        />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label">Mood</label>
                        <input
                            type="text"
                            name="mood"
                            value={formData.mood}
                            onChange={handleChange}
                            className="sidebar-input"
                            placeholder="calm..."
                        />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label">Where</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="sidebar-input"
                            placeholder="optional"
                        />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label">Tags</label>
                        <div className="sidebar-tags-input">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                className="sidebar-input"
                                placeholder="tag"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                            />
                            <button 
                                type="button"
                                className="sidebar-tag-add"
                                onClick={handleTagAdd}
                            >
                                +
                            </button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="sidebar-tags-display">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="sidebar-tag">
                                        {tag}
                                        <button 
                                            type="button"
                                            onClick={() => handleTagRemove(tag)}
                                            className="sidebar-tag-remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label">Cover</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleCoverFileChange}
                            className="sidebar-file-input"
                            id="coverUpload"
                        />
                        <label htmlFor="coverUpload" className="sidebar-upload-btn">
                            {coverFile ? '✓ set' : 'upload'}
                        </label>
                        {isUploading && (
                            <div className="sidebar-upload-status">
                                Uploading... {uploadProgress}%
                            </div>
                        )}
                        
                    </div>

                    <div className="sidebar-section">
    <label className="sidebar-label">YouTube Embed</label>
    <input
        type="url"
        name="youtubeEmbedUrl"
        value={formData.youtubeEmbedUrl}
        onChange={handleChange}
        className="sidebar-input"
        placeholder="https://www.youtube.com/watch?v=..."
    />
    {formData.youtubeEmbedUrl && (
        <div className="video-preview">
            <div className="preview-label">Preview:</div>
            <MediaCard src={formData.youtubeEmbedUrl} alt="YouTube preview" />
        </div>
    )}
</div><div className="sidebar-section sidebar-publish">
                        <label className="sidebar-publish-label">
                            <input
                                type="checkbox"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                            />
                            <span>Publish</span>
                        </label>
                    </div>

                    <div className="sidebar-actions">
                        <button type="button" className="btn-secondary btn-small" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary btn-small" disabled={loading}>
                            {loading ? '...' : (post ? 'Update' : 'Save')}
                        </button>
                    </div>
                </aside>

                {/* RIGHT COLUMN: Writing */}
                <div className="writing-content">
                    <div className="writing-toolbar">
                        <div className="toolbar-group">
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={() => applyAlignment('left')}
                                title="Align left"
                            >
                                Left
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={() => applyAlignment('center')}
                                title="Align center"
                            >
                                Center
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={() => applyAlignment('right')}
                                title="Align right"
                            >
                                Right
                            </button>
                        </div>
                        <div className="toolbar-group">
                            <select
                                className="toolbar-select"
                                value={selectedFont}
                                onChange={(e) => applyFont(e.target.value)}
                                aria-label="Font"
                            >
                                <option value="EB Garamond">Garamond</option>
                                <option value="Newsreader">Newsreader</option>
                                <option value="Inter">Inter</option>
                            </select>
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={applyUnderline}
                                title="Underline"
                            >
                                U
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={applyMark}
                                title="Highlight"
                            >
                                Mark
                            </button>
                            <select
                                className="toolbar-select"
                                value={fontSize}
                                onChange={(e) => applyFontSize(e.target.value)}
                                aria-label="Font size"
                            >
                                <option value="8">8</option>
                                <option value="10">10</option>
                                <option value="12">12</option>
                                <option value="14">14</option>
                                <option value="16">16</option>
                                <option value="18">18</option>
                                <option value="20">20</option>
                                <option value="24">24</option>
                                <option value="28">28</option>
                            </select>
                            <input
                                type="color"
                                className="toolbar-color"
                                value={markColor}
                                onChange={(e) => setMarkColor(e.target.value)}
                                title="Mark color"
                            />
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={applyColor}
                                title="Text color"
                            >
                                Text
                            </button>
                            <input
                                type="color"
                                className="toolbar-color"
                                value={fontColor}
                                onChange={(e) => setFontColor(e.target.value)}
                                title="Text color"
                            />
                        </div>
                        <div className="toolbar-group">
                            <input
                                type="text"
                                className="toolbar-input"
                                value={imageCaption}
                                onChange={(e) => {
                                    setImageCaption(e.target.value);
                                    setIsImageCaptionSaved(false);
                                }}
                                placeholder="Image caption"
                            />
                            <button
                                type="button"
                                className={`toolbar-btn ${isImageCaptionSaved ? 'is-saved' : ''}`}
                                onClick={() => {
                                    const nextCaption = imageCaption.trim();
                                    setSavedImageCaption(nextCaption);
                                    setIsImageCaptionSaved(Boolean(nextCaption));
                                }}
                                title={isImageCaptionSaved ? 'Caption saved' : 'Save caption'}
                                aria-pressed={isImageCaptionSaved}
                                disabled={!imageCaption.trim()}
                            >
                                ✓
                            </button>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="visually-hidden"
                                id="inlineImageUpload"
                                onChange={handleInlineImageUpload}
                            />
                            <label className="toolbar-btn toolbar-attach" htmlFor="inlineImageUpload" title="Attach image">
                                Image
                            </label>
                            {isUploading && (
                                <span className="toolbar-upload-status">
                                    Uploading... {uploadProgress}%
                                </span>
                            )}
                            <button
                                type="button"
                                className="toolbar-btn toolbar-attach"
                                onClick={handleEmbedInsert}
                                title="Embed link"
                            >
                                Embed
                            </button>
                        </div>
                    </div>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="writing-title"
                        placeholder="Title..."
                        required
                    />

                    <textarea
                        ref={contentRef}
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="writing-textarea"
                        placeholder="Write your entry..."
                        rows="20"
                        required
                    />
                </div>
            </form>
        </div>
    );
};

export default PostEditor;



