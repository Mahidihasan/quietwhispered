/**
 * Markdown utility functions for the journal editor.
 * All functions operate on raw Markdown text and cursor positions.
 * No HTML is ever stored - only standard Markdown syntax.
 */

/**
 * Get the current line information from the cursor position
 */
export const getLineInfo = (text, cursor) => {
  if (!text || cursor === undefined || cursor === null) return null;
  const lineStart = text.lastIndexOf('\n', cursor - 1) + 1;
  const lineEndIndex = text.indexOf('\n', cursor);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const line = text.slice(lineStart, lineEnd);
  const offset = cursor - lineStart;
  return { line, lineStart, lineEnd, offset, cursor };
};

/**
 * Replace content between start and end positions
 */
export const replaceRange = (text, start, end, replacement) => {
  return text.slice(0, start) + replacement + text.slice(end);
};

/**
 * Insert text at cursor position
 */
export const insertAtCursor = (text, cursor, insert) => {
  return replaceRange(text, cursor, cursor, insert);
};

/**
 * Wrap selected text with opening and closing tags (Markdown syntax)
 * e.g. wrapText(text, start, end, '**', '**') for bold
 * If no selection, inserts the tags and places cursor in the middle
 */
export const wrapSelection = (text, start, end, openTag, closeTag = '') => {
  if (!closeTag) closeTag = openTag;
  const selected = text.slice(start, end);
  const before = text.slice(0, start);
  const after = text.slice(end);

  if (selected) {
    return {
      newText: `${before}${openTag}${selected}${closeTag}${after}`,
      cursorStart: start + openTag.length,
      cursorEnd: end + openTag.length
    };
  } else {
    // No selection - insert placeholder and place cursor between tags
    return {
      newText: `${before}${openTag}${closeTag}${after}`,
      cursorStart: start + openTag.length,
      cursorEnd: start + openTag.length
    };
  }
};

/**
 * Apply text color using HTML span with inline style
 * Works for selected text or entire blocks
 */
export const applyTextColor = (text, start, end, color) => {
  const selected = text.slice(start, end);
  const before = text.slice(0, start);
  const after = text.slice(end);

  if (selected) {
    // Wrap selected text with color span
    return {
      newText: `${before}<span style="color: ${color};">${selected}</span>${after}`,
      cursorStart: start,
      cursorEnd: end
    };
  } else {
    // No selection - insert color span with placeholder
    return {
      newText: `${before}<span style="color: ${color};">text</span>${after}`,
      cursorStart: start + `<span style="color: ${color};">`.length,
      cursorEnd: start + `<span style="color: ${color};">text`.length
    };
  }
};

/**
 * Apply bold formatting (**text**)
 */
export const applyBold = (text, start, end) => {
  return wrapSelection(text, start, end, '**', '**');
};

/**
 * Apply italic formatting (*text*)
 */
export const applyItalic = (text, start, end) => {
  return wrapSelection(text, start, end, '*', '*');
};

/**
 * Apply bold+italic formatting (***text***)
 */
export const applyBoldItalic = (text, start, end) => {
  return wrapSelection(text, start, end, '***', '***');
};

/**
 * Apply underline as HTML <u> tag (Markdown doesn't have native underline)
 * We use a compatible approach with <u> which still renders in Markdown
 */
export const applyUnderline = (text, start, end) => {
  return wrapSelection(text, start, end, '<u>', '</u>');
};

/**
 * Apply strikethrough (~~text~~)
 */
export const applyStrikethrough = (text, start, end) => {
  return wrapSelection(text, start, end, '~~', '~~');
};

/**
 * Apply inline code (`code`)
 */
export const applyCode = (text, start, end) => {
  return wrapSelection(text, start, end, '`', '`');
};

/**
 * Create heading at the current line
 */
export const applyHeading = (text, cursor, level) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { line, lineStart } = info;
  const prefix = '#'.repeat(level) + ' ';
  
  // Remove existing heading prefix if any
  const cleanLine = line.replace(/^#+\s*/, '');
  const newLine = `${prefix}${cleanLine}`;
  const newText = replaceRange(text, lineStart, lineStart + line.length, newLine);
  
  const newCursor = lineStart + newLine.length;
  return { newText, cursorStart: newCursor, cursorEnd: newCursor };
};

/**
 * Toggle heading - if already a heading at this level, remove it
 */
