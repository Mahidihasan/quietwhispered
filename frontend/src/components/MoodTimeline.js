import React, { useMemo } from 'react';

/**
 * MoodTimeline - Visual mood tracking across journal entries
 * Shows small colored dots for each day with mood entries
 * No gamification, just quiet reflection
 */
const MoodTimeline = ({ posts, limit = 30 }) => {
  const moodColors = {
    calm: '#8b9d8f',
    reflective: '#9b8f9d',
    content: '#8f9d9d',
    peaceful: '#8d9baa',
    energetic: '#9d9085',
    melancholic: '#8f8f9d',
    hopeful: '#9d9090',
    'default': '#9a9a9a'
  };

  const moodData = useMemo(() => {
    if (!posts || posts.length === 0) return {};

    const data = {};
    posts.forEach(post => {
      const date = new Date(post.date).toISOString().split('T')[0];
      if (!data[date]) {
        data[date] = {
          mood: post.mood || 'default',
          count: 0
        };
      }
      data[date].count += 1;
    });

    return data;
  }, [posts]);

  const dates = useMemo(() => {
    const allDates = Object.keys(moodData).sort().reverse();
    return allDates.slice(0, limit);
  }, [moodData, limit]);

  if (dates.length === 0) {
    return null;
  }

  const getColor = (mood) => {
    const normalized = (mood || 'default').toLowerCase().trim();
    return moodColors[normalized] || moodColors['default'];
  };

  return (
    <div className="mood-timeline">
      <div className="timeline-header">
        <h3 className="timeline-title">Mood Memory</h3>
        <span className="timeline-info">{dates.length} days</span>
      </div>
      
      <div className="timeline-dots">
        {dates.map(date => {
          const entry = moodData[date];
          const d = new Date(date + 'T00:00:00');
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <div
              key={date}
              className="mood-dot"
              style={{ backgroundColor: getColor(entry.mood) }}
              title={`${label}: ${entry.mood || 'quiet'}`}
            />
          );
        })}
      </div>

      <div className="timeline-legend">
        <p className="legend-text">Each dot is a day of writing</p>
      </div>
    </div>
  );
};

export default MoodTimeline;
