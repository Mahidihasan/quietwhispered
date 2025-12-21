import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiImage, FiVideo, FiBook } from 'react-icons/fi';
import MediaCard from './MediaCard';

const PostCard = ({ post }) => {
    const getTypeIcon = (type) => {
        switch(type) {
            case 'image': return <FiImage />;
            case 'video': return <FiVideo />;
            case 'journey': return <FiMapPin />;
            default: return <FiBook />;
        }
    };

    return (
        <Link to={`/post/${post._id}`} className="post-card">
            <div className="post-header">
                <div className="post-type">
                    {getTypeIcon(post.type)}
                    <span className="type-label">{post.type}</span>
                </div>
                {post.mood && (
                    <div className="mood-indicator" data-mood={post.mood}></div>
                )}
            </div>
            
            <h3 className="post-title">{post.title}</h3>
            
            <div className="post-meta">
                <FiCalendar />
                <span>{format(new Date(post.date), 'MMM dd, yyyy')}</span>
                
                {post.location && (
                    <>
                        <FiMapPin />
                        <span>{post.location}</span>
                    </>
                )}
            </div>
            
            <p className="post-excerpt">
                {post.content.substring(0, 150)}...
            </p>
            
            {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                    {post.tags.map(tag => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                    ))}
                </div>
            )}
            
            {post.media && (
                <div 
                    className="post-media-preview" 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className="media-thumbnail">
                        <MediaCard src={post.media} alt={post.title} />
                    </div>
                </div>
            )}
        </Link>
    );
};

export default PostCard;