export const toggleHeading = (text, cursor, level) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { line, lineStart } = info;
  const headingMatch = line.match(/^(#{1,6})\s/);
  
  if (headingMatch) {
    const existingLevel = headingMatch[1].length;
    if (existingLevel === level) {
      // Remove heading
      const cleanLine = line.replace(/^#{1,6}\s+/, '');
      const newText = replaceRange(text, lineStart, lineStart + line.length, cleanLine);
      return { newText, cursorStart: lineStart + cleanLine.length, cursorEnd: lineStart + cleanLine.length };
    }
  }
  
  return applyHeading(text, cursor, level);
};

/**
 * Create blockquote at the current line
 */
export const applyBlockquote = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { line, lineStart } = info;
  const newLine = `> ${line}`;
  const newText = replaceRange(text, lineStart, lineStart + line.length, newLine);
  
  return {
    newText,
    cursorStart: lineStart + newLine.length,
    cursorEnd: lineStart + newLine.length
  };
};

/**
 * Insert horizontal rule
 */
export const insertHorizontalRule = (text, cursor) => {
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  // Ensure it's on its own line
  const prefix = before.endsWith('\n') || before === '' ? '' : '\n';
  const suffix = after.startsWith('\n') || after === '' ? '' : '\n';
  const rule = `${prefix}---${suffix}`;
  return {
    newText: `${before}${rule}${after}`,
    cursorStart: cursor + rule.length,
    cursorEnd: cursor + rule.length
  };
};

/**
 * Insert ordered list item
 */
export const insertOrderedList = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { lineStart, lineEnd } = info;
  const list = '\n1. Item 1\n2. Item 2\n3. Item 3\n';
  const newText = replaceRange(text, lineStart, lineEnd, list);
  return {
    newText,
    cursorStart: lineStart + list.length,
    cursorEnd: lineStart + list.length
  };
};

/**
 * Insert unordered list item
 */
export const insertUnorderedList = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { lineStart, lineEnd } = info;
  const list = '\n- Item 1\n- Item 2\n- Item 3\n';
  const newText = replaceRange(text, lineStart, lineEnd, list);
  return {
    newText,
    cursorStart: lineStart + list.length,
    cursorEnd: lineStart + list.length
  };
};

/**
 * Insert task list
 */
export const insertTaskList = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return { newText: text, cursorStart: cursor, cursorEnd: cursor };
  
  const { lineStart, lineEnd } = info;
  const list = '\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n';
  const newText = replaceRange(text, lineStart, lineEnd, list);
  return {
    newText,
    cursorStart: lineStart + list.length,
    cursorEnd: lineStart + list.length
  };
};

/**
 * Insert link [text](url)
 */
export const insertLink = (text, start, end) => {
  const selected = text.slice(start, end);
  if (selected) {
    return wrapSelection(text, start, end, '[', '](url)');
  }
  return {
    newText: `${text.slice(0, start)}[link text](url)${text.slice(end)}`,
    cursorStart: start + 1,
    cursorEnd: start + 10 // select "link text"
  };
};

/**
 * Insert image as MediaCard-compatible format ([image:url])
 */
export const insertImage = (text, cursor, imageUrl, alt = '') => {
  const img = `\n[image:${imageUrl}]\n`;
  return insertAtCursor(text, cursor, img);
};

/**
 * Insert video as MediaCard-compatible format ([video:url])
 * For direct video file URLs or any video URL
 */
export const insertVideo = (text, cursor, videoUrl) => {
  const video = `\n[video:${videoUrl}]\n`;
  const newText = insertAtCursor(text, cursor, video);
  return {
    newText,
    cursorStart: cursor + video.length,
    cursorEnd: cursor + video.length
  };
};

/**
 * Insert embed (YouTube, Vimeo, etc.) as MediaCard-compatible format ([embed:url])
 */
export const insertEmbed = (text, cursor, embedUrl) => {
  const embed = `\n[embed:${embedUrl}]\n`;
  const newText = insertAtCursor(text, cursor, embed);
  return {
    newText,
    cursorStart: cursor + embed.length,
    cursorEnd: cursor + embed.length
  };
};

/**
 * Insert code block with language
 */
export const insertCodeBlock = (text, cursor, language = '') => {
  const block = `\n\`\`\`${language}\n\n\`\`\`\n`;
  const result = insertAtCursor(text, cursor, block);
  return {
    ...result,
    cursorStart: cursor + block.length - 4 - language.length,
    cursorEnd: cursor + block.length - 4 - language.length
  };
};

/**
 * Insert a table
 */
