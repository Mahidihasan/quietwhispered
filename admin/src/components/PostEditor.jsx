import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createEntry, updateEntry, uploadImage } from '../shared/services/journalService';
import MediaCard from '../shared/components/MediaCard.jsx';
import ThinkerLoader from '../shared/components/ThinkerLoader';
import EntryPreview from '../shared/components/EntryPreview.jsx';
import Icon from './Icon';
import { resolvePostDate } from '../shared/utils/dateUtils';
import { FiCalendar, FiMapPin, FiTag, FiImage, FiSettings, FiVideo, FiShare2, FiCheck, FiX, FiEye, FiEdit, FiMusic, FiChevronDown, FiChevronUp, FiType, FiMenu, FiInfo, FiBook, FiGrid, FiFileText, FiHeart, FiBookmark, FiSave, FiDroplet, FiSmile } from 'react-icons/fi';
import LiveMarkdownEditor from './LiveMarkdownEditor';
import { insertImage } from '../shared/utils/markdownUtils';

const MOOD_OPTIONS = [
  { icon: '😊', label: 'Happy' },
  { icon: '☕', label: 'Calm' },
  { icon: '🌙', label: 'Peaceful' },
  { icon: '⚡', label: 'Excited' },
  { icon: '⭐', label: 'Inspired' },
  { icon: '❤️', label: 'Loved' },
  { icon: '🌅', label: 'Hopeful' },
  { icon: '🎁', label: 'Grateful' },
  { icon: '☕', label: 'Relaxed' },
  { icon: '🌙', label: 'Lonely' },
  { icon: '😴', label: 'Tired' },
  { icon: '☁️', label: 'Sad' },
  { icon: '🔥', label: 'Angry' },
  { icon: '⚠️', label: 'Anxious' },
  { icon: '❓', label: 'Confused' },
  { icon: '📚', label: 'Nostalgic' },
  { icon: '📚', label: 'Overwhelmed' },
  { icon: '📈', label: 'Motivated' }
];

const WEATHER_OPTIONS = [
  { icon: '☀️', label: 'Sunny', value: 'sunny' },
  { icon: '☁️', label: 'Cloudy', value: 'cloudy' },
  { icon: '🌧️', label: 'Rain', value: 'rain' },
  { icon: '⛈️', label: 'Storm', value: 'storm' },
  { icon: '❄️', label: 'Snow', value: 'snow' },
  { icon: '💨', label: 'Windy', value: 'windy' },
  { icon: '🌫️', label: 'Fog', value: 'fog' },
  { icon: '🌙', label: 'Night', value: 'night' }
];

const SLEEP_OPTIONS = [
  { label: 'Very Good', value: 'very-good' },
  { label: 'Good', value: 'good' },
  { label: 'Normal', value: 'normal' },
  { label: 'Poor', value: 'poor' },
  { label: 'Very Poor', value: 'very-poor' }
];

