import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeRaw from 'rehype-raw';
import { 
  getLineInfo, parseSlashCommand, executeSlashCommand,
  handleEnterInList, handleTab, toggleTaskCheckbox,
  applyBold, applyItalic, applyUnderline, applyStrikethrough,
  applyCode, applyBoldItalic, toggleHeading, applyBlockquote,
  insertCodeBlock, insertUnorderedList, insertOrderedList,
  insertTaskList, insertHorizontalRule, insertLink, insertImage,
  insertVideo, insertEmbed, insertTable, wrapSelection, applyTextColor
} from '../shared/utils/markdownUtils';
import MarkdownToolbar from './MarkdownToolbar';
import SlashCommands from './SlashCommands';
import MediaCard from '../shared/components/MediaCard.jsx';
import { getMediaType, getEmbedUrl } from '../shared/utils/mediaUtils.js';
import YoutubeAudioPlayer from '../shared/components/YoutubeAudioPlayer.jsx';
import SpotifyPlayer from '../shared/components/SpotifyPlayer.jsx';

const HIGHLIGHT_COLORS = [
  '#d7c7a5','#c9b99a','#e8d5b7','#d4a574','#b8956a',
  '#a67c52','#e3c9b0','#d4b8a0','#c4a882','#b89a7a',
  '#f0dbd0','#e6ccb2','#ddc0a0','#cdb79e'
];

const TEXT_COLORS = [
  '#1f1b16','#4a3728','#6b4c3b','#8b6914','#2d5a27',
  '#1a5276','#6c3483','#922b21','#34495e','#7f8c8d',
  '#d35400','#c0392b','#2980b9'
];

