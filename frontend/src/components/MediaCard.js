import React, { useEffect, useState } from 'react';
import { getMediaType, getEmbedUrl } from '../utils/mediaUtils';

const FALLBACK_IMAGE = '/images/posts/fallback.svg';

/**
 * Modern media card component for images and videos
 * Supports: uploaded images/videos, YouTube, and Vimeo embeds
 */
const MediaCard = ({ src, alt, caption, className = '' }) => {
  const [safeSrc, setSafeSrc] = useState('');

  useEffect(() => {
    // Process the src URL
    let processedSrc = src;
    
    if (!src) {
      setSafeSrc(FALLBACK_IMAGE);
      return;
    }

    // If it's just a filename (no http/https and no /), prepend /uploads/
    if (typeof src === 'string' && 
        !src.startsWith('http') && 
        !src.startsWith('/') && 
        !src.includes('youtu') && 
        !src.includes('vimeo')) {
      processedSrc = `/uploads/${src}`;
    }

    setSafeSrc(processedSrc);
  }, [src]);

  if (!src) return null;

  const mediaType = getMediaType(safeSrc);
  const embedUrl = getEmbedUrl(safeSrc);

  const handleError = (e) => {
    console.error('Image failed to load:', safeSrc);
    if (safeSrc !== FALLBACK_IMAGE) {
      setSafeSrc(FALLBACK_IMAGE);
    }
  };

  const renderMedia = () => {
    // YouTube or Vimeo embed
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title={alt || 'Embedded video'}
          frameBorder="0"
          allow="encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      );
    }
    
    if (mediaType === 'video') {
      return (
        <video controls playsInline preload="metadata" onError={handleError}>
          <source src={safeSrc} type="video/mp4" />
          <source src={safeSrc} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Image (default)
    return <img src={safeSrc} alt={alt || ''} onError={handleError} />;
  };

  return (
    <div className={`media-card ${className}`}>
      {renderMedia()}
      {caption && <div className="media-caption">{caption}</div>}
    </div>
  );
};

export default MediaCard;