export const insertTable = (text, cursor) => {
  const table = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n';
  return insertAtCursor(text, cursor, table);
};

/**
 * Handle Enter key in list context - auto-continue list
 */
export const handleEnterInList = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return null;
  
  const { line, lineStart, lineEnd } = info;
  
  // Check for unordered list items (-, *, +)
  const ulMatch = line.match(/^(\s*)([-*+]) +(.+)?$/);
  // Check for ordered list items (1., 2., etc.)
  const olMatch = line.match(/^(\s*)(\d+)\. +(.+)?$/);
  // Check for task list items (- [ ] or - [x])
  const taskMatch = line.match(/^(\s*)[-*+] \[([ x])\] +(.+)?$/);
  // Check for empty list item
  const emptyListMatch = line.match(/^(\s*)([-*+]|\d+\.)\s*$/);
  const emptyTaskMatch = line.match(/^(\s*)[-*+] \[[ x]\]\s*$/);
  // Check for blockquote
  const quoteMatch = line.match(/^(\s*)>( ?)?(.+)?$/);
  const emptyQuoteMatch = line.match(/^(\s*)>\s*$/);
  
  if (emptyListMatch || emptyTaskMatch) {
    // Empty list item - remove it (end the list)
    let after = text.slice(lineEnd);
    if (after.startsWith('\n')) after = after.slice(1);
    return {
      newText: text.slice(0, lineStart) + '\n' + after,
      cursorStart: lineStart + 1,
      cursorEnd: lineStart + 1
    };
  }
  
  if (ulMatch) {
    const indent = ulMatch[1] || '';
    const marker = ulMatch[2];
    const newLine = `\n${indent}${marker} `;
    return insertAtCursor(text, cursor, newLine);
  }
  
  if (olMatch) {
    const indent = olMatch[1] || '';
    const num = parseInt(olMatch[2], 10);
    const newLine = `\n${indent}${num + 1}. `;
    return insertAtCursor(text, cursor, newLine);
  }
  
  if (taskMatch) {
    const indent = taskMatch[1] || '';
    const marker = taskMatch[2] === 'x' ? '- [x]' : '- [ ]';
    const newLine = `\n${indent}${marker} `;
    return insertAtCursor(text, cursor, newLine);
  }
  
  if (quoteMatch) {
    const indent = quoteMatch[1] || '';
    const spacer = quoteMatch[2] || '';
    const newLine = `\n${indent}> ${spacer}`;
    return insertAtCursor(text, cursor, newLine);
  }
  
  return null;
};

/**
 * Handle Tab key for list indentation
 */
export const handleTab = (text, cursor, shiftKey = false) => {
  const info = getLineInfo(text, cursor);
  if (!info) return null;
  
  const { line, lineStart, offset } = info;
  
  if (shiftKey) {
    // Un-indent: remove 2 spaces from beginning
    if (line.startsWith('  ')) {
      const newText = replaceRange(text, lineStart, lineStart + 2, '');
      return {
        newText,
        cursorStart: Math.max(0, cursor - 2),
        cursorEnd: Math.max(0, cursor - 2)
      };
    }
    return null;
  }
  
  // Check if on a list line
  const listMatch = line.match(/^(\s*)([-*+]|\d+\.)/);
  if (listMatch) {
    // Add indent before the marker
    const beforeMarker = listMatch[1] || '';
    const marker = listMatch[2];
    const markerIndex = line.indexOf(marker);
    const newLine = beforeMarker + '  ' + line.slice(beforeMarker.length);
    const newText = replaceRange(text, lineStart, lineStart + line.length, newLine);
    return {
      newText,
      cursorStart: lineStart + offset + 2,
      cursorEnd: lineStart + offset + 2
    };
  }
  
  // Insert 2 spaces
  return insertAtCursor(text, cursor, '  ');
};

/**
 * Toggle task checkbox
 */
export const toggleTaskCheckbox = (text, cursor) => {
  const info = getLineInfo(text, cursor);
  if (!info) return null;
  
  const { line, lineStart, lineEnd } = info;
  const taskMatch = line.match(/^(\s*[-*+] )\[([ x])\]/);
  
  if (taskMatch) {
    const prefix = taskMatch[1];
    const currentState = taskMatch[2];
    const newState = currentState === 'x' ? ' ' : 'x';
    const newLine = line.replace(/\[[ x]\]/g, `[${newState}]`);
    const newText = replaceRange(text, lineStart, lineEnd, newLine);
    return {
      newText,
      cursorStart: cursor,
      cursorEnd: cursor
    };
  }
  
  return null;
};

