import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import MediaCard from './MediaCard';

const Entry = ({ post }) => {
  const entryRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = entryRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root: null, threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const moodLabel = post.mood ? post.mood : null;
  const coverImage = post.media || (post.imageUrls && post.imageUrls[0]) || '';
  const videoUrl = post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '');
  const titleSizeValue = Number(post.titleSize);
  const titleSize = Number.isFinite(titleSizeValue)
    ? Math.min(56, Math.max(20, titleSizeValue))
    : null;
  const lineHeightValue = Number(post.lineHeight);
  const lineHeight = Number.isFinite(lineHeightValue)
    ? Math.min(2.6, Math.max(1.2, lineHeightValue))
    : null;

  const allowedFonts = new Set(['EB Garamond', 'Newsreader', 'Inter']);

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderInline = (text) => {
    let safe = escapeHtml(text);
    safe = safe.replace(/\[u\]/gi, '<u>').replace(/\[\/u\]/gi, '</u>');
    safe = safe.replace(/\[mark=([^\]]+)\]/gi, (match, color) => {
      const sanitized = color.trim();
      return `<span style="background:${sanitized};padding:0 2px;border-radius:2px">`;
    });
    safe = safe.replace(/\[\/mark\]/gi, '</span>');
    safe = safe.replace(/\[color=([^\]]+)\]/gi, (match, color) => {
      const sanitized = color.trim();
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
      const normalized = font.trim();
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
      ref={entryRef}
      id={`post-${post._id}`}
      className={`entry scroll-reveal ${isVisible ? 'is-visible' : ''}`.trim()}
    >
      <header className="entry-header">
        <h2 className="entry-title" style={titleSize ? { fontSize: `${titleSize}px` } : undefined}>
          {post.title}
        </h2>
        <div className="entry-meta">
          <span className="entry-date">{format(new Date(post.date || post.createdAt), 'MMMM d, yyyy')}</span>
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {shouldShowCover && (
        <div className="entry-media">
          <MediaCard src={coverImage} alt={post.title} />
        </div>
      )}

      <div className="entry-body" style={lineHeight ? { lineHeight } : undefined}>
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
    </article>
  );
};

export default Entry;
