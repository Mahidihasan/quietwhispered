import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import MediaCard from '../shared/components/MediaCard.jsx';
import SpotifyPlayer from '../shared/components/SpotifyPlayer.jsx';
import { getPublicMediaSettings } from '../shared/services/mediaSettingsService';
import { resolvePostDate } from '../shared/utils/dateUtils';

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const Entry = ({ post, mediaSettings: propSettings }) => {
  const [mediaSettings, setMediaSettings] = useState(propSettings || null);

  useEffect(() => {
    if (propSettings) {
      setMediaSettings(propSettings);
      return;
    }
    // Fetch settings if not provided as prop
    getPublicMediaSettings().then(setMediaSettings).catch(() => {});
  }, [propSettings]);

  // Per-entry frame/texture/color takes priority over global settings
  const activeFrame = (post.mediaFrame && post.mediaFrame !== 'polaroid') ? post.mediaFrame : (mediaSettings?.mediaFrame || 'polaroid');
  const activeFrameSize = (post.frameSize && post.frameSize !== 'md') ? post.frameSize : (mediaSettings?.frameSize || 'md');
  const activeTexture = (post.paperTexture && post.paperTexture !== 'none') ? post.paperTexture : (mediaSettings?.paperTexture || 'none');
  const activePaperColor = (post.paperColor && post.paperColor !== '#f8f5f0') ? post.paperColor : (mediaSettings?.paperColor || '#FAF8F5');
  /* Off-white - default entry background color */
  const moodLabel = post.mood ? post.mood : null;
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

  // Per-entry font from post data
  const entryFont = post.font || null;
  const allowedFonts = new Set(['EB Garamond', 'Newsreader', 'Inter', 'Caveat', 'Patrick Hand', 'Kalam', 'Playfair Display', 'Source Serif 4', 'JetBrains Mono', 'Lora', 'DM Serif Display']);

  const renderInline = (text) => {
    let safe = escapeHtml(text);
    safe = safe.replace(/\[u\]/gi, '<u>').replace(/\[\/u\]/gi, '</u>');
    safe = safe.replace(/\[mark=([^\]]+)\]/gi, (match, color) => {
      const sanitized = escapeHtml(color.trim());
      return `<span style="background:${sanitized};padding:0 2px;border-radius:2px">`;
    });
    safe = safe.replace(/\[\/mark\]/gi, '</span>');
    safe = safe.replace(/\[color=([^\]]+)\]/gi, (match, color) => {
      const sanitized = escapeHtml(color.trim());
      return `<span style="color:${sanitized}">`;
    });
    safe = safe.replace(/\[\/color\]/gi, '</span>');
    safe = safe.replace(/\[size=([^\]]+)\]/gi, (match, size) => {
      const numeric = size.trim().replace(/[^\d.]/g, '');
      const value = numeric ? `${numeric}px` : 'inherit';
      return `<span style="font-size:${value}">`;
    });
    safe = safe.replace(/\[\/size\]/gi, '</span>');
    safe = safe.replace(/\[font=([^\]]+)\]/gi, (match, font) => {
      const normalized = escapeHtml(font.trim());
      if (!allowedFonts.has(normalized)) {
        return '<span>';
      }
      return `<span style="font-family:${normalized}">`;
    });
    safe = safe.replace(/\[\/font\]/gi, '</span>');
    return safe;
  };

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

  const inlineImageUrls = new Set(
    blocks
      .filter((block) => block.type === 'image' && block.src)
      .map((block) => block.src)
  );
  const shouldShowCover = coverImage && post.type === 'image' && !inlineImageUrls.has(coverImage);

  return (
    <article
      id={`post-${post._id}`}
      className={`entry ${activeTexture !== 'none' ? 'texture-applied' : ''}`}
      style={activeTexture !== 'none' && activePaperColor ? { backgroundColor: activePaperColor } : undefined}
    >
      {activeTexture !== 'none' && (
        <div className={`entry-texture texture-${activeTexture}`} aria-hidden="true" />
      )}
      <header className="entry-header" style={{ borderBottomColor: mediaSettings?.dividerColor || 'var(--divider-color, var(--cg-light))' }}>
        <h2 className="entry-title" style={{
          ...(titleSize ? { fontSize: `${titleSize}px` } : {}),
          ...(entryFont ? { fontFamily: `'${entryFont}', serif` } : {})
        }}>
          {post.title}
        </h2>
        <div className="entry-meta">
          {postDate && <span className="entry-date">{format(postDate, 'MMMM d, yyyy')}</span>}
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {shouldShowCover && (
        <div className={`entry-media ${activeTexture !== 'none' ? `texture-${activeTexture}` : ''}`}>
          <MediaCard src={coverImage} alt={post.title} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
        </div>
      )}

      <div className="entry-body" style={{
        ...(lineHeight ? { lineHeight } : {}),
        ...(post.bodySize ? { fontSize: `${post.bodySize}px` } : {}),
        ...(entryFont ? { fontFamily: `'${entryFont}', serif` } : {})
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
                  alt={block.caption || post.title}
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
          <MediaCard src={videoUrl} alt={post.title} />
        </div>
      )}

      {post.spotifyUrl && (
        <SpotifyPlayer url={post.spotifyUrl} entryId={post._id} />
      )}
    </article>
  );
};

export default Entry;