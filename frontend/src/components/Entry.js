import React from 'react';
import { format } from 'date-fns';
import MediaCard from './MediaCard';

const Entry = ({ post }) => {
  const moodLabel = post.mood ? post.mood : null;
  const coverImage = post.media || (post.imageUrls && post.imageUrls[0]) || '';
  const videoUrl = post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '');

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

  const lines = (post.content || '').split('\n').filter(line => line.trim());
  const blocks = lines.map((line, index) => {
    const trimmed = line.trim();
    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\s*\]$/i);
    if (imageMatch) {
      const [rawUrl, rawCaption] = imageMatch[1].split('|');
      return {
        type: 'image',
        src: rawUrl.trim(),
        caption: rawCaption ? rawCaption.trim() : '',
        key: `img-${index}`
      };
    }
    const videoMatch = trimmed.match(/^\[video:\s*(.+?)\s*\]$/i);
    if (videoMatch) {
      return { type: 'video', src: videoMatch[1], key: `vid-${index}` };
    }
    const embedMatch = trimmed.match(/^\[embed:\s*(.+?)\s*\]$/i);
    if (embedMatch) {
      return { type: 'embed', src: embedMatch[1], key: `emb-${index}` };
    }
    const alignMatch = trimmed.match(/^\[align=(left|center|right)\](.*)\[\/align\]$/i);
    if (alignMatch) {
      return {
        type: 'text',
        align: alignMatch[1].toLowerCase(),
        html: renderInline(alignMatch[2]),
        key: `txt-${index}`
      };
    }
    return { type: 'text', align: null, html: renderInline(line), key: `txt-${index}` };
  });

  return (
    <article id={`post-${post._id}`} className="entry fade-in">
      <header className="entry-header">
        <h2 className="entry-title">{post.title}</h2>
        <div className="entry-meta">
          <span className="entry-date">{format(new Date(post.date || post.createdAt), 'MMMM d, yyyy')}</span>
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {coverImage && post.type === 'image' && (
        <div className="entry-media">
          <MediaCard src={coverImage} alt={post.title} />
        </div>
      )}

      <div className="entry-body">
        {blocks.map(block => {
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
