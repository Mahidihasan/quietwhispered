import React, { useState } from 'react';
import { format } from 'date-fns';
import MediaCard from './MediaCard';

const Entry = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const moodLabel = post.mood ? post.mood : null;
  
  const paragraphs = post.content.split('\n').filter(p => p.trim());
  const firstParagraph = paragraphs[0] || '';
  const remainingContent = paragraphs.slice(1);
  const hasMore = remainingContent.length > 0;

  const handleExpand = () => {
    if (!isExpanded && hasMore) {
      setIsExpanded(true);
    }
  };

  return (
    <article id={`post-${post._id}`} className={`entry fade-in ${!isExpanded && hasMore ? 'entry-collapsed' : ''}`}>
      <header className="entry-header" onClick={handleExpand}>
        <h2 className="entry-title">{post.title}</h2>
        <div className="entry-meta">
          <span className="entry-date">{format(new Date(post.date), 'MMMM d, yyyy')}</span>
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {post.media && post.type === 'image' && (
        <div className="entry-media">
          <MediaCard src={post.media} alt={post.title} />
        </div>
      )}

      <div className="entry-body" onClick={handleExpand}>
        <p>{firstParagraph}</p>
        
        {isExpanded && remainingContent.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {isExpanded && post.media && post.type === 'video' && (
        <div className="entry-media">
          <MediaCard src={post.media} alt={post.title} />
        </div>
      )}
    </article>
  );
};

export default Entry;
