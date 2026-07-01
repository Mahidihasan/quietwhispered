import React from 'react';
import { resolvePostDate } from '../shared/utils/dateUtils';

const ArchiveSidebar = ({ posts }) => {
  if (!posts?.length) return null;

  const groups = posts.reduce((acc, post) => {
    const d = resolvePostDate(post);
    if (!d) {
      acc.Undated = acc.Undated || { posts: [] };
      acc.Undated.posts.push(post);
      return acc;
    }

    const y = d.getFullYear();
    const m = d.toLocaleString('default', { month: 'long' });
    acc[y] = acc[y] || {};
    acc[y][m] = acc[y][m] || [];
    acc[y][m].push(post);
    return acc;
  }, {});

  const years = Object.keys(groups)
    .filter((year) => year !== 'Undated')
    .sort((a, b) => Number(b) - Number(a));

  if (groups.Undated?.posts?.length) {
    years.push('Undated');
  }

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
          {year === 'Undated' ? (
            <>
              <div className="archive-year-label">Undated</div>
              <ul className="archive-months">
                <li className="archive-month">
                  <ul className="archive-posts">
                    {groups.Undated.posts.map(p => (
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
              </ul>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      ))}
      {/* Older posts link handled in JournalHome pager */}
    </aside>
  );
};

export default ArchiveSidebar;
