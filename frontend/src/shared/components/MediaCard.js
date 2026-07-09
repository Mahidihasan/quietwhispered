import React, { useEffect, useState } from 'react';
import { getMediaType, getEmbedUrl } from '../utils/mediaUtils';

const FALLBACK_IMAGE = '/images/posts/fallback.svg';

const MediaCard = ({ src, alt, caption, className = '', 
  frame = 'polaroid', 
  frameSize = 'md',
  texture = 'none' }) => {
  const [safeSrc, setSafeSrc] = useState('');

  useEffect(() => {
    let processedSrc = src;
    
    if (!src) {
      setSafeSrc(FALLBACK_IMAGE);
      return;
    }

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

  const handleError = () => {
    console.error('Image failed to load:', safeSrc);
    if (safeSrc !== FALLBACK_IMAGE) {
      setSafeSrc(FALLBACK_IMAGE);
    }
  };

  const renderMedia = () => {
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

    return <img src={safeSrc} alt={alt || ''} onError={handleError} />;
  };

  const frameClass = frame && frame !== 'none' ? `media-frame-${frame}` : '';
  const sizeClass = frameSize ? `media-frame-${frameSize}` : '';

  return (
    <div className={`media-card ${className} ${frameClass} ${sizeClass}`.trim()}>
      {renderMedia()}
      {caption && <div className="media-caption">{caption}</div>}
    </div>
  );
};

export default MediaCard;
