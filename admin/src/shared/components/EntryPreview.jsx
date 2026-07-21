import React from 'react';
import { format } from 'date-fns';
import MediaCard from './MediaCard.jsx';
import SpotifyPlayer from './SpotifyPlayer.jsx';
import YoutubeAudioPlayer from './YoutubeAudioPlayer.jsx';
import { resolvePostDate } from '../utils/dateUtils';

/**
 * Render inline content with markdown and HTML tag support.
 * This preserves HTML tags from toolbar (span, mark, u, etc.) while
 * also supporting standard markdown syntax and BBCode (backward compat).
 */
const renderInline = (text) => {
  let safe = String(text || '');
  
  // Step 1: Preserve existing HTML tags by replacing them with placeholders
  const htmlTags = [];
  let tagIndex = 0;
  safe = safe.replace(/<(\/?)(\w+)([^>]*)>/gi, (match) => {
    const placeholder = `\x00HTML${tagIndex}\x00`;
    htmlTags[tagIndex] = match;
    tagIndex++;
    return placeholder;
  });

  // Step 2: Escape HTML entities in the remaining text
  safe = safe
    .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
  
  // Step 3: Markdown syntax support on the escaped text
  
  // Bold: **text** or __text__
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_ (but not inside bold)
  safe = safe.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  safe = safe.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  
  // Strikethrough: ~~text~~
  safe = safe.replace(/~~(.+?)~~/g, '<s>$1</s>');
  
  // Inline code: `text`
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links: [text](url)
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, textContent, url) => {
    const sanitizedUrl = String(url || '').trim()
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'");
    return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${textContent}</a>`;
  });
  
  // BBCode support (backward compatibility)
  safe = safe.replace(/\[u\]/gi, '<u>').replace(/\[\/u\]/gi, '</u>');
  safe = safe.replace(/\[b\]/gi, '<strong>').replace(/\[\/b\]/gi, '</strong>');
  safe = safe.replace(/\[i\]/gi, '<em>').replace(/\[\/i\]/gi, '</em>');
  safe = safe.replace(/\[s\]/gi, '<s>').replace(/\[\/s\]/gi, '</s>');
  safe = safe.replace(/\[quote\]/gi, '<blockquote>').replace(/\[\/quote\]/gi, '</blockquote>');
  safe = safe.replace(/\[code\]/gi, '<code>').replace(/\[\/code\]/gi, '</code>');
  safe = safe.replace(/\[link=([^\]]+)\](.*?)\[\/link\]/gi, (match, url, textContent) => {
    const sanitizedUrl = String(url || '').trim()
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>');
    return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${textContent}</a>`;
  });
  safe = safe.replace(/\[mark=([^\]]+)\]/gi, (match, color) => {
    const sanitized = String(color || '').trim()
      .replace(/&/g, '&');
    return `<span style="background:${sanitized};padding:0 2px;border-radius:2px">`;
  });
  safe = safe.replace(/\[\/mark\]/gi, '</span>');
  safe = safe.replace(/\[color=([^\]]+)\]/gi, (match, color) => {
    const sanitized = String(color || '').trim()
      .replace(/&/g, '&');
    return `<span style="color:${sanitized}">`;
  });
  safe = safe.replace(/\[\/color\]/gi, '</span>');
  safe = safe.replace(/\[size=([^\]]+)\]/gi, (match, size) => {
    const numeric = size.trim().replace(/[^\d.]/g, '');
    const value = numeric ? `${numeric}px` : 'inherit';
    return `<span style="font-size:${value}">`;
  });
  safe = safe.replace(/\[\/size\]/gi, '</span>');
  
  // Step 4: Restore preserved HTML tags
  safe = safe.replace(/\x00HTML(\d+)\x00/g, (match, index) => {
    return htmlTags[parseInt(index)] || match;
  });

  return safe;
};