const HEADING_FONT_OPTIONS = [
  { value: 'Special Elite', label: 'Special Elite (Typewriter)' },
  { value: 'Caveat', label: 'Caveat (Handwritten)' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville (Cozy)' },
  { value: 'AdorNoirrit', label: 'AdorNoirrit (বাংলা)' },
  { value: 'Galada', label: 'Galada (বাংলা হাতের লেখা)' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Merriweather', label: 'Merriweather (Warm)' },
];

const BODY_FONT_OPTIONS = [
  { value: 'Libre Baskerville', label: 'Libre Baskerville (Cozy)' },
  { value: 'Special Elite', label: 'Special Elite (Typewriter)' },
  { value: 'Caveat', label: 'Caveat (Handwritten)' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Merriweather', label: 'Merriweather (Warm)' },
  { value: 'Lora', label: 'Lora (Elegant)' },
  { value: 'Source Serif 4', label: 'Source Serif (Readable)' },
  { value: 'AdorNoirrit', label: 'AdorNoirrit (বাংলা)' },
  { value: 'Galada', label: 'Galada (বাংলা হাতের লেখা)' },
];

const TEMPLATE_OPTIONS = [
  { label: 'Daily Reflection', content: "### Daily Reflection\n\n**Focus of the day:**\n\n**What went well:**\n\n**What could be improved:**\n\n**One thing I learned today:**" },
  { label: 'Gratitude Journal', content: "### Gratitude Journal\n\n**3 things I am grateful for today:**\n1. \n2. \n3. \n\n**Why these things made me happy:**" },
  { label: 'Dream Journal', content: "### Dream Journal\n\n**Describe the dream:**\n\n**Emotions felt in the dream:**\n\n**Key symbols or objects:**" },
  { label: 'Travel Journal', content: "### Travel Journal\n\n**Location & Weather:**\n\n**Highlights of the day:**\n\n**Food/places visited:**\n\n**Best memory:**" },
  { label: 'Daily Log', content: "### Daily Log\n\n**Tasks completed:**\n\n**Meetings/Events:**\n\n**Notes/Thoughts:**" },
  { label: 'Letter to Future Me', content: "### Letter to Future Me\n\n*Write a letter to yourself 1, 5, or 10 years from now...*" }
];

const TEXTURE_OPTIONS = [
  { value: 'none', label: 'None' }, { value: 'vellum', label: 'Vellum' },
  { value: 'linen', label: 'Linen' }, { value: 'canvas', label: 'Canvas' },
  { value: 'lines', label: 'Lines' }, { value: 'vintage', label: 'Vintage' },
  { value: 'cotton', label: 'Cotton' }, { value: 'coffee', label: 'Coffee Stain' },
  { value: 'tears', label: 'Tears' }, { value: 'worn', label: 'Worn' },
  { value: 'lace', label: 'Lace' }, { value: 'fibers', label: 'Fibers' },
  { value: 'wax', label: 'Wax Seal' }, { value: 'stucco', label: 'Stucco' },
  { value: 'grain', label: 'Grain' },
];

const FRAME_OPTIONS = [
  { value: 'polaroid', label: 'Polaroid' }, { value: 'border', label: 'Border' },
  { value: 'double', label: 'Double' }, { value: 'shadow', label: 'Shadow' },
  { value: 'vintage', label: 'Vintage' }, { value: 'minimal', label: 'Minimal' },
  { value: 'rounded', label: 'Rounded' }, { value: 'filmstrip', label: 'Filmstrip' },
];

const FRAME_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }, { value: 'xl', label: 'Full width' },
];

// ── Sidebar Accordion Section Component ──
const AccordionSection = memo(({ icon, title, isOpen, onToggle, children }) => (
  <div className={`sidebar-accordion ${isOpen ? 'is-open' : ''}`}>
    <button type="button" className="sidebar-accordion-header" onClick={onToggle}>
      <span className="sidebar-accordion-header-left">
        <span className="sidebar-accordion-icon">{icon}</span>
        <span className="sidebar-accordion-title">{title}</span>
      </span>
      <span className={`sidebar-accordion-arrow ${isOpen ? 'rotated' : ''}`}>
        <FiChevronDown size={12} />
      </span>
    </button>
    {isOpen && <div className="sidebar-accordion-body">{children}</div>}
  </div>
));

const PostEditor = ({ post, mediaSettings, onClose, onSave, restoreBackup = true }) => {
    const [formData, setFormData] = useState({
        title: '', content: '', tags: [], location: '',
        date: new Date().toISOString().split('T')[0], isPublished: true,
        coverImage: '', youtubeEmbedUrl: '', spotifyUrl: '', customAudioUrl: '',
        mood: '', imageUrls: [], lineHeight: 1.75, paperTexture: 'none',
        paperColor: '#f8f5f0', dividerColor: '#c8c4bc', mediaFrame: 'polaroid',
        frameSize: 'md', weather: '', energyLevel: 3, isFavorite: false,
        isPinned: false, privacy: 'public', sleepQuality: ''
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [selectedTitleFont, setSelectedTitleFont] = useState('Caveat');
    const [selectedBodyFont, setSelectedBodyFont] = useState('Libre Baskerville');
    const [markColor, setMarkColor] = useState('#d7c7a5');
    const [fontColor, setFontColor] = useState('#1f1b16');
    const [titleSize, setTitleSize] = useState('32');
    const [bodySize, setBodySize] = useState('18');
    const [lineHeight, setLineHeight] = useState('1.75');
    const [bulletStyle, setBulletStyle] = useState('default');
    const [quoteStyle, setQuoteStyle] = useState('minimal');
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [activeTab, setActiveTab] = useState('write');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarSection, setSidebarSection] = useState(null); // which section is open
    const autoSaveRef = useRef(null);
    const dropRef = useRef(null);

    // Open sidebar by default on desktop (>= 768px), closed on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [audioFile, setAudioFile] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
    const [isAudioUploading, setIsAudioUploading] = useState(false);
    const [audioUploadProgress, setAudioUploadProgress] = useState(0);

    // Handle image upload from toolbar - inserts at saved cursor position
    useEffect(() => {
        const handleToolbarImageSelect = async (e) => {
            const file = e.detail?.file;
            if (!file) return;
            
            try {
                setIsUploading(true);
                setUploadProgress(0);
                const url = await uploadImage(file, { folder: 'journal-images', onProgress: setUploadProgress });
                setImageUrls(prev => (prev.includes(url) ? prev : [...prev, url]));
                
                // Insert at the cursor position saved when the toolbar button was clicked
                const cursorPos = e.detail?.cursorPosition ?? 0;
                const result = insertImage(formData.content, cursorPos, url, 'Image');
                setFormData(prev => ({ ...prev, content: result?.newText || (prev.content + `\n[image:${url}]\n`) }));
            } catch (err) {
                setError(`Error uploading image: ${err.message || 'Unknown error'}`);
            } finally {
                setIsUploading(false);
                setUploadProgress(0);
            }
        };

        document.addEventListener('toolbar-image-select', handleToolbarImageSelect);
        return () => document.removeEventListener('toolbar-image-select', handleToolbarImageSelect);
    }, [formData.content]);

    const wordCount = (formData.content || '').trim() ? (formData.content || '').trim().split(/\s+/).length : 0;
    const charCount = (formData.content || '').length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                title: post.title || '',
                content: post.content || '',
                date: resolvePostDate(post) ? resolvePostDate(post).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                coverImage: post.media || post.imageUrls?.[0] || '',
                youtubeEmbedUrl: post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '') || '',
                customAudioUrl: post.customAudioUrl || '', mood: post.mood || '',
                imageUrls: post.imageUrls || [], lineHeight: Number(post.lineHeight) || 1.75,
                paperTexture: post.paperTexture || 'none', paperColor: post.paperColor || '#f8f5f0',
                dividerColor: post.dividerColor || '#c8c4bc', mediaFrame: post.mediaFrame || 'polaroid',
                frameSize: post.frameSize || 'md', weather: post.weather || '',
                energyLevel: post.energyLevel !== undefined ? Number(post.energyLevel) : 3,
                isFavorite: post.isFavorite || false, isPinned: post.isPinned || false,
                privacy: post.privacy || (post.isPublished === false ? 'draft' : 'public'),
                sleepQuality: post.sleepQuality || ''
            });
            setImageUrls(post.imageUrls || []);
            setTitleSize(String(post.titleSize || 32));
            setBodySize(String(post.bodySize || 18));
            setLineHeight(String(Number(post.lineHeight) || 1.75));
            if (post.titleFont) setSelectedTitleFont(post.titleFont);
            else if (post.font) setSelectedTitleFont(post.font);
            if (post.bodyFont) setSelectedBodyFont(post.bodyFont);
            else setSelectedBodyFont('Libre Baskerville');
        }
    }, [post]);

    useEffect(() => {
        if (!formData.title && !formData.content) return;
        const saveBackup = () => {
            localStorage.setItem('journal_draft_backup', JSON.stringify({
                title: formData.title, content: formData.content,
                tags: formData.tags, location: formData.location, mood: formData.mood,
                titleSize, bodySize, lineHeight, titleFont: selectedTitleFont, bodyFont: selectedBodyFont,
                weather: formData.weather, energyLevel: formData.energyLevel,
                isFavorite: formData.isFavorite, isPinned: formData.isPinned,
                privacy: formData.privacy, sleepQuality: formData.sleepQuality
            }));
            setLastSaved(new Date());
        };
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(saveBackup, 10000);
        return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
    }, [formData.title, formData.content, formData.tags, formData.location, formData.mood, titleSize, bodySize, lineHeight, selectedTitleFont, selectedBodyFont, formData.weather, formData.energyLevel, formData.isFavorite, formData.isPinned, formData.privacy, formData.sleepQuality]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTagAdd = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput('');
        }
    };
    const handleTagRemove = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    const handleCoverFileChange = (e) => setCoverFile(e.target.files?.[0] || null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let uploadedCover = formData.coverImage;
            if (coverFile) {
                setIsUploading(true); setUploadProgress(0);
                uploadedCover = await uploadImage(coverFile, { folder: 'journal-images', onProgress: setUploadProgress });
                setIsUploading(false);
            }
            let uploadedAudio = formData.customAudioUrl || '';
            if (audioFile) {
                setIsAudioUploading(true); setAudioUploadProgress(0);
                uploadedAudio = await uploadImage(audioFile, { folder: 'journal-audio', onProgress: setAudioUploadProgress });
                setIsAudioUploading(false);
            }
            const uniqueImages = new Set(imageUrls);
            if (uploadedCover) uniqueImages.add(uploadedCover);
            const finalImageUrls = Array.from(uniqueImages);
            const youtubeEmbedUrl = formData.youtubeEmbedUrl?.trim() || '';
            const postType = youtubeEmbedUrl ? 'video' : uploadedCover ? 'image' : 'story';
            const mediaUrl = youtubeEmbedUrl || uploadedCover || '';
            // Extract YouTube URL from markdown content if not already in form data
            let finalYoutubeEmbedUrl = youtubeEmbedUrl;
            if (!finalYoutubeEmbedUrl && formData.content) {
                // Look for [embed:youtube-url] or [video:youtube-url] patterns
                const embedMatch = formData.content.match(/\[embed:([^\]]+)\]/);
                const videoMatch = formData.content.match(/\[video:([^\]]+)\]/);
                if (embedMatch) {
                    finalYoutubeEmbedUrl = embedMatch[1].trim();
                } else if (videoMatch) {
                    finalYoutubeEmbedUrl = videoMatch[1].trim();
                }
            }

            const payload = {
                title: formData.title || '', content: formData.content || '', tags: formData.tags || [],
                location: formData.location, date: formData.date, isPublished: formData.privacy === 'public',
                mood: formData.mood || null, type: finalYoutubeEmbedUrl ? 'video' : postType, media: finalYoutubeEmbedUrl || mediaUrl,
                imageUrls: finalImageUrls, youtubeEmbedUrl: finalYoutubeEmbedUrl, spotifyUrl: formData.spotifyUrl?.trim() || '',
                customAudioUrl: uploadedAudio, titleSize: Number(titleSize) || 32,
                bodySize: Number(bodySize) || 18, lineHeight: Number(lineHeight) || 1.75,
                titleFont: selectedTitleFont, bodyFont: selectedBodyFont, font: selectedTitleFont,
                paperTexture: formData.paperTexture || 'none', paperColor: formData.paperColor || '#f8f5f0',
                dividerColor: formData.dividerColor || '#c8c4bc', mediaFrame: formData.mediaFrame || 'polaroid',
                frameSize: formData.frameSize || 'md', weather: formData.weather || '',
                energyLevel: Number(formData.energyLevel) || 3, isFavorite: !!formData.isFavorite,
                isPinned: !!formData.isPinned, privacy: formData.privacy || 'public',
                sleepQuality: formData.sleepQuality || '',
                bulletStyle: bulletStyle || 'default',
                quoteStyle: quoteStyle || 'minimal'
            };
            if (post) await updateEntry(post._id, payload);
            else await createEntry(payload);
            onSave();
        } catch (err) {
            setError(err.message || 'Error saving post');
        } finally { setIsUploading(false); setLoading(false); }
    };

    const handleMoodSelect = (mood) => {
        const currentMoods = formData.mood ? formData.mood.split(',').map(m => m.trim().toLowerCase()) : [];
        const moodLower = mood.toLowerCase();
        setFormData(prev => ({ ...prev, mood: currentMoods.includes(moodLower) ? currentMoods.filter(m => m !== moodLower).join(', ') : [...currentMoods, moodLower].join(', ') }));
    };

    const buildShareUrl = (postId) => {
        if (!postId || typeof window === 'undefined') return '';
        return new URL(`/post/${postId}`, window.location.origin).href;
    };

    const handleCopyShareUrl = async () => {
        if (!post?._id) return;
        const url = buildShareUrl(post._id);
        try { if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(url); return; } } catch (err) {}
        try {
            const el = document.createElement('textarea');
            el.value = url; el.setAttribute('readonly', '');
            el.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(el); el.select();
            document.execCommand('copy'); document.body.removeChild(el);
        } catch (err) { setError('Could not copy URL.'); }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('inlineImageUpload');
            if (input) { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; handleInlineImageUpload({ target: input }); }
        }
    };

    const handleInlineImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true); setUploadProgress(0);
            const url = await uploadImage(file, { folder: 'journal-images', onProgress: setUploadProgress });
            setImageUrls(prev => (prev.includes(url) ? prev : [...prev, url]));
            // Use [image:url] format so it renders as MediaCard (polaroid) instead of plain markdown image
            setFormData(prev => ({ ...prev, content: prev.content + `\n[image:${url}]\n` }));
        } catch (err) {
            setError(`Error uploading image: ${err.message || 'Unknown error'}`);
        } finally { setIsUploading(false); setUploadProgress(0); event.target.value = ''; }
    };

    // Restore backup on mount
    useEffect(() => {
        if (!restoreBackup) return; // Skip restoration if explicitly disabled
        
        try {
            const backup = localStorage.getItem('journal_draft_backup');
            if (backup && !post) {
                const data = JSON.parse(backup);
                if (data.content && !formData.content) {
                    setFormData(prev => ({ ...prev, content: data.content, title: data.title || prev.title, tags: data.tags || prev.tags, location: data.location || prev.location, mood: data.mood || prev.mood }));
                    if (data.titleSize) setTitleSize(String(data.titleSize));
                    if (data.bodySize) setBodySize(String(data.bodySize));
                    if (data.lineHeight) setLineHeight(String(data.lineHeight));
                    if (data.titleFont) setSelectedTitleFont(data.titleFont);
                    if (data.bodyFont) setSelectedBodyFont(data.bodyFont);
                }
            }
        } catch (err) {}
    }, [restoreBackup, post]);

    const insertTemplate = (template) => {
        setFormData(prev => ({ ...prev, content: prev.content ? `${prev.content}\n\n${template.content}` : template.content }));
    };

    // ── Toggle sidebar section (only one at a time) ──
    const toggleSection = useCallback((section) => {
        setSidebarSection(prev => prev === section ? null : section);
    }, []);

    return (
        <div className="post-editor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="post-editor-modal" onClick={(e) => e.stopPropagation()}>
                {/* ── Header Bar ── */}
                <div className="post-editor-header">
                    <div className="post-editor-header-left">
                        <button 
                            type="button" 
                            className="header-btn sidebar-toggle-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                        >
                            <FiMenu size={16} />
                        </button>
                    </div>
                    <div className="post-editor-header-center">
                        <span className="editor-title-label">{post ? 'Edit Entry' : 'New Entry'}</span>
                    </div>
                    <div className="post-editor-header-right">
                        <button type="button" className="header-btn" onClick={onClose} title="Close"><FiX size={16} /></button>
                    </div>
                </div>

                {error && <div className="editor-error"><p><Icon name="alertTriangle" size="sm" /> {error}</p></div>}

                <form onSubmit={handleSubmit} className="post-editor-form">
                    {/* ── Main Content Area ── */}
                    <div className="post-editor-main">
                        {activeTab === 'write' && (
                            <div className="post-editor-write">
                                <div className="writing-canvas">
                                    <input type="text" name="title" value={formData.title} onChange={handleChange}
                                        className="writing-title" placeholder="Your story begins with a title..."
                                        style={{ fontSize: `${Number(titleSize) || 32}px`, fontFamily: `'${selectedTitleFont}', ${selectedTitleFont === 'Caveat' ? 'cursive' : selectedTitleFont === 'Special Elite' ? 'monospace' : 'serif'}` }}
                                        required />
                                    <LiveMarkdownEditor
                                        value={formData.content}
                                        onChange={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                                        placeholder="Write freely. Your thoughts, your voice..."
                                        bulletStyle={bulletStyle}
                                        onBulletStyleChange={setBulletStyle}
                                        quoteStyle={quoteStyle}
                                        onQuoteStyleChange={setQuoteStyle}
                                        dividerStyle="thin"
                                        checkboxStyle="square"
                                        linkStyle="underline"
                                        fontFamily={`'${selectedBodyFont}', ${selectedBodyFont === 'Libre Baskerville' || selectedBodyFont === 'Georgia' || selectedBodyFont === 'Merriweather' || selectedBodyFont === 'Lora' || selectedBodyFont === 'Source Serif 4' ? 'serif' : selectedBodyFont === 'Caveat' ? 'cursive' : selectedBodyFont === 'Special Elite' ? 'monospace' : 'serif'}`}
                                        fontSize={Number(bodySize) || 18}
                                        lineHeight={Number(lineHeight) || 1.75}
                                        textColor={fontColor}
                                        highlightColor={markColor}
                                        textAlign="left"
                                        onFontFamilyChange={(font) => setSelectedBodyFont(font === "'Special Elite', monospace" ? 'Special Elite' : font === "'Caveat', cursive" ? 'Caveat' : font)}
                                        onFontSizeChange={(size) => setBodySize(String(size))}
                                        onLineHeightChange={(lh) => setLineHeight(String(lh))}
                                        onTextColorChange={setFontColor}
                                        onHighlightColorChange={setMarkColor}
                                    />
                                </div>
                            </div>
                        )}
                        {activeTab === 'preview' && (
                            <div className="post-editor-preview">
                                {formData.content ? (
                                    <div className="preview-content-wrapper">
                                        <EntryPreview post={{ ...formData, titleSize, bodySize, lineHeight, titleFont: selectedTitleFont, bodyFont: selectedBodyFont, font: selectedTitleFont, type: formData.youtubeEmbedUrl ? 'video' : (coverFile || formData.coverImage) ? 'image' : 'story', customAudioUrl: audioFile ? audioPreviewUrl : (formData.customAudioUrl || '') }} mediaSettings={mediaSettings} />
                                    </div>
                                ) : (
                                    <div className="preview-empty">
                                        <span className="preview-empty-icon"><Icon name="pen" size="xl" /></span>
                                        <p>Write something to see a preview</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <aside className={`post-editor-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
                        {/* Document Info */}
                        <AccordionSection 
                            icon={<FiInfo size={14} />} 
                            title="Document" 
                            isOpen={sidebarSection === 'document'} 
                            onToggle={() => toggleSection('document')}
                        >
                            <div className="sidebar-field-row">
                                <label>Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} />
                            </div>
                            <div className="sidebar-field-row">
                                <label>Privacy</label>
                                <div className="privacy-chips-row">
                                    {['public', 'private', 'draft', 'hidden'].map(p => (
                                        <button key={p} type="button" className={`privacy-chip-sm ${formData.privacy === p ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, privacy: p }))}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Tags</label>
                                <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." className="tag-input-sm"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagAdd(); } }} />
                                    <button type="button" className="tag-add-btn" onClick={handleTagAdd}>+</button>
                                </div>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="tags-row" style={{ marginTop: 4 }}>
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="tag-pill-sm">#{tag} <button type="button" onClick={() => handleTagRemove(tag)}><FiX size={10} /></button></span>
                                    ))}
                                </div>
                            )}
                            <div className="sidebar-field-row">
                                <label>Flags</label>
                                <div className="flag-row">
                                    <button type="button" className={`flag-btn-sm ${formData.isFavorite ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}>Favorite</button>
                                    <button type="button" className={`flag-btn-sm ${formData.isPinned ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}>Pinned</button>
                                </div>
                            </div>
                        </AccordionSection>

                        {/* Mood & Context */}
                        <AccordionSection 
                            icon={<FiSmile size={14} />} 
                            title="Mood & Context" 
                            isOpen={sidebarSection === 'mood'} 
                            onToggle={() => toggleSection('mood')}
                        >
                            <div className="sidebar-field-row">
                                <label>Mood</label>
                                <div className="mood-chips-row">
                                    {MOOD_OPTIONS.slice(0, 9).map(m => {
                                        const isSelected = formData.mood?.toLowerCase().split(',').map(x => x.trim()).includes(m.label.toLowerCase());
                                        return (
                                            <button key={m.label} type="button" className={`mood-chip-sm ${isSelected ? 'active' : ''}`} onClick={() => handleMoodSelect(m.label.toLowerCase())} title={m.label}>
                                                {m.icon}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Weather</label>
                                <div className="weather-chips-row">
                                    {WEATHER_OPTIONS.map(w => (
                                        <button key={w.value} type="button" className={`weather-chip-sm ${formData.weather === w.value ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, weather: prev.weather === w.value ? '' : w.value }))} title={w.label}>
                                            {w.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Energy</label>
                                <div className="energy-row">
                                    {[1,2,3,4,5].map(val => (
                                        <button key={val} type="button" className={`energy-dot ${formData.energyLevel >= val ? 'filled' : ''}`} onClick={() => setFormData(prev => ({ ...prev, energyLevel: val }))} />
                                    ))}
                                </div>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Sleep</label>
                                <select name="sleepQuality" value={formData.sleepQuality || ''} onChange={handleChange}>
                                    <option value="">Select...</option>
                                    {SLEEP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Where?" />
                            </div>
                        </AccordionSection>

                        {/* Typography */}
                        <AccordionSection 
                            icon={<FiType size={14} />} 
                            title="Typography" 
                            isOpen={sidebarSection === 'typography'} 
                            onToggle={() => toggleSection('typography')}
                        >
                            <div className="sidebar-field-row">
                                <label>Title font</label>
                                <select value={selectedTitleFont} onChange={(e) => setSelectedTitleFont(e.target.value)}>
                                    {HEADING_FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Body font</label>
                                <select value={selectedBodyFont} onChange={(e) => setSelectedBodyFont(e.target.value)}>
                                    {BODY_FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Title size</label>
                                <select value={titleSize} onChange={(e) => setTitleSize(e.target.value)}>{[20,24,28,32,36,40,44,48].map(s => <option key={s} value={s}>{s}px</option>)}</select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Body size</label>
                                <select value={bodySize} onChange={(e) => setBodySize(e.target.value)}>{[14,15,16,17,18,19,20,21,22,24].map(s => <option key={s} value={s}>{s}px</option>)}</select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Spacing</label>
                                <select value={lineHeight} onChange={(e) => setLineHeight(e.target.value)}>{[1.2,1.4,1.6,1.75,2,2.2,2.4].map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </div>
                        </AccordionSection>

                        {/* Appearance */}
                        <AccordionSection 
                            icon={<FiDroplet size={14} />} 
                            title="Appearance" 
                            isOpen={sidebarSection === 'appearance'} 
                            onToggle={() => toggleSection('appearance')}
                        >
                            <div className="sidebar-field-row">
                                <label>Texture</label>
                                <select value={formData.paperTexture} onChange={(e) => setFormData(prev => ({ ...prev, paperTexture: e.target.value }))}>
                                    {TEXTURE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Paper color</label>
                                <input type="color" value={formData.paperColor} onChange={(e) => setFormData(prev => ({ ...prev, paperColor: e.target.value }))} style={{ width: '100%', height: '32px', padding: 0, border: '1px solid var(--cg-light)', cursor: 'pointer', borderRadius: '4px' }} />
                            </div>
                            <div className="sidebar-field-row">
                                <label>Frame</label>
                                <select name="mediaFrame" value={formData.mediaFrame} onChange={handleChange}>
                                    {FRAME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="sidebar-field-row">
                                <label>Frame size</label>
                                <select name="frameSize" value={formData.frameSize} onChange={handleChange}>
                                    {FRAME_SIZE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </AccordionSection>

                        {/* Media */}
                        <AccordionSection 
                            icon={<FiImage size={14} />} 
                            title="Media" 
                            isOpen={sidebarSection === 'media'} 
                            onToggle={() => toggleSection('media')}
                        >
                            <div className="sidebar-field-row">
                                <label>Cover</label>
                                <div style={{ flex: 1 }}>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverFileChange} className="file-input-sm" id="coverUpload" />
                                    <label htmlFor="coverUpload" className="file-label-sm">{coverFile ? 'Image set' : 'Upload cover...'}</label>
                                    {isUploading && <div className="upload-progress-sm">{uploadProgress}%</div>}
                                </div>
                            </div>
                            <div className="sidebar-field-row">
                                <label>YouTube</label>
                                <input type="url" name="youtubeEmbedUrl" value={formData.youtubeEmbedUrl} onChange={handleChange} placeholder="https://youtube.com/..." className="url-input-sm" />
                            </div>
                            <div className="sidebar-field-row">
                                <label>Spotify</label>
                                <input type="url" name="spotifyUrl" value={formData.spotifyUrl} onChange={handleChange} placeholder="https://open.spotify.com/..." className="url-input-sm" />
                            </div>
                            <div className="sidebar-field-row">
                                <label>Audio</label>
                                <input type="file" accept="audio/*" className="file-input-sm" id="customAudioUpload" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); setAudioPreviewUrl(URL.createObjectURL(f)); } }} />
                                <label htmlFor="customAudioUpload" className="file-label-sm">{audioFile ? audioFile.name : 'Upload audio...'}</label>
                                {isAudioUploading && <div className="upload-progress-sm">{audioUploadProgress}%</div>}
                            </div>
                            <div className="sidebar-field-row">
                                <label>Inline image</label>
                                <div style={{ flex: 1 }}>
                                    <input type="file" accept="image/*" className="file-input-sm" id="inlineImageUpload" onChange={handleInlineImageUpload} />
                                    <label htmlFor="inlineImageUpload" className="file-label-sm">Insert image</label>
                                </div>
                            </div>
                        </AccordionSection>

                        {/* Templates */}
                        <AccordionSection 
                            icon={<FiFileText size={14} />} 
                            title="Templates" 
                            isOpen={sidebarSection === 'templates'} 
                            onToggle={() => toggleSection('templates')}
                        >
                            <div className="sidebar-field-row">
                                <label>Select template</label>
                                <select className="template-select" defaultValue="" onChange={(e) => { if (e.target.value) { const t = TEMPLATE_OPTIONS.find(opt => opt.label === e.target.value); if (t) insertTemplate(t); e.target.value = ''; } }}>
                                    <option value="" disabled>Choose a template...</option>
                                    {TEMPLATE_OPTIONS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                            </div>
                        </AccordionSection>

                        {/* Share */}
                        {post?._id && (
                            <AccordionSection 
                                icon={<FiShare2 size={14} />} 
                                title="Share" 
                                isOpen={sidebarSection === 'share'} 
                                onToggle={() => toggleSection('share')}
                            >
                                <div className="sidebar-field-row">
                                    <label>Share link</label>
                                    <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                                        <input type="text" readOnly className="url-input-sm" value={buildShareUrl(post._id)} onFocus={(e) => e.target.select()} style={{ flex: 1, fontSize: '11px' }} />
                                        <button type="button" className="action-btn-sm" onClick={handleCopyShareUrl}>Copy</button>
                                    </div>
                                </div>
                            </AccordionSection>
                        )}

                        {/* ── Sidebar Bottom Actions ── */}
                        <div className="sidebar-actions-bar">
                            <button type="button" className="action-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
                            <button type="submit" className="action-btn-save" disabled={loading} aria-busy={loading}>
                                {loading ? <span className="btn-loading"><ThinkerLoader /> Saving</span> : (post ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </aside>
                </form>
            </div>
        </div>
    );
};

export default memo(PostEditor);