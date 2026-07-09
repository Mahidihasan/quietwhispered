import React, { useState, useEffect, useRef } from 'react';

const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const YoutubeAudioPlayer = ({ url, compact = false, entryId }) => {
  const [videoId, setVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!url) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const id = getYouTubeId(url);
    if (!id) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setVideoId(id);
    setIsLoading(false);
  }, [url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (!url || hasError) return null;

  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&controls=1&iv_load_policy=3&playsinline=1&disablekb=1`
    : '';

  return (
    <div className={`spotify-player ${compact ? 'spotify-player--compact' : ''} ${isExpanded ? 'spotify-player--expanded' : ''}`}>
      <div className="spotify-player__header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="spotify-player__header-left">
          <span className="spotify-player__icon">🎵</span>
          <div className="spotify-player__info">
            <span className="spotify-player__label">YouTube Music attached</span>
            <span className="spotify-player__subtitle">
              {isExpanded ? 'Click to collapse' : 'Click to play'}
            </span>
          </div>
        </div>
        <div className="spotify-player__header-right">
          <span className={`spotify-player__toggle ${isExpanded ? 'is-open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div className="spotify-player__equalizer">
            <span className="eq-bar eq-bar--1"></span>
            <span className="eq-bar eq-bar--2"></span>
            <span className="eq-bar eq-bar--3"></span>
            <span className="eq-bar eq-bar--4"></span>
          </div>
        </div>
      </div>
      
      <div className={`spotify-player__body ${isExpanded ? 'is-visible' : ''}`}>
        <div className="spotify-player__embed-wrapper">
          {isLoading && (
            <div className="spotify-player__loading">
              <div className="spotify-player__loading-spinner">
                <span className="spinner-bar"></span>
                <span className="spinner-bar"></span>
                <span className="spinner-bar"></span>
                <span className="spinner-bar"></span>
              </div>
              <span>Loading music...</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="YouTube Audio Player"
            className="spotify-player__iframe"
            allow="encrypted-media; gyroscope; picture-in-picture; clipboard-write"
            loading="lazy"
            onLoad={handleIframeLoad}
            onError={handleError}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        </div>
      </div>
    </div>
  );
};

export default YoutubeAudioPlayer;