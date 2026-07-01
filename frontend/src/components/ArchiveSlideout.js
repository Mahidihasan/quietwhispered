import React, { useState } from 'react';

const ArchiveSlideout = ({ posts, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedYears, setExpandedYears] = useState({});

  // Group posts by year & month
  const groups = (posts || []).reduce((acc, post) => {
    const d = new Date(post.date || post.createdAt);
    const y = d.getFullYear();
    const m = d.toLocaleString('default', { month: 'long' });
    acc[y] = acc[y] || {};
    acc[y][m] = acc[y][m] || [];
    acc[y][m].push(post);
    return acc;
  }, {});

  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  // Auto-expand current year on first open
  if (!posts?.length) return null;

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // Filter posts by search
  const filterPosts = (post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (post.title && post.title.toLowerCase().includes(q)) ||
      (post.body && post.body.toLowerCase().includes(q)) ||
      (post.mood && post.mood.toLowerCase().includes(q)) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(q)))
    );
  };

  const handleScroll = (e, postId) => {
    e.preventDefault();
    onClose();
    const target = document.getElementById(`post-${postId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const countPostsForYear = (year) => {
    return Object.values(groups[year]).reduce((sum, posts) => sum + posts.length, 0);
  };

  return (
    <div className={`archive-slideout ${isOpen ? 'archive-slideout--open' : ''}`}>
      <div className="archive-slideout-header">
        <h3 className="archive-slideout-title">✦ Archive</h3>
        <button className="archive-slideout-close" onClick={onClose} aria-label="Close archive">
          <span className="close-icon">✕</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="archive-search">
        <span className="archive-search-icon">◈</span>
        <input
          type="text"
          className="archive-search-input"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search archive entries"
        />
        {searchQuery && (
          <button className="archive-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
            ◇
          </button>
        )}
      </div>

      <div className="archive-slideout-body">
        {searchQuery.trim() ? (
          /* Flat search results */
          <div className="archive-search-results">
            {years.map(year => (
              Object.keys(groups[year]).map(month => (
                groups[year][month]
                  .filter(filterPosts)
                  .map(p => (
                    <div key={p._id} className="archive-search-item">
                      <a
                        href={`#post-${p._id}`}
                        onClick={(e) => handleScroll(e, p._id)}
                      >
                        <span className="search-item-dot">◈</span>
                        <span className="search-item-title">{p.title}</span>
                        <span className="search-item-date">
                          {new Date(p.date || p.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                        </span>
                      </a>
                    </div>
                  ))
              ))
            ))}
          </div>
        ) : (
          /* Year timeline */
          years.map(year => {
            // If no years expanded yet, default to showing the first year
            const hasAnyExpanded = Object.keys(expandedYears).length > 0;
            const isExpanded = hasAnyExpanded ? expandedYears[year] : year === years[0];
            const postCount = countPostsForYear(year);
            return (
              <div key={year} className="archive-year-block">
                <button
                  className="archive-year-toggle"
                  onClick={() => toggleYear(year)}
                  aria-expanded={isExpanded}
                >
                  <span className="year-arrow">{isExpanded ? '▾' : '▸'}</span>
                  <span className="year-label">{year}</span>
                  <span className="year-count">{postCount}</span>
                </button>
                {isExpanded && (
                  <div className="archive-year-content">
                    {Object.keys(groups[year]).map(month => (
                      <div key={month} className="archive-month-block">
                        <span className="archive-month-label">{month}</span>
                        <div className="archive-month-posts">
                          {groups[year][month].map(p => (
                            <a
                              key={p._id}
                              href={`#post-${p._id}`}
                              className="archive-post-link"
                              onClick={(e) => handleScroll(e, p._id)}
                            >
                              {p.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ArchiveSlideout;