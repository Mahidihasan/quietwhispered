import React from 'react';

const ArchiveSidebar = ({ posts }) => {
  if (!posts?.length) return null;

  const groups = posts.reduce((acc, post) => {
    const d = new Date(post.date || post.createdAt);
    const y = d.getFullYear();
    const m = d.toLocaleString('default', { month: 'long' });
    acc[y] = acc[y] || {};
    acc[y][m] = acc[y][m] || [];
    acc[y][m].push(post);
    return acc;
  }, {});

  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  const handleScroll = (e, postId) => {
    e.preventDefault();
    const target = document.getElementById(`post-${postId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="archive">
      <h3 className="archive-title">Archive</h3>
      {years.map(year => (
        <div key={year} className="archive-year">
          <div className="archive-year-label">{year}</div>
          <ul className="archive-months">
            {Object.keys(groups[year]).map(month => (
              <li key={month} className="archive-month">
                <span className="archive-month-label">{month}</span>
                <ul className="archive-posts">
                  {groups[year][month].map(p => (
                    <li key={p._id}>
                      <a 
                        href={`#post-${p._id}`} 
                        onClick={(e) => handleScroll(e, p._id)}
                      >
                        {p.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {/* Older posts link handled in JournalHome pager */}
    </aside>
  );
};

export default ArchiveSidebar;