const EntryPreview = ({ post, mediaSettings }) => {
  const activeFrame = (post.mediaFrame && post.mediaFrame !== 'polaroid') ? post.mediaFrame : (mediaSettings?.mediaFrame || 'polaroid');
  const activeFrameSize = (post.frameSize && post.frameSize !== 'md') ? post.frameSize : (mediaSettings?.frameSize || 'md');
  const activeTexture = (post.paperTexture && post.paperTexture !== 'none') ? post.paperTexture : (mediaSettings?.paperTexture || 'none');
  const activePaperColor = (post.paperColor && post.paperColor !== '#f8f5f0') ? post.paperColor : (mediaSettings?.paperColor || '#FAF8F5');
  const moodLabel = post.mood ? post.mood : null;
  const weatherLabel = post.weather ? post.weather : null;
  const coverImage = post.media || (post.imageUrls && post.imageUrls[0]) || '';
  const videoUrl = post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '');
  const postDate = resolvePostDate(post);
  
  const titleSizeValue = Number(post.titleSize);
  const titleSize = Number.isFinite(titleSizeValue)
    ? Math.min(56, Math.max(20, titleSizeValue))
    : null;
    
  const lineHeightValue = Number(post.lineHeight);
  const lineHeight = Number.isFinite(lineHeightValue)
    ? Math.min(2.6, Math.max(1.2, lineHeightValue))
    : null;

  const titleFont = post.titleFont || post.font || null;
  const bodyFont = post.bodyFont || post.font || null;

  const lines = (post.content || '').split('\n');
  const blocks = [];
  let listBlock = null;

  const flushList = () => {
    if (listBlock) {
      blocks.push(listBlock);
      listBlock = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const indent = Math.floor((listMatch[1] || '').length / 2);
      const marker = listMatch[2];
      const listType = /\d+\./.test(marker) ? 'ol' : 'ul';
      if (!listBlock || listBlock.listType !== listType) {
        flushList();
        listBlock = { type: 'list', listType, items: [], key: `list-${index}` };
      }
      listBlock.items.push({
        html: renderInline(listMatch[3]),
        indent,
        key: `li-${index}-${listBlock.items.length}`
      });
      return;
    }

    flushList();

    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\s*\]$/i);
    if (imageMatch) {
      const [rawUrl, rawCaption] = imageMatch[1].split('|');
      blocks.push({
        type: 'image',
        src: rawUrl.trim(),
        caption: rawCaption ? rawCaption.trim() : '',
        key: `img-${index}`
      });
      return;
    }
    const videoMatch = trimmed.match(/^\[video:\s*(.+?)\s*\]$/i);
    if (videoMatch) {
      blocks.push({ type: 'video', src: videoMatch[1], key: `vid-${index}` });
      return;
    }
    const embedMatch = trimmed.match(/^\[embed:\s*(.+?)\s*\]$/i);
    if (embedMatch) {
      blocks.push({ type: 'embed', src: embedMatch[1], key: `emb-${index}` });
      return;
    }
    const alignMatch = trimmed.match(/^\[align=(left|center|right)\](.*)\[\/align\]$/i);
    if (alignMatch) {
      blocks.push({
        type: 'text',
        align: alignMatch[1].toLowerCase(),
        html: renderInline(alignMatch[2]),
        key: `txt-${index}`
      });
      return;
    }
    blocks.push({ type: 'text', align: null, html: renderInline(line), key: `txt-${index}` });
  });

  flushList();

  // Determine if cover image should be shown (not already rendered inline)
  // Check if the cover image URL already appears in the content
  const coverInContent = coverImage && post.content && post.content.includes(coverImage);
  const shouldShowCover = coverImage && post.type === 'image' && !coverInContent;

  return (
    <article
      id={`preview-${post._id || 'new'}`}
      className={`entry ${activeTexture !== 'none' ? 'texture-applied' : ''}`}
      style={activeTexture !== 'none' && activePaperColor ? { backgroundColor: activePaperColor } : undefined}
    >
      {activeTexture !== 'none' && (
        <div className={`entry-texture texture-${activeTexture}`} aria-hidden="true" />
      )}
      <header className="entry-header">
        <h2 className="entry-title" style={{
          ...(titleSize ? { fontSize: `${titleSize}px` } : {}),
          fontFamily: titleFont ? `'${titleFont}', ${titleFont === 'Caveat' ? 'cursive' : titleFont === 'Special Elite' ? 'monospace' : 'serif'}` : 'var(--font-hand)'
        }}>
          {post.title || 'Untitled'}
        </h2>
        <div className="entry-meta">
          {postDate && <span className="entry-date">{format(postDate, 'MMMM d, yyyy')}</span>}
          {weatherLabel && <span className="entry-weather-icon">{weatherLabel}</span>}
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {shouldShowCover && (
        <div className={`entry-media ${activeTexture !== 'none' ? `texture-${activeTexture}` : ''}`}>
          <MediaCard src={coverImage} alt={post.title || 'Preview cover'} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
        </div>
      )}

      <div className="entry-body" style={{
        ...(lineHeight ? { lineHeight } : {}),
        ...(post.bodySize ? { fontSize: `${post.bodySize}px` } : {}),
        fontFamily: bodyFont ? `'${bodyFont}', ${bodyFont === 'Libre Baskerville' || bodyFont === 'Georgia' || bodyFont === 'Merriweather' || bodyFont === 'Lora' || bodyFont === 'Source Serif 4' ? 'serif' : bodyFont === 'Caveat' ? 'cursive' : bodyFont === 'Special Elite' ? 'monospace' : 'serif'}` : 'var(--font-body)'
      }}>
        {blocks.map(block => {
          if (block.type === 'list') {
            const ListTag = block.listType === 'ol' ? 'ol' : 'ul';
            return (
              <ListTag key={block.key} className={`entry-list ${block.listType}`}>
                {block.items.map((item) => (
                  <li
                    key={item.key}
                    style={{ marginLeft: `${item.indent * 16}px` }}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                ))}
              </ListTag>
            );
          }
          if (block.type === 'image' || block.type === 'video' || block.type === 'embed') {
            const isVideo = block.type === 'video' || block.type === 'embed';
            return (
              <div key={block.key} className={`entry-media inline-media ${isVideo ? 'is-video' : ''}`.trim()}>
                <MediaCard
                  src={block.src}
                  alt={block.caption || post.title || 'inline media'}
                  caption={!isVideo ? block.caption : undefined}
                  className={!isVideo ? 'polaroid-card' : 'dotted-frame'}
                />
              </div>
            );
          }
          const alignClass = block.align ? `align-${block.align}` : '';
          return (
            <p
              key={block.key}
              className={`entry-paragraph ${alignClass}`.trim()}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        })}
      </div>

      {videoUrl && post.type === 'video' && (
        <div className="entry-media">
          <MediaCard src={videoUrl} alt={post.title || 'Video preview'} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
        </div>
      )}

      {post.spotifyUrl && (
        <SpotifyPlayer url={post.spotifyUrl} entryId={post._id || 'preview'} />
      )}
    </article>
  );
};

export default EntryPreview;