import React, { useMemo } from 'react';

/**
 * TagMemory - Visual organization of themes and memories
 * Shows tags grouped by frequency without cloud-style sizing
 * Minimal, text-focused view
 */
const TagMemory = ({ posts }) => {
  const tagData = useMemo(() => {
    if (!posts || posts.length === 0) return {};

    const tags = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!tags[tag]) {
            tags[tag] = { count: 0, lastUsed: new Date(0) };
          }
          tags[tag].count += 1;
          const postDate = new Date(post.date);
          if (postDate > tags[tag].lastUsed) {
            tags[tag].lastUsed = postDate;
          }
        });
      }
    });

    return tags;
  }, [posts]);

  const sortedTags = useMemo(() => {
    return Object.entries(tagData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30);
  }, [tagData]);

  if (sortedTags.length === 0) {
    return null;
  }

  return (
    <div className="tag-memory">
      <div className="memory-header">
        <h3 className="memory-title">Themes</h3>
        <span className="memory-info">{sortedTags.length} themes</span>
      </div>

      <div className="tags-list">
        {sortedTags.map(([tag, data]) => (
          <div key={tag} className="tag-item">
            <span className="tag-name">#{tag}</span>
            <span className="tag-count" title={`${data.count} entries`}>
              {data.count}
            </span>
          </div>
        ))}
      </div>

      <div className="memory-note">
        <p>Themes that shape your reflection</p>
      </div>
    </div>
  );
};

export default TagMemory;
