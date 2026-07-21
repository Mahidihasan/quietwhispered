import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { 
  FiBold, FiItalic, FiUnderline, FiCode, FiChevronDown, 
  FiType, FiImage, FiLink, FiList, FiHash, FiMinus,
  FiCheckSquare, FiCornerUpRight, FiTable, FiClock,
  FiVideo, FiYoutube
} from 'react-icons/fi';

const HEADING_OPTIONS = [
  { level: 1, label: 'Heading 1', markdown: '# ', shortcut: 'Ctrl+1' },
  { level: 2, label: 'Heading 2', markdown: '## ', shortcut: 'Ctrl+2' },
  { level: 3, label: 'Heading 3', markdown: '### ', shortcut: 'Ctrl+3' },
  { level: 4, label: 'Heading 4', markdown: '#### ', shortcut: 'Ctrl+4' },
];

const BULLET_STYLES = [
  { value: 'default', label: '• Classic Dot', icon: '•' },
  { value: 'hollow', label: '◦ Hollow Circle', icon: '◦' },
  { value: 'square', label: '▪ Square', icon: '▪' },
  { value: 'diamond', label: '◆ Diamond', icon: '◆' },
  { value: 'outline-diamond', label: '◇ Outline Diamond', icon: '◇' },
  { value: 'arrow', label: '▸ Arrow', icon: '▸' },
  { value: 'minimal-arrow', label: '→ Minimal Arrow', icon: '→' },
  { value: 'checkmark', label: '✓ Checkmark', icon: '✓' },
  { value: 'filled-check', label: '✔ Filled Check', icon: '✔' },
  { value: 'heart', label: '♥ Heart', icon: '♥' },
  { value: 'flower', label: '❀ Flower', icon: '❀' },
  { value: 'blossom', label: '✿ Blossom', icon: '✿' },
  { value: 'floral', label: '❧ Floral', icon: '❧' },
  { value: 'sparkle', label: '✦ Sparkle', icon: '✦' },
  { value: 'star', label: '★ Star', icon: '★' },
  { value: 'outline-star', label: '☆ Outline Star', icon: '☆' },
  { value: 'moon', label: '☽ Moon', icon: '☽' },
  { value: 'leaf', label: '🍃 Leaf', icon: '🍃' },
  { value: 'branch', label: '🌿 Branch', icon: '🌿' },
];

const NUMBERING_STYLES = [
  { value: 'default', label: '1. 2. 3.', icon: '1.' },
  { value: 'circled', label: '①②③', icon: '①' },
  { value: 'roman', label: 'I II III', icon: 'I.' },
  { value: 'alpha', label: 'A. B. C.', icon: 'A.' },
  { value: 'alpha-lower', label: 'a. b. c.', icon: 'a.' },
];

const QUOTE_STYLES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'paper-margin', label: 'Paper Margin' },
  { value: 'elegant', label: 'Elegant Left Border' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'handwritten', label: 'Handwritten' },
  { value: 'muted', label: 'Muted' },
];

const DIVIDER_STYLES = [
  { value: 'thin', label: 'Thin', icon: '—' },
  { value: 'double', label: 'Double', icon: '═' },
  { value: 'dotted', label: 'Dotted', icon: '···' },
  { value: 'dashed', label: 'Dashed', icon: '---' },
  { value: 'leaf', label: 'Leaf Divider', icon: '🍃' },
  { value: 'floral', label: 'Floral Divider', icon: '✿' },
  { value: 'minimal', label: 'Minimal', icon: '─' },
  { value: 'vintage', label: 'Vintage', icon: '◈' },
];

const CHECKBOX_STYLES = [
  { value: 'square', label: 'Square', icon: '☐' },
  { value: 'rounded', label: 'Rounded', icon: '◻' },
  { value: 'circle', label: 'Circle', icon: '○' },
  { value: 'leaf', label: 'Leaf', icon: '🍃' },
  { value: 'heart', label: 'Heart', icon: '♥' },
  { value: 'minimal', label: 'Minimal', icon: '□' },
];

const LINK_STYLES = [
  { value: 'underline', label: 'Underline' },
  { value: 'icon', label: 'Icon' },
  { value: 'muted', label: 'Muted' },
  { value: 'accent', label: 'Accent' },
  { value: 'button', label: 'Button Style' },
];

const FONT_FAMILIES = [
  { value: 'Libre Baskerville', label: 'Libre Baskerville', css: "'Libre Baskerville', serif" },
  { value: 'Special Elite', label: 'Special Elite', css: "'Special Elite', monospace" },
  { value: 'Caveat', label: 'Caveat', css: "'Caveat', cursive" },
  { value: 'Georgia', label: 'Georgia', css: "Georgia, serif" },
  { value: 'Merriweather', label: 'Merriweather', css: "'Merriweather', serif" },
  { value: 'Lora', label: 'Lora', css: "'Lora', serif" },
  { value: 'Source Serif 4', label: 'Source Serif', css: "'Source Serif 4', serif" },
];

const ToolbarButton = memo(({ icon, onClick, isActive, tooltip, children }) => (
  <button
    type="button"
    className={`toolbar-btn ${isActive ? 'is-active' : ''}`}
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    data-tooltip={tooltip}
  >
    {icon || children}
  </button>
));

const MarkdownToolbar = ({
  onAction,
  bulletStyle,
  numberingStyle,
  quoteStyle,
  dividerStyle,
  checkboxStyle,
  linkStyle,
  onBulletStyleChange,
  onNumberingStyleChange,
  onQuoteStyleChange,
  onDividerStyleChange,
  onCheckboxStyleChange,
  onLinkStyleChange,
  fontFamily,
  fontSize,
  lineHeight,
  onFontFamilyChange,
  onFontSizeChange,
  onLineHeightChange,
  textColor,
  highlightColor,
  onTextColorChange,
  onHighlightColorChange,
  textAlign,
  onTextAlignChange,
  activeStyles,
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);

  const handleAction = useCallback((action) => {
    onAction && onAction(action);
    closeDropdown();
  }, [onAction, closeDropdown]);

  const toggleDropdown = useCallback((name) => {
    setActiveDropdown(prev => prev === name ? null : name);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
  }, []);

  return (
    <div className="markdown-toolbar" ref={dropdownRef}>
      {/* Group 1: Text Formatting */}
      <div className="toolbar-group">
        <ToolbarButton 
          icon={<FiBold size={14} />} 
          onClick={() => handleAction('bold')} 
          isActive={activeStyles?.bold} 
          tooltip="Bold (Ctrl+B)"
        />
        <ToolbarButton 
          icon={<FiItalic size={14} />} 
          onClick={() => handleAction('italic')} 
          isActive={activeStyles?.italic} 
          tooltip="Italic (Ctrl+I)"
        />
        <ToolbarButton 
          icon={<FiUnderline size={14} />} 
          onClick={() => handleAction('underline')} 
          isActive={activeStyles?.underline} 
          tooltip="Underline (Ctrl+U)"
        />
        <ToolbarButton 
          icon={<span style={{ textDecoration: 'line-through', fontSize: '12px' }}>S</span>} 
          onClick={() => handleAction('strikethrough')} 
          isActive={activeStyles?.strikethrough} 
          tooltip="Strikethrough"
        />
        <ToolbarButton 
          icon={<FiCode size={14} />} 
          onClick={() => handleAction('code')} 
          isActive={activeStyles?.code} 
          tooltip="Inline Code"
        />
        <ToolbarButton 
          icon={<span style={{ fontWeight: 700, fontStyle: 'italic', fontSize: '11px' }}>BI</span>} 
          onClick={() => handleAction('bolditalic')} 
          isActive={activeStyles?.bolditalic} 
          tooltip="Bold + Italic"
        />
      </div>

      {/* Group 2: Headings */}
      <div className="toolbar-group dropdown-container">
        <button
          type="button"
          className={`toolbar-btn dropdown-trigger ${activeDropdown === 'headings' ? 'is-active' : ''}`}
          onClick={() => toggleDropdown('headings')}
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Headings"
        >
          <FiHash size={14} />
          <FiChevronDown size={10} />
        </button>
        {activeDropdown === 'headings' && (
          <div className="toolbar-dropdown-menu">
            {HEADING_OPTIONS.map(h => (
              <button key={h.level} type="button" className={`dropdown-item ${activeStyles?.[`h${h.level}`] ? 'is-active' : ''}`} onClick={() => handleAction(`h${h.level}`)} onMouseDown={(e) => e.preventDefault()}>
                <span className="dropdown-item-label" style={{ fontSize: `${20 - h.level * 2}px`, fontWeight: 600 }}>{h.label}</span>
                <span className="slash-command-shortcut">Ctrl+{h.level}</span>
              </button>
            ))}
            <div className="dropdown-divider" />
            <button type="button" className={`dropdown-item ${activeStyles?.blockquote ? 'is-active' : ''}`} onClick={() => handleAction('blockquote')} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">Quote</span>
            </button>
            <button type="button" className="dropdown-item" onClick={() => handleAction('codeblock')} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">Code Block</span>
            </button>
          </div>
        )}
      </div>

      {/* Group 3: Lists */}
      <div className="toolbar-group dropdown-container">
        <button
          type="button"
          className={`toolbar-btn dropdown-trigger ${activeDropdown === 'lists' ? 'is-active' : ''}`}
          onClick={() => toggleDropdown('lists')}
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Lists"
        >
          <FiList size={14} />
          <FiChevronDown size={10} />
        </button>
        {activeDropdown === 'lists' && (
          <div className="toolbar-dropdown-menu">
            <button type="button" className="dropdown-item" onClick={() => handleAction('unordered-list')} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">• Bullet List</span>
            </button>
            <button type="button" className="dropdown-item" onClick={() => handleAction('ordered-list')} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">1. Numbered List</span>
            </button>
            <button type="button" className="dropdown-item" onClick={() => handleAction('task-list')} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">☐ Checklist</span>
            </button>
            <div className="dropdown-divider" />

            {/* Bullet Style Selector */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Bullet Style</span>
              <div className="bullet-style-palette">
                {BULLET_STYLES.slice(0, 12).map(bs => (
                  <button
                    key={bs.value}
                    type="button"
                    className={`bullet-style-chip ${bulletStyle === bs.value ? 'active' : ''}`}
                    onClick={() => { onBulletStyleChange && onBulletStyleChange(bs.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                    title={bs.label}
                  >
                    {bs.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Numbering Style Selector */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Numbering Style</span>
              <div className="bullet-style-palette">
                {NUMBERING_STYLES.map(ns => (
                  <button
                    key={ns.value}
                    type="button"
                    className={`bullet-style-chip ${numberingStyle === ns.value ? 'active' : ''}`}
                    onClick={() => { onNumberingStyleChange && onNumberingStyleChange(ns.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                    title={ns.label}
                  >
                    {ns.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 4: Insert */}
      <div className="toolbar-group">
        <ToolbarButton 
          icon={<FiLink size={14} />} 
          onClick={() => handleAction('link')} 
          tooltip="Insert Link (Ctrl+K)"
        />
        <ToolbarButton 
          icon={<FiImage size={14} />} 
          onClick={() => handleAction('image')} 
          tooltip="Insert Image (upload as MediaCard)"
        />
        <ToolbarButton 
          icon={<FiVideo size={14} />} 
          onClick={() => handleAction('video')} 
          tooltip="Insert Video URL (MediaCard)"
        />
        <ToolbarButton 
          icon={<span style={{ fontSize: '13px', fontWeight: 700 }}>▶</span>} 
          onClick={() => handleAction('embed')} 
          tooltip="Insert YouTube/Vimeo Embed (MediaCard)"
        />
        <ToolbarButton 
          icon={<FiTable size={14} />} 
          onClick={() => handleAction('table')} 
          tooltip="Insert Table"
        />
        <ToolbarButton 
          icon={<FiMinus size={14} />} 
          onClick={() => handleAction('horizontal-rule')} 
          tooltip="Horizontal Rule"
        />
      </div>

      {/* Group 5: Quote & Divider Styles */}
      <div className="toolbar-group dropdown-container">
        <button
          type="button"
          className={`toolbar-btn dropdown-trigger ${activeDropdown === 'styles' ? 'is-active' : ''}`}
          onClick={() => toggleDropdown('styles')}
          data-tooltip="Visual Styles"
        >
          <span style={{ fontSize: '13px', fontWeight: 700 }}>✦</span>
          <FiChevronDown size={10} />
        </button>
        {activeDropdown === 'styles' && (
          <div className="toolbar-dropdown-menu style-dropdown">
            {/* Quote Style */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Quote Style</span>
              <div className="style-chip-row">
                {QUOTE_STYLES.map(qs => (
                  <button
                    key={qs.value}
                    type="button"
                    className={`style-chip ${quoteStyle === qs.value ? 'active' : ''}`}
                    onClick={() => { onQuoteStyleChange && onQuoteStyleChange(qs.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dropdown-divider" />

            {/* Divider Style */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Divider Style</span>
              <div className="bullet-style-palette">
                {DIVIDER_STYLES.map(ds => (
                  <button
                    key={ds.value}
                    type="button"
                    className={`bullet-style-chip ${dividerStyle === ds.value ? 'active' : ''}`}
                    onClick={() => { onDividerStyleChange && onDividerStyleChange(ds.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                    title={ds.label}
                  >
                    {ds.icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="dropdown-divider" />

            {/* Checkbox Style */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Checkbox Style</span>
              <div className="bullet-style-palette">
                {CHECKBOX_STYLES.map(cs => (
                  <button
                    key={cs.value}
                    type="button"
                    className={`bullet-style-chip ${checkboxStyle === cs.value ? 'active' : ''}`}
                    onClick={() => { onCheckboxStyleChange && onCheckboxStyleChange(cs.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                    title={cs.label}
                  >
                    {cs.icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="dropdown-divider" />

            {/* Link Style */}
            <div className="dropdown-subsection">
              <span className="dropdown-subsection-label">Link Style</span>
              <div className="style-chip-row">
                {LINK_STYLES.map(ls => (
                  <button
                    key={ls.value}
                    type="button"
                    className={`style-chip ${linkStyle === ls.value ? 'active' : ''}`}
                    onClick={() => { onLinkStyleChange && onLinkStyleChange(ls.value); closeDropdown(); }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {ls.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 6: Text Alignment */}
      <div className="toolbar-group dropdown-container">
        <button
          type="button"
          className={`toolbar-btn dropdown-trigger ${activeDropdown === 'align' ? 'is-active' : ''}`}
          onClick={() => toggleDropdown('align')}
          data-tooltip="Text Alignment"
        >
          <span style={{ fontSize: '11px', fontWeight: 700 }}>≡</span>
          <FiChevronDown size={10} />
        </button>
        {activeDropdown === 'align' && (
          <div className="toolbar-dropdown-menu">
            <button type="button" className={`dropdown-item ${textAlign === 'left' ? 'is-active' : ''}`} onClick={() => { onTextAlignChange && onTextAlignChange('left'); closeDropdown(); }} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">⬅ Left</span>
            </button>
            <button type="button" className={`dropdown-item ${textAlign === 'center' ? 'is-active' : ''}`} onClick={() => { onTextAlignChange && onTextAlignChange('center'); closeDropdown(); }} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">⬌ Center</span>
            </button>
            <button type="button" className={`dropdown-item ${textAlign === 'right' ? 'is-active' : ''}`} onClick={() => { onTextAlignChange && onTextAlignChange('right'); closeDropdown(); }} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">➡ Right</span>
            </button>
            <button type="button" className={`dropdown-item ${textAlign === 'justify' ? 'is-active' : ''}`} onClick={() => { onTextAlignChange && onTextAlignChange('justify'); closeDropdown(); }} onMouseDown={(e) => e.preventDefault()}>
              <span className="dropdown-item-label">↔ Justify</span>
            </button>
          </div>
        )}
      </div>

      {/* Group 7: Font Settings */}
      <div className="toolbar-group dropdown-container">
        <button
          type="button"
          className={`toolbar-btn dropdown-trigger ${activeDropdown === 'font' ? 'is-active' : ''}`}
          onClick={() => toggleDropdown('font')}
          onMouseDown={(e) => e.preventDefault()}
          data-tooltip="Typography"
        >
          <FiType size={14} />
          <FiChevronDown size={10} />
        </button>
        {activeDropdown === 'font' && (
          <div className="toolbar-dropdown-menu font-dropdown">
            <div className="font-dropdown-header">Typography</div>
            <div className="font-dropdown-body">
              <div className="font-dropdown-row">
                <label>Font</label>
                <select 
                  value={FONT_FAMILIES.find(f => f.value === fontFamily || f.css === fontFamily || fontFamily?.includes(f.value))?.value || 'Libre Baskerville'} 
                  onChange={(e) => onFontFamilyChange && onFontFamilyChange(e.target.value)}
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="font-dropdown-row">
                <label>Size</label>
                <select value={fontSize} onChange={(e) => onFontSizeChange && onFontSizeChange(e.target.value)}>
                  {[14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 28, 32, 36, 40].map(s => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
              <div className="font-dropdown-row">
                <label>Line height</label>
                <select value={lineHeight} onChange={(e) => onLineHeightChange && onLineHeightChange(e.target.value)}>
                  {[1.2, 1.4, 1.6, 1.75, 1.8, 2.0, 2.2, 2.4].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="font-dropdown-row">
                <label>Letter spacing</label>
                <select defaultValue="0">
                  <option value="-0.5">-0.5px</option>
                  <option value="0">Normal</option>
                  <option value="0.5">0.5px</option>
                  <option value="1">1px</option>
                  <option value="1.5">1.5px</option>
                  <option value="2">2px</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 8: Color & Highlight */}
      <div className="toolbar-group dropdown-container">
        <ToolbarButton 
          icon={<span style={{ fontWeight: 700, fontSize: '13px', color: textColor }}>A</span>} 
          onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setActiveDropdown(null); }} 
          tooltip="Text Color"
        />
        {showColorPicker && (
          <div className="toolbar-dropdown-menu color-dropdown">
            <div className="color-dropdown-header">Text Color</div>
            <div className="color-swatches-row">
              {['#1f1b16','#4a3728','#6b4c3b','#8b6914','#2d5a27','#1a5276','#6c3483','#922b21','#34495e','#7f8c8d','#d35400','#c0392b','#2980b9'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch-btn ${textColor === c ? 'active' : ''}`}
                  onClick={() => { onTextColorChange && onTextColorChange(c); }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          <div className="color-dropdown-custom">
            <input type="color" value={textColor} onChange={(e) => onTextColorChange && onTextColorChange(e.target.value)} />
            <span>Custom</span>
          </div>
          <button type="button" className="dropdown-item dropdown-item-apply" onClick={() => handleAction('text-color')} onMouseDown={(e) => e.preventDefault()}>
            Apply Color
          </button>
        </div>
      )}
        <ToolbarButton 
          icon={<span style={{ fontSize: '10px' }}>🖍</span>} 
          onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setActiveDropdown(null); }} 
          isActive={false}
          tooltip="Highlight"
        />
        {showHighlightPicker && (
          <div className="toolbar-dropdown-menu mark-dropdown">
            <div className="mark-dropdown-header">Highlight Color</div>
            <div className="color-swatches-row">
              {['#d7c7a5','#c9b99a','#e8d5b7','#d4a574','#b8956a','#a67c52','#e3c9b0','#d4b8a0','#c4a882','#b89a7a','#f0dbd0','#e6ccb2','#ddc0a0','#cdb79e'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch-btn ${highlightColor === c ? 'active' : ''}`}
                  onClick={() => { onHighlightColorChange && onHighlightColorChange(c); }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="color-dropdown-custom">
              <input type="color" value={highlightColor} onChange={(e) => onHighlightColorChange && onHighlightColorChange(e.target.value)} />
              <span>Custom</span>
            </div>
            <button type="button" className="dropdown-item dropdown-item-apply" onClick={() => handleAction('highlight')} onMouseDown={(e) => e.preventDefault()}>
              Apply Highlight
            </button>
          </div>
        )}
      </div>

      {/* Group 9: Undo / Redo */}
      <div className="toolbar-group">
        <ToolbarButton 
          icon={<span style={{ fontSize: '12px', fontWeight: 700 }}>↩</span>} 
          onClick={() => handleAction('undo')} 
          tooltip="Undo (Ctrl+Z)"
        />
        <ToolbarButton 
          icon={<span style={{ fontSize: '12px', fontWeight: 700 }}>↪</span>} 
          onClick={() => handleAction('redo')} 
          tooltip="Redo (Ctrl+Shift+Z)"
        />
      </div>
    </div>
  );
};

export default memo(MarkdownToolbar);