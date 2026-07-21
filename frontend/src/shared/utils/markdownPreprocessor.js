/**
 * markdownPreprocessor.js
 * 
 * Pre-processes content for MarkdownRenderer by converting BBCode-style tags
 * and custom syntax to standard Markdown that react-markdown can process natively.
 * 
 * Strategy:
 * - Convert BBCode to standard Markdown syntax where possible
 * - For inline formatting without Markdown equivalent (color, size, font, mark, underline),
 *   preserve the HTML tags so they pass through to react-markdown with rehypeRaw
 * - Block-level custom syntax (image, video, embed, quote, code, align, list)
 *   is converted to standard Markdown or comment markers
 * 
 * IMPORTANT: HTML tags from toolbar (span, mark, u) are PRESERVED, not stripped.
 * This allows react-markdown + rehypeRaw to render them properly.
 * 
 * Images are converted to custom comment markers so they render as MediaCard
 * components (polaroid style) instead of plain <img> tags.
 */

/**
 * Escape HTML special characters
 */
const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
};

/**
 * Convert BBCode inline tags to Markdown syntax.
 * Tags without Markdown equivalents are converted to HTML tags (preserved for rehypeRaw).
 */
const bbcodeToMarkdown = (text) => {
  let result = text;

  // Bold: [b]text[/b] → **text**
  result = result.replace(/\[b\]/gi, '**').replace(/\[\/b\]/gi, '**');

  // Italic: [i]text[/i] → *text*
  result = result.replace(/\[i\]/gi, '*').replace(/\[\/i\]/gi, '*');

  // Strikethrough: [s]text[/s] → ~~text~~ (react-markdown + remark-gfm supports this)
  result = result.replace(/\[s\]/gi, '~~').replace(/\[\/s\]/gi, '~~');

  // Underline: [u]text[/u] → <u>text</u> (HTML tag preserved for rehypeRaw)
  result = result.replace(/\[u\]/gi, '<u>').replace(/\[\/u\]/gi, '</u>');

  // [mark=color]text[/mark] → <mark style="background:color">text</mark>
  result = result.replace(/\[mark=([^\]]+)\]/gi, (match, color) => {
    return `<mark style="background:${color.trim()}">`;
  });
  result = result.replace(/\[\/mark\]/gi, '</mark>');

  // [color=value]text[/color] → <span style="color:value">text</span>
  result = result.replace(/\[color=([^\]]+)\]/gi, (match, color) => {
    return `<span style="color:${color.trim()}">`;
  });
  result = result.replace(/\[\/color\]/gi, '</span>');

  // [size=value]text[/size] → <span style="font-size:value">text</span>
  result = result.replace(/\[size=([^\]]+)\]/gi, (match, size) => {
    const numeric = size.trim().replace(/[^\d.]/g, '');
    const value = numeric ? `${numeric}px` : 'inherit';
    return `<span style="font-size:${value}">`;
  });
  result = result.replace(/\[\/size\]/gi, '</span>');

  // [font=name]text[/font] → <span style="font-family:name">text</span>
  result = result.replace(/\[font=([^\]]+)\]/gi, (match, font) => {
    return `<span style="font-family:${font.trim()}">`;
  });
  result = result.replace(/\[\/font\]/gi, '</span>');

  // [link=url]text[/link] → [text](url)
  result = result.replace(/\[link=([^\]]+)\](.*?)\[\/link\]/gi, (match, url, textContent) => {
    const sanitizedUrl = escapeHtml(url.trim());
    return `[${textContent}](${sanitizedUrl})`;
  });

  return result;
};

/**
 * Pre-process block-level custom syntax to standard Markdown.
 * This handles entire lines or multi-line constructs.
 */
const processContent = (content) => {
  if (!content) return '';

  const lines = content.split('\n');
  const resultLines = [];
  let inListBlock = false;
  let listType = 'ul';
  let listStyle = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle empty lines
    if (!trimmed) {
      if (inListBlock) {
        resultLines.push('');
        inListBlock = false;
        listStyle = null;
      }
      resultLines.push('');
      continue;
    }

    // Check for code block start/end tags
    const codeStartMatch = trimmed.match(/^\[code\]$/i);
    const codeEndMatch = trimmed.match(/^\[\/code\]$/i);
    if (codeStartMatch) {
      inCodeBlock = true;
      resultLines.push('```');
      continue;
    }
    if (codeEndMatch) {
      inCodeBlock = false;
      resultLines.push('```');
      continue;
    }

    // If inside a code block, pass through as-is
    if (inCodeBlock) {
      resultLines.push(trimmed);
      continue;
    }

    // Check for list start tag: [list=style]
    const listStartMatch = trimmed.match(/^\[list=([^\]]+)\]$/i);
    if (listStartMatch) {
      listStyle = listStartMatch[1].toLowerCase();
      inListBlock = true;
      continue;
    }

    // Check for list end tag: [/list]
    if (trimmed.match(/^\[\/list\]$/i)) {
      inListBlock = false;
      listStyle = null;
      continue;
    }

    // Check for list items (including cozy markers)
    const listMatch = line.match(/^(\s*)([-*•♥★✦❀◇→❧✎⌇☽〜]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const indent = Math.floor((listMatch[1] || '').length / 2);
      const marker = listMatch[2];
      const detectedType = /\d+\./.test(marker) ? 'ol' : 'ul';

      // If switching list types, close previous list
      if (inListBlock && detectedType !== listType) {
        resultLines.push('');
        inListBlock = false;
        listStyle = null;
      }

      if (!inListBlock) {
        listType = detectedType;
        inListBlock = true;
      }

      const indentPrefix = indent > 0 ? '  '.repeat(indent) : '';
      const processedText = bbcodeToMarkdown(listMatch[3]);
      resultLines.push(`${indentPrefix}- ${processedText}`);

      // Add cozy list style as a data attribute on the list item
      if (listStyle && listStyle !== 'default') {
        resultLines.push(`<!-- cozy-list:${listStyle} -->`);
      }
      continue;
    }

    // If we were in a list and hit non-list content, close the list
    if (inListBlock) {
      resultLines.push('');
      inListBlock = false;
      listStyle = null;
    }

    // Check for [image:url|caption] - convert to custom comment marker for MediaCard rendering
    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\s*\]$/i);
    if (imageMatch) {
      const [rawUrl, rawCaption] = imageMatch[1].split('|');
      const url = rawUrl.trim();
      const caption = rawCaption ? rawCaption.trim() : '';
      // Emit as custom comment marker so MarkdownRenderer renders it as MediaCard
      resultLines.push(`<!-- image:${url}|${caption} -->`);
      continue;
    }

    // Check for [video:url]
    const videoMatch = trimmed.match(/^\[video:\s*(.+?)\s*\]$/i);
    if (videoMatch) {
      resultLines.push(`<!-- video:${videoMatch[1].trim()} -->`);
      continue;
    }

    // Check for [embed:url]
    const embedMatch = trimmed.match(/^\[embed:\s*(.+?)\s*\]$/i);
    if (embedMatch) {
      resultLines.push(`<!-- embed:${embedMatch[1].trim()} -->`);
      continue;
    }

    // Check for [quote]text[/quote] on a single line
    const quoteMatch = trimmed.match(/^\[quote\](.*)\[\/quote\]$/i);
    if (quoteMatch) {
      const quoteContent = bbcodeToMarkdown(quoteMatch[1]);
      resultLines.push(`> ${quoteContent}`);
      continue;
    }

    // Check for [align=left|center|right]text[/align] - wrap in alignment comment markers
    const alignMatch = trimmed.match(/^\[align=(left|center|right)\](.*)\[\/align\]$/i);
    if (alignMatch) {
      const align = alignMatch[1].toLowerCase();
      const alignContent = bbcodeToMarkdown(alignMatch[2]);
      // Align uses custom markers that the MarkdownRenderer intercepts
      resultLines.push(`<!-- align:${align} -->`);
      resultLines.push(alignContent);
      resultLines.push('<!-- end-align -->');
      continue;
    }

    // Regular text line - process inline BBCode to markdown
    resultLines.push(bbcodeToMarkdown(line));
  }

  // Close any open list
  if (inListBlock) {
    resultLines.push('');
  }

  return resultLines.join('\n');
};

/**
 * Extract custom block data like video/embed URLs, image URLs, and alignment markers
 * from HTML comments placed by the preprocessor.
 */
const extractCustomBlocks = (content) => {
  const blocks = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for image comment marker
    const imageMatch = line.match(/^<!-- image:(.+?)\|(.+?) -->$/);
    if (imageMatch) {
      blocks.push({ type: 'image', src: imageMatch[1], caption: imageMatch[2], line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for image comment marker without caption
    const imageNoCaptionMatch = line.match(/^<!-- image:(.+?)\| -->$/);
    if (imageNoCaptionMatch) {
      blocks.push({ type: 'image', src: imageNoCaptionMatch[1], caption: '', line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for video comment marker
    const videoMatch = line.match(/^<!-- video:(.+?) -->$/);
    if (videoMatch) {
      blocks.push({ type: 'video', src: videoMatch[1], line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for embed comment marker
    const embedMatch = line.match(/^<!-- embed:(.+?) -->$/);
    if (embedMatch) {
      blocks.push({ type: 'embed', src: embedMatch[1], line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for align start marker
    const alignMatch = line.match(/^<!-- align:(left|center|right) -->$/);
    if (alignMatch) {
      blocks.push({ type: 'align-start', align: alignMatch[1], line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for align end marker
    if (line === '<!-- end-align -->') {
      blocks.push({ type: 'align-end', line: i });
      lines.splice(i, 1);
      continue;
    }

    // Check for cozy list style marker
    const listStyleMatch = line.match(/^<!-- cozy-list:(.+?) -->$/);
    if (listStyleMatch) {
      blocks.push({ type: 'list-style', style: listStyleMatch[1], line: i });
      lines.splice(i, 1);
      continue;
    }

    i++;
  }

  return { processedContent: lines.join('\n'), blocks };
};

export { processContent, extractCustomBlocks, bbcodeToMarkdown, escapeHtml };