// Custom components for Markdown rendering with visual customization
const createCustomComponents = (options) => ({
  h1: ({ children, ...props }) => (
    <h1 className="md-header md-h1" style={options?.headingStyles?.[1]} {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="md-header md-h2" style={options?.headingStyles?.[2]} {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="md-header md-h3" style={options?.headingStyles?.[3]} {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="md-header md-h4" style={options?.headingStyles?.[4]} {...props}>{children}</h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="md-header md-h5" style={options?.headingStyles?.[5]} {...props}>{children}</h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="md-header md-h6" style={options?.headingStyles?.[6]} {...props}>{children}</h6>
  ),
  p: ({ children, ...props }) => (
    <p className="md-paragraph" style={{ 
      textAlign: options?.textAlign || 'left',
      color: options?.textColor,
      ...options?.paragraphStyles
    }} {...props}>{children}</p>
  ),
  ul: ({ children, ...props }) => (
    <ul className={`md-list md-list-ul bullet-style-${options?.bulletStyle || 'default'}`} {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="md-list md-list-ol" style={{ 
      listStyleType: options?.numberingStyle === 'alpha' ? 'upper-alpha' 
        : options?.numberingStyle === 'alpha-lower' ? 'lower-alpha' 
        : undefined 
    }} {...props}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li className="md-list-item" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className={`md-blockquote quote-style-${options?.quoteStyle || 'minimal'}`} {...props}>{children}</blockquote>
  ),
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    if (inline) {
      return <code className="md-inline-code" {...props}>{children}</code>;
    }
    return (
      <pre className={`md-code-block code-theme-${options?.codeTheme || 'dark'}`}>
        {lang && <span className="code-language-label">{lang}</span>}
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  hr: () => (
    <hr className={`md-divider divider-style-${options?.dividerStyle || 'thin'}`} />
  ),
  a: ({ href, children, ...props }) => (
    <a href={href} className={`md-link link-style-${options?.linkStyle || 'underline'}`} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  img: ({ src, alt, ...props }) => (
    <span className={`md-image-wrapper image-style-${options?.imageStyle || 'rounded'}`}>
      <img src={src} alt={alt || ''} className="md-image" {...props} />
      {alt && <em className="md-image-caption">{alt}</em>}
    </span>
  ),
  table: ({ children, ...props }) => (
    <div className="md-table-wrapper">
      <table className={`md-table ${options?.tableCompact ? 'table-compact' : ''} ${options?.tableStriped ? 'table-striped' : ''}`} {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }) => <thead className="md-table-head" {...props}>{children}</thead>,
  tbody: ({ children, ...props }) => <tbody className="md-table-body" {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => <tr className="md-table-row" {...props}>{children}</tr>,
  th: ({ children, ...props }) => <th className="md-table-header" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="md-table-cell" {...props}>{children}</td>,
  input: ({ type, checked, ...props }) => {
    if (type === 'checkbox') {
      return (
        <span className={`md-checkbox checkbox-style-${options?.checkboxStyle || 'square'} ${checked ? 'checked' : ''}`}
          onClick={() => options?.onToggleCheckbox && options.onToggleCheckbox()}>
          {checked ? '☑' : '☐'}
        </span>
      );
    }
    return <input type={type} checked={checked} {...props} />;
  },
  del: ({ children, ...props }) => <del className="md-strikethrough" {...props}>{children}</del>,
  em: ({ children, ...props }) => <em className="md-italic" {...props}>{children}</em>,
  strong: ({ children, ...props }) => <strong className="md-bold" {...props}>{children}</strong>,
  u: ({ children, ...props }) => <u className="md-underline" {...props}>{children}</u>,
  mark: ({ children, ...props }) => (
    <mark className="md-highlight" style={{ backgroundColor: options?.highlightColor || '#d7c7a5' }} {...props}>{children}</mark>
  ),
});

const RenderedContent = memo(({ markdown, components }) => {
  if (!markdown) return <div className="md-placeholder" style={{ padding: 0, color: 'var(--text-muted)', opacity: 0.3, fontStyle: 'italic' }}>Write freely. Your thoughts, your voice...</div>;
  
  // Pre-process markdown to convert custom media syntax to rendered components
  const lines = markdown.split('\n');
  const elements = [];
  let markdownBuffer = [];
  
  const flushMarkdown = () => {
    if (markdownBuffer.length > 0) {
      const mdContent = markdownBuffer.join('\n');
      elements.push(
        <ReactMarkdown
          key={`md-${elements.length}`}
          remarkPlugins={[remarkGfm, remarkEmoji]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {mdContent}
        </ReactMarkdown>
      );
      markdownBuffer = [];
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for [image:url] or [image:url|caption]
    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\s*\]$/i);
    if (imageMatch) {
      flushMarkdown();
      const [rawUrl, rawCaption] = imageMatch[1].split('|');
      const url = rawUrl.trim();
      const caption = rawCaption ? rawCaption.trim() : '';
      elements.push(
        <div key={`img-${i}`} className="entry-media inline-media" style={{ margin: '1em 0' }}>
          <MediaCard
            src={url}
            alt={caption || 'Image'}
            caption={caption || undefined}
            className="polaroid-card"
          />
        </div>
      );
      continue;
    }

    // Check for [video:url]
    const videoMatch = trimmed.match(/^\[video:\s*(.+?)\s*\]$/i);
    if (videoMatch) {
      flushMarkdown();
      const videoUrl = videoMatch[1].trim();
      const mediaType = getMediaType(videoUrl);

      if (mediaType === 'youtube' || mediaType === 'vimeo') {
        // Render as embeddable video player
        elements.push(
          <div key={`vid-${i}`} className="entry-media inline-media is-video" style={{ margin: '1em 0' }}>
            <MediaCard
              src={videoUrl}
              alt="Video"
              className="dotted-frame"
            />
          </div>
        );
      } else {
        // Render as direct video file
        elements.push(
          <div key={`vid-${i}`} className="entry-media inline-media is-video" style={{ margin: '1em 0' }}>
            <MediaCard
              src={videoUrl}
              alt="Video"
              className="dotted-frame"
            />
          </div>
        );
      }
      continue;
    }

    // Check for [embed:url] - specifically for YouTube/Spotify
    const embedMatch = trimmed.match(/^\[embed:\s*(.+?)\s*\]$/i);
    if (embedMatch) {
      flushMarkdown();
      const embedUrl = embedMatch[1].trim();
      const mediaType = getMediaType(embedUrl);

      if (mediaType === 'youtube') {
        // Render YouTube player as video frame
        elements.push(
          <div key={`youtube-${i}`} className="entry-media inline-media is-video" style={{ margin: '1em 0' }}>
            <MediaCard
              src={embedUrl}
              alt="YouTube Video"
              className="dotted-frame"
            />
          </div>
        );
      } else if (mediaType === 'spotify') {
        // Render Spotify player
        elements.push(
          <div key={`spotify-${i}`} className="entry-media inline-media is-spotify" style={{ margin: '1em 0' }}>
            <SpotifyPlayer url={embedUrl} compact={true} />
          </div>
        );
      } else {
        // Fallback to generic MediaCard for other embeds
        elements.push(
          <div key={`emb-${i}`} className="entry-media inline-media is-video" style={{ margin: '1em 0' }}>
            <MediaCard
              src={embedUrl}
              alt="Embedded media"
              className="dotted-frame"
            />
          </div>
        );
      }
      continue;
    }

    markdownBuffer.push(line);
  }
  
  flushMarkdown();
  
  return <>{elements}</>;
});

const LiveMarkdownEditor = ({
  value,
  onChange,
  placeholder = 'Write freely. Your thoughts, your voice...',
  readOnly = false,
  bulletStyle = 'default',
  numberingStyle = 'default',
  quoteStyle = 'minimal',
  dividerStyle = 'thin',
  checkboxStyle = 'square',
  linkStyle = 'underline',
  codeTheme = 'dark',
  imageStyle = 'rounded',
  fontFamily = "'Libre Baskerville', serif",
  fontSize = 18,
  lineHeight = 1.75,
  textColor = '#1f1b16',
  highlightColor = '#d7c7a5',
  textAlign = 'left',
  paragraphSpacing = 1.2,
  letterSpacing = 0,
  tableCompact = false,
  tableStriped = false,
  onBulletStyleChange,
  onNumberingStyleChange,
  onQuoteStyleChange,
  onDividerStyleChange,
  onCheckboxStyleChange,
  onLinkStyleChange,
  onCodeThemeChange,
  onImageStyleChange,
  onFontFamilyChange,
  onFontSizeChange,
  onLineHeightChange,
  onTextColorChange,
  onHighlightColorChange,
  onTextAlignChange,
}) => {
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const editorRef = useRef(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
  const [activeStyles, setActiveStyles] = useState({});
  const [showSource, setShowSource] = useState(false);

  const pendingSelectionRef = useRef(null);
  const pendingCursorRef = useRef(null); // cursor before modal opens

  // Error state for toolbar operations
  const [error, setError] = useState(null);

  // Media insert modals
  const [videoModal, setVideoModal] = useState({ open: false, value: '' });
  const [embedModal, setEmbedModal] = useState({ open: false, value: '' });

  // Fallback states for visual settings
  const [localBulletStyle, setLocalBulletStyle] = useState(bulletStyle);
  const [localNumberingStyle, setLocalNumberingStyle] = useState(numberingStyle);
  const [localQuoteStyle, setLocalQuoteStyle] = useState(quoteStyle);
  const [localDividerStyle, setLocalDividerStyle] = useState(dividerStyle);
  const [localCheckboxStyle, setLocalCheckboxStyle] = useState(checkboxStyle);
  const [localLinkStyle, setLocalLinkStyle] = useState(linkStyle);
  const [localTextAlign, setLocalTextAlign] = useState(textAlign);
  const [localFontFamily, setLocalFontFamily] = useState(fontFamily);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localLineHeight, setLocalLineHeight] = useState(lineHeight);
  const [localTextColor, setLocalTextColor] = useState(textColor);
  const [localHighlightColor, setLocalHighlightColor] = useState(highlightColor);

  // Sync from props
  useEffect(() => { setLocalBulletStyle(bulletStyle); }, [bulletStyle]);
  useEffect(() => { setLocalNumberingStyle(numberingStyle); }, [numberingStyle]);
  useEffect(() => { setLocalQuoteStyle(quoteStyle); }, [quoteStyle]);
  useEffect(() => { setLocalDividerStyle(dividerStyle); }, [dividerStyle]);
  useEffect(() => { setLocalCheckboxStyle(checkboxStyle); }, [checkboxStyle]);
  useEffect(() => { setLocalLinkStyle(linkStyle); }, [linkStyle]);
  useEffect(() => { setLocalTextAlign(textAlign); }, [textAlign]);
  useEffect(() => { setLocalFontFamily(fontFamily); }, [fontFamily]);
  useEffect(() => { setLocalFontSize(fontSize); }, [fontSize]);
  useEffect(() => { setLocalLineHeight(lineHeight); }, [lineHeight]);
  useEffect(() => { setLocalTextColor(textColor); }, [textColor]);
  useEffect(() => { setLocalHighlightColor(highlightColor); }, [highlightColor]);

  // Synchronize cursor selection after DOM updates
  useEffect(() => {
    if (pendingSelectionRef.current && textareaRef.current) {
      const { start, end } = pendingSelectionRef.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    }
  }, [value]);

  const handleBulletStyleChange = useCallback((val) => {
    setLocalBulletStyle(val);
    onBulletStyleChange && onBulletStyleChange(val);
  }, [onBulletStyleChange]);

  const handleNumberingStyleChange = useCallback((val) => {
    setLocalNumberingStyle(val);
    onNumberingStyleChange && onNumberingStyleChange(val);
  }, [onNumberingStyleChange]);

  const handleQuoteStyleChange = useCallback((val) => {
    setLocalQuoteStyle(val);
    onQuoteStyleChange && onQuoteStyleChange(val);
  }, [onQuoteStyleChange]);

  const handleDividerStyleChange = useCallback((val) => {
    setLocalDividerStyle(val);
    onDividerStyleChange && onDividerStyleChange(val);
  }, [onDividerStyleChange]);

  const handleCheckboxStyleChange = useCallback((val) => {
    setLocalCheckboxStyle(val);
    onCheckboxStyleChange && onCheckboxStyleChange(val);
  }, [onCheckboxStyleChange]);

  const handleLinkStyleChange = useCallback((val) => {
    setLocalLinkStyle(val);
    onLinkStyleChange && onLinkStyleChange(val);
  }, [onLinkStyleChange]);

  const handleTextAlignChange = useCallback((val) => {
    setLocalTextAlign(val);
    onTextAlignChange && onTextAlignChange(val);
  }, [onTextAlignChange]);

  const handleFontFamilyChange = useCallback((val) => {
    setLocalFontFamily(val);
    onFontFamilyChange && onFontFamilyChange(val);
  }, [onFontFamilyChange]);

  const handleFontSizeChange = useCallback((val) => {
    setLocalFontSize(val);
    onFontSizeChange && onFontSizeChange(val);
  }, [onFontSizeChange]);

  const handleLineHeightChange = useCallback((val) => {
    setLocalLineHeight(val);
    onLineHeightChange && onLineHeightChange(val);
  }, [onLineHeightChange]);

  const handleTextColorChange = useCallback((val) => {
    setLocalTextColor(val);
    onTextColorChange && onTextColorChange(val);
  }, [onTextColorChange]);

  const handleHighlightColorChange = useCallback((val) => {
    setLocalHighlightColor(val);
    onHighlightColorChange && onHighlightColorChange(val);
  }, [onHighlightColorChange]);

  // ── Accurate cursor-based style detection ──
  const updateActiveStyles = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !value) {
      setActiveStyles({});
      return;
    }
    
    const { selectionStart, selectionEnd } = textarea;
    
    if (selectionStart !== selectionEnd) {
      // Check text selection for formatting
      const selectedText = value.slice(selectionStart, selectionEnd);
      setActiveStyles({
        bold: /\*\*/.test(selectedText) || value.slice(Math.max(0, selectionStart - 10), selectionStart).includes('**'),
        italic: /\*/.test(selectedText) && !/\*\*/.test(selectedText),
        underline: /<u>/.test(selectedText),
        strikethrough: /~~/.test(selectedText),
        code: /`/.test(selectedText),
        h1: value.slice(0, selectionStart).split('\n').pop().startsWith('# '),
        h2: value.slice(0, selectionStart).split('\n').pop().startsWith('## '),
        h3: value.slice(0, selectionStart).split('\n').pop().startsWith('### '),
        h4: value.slice(0, selectionStart).split('\n').pop().startsWith('#### '),
        blockquote: value.slice(0, selectionStart).split('\n').pop().startsWith('> '),
      });
      return;
    }
    
    // Single cursor position — detect context
    const cursorLine = value.slice(0, selectionStart).split('\n').pop() || '';
    
    setActiveStyles({
      bold: /\*\*[^*]*\*\*$/.test(cursorLine) || /\*\*[^*]*$/.test(cursorLine),
      italic: /(?<!\*)\*[^*]+$/.test(cursorLine) && !/\*\*/.test(cursorLine),
      underline: /<u>.*$/.test(cursorLine),
      strikethrough: /~~.*$/.test(cursorLine),
      code: /`[^`]*$/.test(cursorLine),
      h1: cursorLine.startsWith('# '),
      h2: cursorLine.startsWith('## '),
      h3: cursorLine.startsWith('### '),
      h4: cursorLine.startsWith('#### '),
      blockquote: cursorLine.startsWith('> '),
    });
  }, [value]);

  // Update styles on cursor move
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      setCursorPosition({
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      });
      updateActiveStyles();
    }
  }, [updateActiveStyles]);

  // ── Handle toolbar actions ──
  const handleToolbarAction = useCallback((action) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    let result;

    switch (action) {
      case 'bold':
        result = applyBold(value, selectionStart, selectionEnd);
        break;
      case 'italic':
        result = applyItalic(value, selectionStart, selectionEnd);
        break;
      case 'underline':
        result = applyUnderline(value, selectionStart, selectionEnd);
        break;
      case 'strikethrough':
        result = applyStrikethrough(value, selectionStart, selectionEnd);
        break;
      case 'code':
        result = applyCode(value, selectionStart, selectionEnd);
        break;
      case 'bolditalic':
        result = applyBoldItalic(value, selectionStart, selectionEnd);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4': {
        const level = parseInt(action[1]);
        result = toggleHeading(value, selectionStart, level);
        break;
      }
      case 'blockquote':
        result = applyBlockquote(value, selectionStart);
        break;
      case 'codeblock':
        result = insertCodeBlock(value, selectionStart);
        break;
      case 'unordered-list':
        result = insertUnorderedList(value, selectionStart);
        break;
      case 'ordered-list':
        result = insertOrderedList(value, selectionStart);
        break;
      case 'task-list':
        result = insertTaskList(value, selectionStart);
        break;
      case 'horizontal-rule':
        result = insertHorizontalRule(value, selectionStart);
        break;
      case 'link':
        result = insertLink(value, selectionStart, selectionEnd);
        break;
      case 'image': {
        // Save cursor position before opening file picker
        pendingCursorRef.current = selectionStart;
        const fileInput = document.getElementById('toolbar-image-upload');
        if (fileInput) {
          try {
            fileInput.click();
          } catch (err) {
            console.error('Failed to open file picker:', err);
            setError('Could not open file picker. Please try using the sidebar "Insert image" option instead.');
          }
        } else {
          console.error('Image upload input element not found in DOM');
          setError('Image upload is not available. Please try using the sidebar "Insert image" option or reload the editor.');
        }
        return;
      }
      case 'video':
        // Save cursor position, then open inline modal
        pendingCursorRef.current = selectionStart;
        setVideoModal({ open: true, value: '' });
        return;
      case 'embed':
        // Save cursor position, then open inline modal
        pendingCursorRef.current = selectionStart;
        setEmbedModal({ open: true, value: '' });
        return;
      case 'table':
        result = insertTable(value, selectionStart);
        break;
      case 'highlight':
        result = wrapSelection(value, selectionStart, selectionEnd, `<mark style="background:${localHighlightColor}">`, '</mark>');
        break;
      case 'text-color':
        result = applyTextColor(value, selectionStart, selectionEnd, localTextColor);
        break;
      case 'undo':
        document.execCommand('undo');
        return;
      case 'redo':
        document.execCommand('redo');
        return;
      default:
        return;
    }

    if (result) {
      const start = result.cursorStart !== undefined ? result.cursorStart : selectionStart;
      const end = result.cursorEnd !== undefined ? result.cursorEnd : selectionEnd;
      pendingSelectionRef.current = { start, end };
      onChange(result.newText);
    }
    
    // Update active styles after action
    requestAnimationFrame(updateActiveStyles);
  }, [value, onChange, localHighlightColor, localTextColor, updateActiveStyles]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback((e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleToolbarAction('bold');
          return;
        case 'i':
          e.preventDefault();
          handleToolbarAction('italic');
          return;
        case 'u':
          e.preventDefault();
          handleToolbarAction('underline');
          return;
        case 'k':
          e.preventDefault();
          handleToolbarAction('link');
          return;
        case '/':
          e.preventDefault();
          setShowSlashCommands(prev => !prev);
          return;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            handleToolbarAction('undo');
          } else {
            e.preventDefault();
            handleToolbarAction('redo');
          }
          return;
        case 'y':
          e.preventDefault();
          handleToolbarAction('redo');
          return;
      }
    }

    // Slash command detection
    if (e.key === '/' && !showSlashCommands && !e.ctrlKey && !e.metaKey) {
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart;
        const beforeSlash = value.slice(Math.max(0, pos - 50), pos);
        // Check if there's a word character before the slash
        const charBefore = beforeSlash.slice(-2, -1);
        if (charBefore === '' || charBefore === '\n' || charBefore === ' ') {
          setSlashFilter('');
          setShowSlashCommands(true);
        }
      });
    }

    if (showSlashCommands) {
      if (e.key === 'Backspace') {
        const parsed = parseSlashCommand(value, cursor);
        if (parsed) {
          setSlashFilter(parsed.commandText);
        } else {
          setShowSlashCommands(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashCommands(false);
        textarea.focus();
        return;
      }
      if (e.key.length === 1 && e.key !== 'Enter') {
        const parsed = parseSlashCommand(value + e.key, cursor + 1);
        if (parsed) {
          setSlashFilter(parsed.commandText);
        }
      }
    }

    if (e.key === 'Enter') {
      const result = handleEnterInList(value, cursor);
      if (result) {
        e.preventDefault();
        onChange(result.newText);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorStart, result.cursorEnd);
          }
        });
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const result = handleTab(value, cursor, e.shiftKey);
      if (result) {
        onChange(result.newText);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorStart, result.cursorEnd);
          }
        });
      }
    }
  }, [value, onChange, showSlashCommands, handleToolbarAction]);

  // ── Slash command selection ──
  const handleSlashSelect = useCallback((commandId) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const result = executeSlashCommand(value, cursor, commandId);
    if (result) {
      onChange(result.newText);
      setShowSlashCommands(false);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            result.cursorStart || result.newText.length,
            result.cursorEnd || result.newText.length
          );
          textareaRef.current.focus();
        }
      });
    }
  }, [value, onChange]);

  const handleSlashClose = useCallback(() => {
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  }, []);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
    // Recalculate styles after typing
    requestAnimationFrame(updateActiveStyles);
  }, [onChange, updateActiveStyles]);

  // ── Sync scroll: only the container scrolls; textarea has no scroll ──
  const syncTextareaWithScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    const textarea = textareaRef.current;
    if (container && textarea) {
      // textarea is absolutely positioned, so its scroll position is irrelevant.
      // We just need to ensure content fills the height for overlay alignment.
    }
  }, []);

  // ── Handle scroll of the container ──
  const handleContainerScroll = useCallback(() => {
    // No action needed — textarea and overlay are both inside the container
    // and move naturally with it.
  }, []);

  // ── Build heading styles ──
  const headingStyles = useMemo(() => ({
    1: { fontFamily, fontSize: `${Math.round(fontSize * 2)}px` },
    2: { fontFamily, fontSize: `${Math.round(fontSize * 1.7)}px` },
    3: { fontFamily, fontSize: `${Math.round(fontSize * 1.4)}px` },
    4: { fontFamily, fontSize: `${Math.round(fontSize * 1.2)}px` },
    5: { fontFamily, fontSize: `${Math.round(fontSize * 1.1)}px` },
    6: { fontFamily, fontSize: `${fontSize}px` },
  }), [fontFamily, fontSize]);

  const paragraphStyles = useMemo(() => ({
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    marginBottom: `${paragraphSpacing}em`,
  }), [lineHeight, letterSpacing, paragraphSpacing]);

  const onToggleCheckbox = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const result = toggleTaskCheckbox(value, textarea.selectionStart);
      if (result) onChange(result.newText);
    }
  }, [value, onChange]);

  // ── Create custom components ──
  const customComponents = useMemo(() => createCustomComponents({
    bulletStyle: localBulletStyle,
    numberingStyle: localNumberingStyle,
    quoteStyle: localQuoteStyle,
    dividerStyle: localDividerStyle,
    checkboxStyle: localCheckboxStyle,
    linkStyle: localLinkStyle,
    codeTheme,
    imageStyle,
    headingStyles,
    paragraphStyles,
    textColor: localTextColor,
    highlightColor: localHighlightColor,
    textAlign: localTextAlign,
    tableCompact,
    tableStriped,
    onToggleCheckbox,
  }), [
    localBulletStyle, localNumberingStyle, localQuoteStyle, localDividerStyle,
    localCheckboxStyle, localLinkStyle, codeTheme, imageStyle,
    headingStyles, paragraphStyles, localTextColor, localHighlightColor,
    localTextAlign, tableCompact, tableStriped, onToggleCheckbox
  ]);

  // ── Word/char stats ──
  const wordCount = useMemo(() => value?.trim() ? value.trim().split(/\s+/).length : 0, [value]);
  const charCount = useMemo(() => value?.length || 0, [value]);
  const readingTime = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);

  // ── Styles ──
  const textareaStyle = useMemo(() => ({
    fontFamily: localFontFamily,
    fontSize: `${localFontSize}px`,
    lineHeight: localLineHeight,
    overflow:'hidden',
    cursor:'auto',
    color: 'transparent',
    caretColor: localTextColor || '#1f1b16',
  }), [localFontFamily, localFontSize, localLineHeight, localTextColor]);

  const overlayStyle = useMemo(() => ({
    fontFamily: localFontFamily,
    fontSize: `${localFontSize}px`,
    lineHeight: localLineHeight,
    color: localTextColor || '#1f1b16',
  }), [localFontFamily, localFontSize, localLineHeight, localTextColor]);

  return (
    <div className="live-markdown-editor" ref={editorRef}>
      <MarkdownToolbar
        onAction={handleToolbarAction}
        bulletStyle={localBulletStyle}
        numberingStyle={localNumberingStyle}
        quoteStyle={localQuoteStyle}
        dividerStyle={localDividerStyle}
        checkboxStyle={localCheckboxStyle}
        linkStyle={localLinkStyle}
        onBulletStyleChange={handleBulletStyleChange}
        onNumberingStyleChange={handleNumberingStyleChange}
        onQuoteStyleChange={handleQuoteStyleChange}
        onDividerStyleChange={handleDividerStyleChange}
        onCheckboxStyleChange={handleCheckboxStyleChange}
        onLinkStyleChange={handleLinkStyleChange}
        fontFamily={localFontFamily}
        fontSize={String(localFontSize)}
        lineHeight={String(localLineHeight)}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={(val) => handleFontSizeChange && handleFontSizeChange(Number(val))}
        onLineHeightChange={(val) => handleLineHeightChange && handleLineHeightChange(Number(val))}
        textColor={localTextColor}
        highlightColor={localHighlightColor}
        onTextColorChange={handleTextColorChange}
        onHighlightColorChange={handleHighlightColorChange}
        textAlign={localTextAlign}
        onTextAlignChange={handleTextAlignChange}
        activeStyles={activeStyles}
      />

      <div className="md-editor-tabs">
        <button
          type="button"
          className={`md-editor-tab ${!showSource ? 'active' : ''}`}
          onClick={() => setShowSource(false)}
        >
          <span className="md-tab-icon">✎</span> Write
        </button>
        <button
          type="button"
          className={`md-editor-tab ${showSource ? 'active' : ''}`}
          onClick={() => setShowSource(true)}
        >
          <span className="md-tab-icon">{'</>'}</span> Source
        </button>
      </div>

      <div className="md-editor-body">
        {showSource && (
          <textarea
            ref={textareaRef}
            className="md-textarea md-source-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onClick={handleSelect}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={true}
            style={{
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: '14px',
              lineHeight: '1.6',
              cursor:'text',

            }}
          />
        )}

        {/* ── Video URL Modal ── */}
        {videoModal.open && (
          <div className="md-url-modal-overlay" onClick={() => setVideoModal({ open: false, value: '' })}>
            <div className="md-url-modal" onClick={e => e.stopPropagation()}>
              <div className="md-url-modal-header">Insert Video</div>
              <input
                className="md-url-modal-input"
                type="url"
                placeholder="https://example.com/video.mp4 or YouTube URL"
                value={videoModal.value}
                onChange={e => setVideoModal(m => ({ ...m, value: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const url = videoModal.value.trim();
                    if (url) {
                      const pos = pendingCursorRef.current ?? 0;
                      const r = insertVideo(value, pos, url);
                      if (r) {
                        pendingSelectionRef.current = { start: r.cursorStart ?? pos, end: r.cursorEnd ?? pos };
                        onChange(r.newText);
                      }
                    }
                    setVideoModal({ open: false, value: '' });
                  } else if (e.key === 'Escape') {
                    setVideoModal({ open: false, value: '' });
                  }
                }}
                autoFocus
              />
              <div className="md-url-modal-actions">
                <button type="button" className="md-url-modal-btn cancel" onClick={() => setVideoModal({ open: false, value: '' })}>Cancel</button>
                <button
                  type="button"
                  className="md-url-modal-btn confirm"
                  onClick={() => {
                    const url = videoModal.value.trim();
                    if (url) {
                      const pos = pendingCursorRef.current ?? 0;
                      const r = insertVideo(value, pos, url);
                      if (r) {
                        pendingSelectionRef.current = { start: r.cursorStart ?? pos, end: r.cursorEnd ?? pos };
                        onChange(r.newText);
                      }
                    }
                    setVideoModal({ open: false, value: '' });
                  }}
                >Insert</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Embed URL Modal ── */}
        {embedModal.open && (
          <div className="md-url-modal-overlay" onClick={() => setEmbedModal({ open: false, value: '' })}>
            <div className="md-url-modal" onClick={e => e.stopPropagation()}>
              <div className="md-url-modal-header">Embed Media</div>
              <p className="md-url-modal-hint">Paste a YouTube, Vimeo, or Spotify URL</p>
              <input
                className="md-url-modal-input"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={embedModal.value}
                onChange={e => setEmbedModal(m => ({ ...m, value: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const url = embedModal.value.trim();
                    if (url) {
                      const pos = pendingCursorRef.current ?? 0;
                      const r = insertEmbed(value, pos, url);
                      if (r) {
                        pendingSelectionRef.current = { start: r.cursorStart ?? pos, end: r.cursorEnd ?? pos };
                        onChange(r.newText);
                      }
                    }
                    setEmbedModal({ open: false, value: '' });
                  } else if (e.key === 'Escape') {
                    setEmbedModal({ open: false, value: '' });
                  }
                }}
                autoFocus
              />
              <div className="md-url-modal-actions">
                <button type="button" className="md-url-modal-btn cancel" onClick={() => setEmbedModal({ open: false, value: '' })}>Cancel</button>
                <button
                  type="button"
                  className="md-url-modal-btn confirm"
                  onClick={() => {
                    const url = embedModal.value.trim();
                    if (url) {
                      const pos = pendingCursorRef.current ?? 0;
                      const r = insertEmbed(value, pos, url);
                      if (r) {
                        pendingSelectionRef.current = { start: r.cursorStart ?? pos, end: r.cursorEnd ?? pos };
                        onChange(r.newText);
                      }
                    }
                    setEmbedModal({ open: false, value: '' });
                  }}
                >Embed</button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for toolbar image uploads - always in DOM, regardless of write/source tab */}
        <input
          type="file"
          id="toolbar-image-upload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Include cursor position so the parent can insert at the correct location
              const event = new CustomEvent('toolbar-image-select', { 
                detail: { 
                  file,
                  cursorPosition: pendingCursorRef.current ?? 0
                },
                bubbles: true 
              });
              document.dispatchEvent(event);
            }
            e.target.value = '';
          }}
        />

        {error && (
          <div className="md-editor-error-banner" style={{
            padding: '8px 12px',
            margin: '8px 12px',
            backgroundColor: 'var(--color-error-bg, #fef2f2)',
            color: 'var(--color-error-text, #dc2626)',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--color-error-border, #fecaca)'
          }}>
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit', padding: '0 4px' }}
              aria-label="Dismiss error"
            >×</button>
          </div>
        )}

        {!showSource && (
          <div className="md-editor-body">
            {/* Single unified scroll container — both layers scroll identically */}
            <div 
              className="md-scroll-container" 
              ref={scrollContainerRef}
              onScroll={handleContainerScroll}
            >
              {/* Textarea layer (invisible text, visible caret) — no independent scroll */}
              <textarea
                ref={textareaRef}
                className="md-textarea md-live-textarea"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                onClick={handleSelect}
                placeholder={placeholder}
                readOnly={readOnly}
                spellCheck={true}
                style={textareaStyle}
              />
              {/* Render overlay layer (visible rendered markdown, no pointer events) */}
              <div
                className="md-render-overlay"
                style={overlayStyle}
                aria-hidden="true"
              >
                <RenderedContent markdown={value} components={customComponents} />
              </div>
            </div>
          </div>
        )}

        {showSlashCommands && (
          <SlashCommands
            position={slashPosition}
            onSelect={handleSlashSelect}
            onClose={handleSlashClose}
            filterText={slashFilter}
          />
        )}
      </div>

      <div className="md-editor-footer">
        <span className="md-stats">
          <span title={`${wordCount} words`}>{wordCount} words</span>
          <span className="md-stat-sep">·</span>
          <span title={`${charCount} characters`}>{charCount} chars</span>
          <span className="md-stat-sep">·</span>
          <span title={`${readingTime} min read`}>{readingTime} min read</span>
        </span>
        <span className="md-format-info">
          {showSource ? 'Markdown source' : 'Live preview'}
        </span>
      </div>
    </div>
  );
};

export default memo(LiveMarkdownEditor);