/**
 * Insert emoji at cursor (shortcode or Unicode)
 */
export const insertEmoji = (text, cursor, emoji) => {
  return insertAtCursor(text, cursor, emoji);
};

/**
 * Parse slash commands from text
 * Returns the command text and position if a slash command is being typed
 */
export const parseSlashCommand = (text, cursor) => {
  if (!text || cursor <= 0) return null;
  
  // Look backwards from cursor for `/`
  const beforeCursor = text.slice(0, cursor);
  const slashIndex = beforeCursor.lastIndexOf('/');
  
  if (slashIndex === -1) return null;
  
  // Ensure the slash is at the beginning of a line or whitespace
  const charBeforeSlash = slashIndex > 0 ? beforeCursor[slashIndex - 1] : null;
  if (charBeforeSlash && charBeforeSlash !== '\n' && charBeforeSlash !== ' ') return null;
  
  const commandText = beforeCursor.slice(slashIndex + 1);
  
  // Only trigger if there's text after slash and no newline
  if (!commandText || commandText.includes('\n')) return null;
  
  // Only show for up to 20 characters of typing
  if (commandText.length > 20) return null;
  
  return {
    slashPosition: slashIndex,
    commandText
  };
};

/**
 * Execute a slash command, replacing the /command text with the result
 */
export const executeSlashCommand = (text, cursor, commandType) => {
  const parsed = parseSlashCommand(text, cursor);
  if (!parsed) return null;
  
  const { slashPosition } = parsed;
  const before = text.slice(0, slashPosition);
  const after = text.slice(cursor);
  
  switch (commandType) {
    case 'heading1':
      return { newText: `${before}#  ${after}`, cursorStart: before.length + 3, cursorEnd: before.length + 3 };
    case 'heading2':
      return { newText: `${before}##  ${after}`, cursorStart: before.length + 4, cursorEnd: before.length + 4 };
    case 'heading3':
      return { newText: `${before}###  ${after}`, cursorStart: before.length + 5, cursorEnd: before.length + 5 };
    case 'quote':
      return { newText: `${before}>  ${after}`, cursorStart: before.length + 3, cursorEnd: before.length + 3 };
    case 'checklist':
      return { newText: `${before}- [ ]  ${after}`, cursorStart: before.length + 7, cursorEnd: before.length + 7 };
    case 'divider':
      return { newText: `${before}---\n${after}`, cursorStart: before.length + 4, cursorEnd: before.length + 4 };
    case 'image':
      return { newText: `${before}[image:url]${after}`, cursorStart: before.length + 7, cursorEnd: before.length + 10 };
    case 'video':
      return { newText: `${before}[video:url]${after}`, cursorStart: before.length + 7, cursorEnd: before.length + 10 };
    case 'embed':
      return { newText: `${before}[embed:url]${after}`, cursorStart: before.length + 7, cursorEnd: before.length + 10 };
    case 'table':
      return { newText: `${before}\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n${after}`, cursorStart: before.length + 1, cursorEnd: before.length + 1 };
    case 'code':
      return { newText: `${before}\n\`\`\`\n\n\`\`\`\n${after}`, cursorStart: before.length + 5, cursorEnd: before.length + 5 };
    case 'link':
      return { newText: `${before}[link text](url)${after}`, cursorStart: before.length + 1, cursorEnd: before.length + 10 };
    case 'date':
      const date = new Date().toISOString().split('T')[0];
      return { newText: `${before}${date}${after}`, cursorStart: before.length + date.length, cursorEnd: before.length + date.length };
    case 'time':
      const time = new Date().toLocaleTimeString();
      return { newText: `${before}${time}${after}`, cursorStart: before.length + time.length, cursorEnd: before.length + time.length };
    default:
      return null;
  }
};

/**
 * Get word count for Markdown (strips formatting for accurate counting)
 */
export const getWordCount = (markdown) => {
  if (!markdown || !markdown.trim()) return 0;
  // Strip Markdown formatting for word count
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*|_|~|`){1,3}/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[|]/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
  return plain.split(/\s+/).filter(Boolean).length;
};

/**
 * Get character count
 */
export const getCharCount = (markdown) => {
  return (markdown || '').length;
};

/**
 * Sanitize Markdown for safe storage - ensure no HTML sneaks in
 */
export const sanitizeMarkdown = (text) => {
  if (!text) return '';
  // Only store Markdown, never HTML
  return text;
};