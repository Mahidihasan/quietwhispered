import React, { useState, useEffect } from 'react';
import { postsAPI } from '../api';
import MediaCard from './MediaCard';

const PostEditor = ({ post, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'story',
        tags: [],
        location: '',
        date: new Date().toISOString().split('T')[0],
        isPublished: true,
        coverImage: '',
        videoUrl: '',
        mood: ''
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoMode, setVideoMode] = useState('upload'); // 'upload' or 'url'

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                date: post.date ? new Date(post.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                coverImage: (post.type === 'image' ? post.media : '') || '',
                videoUrl: (post.type === 'video' ? post.media : '') || '',
                mood: post.mood || ''
            });
            // Detect if editing a video post with URL
            if (post.type === 'video' && post.media && !post.media.startsWith('/uploads')) {
                setVideoMode('url');
            }
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

    const handleVideoFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
        } else {
            setVideoFile(null);
        }
    };

    const handleVideoModeToggle = (mode) => {
        setVideoMode(mode);
        if (mode === 'upload') {
            setFormData(prev => ({ ...prev, videoUrl: '' }));
        } else {
            setVideoFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let uploadedCover = formData.coverImage;
            let uploadedVideo = '';
            let postType = 'story';
            let mediaUrl = '';

            // Handle cover image upload
            if (coverFile) {
                const uploadRes = await postsAPI.upload(coverFile);
                uploadedCover = uploadRes.data.url;
            }

            // Handle video
            if (videoFile) {
                // Upload video file
                const uploadRes = await postsAPI.upload(videoFile);
                uploadedVideo = uploadRes.data.url;
                postType = 'video';
                mediaUrl = uploadedVideo;
            } else if (formData.videoUrl.trim()) {
                // Use video URL
                postType = 'video';
                mediaUrl = formData.videoUrl;
            } else if (uploadedCover) {
                // Image cover
                postType = 'image';
                mediaUrl = uploadedCover;
            }

            const payload = {
                title: formData.title,
                content: formData.content,
                tags: formData.tags,
                location: formData.location,
                date: formData.date,
                isPublished: formData.isPublished,
                mood: formData.mood || null,
                type: postType,
                media: mediaUrl
            };

            if (post) {
                await postsAPI.update(post._id, payload);
            } else {
                await postsAPI.create(payload);
            }
            
            onSave();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving post');
            console.error('Error saving post:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="writing-editor">
            <div className="editor-header">
                <button className="editor-close" onClick={onClose} title="Close">×</button>
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
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="sidebar-file-input"
                            id="coverUpload"
                        />
                        <label htmlFor="coverUpload" className="sidebar-upload-btn">
                            {coverFile ? '✓ set' : 'upload'}
                        </label>
                        
                        <input
                            type="url"
                            name="coverImage"
                            value={formData.coverImage}
                            onChange={handleChange}
                            className="sidebar-input"
                            placeholder="URL"
                        />
                    </div>

                    <div className="sidebar-section">
                        <label className="sidebar-label">Video</label>
                        
                        <div className="video-mode-toggle">
                            <button
                                type="button"
                                className={`mode-toggle-btn ${videoMode === 'upload' ? 'active' : ''}`}
                                onClick={() => handleVideoModeToggle('upload')}
                            >
                                Upload
                            </button>
                            <button
                                type="button"
                                className={`mode-toggle-btn ${videoMode === 'url' ? 'active' : ''}`}
                                onClick={() => handleVideoModeToggle('url')}
                            >
                                URL
                            </button>
                        </div>

                        {videoMode === 'upload' ? (
                            <>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoFileChange}
                                    className="sidebar-file-input"
                                    id="videoUpload"
                                />
                                <label htmlFor="videoUpload" className="sidebar-upload-btn">
                                    {videoFile ? '✓ ' + videoFile.name.substring(0, 15) + '...' : 'upload video'}
                                </label>
                            </>
                        ) : (
                            <input
                                type="url"
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                className="sidebar-input"
                                placeholder="YouTube or Vimeo URL"
                            />
                        )}

                        {/* Video Preview */}
                        {(videoFile || formData.videoUrl) && (
                            <div className="video-preview">
                                <div className="preview-label">Preview:</div>
                                <MediaCard 
                                    src={videoFile ? URL.createObjectURL(videoFile) : formData.videoUrl}
                                    alt="Video preview"
                                />
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section sidebar-publish">
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