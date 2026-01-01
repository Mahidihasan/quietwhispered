import React, { useMemo } from 'react';
import { format } from 'date-fns';

/**
 * OnThisDay - Shows entries from past years on the same date
 * A gentle way to revisit and reflect on previous thoughts
 */
const OnThisDay = ({ posts }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const onThisDayEntries = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const entries = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getMonth() === currentMonth && 
             postDate.getDate() === currentDate &&
             postDate.getFullYear() !== today.getFullYear();
    });

    return entries.sort((a, b) => 
      new Date(b.date).getFullYear() - new Date(a.date).getFullYear()
    );
  }, [posts, currentMonth, currentDate, today]);

  if (onThisDayEntries.length === 0) {
    return null;
  }

  return (
    <div className="on-this-day">
      <div className="day-header">
        <h3 className="day-title">On This Day</h3>
        <span className="day-info">{onThisDayEntries.length} year{onThisDayEntries.length > 1 ? 's' : ''} ago</span>
      </div>

      <div className="day-entries">
        {onThisDayEntries.map((entry, idx) => {
          const entryDate = new Date(entry.date);
          const yearDiff = today.getFullYear() - entryDate.getFullYear();
          
          return (
            <div key={entry._id} className="day-entry">
              <div className="entry-year">
                <span className="year-ago">{yearDiff} {yearDiff === 1 ? 'year' : 'years'} ago</span>
              </div>
              <div className="entry-excerpt">
                <h4 className="entry-title">{entry.title}</h4>
                <p className="entry-text">
                  {entry.content.substring(0, 120)}
                  {entry.content.length > 120 ? '…' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="day-note">
        <p>A gentle reminder of your growth</p>
      </div>
    </div>
  );
};

export default OnThisDay;
