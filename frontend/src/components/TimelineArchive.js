import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const TimelineArchive = ({ posts }) => {
    if (!posts || posts.length === 0) {
        return null;
    }

    // Group posts by year and month for a compact archive
    const groupedPosts = posts.reduce((acc, post) => {
        const date = new Date(post.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(post);
        return acc;
    }, {});

    const timelineKeys = Object.keys(groupedPosts).sort().reverse();

    const formatMonthYear = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    };

    return (
        <div className="timeline-archive minimal">
            <div className="timeline-header">
                <h3>Archive</h3>
                <span className="timeline-info">{timelineKeys.length} months</span>
            </div>

            <div className="archive-list">
                {timelineKeys.map(key => (
                    <div key={key} className="archive-row">
                        <div className="archive-month">
                            <FiCalendar size={14} />
                            <span>{formatMonthYear(key)}</span>
                        </div>
                        <span className="archive-count">{groupedPosts[key].length} posts</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineArchive;
