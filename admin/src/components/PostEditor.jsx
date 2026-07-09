import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEntry, updateEntry, uploadImage } from '../shared/services/journalService';
import MediaCard from '../shared/components/MediaCard.jsx';
import ThinkerLoader from '../shared/components/ThinkerLoader';
import EntryPreview from '../shared/components/EntryPreview.jsx';
import Icon from './Icon';
import { resolvePostDate } from '../shared/utils/dateUtils';
import { FiCalendar, FiSmile, FiMapPin, FiTag, FiImage, FiSettings, FiVideo, FiShare2, FiCheck, FiX, FiEye, FiEdit, FiBold, FiItalic, FiUnderline, FiChevronDown, FiType, FiDroplet } from 'react-icons/fi';


const MOOD_OPTIONS = [
  { icon: '😊', label: 'Happy' },
  { icon: '😌', label: 'Calm' },
  { icon: '☮️', label: 'Peaceful' },
  { icon: '🤩', label: 'Excited' },
  { icon: '✨', label: 'Inspired' },
  { icon: '❤️', label: 'Loved' },
  { icon: '🤞', label: 'Hopeful' },
  { icon: '🙏', label: 'Grateful' },
  { icon: '🛀', label: 'Relaxed' },
  { icon: '🏚️', label: 'Lonely' },
  { icon: '🥱', label: 'Tired' },
  { icon: '😢', label: 'Sad' },
  { icon: '😠', label: 'Angry' },
  { icon: '😰', label: 'Anxious' },
  { icon: '😕', label: 'Confused' },
  { icon: '🎞️', label: 'Nostalgic' },
  { icon: '🤯', label: 'Overwhelmed' },
  { icon: '💪', label: 'Motivated' }
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

const TEMPLATE_OPTIONS = [
  { label: 'Daily Reflection', content: "### Daily Reflection\n\n**Focus of the day:**\n\n**What went well:**\n\n**What could be improved:**\n\n**One thing I learned today:**" },
  { label: 'Gratitude Journal', content: "### Gratitude Journal\n\n**3 things I am grateful for today:**\n1. \n2. \n3. \n\n**Why these things made me happy:**" },
  { label: 'Dream Journal', content: "### Dream Journal\n\n**Describe the dream:**\n\n**Emotions felt in the dream:**\n\n**Key symbols or objects:**" },
  { label: 'Travel Journal', content: "### Travel Journal\n\n**Location & Weather:**\n\n**Highlights of the day:**\n\n**Food/places visited:**\n\n**Best memory:**" },
  { label: 'Daily Log', content: "### Daily Log\n\n**Tasks completed:**\n\n**Meetings/Events:**\n\n**Notes/Thoughts:**" },
  { label: 'Letter to Future Me', content: "### Letter to Future Me\n\n*Write a letter to yourself 1, 5, or 10 years from now...*" }
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

const MARK_COLORS = [
  { value: '#d7c7a5', label: 'Warm Sand', group: 'warm' },
  { value: '#c9b99a', label: 'Golden Beige', group: 'warm' },
  { value: '#e8d5b7', label: 'Creamy', group: 'warm' },
  { value: '#d4a574', label: 'Caramel', group: 'coffee' },
  { value: '#b8956a', label: 'Coffee Latte', group: 'coffee' },
  { value: '#a67c52', label: 'Mocha', group: 'coffee' },
  { value: '#8b6f47', label: 'Espresso', group: 'coffee' },
  { value: '#6b4c3b', label: 'Dark Roast', group: 'coffee' },
  { value: '#e3c9b0', label: 'Warm Cocoa', group: 'cozy' },
  { value: '#d4b8a0', label: 'Soft Bisque', group: 'cozy' },
  { value: '#c4a882', label: 'Toasted Almond', group: 'cozy' },
  { value: '#b89a7a', label: 'Cozy Taupe', group: 'cozy' },
  { value: '#f0dbd0', label: 'Rose Dust', group: 'cozy' },
  { value: '#e6ccb2', label: 'Parchment', group: 'cozy' },
  { value: '#ddc0a0', label: 'Honey Wheat', group: 'warm' },
  { value: '#cdb79e', label: 'Warm Stone', group: 'warm' },
];

const PostEditor = ({ post, mediaSettings, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: [],
        location: '',
        date: new Date().toISOString().split('T')[0],
        isPublished: true,
        coverImage: '',
        youtubeEmbedUrl: '',
        spotifyUrl: '',
        mood: '', // will be comma separated string of moods
        imageUrls: [],
        lineHeight: 1.75,
        paperTexture: 'none',
        paperColor: '#f8f5f0',
        dividerColor: '#c8c4bc',
        mediaFrame: 'polaroid',
        frameSize: 'md',
        weather: '',
        energyLevel: 3,
        isFavorite: false,
        isPinned: false,
        privacy: 'public',
        sleepQuality: ''
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
    const [savedImageCaption] = useState('');
    const [isImageCaptionSaved] = useState(false);
    const [lineHeight, setLineHeight] = useState('1.75');
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [activeTab, setActiveTab] = useState('write');
    const [sidebarTab, setSidebarTab] = useState('meta');
    const [sidebarGroups, setSidebarGroups] = useState({
        general: false,
        locationTags: false,
        privacyPublishing: false,
        media: false,
        advanced: false
    });
    const toggleSidebarGroup = (group) => setSidebarGroups(prev => ({ ...prev, [group]: !prev[group] }));
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showMarkPicker, setShowMarkPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showInsertMenu, setShowInsertMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
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
        { value: 'canvas', label: 'Canvas' },
        { value: 'lines', label: 'Lines' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'cotton', label: 'Cotton' },
        { value: 'coffee', label: 'Coffee Stain' },
        { value: 'tears', label: 'Tears' },
        { value: 'worn', label: 'Worn' },
        { value: 'lace', label: 'Lace' },
        { value: 'fibers', label: 'Fibers' },
        { value: 'wax', label: 'Wax Seal' },
        { value: 'stucco', label: 'Stucco' },
        { value: 'grain', label: 'Grain' },
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
            if (backupData.titleFont) setSelectedTitleFont(backupData.titleFont);
            if (backupData.bodyFont) setSelectedBodyFont(backupData.bodyFont);
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
                paperColor: post.paperColor || '#f8f5f0',
                dividerColor: post.dividerColor || '#c8c4bc',
                mediaFrame: post.mediaFrame || 'polaroid',
                frameSize: post.frameSize || 'md',
                weather: post.weather || '',
                energyLevel: post.energyLevel !== undefined ? Number(post.energyLevel) : 3,
                isFavorite: post.isFavorite || false,
                isPinned: post.isPinned || false,
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
                titleFont: selectedTitleFont,
                bodyFont: selectedBodyFont,
                weather: formData.weather,
                energyLevel: formData.energyLevel,
                isFavorite: formData.isFavorite,
                isPinned: formData.isPinned,
                privacy: formData.privacy,
                sleepQuality: formData.sleepQuality
            }));
            setLastSaved(new Date());
        };

        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(saveBackup, 10000); // Back up every 10 seconds

        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [formData.title, formData.content, formData.tags, formData.location, formData.mood, titleSize, bodySize, lineHeight, selectedTitleFont, selectedBodyFont, formData.weather, formData.energyLevel, formData.isFavorite, formData.isPinned, formData.privacy, formData.sleepQuality]);

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
                isPublished: formData.privacy === 'public',
                mood: formData.mood || null,
                type: postType,
                media: mediaUrl,
                imageUrls: finalImageUrls,
                youtubeEmbedUrl,
                spotifyUrl: formData.spotifyUrl?.trim() || '',
                titleSize: Number(titleSize) || 32,
                bodySize: Number(bodySize) || 18,
                lineHeight: Number(lineHeight) || 1.75,
                titleFont: selectedTitleFont,
                bodyFont: selectedBodyFont,
                font: selectedTitleFont, // keep backwards compat
                paperTexture: formData.paperTexture || 'none',
                paperColor: formData.paperColor || '#f8f5f0',
                dividerColor: formData.dividerColor || '#c8c4bc',
                mediaFrame: formData.mediaFrame || 'polaroid',
                frameSize: formData.frameSize || 'md',
                weather: formData.weather || '',
                energyLevel: Number(formData.energyLevel) || 3,
                isFavorite: !!formData.isFavorite,
                isPinned: !!formData.isPinned,
                privacy: formData.privacy || 'public',
                sleepQuality: formData.sleepQuality || ''
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

        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'b' || event.key === 'B') {
                event.preventDefault();
                applyBold();
                return;
            }
            if (event.key === 'i' || event.key === 'I') {
                event.preventDefault();
                applyItalic();
                return;
            }
            if (event.key === 'u' || event.key === 'U') {
                event.preventDefault();
                applyUnderline();
                return;
            }
        }

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
        const currentMoods = formData.mood ? formData.mood.split(',').map(m => m.trim().toLowerCase()) : [];
        const moodLower = mood.toLowerCase();
        let nextMoods;
        if (currentMoods.includes(moodLower)) {
            nextMoods = currentMoods.filter(m => m !== moodLower);
        } else {
            nextMoods = [...currentMoods, moodLower];
        }
        setFormData(prev => ({ ...prev, mood: nextMoods.join(', ') }));
    };

    const getMoodIcon = (mood) => {
        const found = MOOD_OPTIONS.find(m => m.label.toLowerCase() === mood?.toLowerCase());
        return found ? found.icon : '😊';
    };

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.toolbar-dropdown') && !e.target.closest('.toolbar-btn')) {
                setShowMarkPicker(false);
                setShowColorPicker(false);
                setShowFontPanel(false);
                setShowTemplates(false);
                setShowInsertMenu(false);
                setShowAlignMenu(false);
                setShowHeadingMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            {showRestoreBackup && (
                <div className="editor-backup-banner">
                    <span className="backup-banner-text">
                        <Icon name="clock" size="sm" /> Unsaved draft found
                    </span>
                    <div className="editor-backup-actions">
                        <button type="button" className="btn-preview" onClick={() => setActiveTab('preview')}>
                            <FiEye size={12} /> Preview
                        </button>
                        <button type="button" className="btn-restore" onClick={handleRestoreBackup}>
                            <FiCheck size={12} /> Restore
                        </button>
                        <button type="button" className="btn-discard" onClick={handleDiscardBackup}>
                            <FiX size={12} /> Discard
                        </button>
                    </div>
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
                                {/* Collapsible Card: General */}
                                <div className={`sidebar-group-card ${sidebarGroups.general ? 'expanded' : 'collapsed'}`}>
                                    <div className="sidebar-group-header" onClick={() => toggleSidebarGroup('general')}>
                                        <span>General Info</span>
                                        <span className="sidebar-group-arrow">{sidebarGroups.general ? '▾' : '▸'}</span>
                                    </div>
                                    {sidebarGroups.general && (
                                        <div className="sidebar-group-body">
                                            <div className="sidebar-section">
                                                <label className="sidebar-label"><FiCalendar /> Date</label>
                                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="sidebar-input" />
                                            </div>

                                            <div className="sidebar-section">
                                                <label className="sidebar-label"><FiSmile /> Mood (Toggle multiple)</label>
                                                <div className="mood-chips-grid">
                                                    {MOOD_OPTIONS.map(m => {
                                                        const isSelected = formData.mood?.toLowerCase().split(',').map(x => x.trim()).includes(m.label.toLowerCase());
                                                        return (
                                                            <button
                                                                key={m.label}
                                                                type="button"
                                                                className={`mood-chip-btn ${isSelected ? 'active' : ''}`}
                                                                onClick={() => handleMoodSelect(m.label.toLowerCase())}
                                                                title={m.label}
                                                            >
                                                                <span className="mood-chip-icon">{m.icon}</span>
                                                                <span className="mood-chip-text">{m.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="sidebar-section">
                                                <label className="sidebar-label">Weather</label>
                                                <div className="weather-chips-grid">
                                                    {WEATHER_OPTIONS.map(w => (
                                                        <button
                                                            key={w.value}
                                                            type="button"
                                                            className={`weather-chip-btn ${formData.weather === w.value ? 'active' : ''}`}
                                                            onClick={() => setFormData(prev => ({ ...prev, weather: prev.weather === w.value ? '' : w.value }))}
                                                            title={w.label}
                                                        >
                                                            <span>{w.icon}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="sidebar-section">
                                                <label className="sidebar-label">Energy Level</label>
                                                <div className="energy-selector">
                                                    {[1, 2, 3, 4, 5].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            className={`energy-dot ${formData.energyLevel >= val ? 'filled' : ''}`}
                                                            onClick={() => setFormData(prev => ({ ...prev, energyLevel: val }))}
                                                            title={`Energy: ${val}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="sidebar-section">
                                                <label className="sidebar-label">Sleep Quality</label>
                                                <select
                                                    name="sleepQuality"
                                                    value={formData.sleepQuality || ''}
                                                    onChange={handleChange}
                                                    className="sidebar-input"
                                                >
                                                    <option value="">Select sleep quality...</option>
                                                    {SLEEP_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Collapsible Card: Location & Tags */}
                                <div className={`sidebar-group-card ${sidebarGroups.locationTags ? 'expanded' : 'collapsed'}`}>
                                    <div className="sidebar-group-header" onClick={() => toggleSidebarGroup('locationTags')}>
                                        <span>Location & Tags</span>
                                        <span className="sidebar-group-arrow">{sidebarGroups.locationTags ? '▾' : '▸'}</span>
                                    </div>
                                    {sidebarGroups.locationTags && (
                                        <div className="sidebar-group-body">
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
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleTagAdd();
                                                            } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
                                                                handleTagRemove(formData.tags[formData.tags.length - 1]);
                                                            }
                                                        }}
                                                    />
                                                    <button type="button" className="sidebar-tag-add" onClick={handleTagAdd}>+</button>
                                                </div>
                                                {formData.tags.length > 0 && (
                                                    <div className="sidebar-tags-display-pills">
                                                        {formData.tags.map(tag => (
                                                            <span key={tag} className="sidebar-tag-pill">
                                                                <span>#</span>{tag}
                                                                <button type="button" onClick={() => handleTagRemove(tag)} className="sidebar-tag-remove-btn"><FiX /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Collapsible Card: Privacy & Publishing */}
                                <div className={`sidebar-group-card ${sidebarGroups.privacyPublishing ? 'expanded' : 'collapsed'}`}>
                                    <div className="sidebar-group-header" onClick={() => toggleSidebarGroup('privacyPublishing')}>
                                        <span>Privacy & Flags</span>
                                        <span className="sidebar-group-arrow">{sidebarGroups.privacyPublishing ? '▾' : '▸'}</span>
                                    </div>
                                    {sidebarGroups.privacyPublishing && (
                                        <div className="sidebar-group-body">
                                            <div className="sidebar-section">
                                                <label className="sidebar-label">Privacy Visibility</label>
                                                <div className="privacy-chips-grid">
                                                    {['public', 'private', 'draft', 'hidden'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            className={`privacy-chip-btn ${formData.privacy === p ? 'active' : ''}`}
                                                            onClick={() => setFormData(prev => ({ ...prev, privacy: p }))}
                                                        >
                                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="sidebar-flags-row">
                                                <button
                                                    type="button"
                                                    className={`flag-toggle-btn ${formData.isFavorite ? 'active' : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                                                    title="Mark as Favorite"
                                                >
                                                    ⭐ Favorite
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flag-toggle-btn ${formData.isPinned ? 'active' : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                                                    title="Pin entry to top"
                                                >
                                                    📌 Pin to Top
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {sidebarTab === 'appearance' && (
                            <div className="appearance-compact">
                                {/* Typography Row */}
                                <div className="compact-section">
                                    <span className="compact-section-label">Typography</span>
                                    <div className="compact-grid">
                                        <div className="compact-field">
                                            <label>Title</label>
                                            <select value={selectedTitleFont} onChange={(e) => setSelectedTitleFont(e.target.value)}>
                                                {HEADING_FONT_OPTIONS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Body</label>
                                            <select value={selectedBodyFont} onChange={(e) => setSelectedBodyFont(e.target.value)}>
                                                {BODY_FONT_OPTIONS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Title size</label>
                                            <select value={titleSize} onChange={(e) => setTitleSize(e.target.value)}>
                                                {[20,24,28,32,36,40,44,48].map(s => (
                                                    <option key={s} value={s}>{s}px</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Body size</label>
                                            <select value={bodySize} onChange={(e) => setBodySize(e.target.value)}>
                                                {[14,15,16,17,18,19,20,21,22,24].map(s => (
                                                    <option key={s} value={s}>{s}px</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Spacing</label>
                                            <select value={lineHeight} onChange={(e) => setLineHeight(e.target.value)}>
                                                {[1.2,1.4,1.6,1.75,2,2.2,2.4].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Paper Row */}
                                <div className="compact-section">
                                    <span className="compact-section-label">Paper</span>
                                    <div className="compact-grid">
                                        <div className="compact-field">
                                            <label>Texture</label>
                                            <select value={formData.paperTexture} onChange={(e) => setFormData(prev => ({ ...prev, paperTexture: e.target.value }))}>
                                                {TEXTURE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Color</label>
                                            <div className="compact-color-row">
                                                <input type="color" value={formData.paperColor} onChange={(e) => setFormData(prev => ({ ...prev, paperColor: e.target.value }))} className="compact-color-input" />
                                                <div className="compact-swatches">
                                                    {['#f8f5f0','#f5efe6','#efe6d8','#f0ead6','#e8dcc8','#e6dbc8','#f0e8d8','#d9d2c0','#edf0e8','#e8ebe4'].map(color => (
                                                        <button key={color} type="button" onClick={() => setFormData(prev => ({ ...prev, paperColor: color }))} className={`compact-swatch ${formData.paperColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="compact-field">
                                            <label>Divider</label>
                                            <div className="compact-color-row">
                                                <input type="color" value={formData.dividerColor} onChange={(e) => setFormData(prev => ({ ...prev, dividerColor: e.target.value }))} className="compact-color-input" />
                                                <div className="compact-swatches">
                                                    {['#c8c4bc','#b8b4ac','#a8a49c','#98948c','#88847c','#78746c','#68645c','#58544c','#48443c','#38342c'].map(color => (
                                                        <button key={color} type="button" onClick={() => setFormData(prev => ({ ...prev, dividerColor: color }))} className={`compact-swatch ${formData.dividerColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Media Row */}
                                <div className="compact-section">
                                    <span className="compact-section-label">Media</span>
                                    <div className="compact-grid">
                                        <div className="compact-field">
                                            <label>Frame</label>
                                            <select name="mediaFrame" value={formData.mediaFrame} onChange={handleChange}>
                                                {FRAME_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="compact-field">
                                            <label>Size</label>
                                            <select name="frameSize" value={formData.frameSize} onChange={handleChange}>
                                                {FRAME_SIZE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                    <label className="sidebar-label">🎵 Spotify Music</label>
                                    <input type="url" name="spotifyUrl" value={formData.spotifyUrl} onChange={handleChange} className="sidebar-input" placeholder="https://open.spotify.com/track/..." />
                                    {formData.spotifyUrl && (
                                        <div className="video-preview">
                                            <div className="preview-label">Preview:</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: '4px' }}>
                                                🎵 Spotify track attached
                                            </div>
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

                    <div className="sidebar-actions row-actions">
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
                            {/* Group 1: Text Formatting */}
                            <div className="toolbar-group">
                                <button type="button" className="toolbar-btn" onClick={applyBold} title="Bold (Ctrl+B)"><FiBold size={14} /></button>
                                <button type="button" className="toolbar-btn" onClick={applyItalic} title="Italic (Ctrl+I)"><FiItalic size={14} /></button>
                                <button type="button" className="toolbar-btn" onClick={applyUnderline} title="Underline (Ctrl+U)"><FiUnderline size={14} /></button>
                                <button type="button" className="toolbar-btn" onClick={applyStrikethrough} title="Strikethrough"><s>S</s></button>
                            </div>

                            {/* Group 2: Headings */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                                    title="Headings"
                                >
                                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>H</span>
                                    <FiChevronDown size={10} />
                                </button>
                                {showHeadingMenu && (
                                    <div className="toolbar-dropdown-menu heading-dropdown">
                                        <button type="button" className="dropdown-item" onClick={() => { applyHeading(1); setShowHeadingMenu(false); }}>Heading 1</button>
                                        <button type="button" className="dropdown-item" onClick={() => { applyHeading(2); setShowHeadingMenu(false); }}>Heading 2</button>
                                        <button type="button" className="dropdown-item" onClick={() => { applyHeading(3); setShowHeadingMenu(false); }}>Heading 3</button>
                                        <div className="dropdown-divider"></div>
                                        <button type="button" className="dropdown-item" onClick={applyBlockquote}>Quote</button>
                                    </div>
                                )}
                            </div>

                            {/* Group 3: Insert */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowInsertMenu(!showInsertMenu)}
                                    title="Insert"
                                >
                                    <Icon name="plus" size="sm" />
                                    <FiChevronDown size={10} />
                                </button>
                                {showInsertMenu && (
                                    <div className="toolbar-dropdown-menu insert-dropdown">
                                        <button type="button" className="dropdown-item" onClick={() => { insertLink(); setShowInsertMenu(false); }}>🔗 Link</button>
                                        <button type="button" className="dropdown-item" onClick={() => { applyCode(); setShowInsertMenu(false); }}>{'</> Code'}</button>
                                        <button type="button" className="dropdown-item" onClick={() => { insertList('ul'); setShowInsertMenu(false); }}>• List</button>
                                        <button type="button" className="dropdown-item" onClick={() => { insertList('ol'); setShowInsertMenu(false); }}>1. List</button>
                                        <button type="button" className="dropdown-item" onClick={() => { insertHorizontalRule(); setShowInsertMenu(false); }}>— Rule</button>
                                    </div>
                                )}
                            </div>

                            {/* Group 4: Alignment */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowAlignMenu(!showAlignMenu)}
                                    title="Alignment"
                                >
                                    <span style={{ fontSize: '11px', fontWeight: 700 }}>≡</span>
                                    <FiChevronDown size={10} />
                                </button>
                                {showAlignMenu && (
                                    <div className="toolbar-dropdown-menu align-dropdown">
                                        <button type="button" className="dropdown-item" onClick={() => { applyAlignment('left'); setShowAlignMenu(false); }}>Left</button>
                                        <button type="button" className="dropdown-item" onClick={() => { applyAlignment('center'); setShowAlignMenu(false); }}>Center</button>
                                        <button type="button" className="dropdown-item" onClick={() => { applyAlignment('right'); setShowAlignMenu(false); }}>Right</button>
                                    </div>
                                )}
                            </div>

                            {/* Group 5: Mark / Highlight */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn toolbar-mark-btn"
                                    onClick={() => setShowMarkPicker(!showMarkPicker)}
                                    title="Highlight"
                                    style={{ background: markColor, color: '#1a1a1a' }}
                                >
                                    <FiDroplet size={12} />
                                    <FiChevronDown size={10} />
                                </button>
                                {showMarkPicker && (
                                    <div className="toolbar-dropdown-menu mark-dropdown">
                                        <div className="mark-dropdown-header">
                                            <span>Highlight Colors</span>
                                            <input
                                                type="color"
                                                className="mark-custom-color"
                                                value={markColor}
                                                onChange={(e) => setMarkColor(e.target.value)}
                                                title="Custom color"
                                            />
                                        </div>
                                        <div className="mark-color-groups">
                                            {['coffee', 'warm', 'cozy'].map(group => (
                                                <div key={group} className="mark-color-group">
                                                    <span className="mark-color-group-label">{group}</span>
                                                    <div className="mark-color-swatches">
                                                        {MARK_COLORS.filter(c => c.group === group).map(c => (
                                                            <button
                                                                key={c.value}
                                                                type="button"
                                                                className={`mark-swatch ${markColor === c.value ? 'active' : ''}`}
                                                                onClick={() => { setMarkColor(c.value); }}
                                                                style={{ backgroundColor: c.value }}
                                                                title={c.label}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="dropdown-item dropdown-item-apply"
                                            onClick={() => { applyMark(); setShowMarkPicker(false); }}
                                        >
                                            Apply Highlight
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Group 6: Text Color */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    title="Text color"
                                    style={{ color: fontColor }}
                                >
                                    <span style={{ fontWeight: 700, fontSize: '13px' }}>A</span>
                                    <FiChevronDown size={10} />
                                </button>
                                {showColorPicker && (
                                    <div className="toolbar-dropdown-menu color-dropdown">
                                        <div className="color-dropdown-header">
                                            <span>Text Color</span>
                                        </div>
                                        <div className="color-swatches-row">
                                            {['#1f1b16','#4a3728','#6b4c3b','#8b6914','#2d5a27','#1a5276','#6c3483','#922b21','#1a1a1a','#34495e','#7f8c8d','#d35400','#c0392b','#2980b9'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`color-swatch-btn ${fontColor === c ? 'active' : ''}`}
                                                    onClick={() => setFontColor(c)}
                                                    style={{ backgroundColor: c }}
                                                    title={c}
                                                />
                                            ))}
                                        </div>
                                        <div className="color-dropdown-custom">
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => setFontColor(e.target.value)}
                                                title="Custom color"
                                            />
                                            <span>Custom</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="dropdown-item dropdown-item-apply"
                                            onClick={() => { applyColor(); setShowColorPicker(false); }}
                                        >
                                            Apply Color
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Group 7: Font Settings */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowFontPanel(!showFontPanel)}
                                    title="Font settings"
                                >
                                    <FiType size={14} />
                                    <FiChevronDown size={10} />
                                </button>
                                {showFontPanel && (
                                    <div className="toolbar-dropdown-menu font-dropdown">
                                        <div className="font-dropdown-header">
                                            <span>Typography</span>
                                        </div>
                                        <div className="font-dropdown-body">
                                            <div className="font-dropdown-row">
                                                <label>Heading</label>
                                                <select value={selectedTitleFont} onChange={(e) => setSelectedTitleFont(e.target.value)}>
                                                    {HEADING_FONT_OPTIONS.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="font-dropdown-row">
                                                <label>Body</label>
                                                <select value={selectedBodyFont} onChange={(e) => setSelectedBodyFont(e.target.value)}>
                                                    {BODY_FONT_OPTIONS.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="font-dropdown-row">
                                                <label>Title size</label>
                                                <select value={titleSize} onChange={(e) => setTitleSize(e.target.value)}>
                                                    {[20,24,28,32,36,40,44,48].map(s => (
                                                        <option key={s} value={s}>{s}px</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="font-dropdown-row">
                                                <label>Body size</label>
                                                <select value={bodySize} onChange={(e) => setBodySize(e.target.value)}>
                                                    {[14,15,16,17,18,19,20,21,22,24].map(s => (
                                                        <option key={s} value={s}>{s}px</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="font-dropdown-row">
                                                <label>Line spacing</label>
                                                <select value={lineHeight} onChange={(e) => setLineHeight(e.target.value)}>
                                                    {[1.2,1.4,1.6,1.75,2,2.2,2.4].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Group 8: Templates */}
                            <div className="toolbar-group toolbar-dropdown">
                                <button
                                    type="button"
                                    className="toolbar-btn toolbar-dropdown-btn"
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    title="Templates"
                                >
                                    <span style={{ fontSize: '11px' }}>📋</span>
                                    <FiChevronDown size={10} />
                                </button>
                                {showTemplates && (
                                    <div className="toolbar-dropdown-menu template-dropdown">
                                        <div className="template-dropdown-header">
                                            <span>Quick Templates</span>
                                        </div>
                                        {TEMPLATE_OPTIONS.map(t => (
                                            <button
                                                key={t.label}
                                                type="button"
                                                className="dropdown-item"
                                                onClick={() => {
                                                    if (window.confirm(`Load template "${t.label}"? This will append to your editor content.`)) {
                                                        setFormData(prev => ({ ...prev, content: prev.content ? `${prev.content}\n\n${t.content}` : t.content }));
                                                    }
                                                    setShowTemplates(false);
                                                }}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Group 9: Media Insert */}
                            <div className="toolbar-group">
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" id="inlineImageUpload" onChange={handleInlineImageUpload} />
                                <label className="toolbar-btn" htmlFor="inlineImageUpload" title="Drop or click to add image"><FiImage size={14} /></label>
                                {isUploading && <span className="toolbar-upload-status">{uploadProgress}%</span>}
                                <button type="button" className="toolbar-btn" onClick={handleEmbedInsert} title="Embed video"><FiVideo size={14} /></button>
                            </div>

                            {/* Group 10: Extras (Focus, Goal) */}
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
                                            placeholder="Goal"
                                            className="toolbar-input"
                                            style={{ width: '60px' }}
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
                                fontFamily: `'${selectedTitleFont}', ${selectedTitleFont === 'Caveat' ? 'cursive' : selectedTitleFont === 'Special Elite' ? 'monospace' : 'serif'}`
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
                                fontFamily: `'${selectedBodyFont}', ${selectedBodyFont === 'Libre Baskerville' || selectedBodyFont === 'Georgia' || selectedBodyFont === 'Merriweather' || selectedBodyFont === 'Lora' || selectedBodyFont === 'Source Serif 4' ? 'serif' : selectedBodyFont === 'Caveat' ? 'cursive' : selectedBodyFont === 'Special Elite' ? 'monospace' : 'serif'}`
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
                                        bodySize,
                                        lineHeight,
                                        titleFont: selectedTitleFont,
                                        bodyFont: selectedBodyFont,
                                        font: selectedTitleFont,
                                        type: formData.youtubeEmbedUrl ? 'video' : (coverFile || formData.coverImage) ? 'image' : 'story'
                                    }} 
                                    mediaSettings={mediaSettings} 
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
                                <span className="meta-stat-label">Paragraphs</span>
                                <span className="meta-stat-value">{formData.content.split('\n').filter(p => p.trim()).length}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Reading time</span>
                                <span className="meta-stat-value">{readingTime} min</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Images</span>
                                <span className="meta-stat-value">{imageUrls.length + (formData.coverImage ? 1 : 0)}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Tags</span>
                                <span className="meta-stat-value">{formData.tags.length}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Last Saved</span>
                                <span className="meta-stat-value">{lastSaved ? lastSaved.toLocaleTimeString() : 'Not saved'}</span>
                            </div>
                            <div className="meta-stat-item">
                                <span className="meta-stat-label">Autosave Status</span>
                                <span className="meta-stat-value" style={{ color: 'var(--accent)' }}>Active</span>
                            </div>
                        </div>

                        <div className="meta-metadata-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry Metadata</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                                <span>Entry ID:</span>
                                <span style={{ fontFamily: 'monospace' }}>{post?._id || 'New Draft'}</span>
                                <span>Created Date:</span>
                                <span>{post?.createdAt ? new Date(post.createdAt).toLocaleString() : 'Not created'}</span>
                                <span>Updated Date:</span>
                                <span>{post?.updatedAt ? new Date(post.updatedAt).toLocaleString() : 'Not updated'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostEditor;