import React, { useState, useEffect, useRef, useCallback } from 'react';

const SLASH_COMMANDS = [
  { id: 'heading1', label: 'Heading 1', icon: '#', description: 'Large heading', shortcut: 'Ctrl+1' },
  { id: 'heading2', label: 'Heading 2', icon: '##', description: 'Medium heading', shortcut: 'Ctrl+2' },
  { id: 'heading3', label: 'Heading 3', icon: '###', description: 'Small heading', shortcut: 'Ctrl+3' },
  { id: 'separator', label: '—', type: 'separator' },
  { id: 'quote', label: 'Quote', icon: '"', description: 'Blockquote', shortcut: 'Ctrl+Q' },
  { id: 'checklist', label: 'Checklist', icon: '☐', description: 'Checklist / task list', shortcut: 'Ctrl+Shift+C' },
  { id: 'divider', label: 'Divider', icon: '—', description: 'Horizontal rule', shortcut: '---' },
  { id: 'separator2', label: '—', type: 'separator' },
  { id: 'image', label: 'Image', icon: '🖼', description: 'Insert image', shortcut: '' },
  { id: 'table', label: 'Table', icon: '⊞', description: 'Insert table', shortcut: '' },
  { id: 'code', label: 'Code', icon: '</>', description: 'Code block', shortcut: 'Ctrl+Shift+`' },
  { id: 'link', label: 'Link', icon: '🔗', description: 'Insert link', shortcut: 'Ctrl+K' },
  { id: 'separator3', label: '—', type: 'separator' },
  { id: 'date', label: 'Date', icon: '📅', description: 'Insert today\'s date', shortcut: '' },
  { id: 'time', label: 'Time', icon: '🕐', description: 'Insert current time', shortcut: '' },
];

const SlashCommands = ({ position, onSelect, onClose, filterText }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const listRef = useRef(null);

  const visibleCommands = SLASH_COMMANDS.filter(cmd => cmd.type !== 'separator');

  useEffect(() => {
    const filtered = visibleCommands.filter(cmd => 
      !filterText || cmd.id.toLowerCase().includes(filterText.toLowerCase()) || 
      cmd.label.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [filterText]);

  const handleKeyDown = useCallback((e) => {
    const items = filteredCommands;
    if (items.length === 0) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        return true;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return true;
      case 'Enter':
        e.preventDefault();
        onSelect(items[selectedIndex].id);
        return true;
      case 'Escape':
        e.preventDefault();
        onClose();
        return true;
      default:
        return false;
    }
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) return null;

  return (
    <div 
      className="slash-commands-palette"
      style={{
        left: position?.x || 0,
        top: position?.y || 0,
      }}
    >
      <div className="slash-commands-header">
        <span className="slash-commands-title">Commands</span>
        {filterText && (
          <span className="slash-commands-filter">/ {filterText}</span>
        )}
      </div>
      <div className="slash-commands-list" ref={listRef}>
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            type="button"
            className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelect(cmd.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="slash-command-icon">{cmd.icon}</span>
            <div className="slash-command-info">
              <span className="slash-command-label">{cmd.label}</span>
              {cmd.description && (
                <span className="slash-command-description">{cmd.description}</span>
              )}
            </div>
            {cmd.shortcut && (
              <span className="slash-command-shortcut">{cmd.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashCommands;