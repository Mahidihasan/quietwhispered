import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import MediaCard from '../shared/components/MediaCard.jsx';
import MarkdownRenderer from '../shared/components/MarkdownRenderer.jsx';
import SpotifyPlayer from '../shared/components/SpotifyPlayer.jsx';
import { getPublicMediaSettings } from '../shared/services/mediaSettingsService';
import { resolvePostDate } from '../shared/utils/dateUtils';

const Entry = ({ post, mediaSettings: propSettings }) => {
  const [mediaSettings, setMediaSettings] = useState(propSettings || null);

  useEffect(() => {
    if (propSettings) {
      setMediaSettings(propSettings);
      return;
    }
    // Fetch settings if not provided as prop
    getPublicMediaSettings().then(setMediaSettings).catch(() => {});
  }, [propSettings]);

  // Per-entry frame/texture/color takes priority over global settings
  const activeFrame = (post.mediaFrame && post.mediaFrame !== 'polaroid') ? post.mediaFrame : (mediaSettings?.mediaFrame || 'polaroid');
  const activeFrameSize = (post.frameSize && post.frameSize !== 'md') ? post.frameSize : (mediaSettings?.frameSize || 'md');
  const activeTexture = (post.paperTexture && post.paperTexture !== 'none') ? post.paperTexture : (mediaSettings?.paperTexture || 'none');
  const activePaperColor = (post.paperColor && post.paperColor !== '#f8f5f0') ? post.paperColor : (mediaSettings?.paperColor || '#FAF8F5');
  /* Off-white - default entry background color */
  const moodLabel = post.mood ? post.mood : null;
  const weatherLabel = post.weather ? post.weather : null;
  const coverImage = post.media || (post.imageUrls && post.imageUrls[0]) || '';
  const videoUrl = post.youtubeEmbedUrl || (post.type === 'video' ? post.media : '');
  // Check if the video URL is already embedded in the content to avoid duplication
  const videoAlreadyInContent = videoUrl && post.content && (
    post.content.includes(`[embed:${videoUrl}]`) ||
    post.content.includes(`[video:${videoUrl}]`)
  );
  const postDate = resolvePostDate(post);
  const titleSizeValue = Number(post.titleSize);
  const titleSize = Number.isFinite(titleSizeValue)
    ? Math.min(56, Math.max(20, titleSizeValue))
    : null;
  const lineHeightValue = Number(post.lineHeight);
  const lineHeight = Number.isFinite(lineHeightValue)
    ? Math.min(2.6, Math.max(1.2, lineHeightValue))
    : null;

  // Per-entry font from post data - separate title and body fonts
  const titleFont = post.titleFont || post.font || null;
  const bodyFont = post.bodyFont || post.font || null;

  // Determine if cover image should be shown (not already rendered inline by MarkdownRenderer)
  // Check if the cover image URL already appears in the content
  const coverInContent = coverImage && post.content && post.content.includes(coverImage);
  const shouldShowCover = coverImage && post.type === 'image' && !coverInContent;

  return (
    <article
      id={`post-${post._id}`}
      className={`entry ${activeTexture !== 'none' ? 'texture-applied' : ''}`}
      style={activeTexture !== 'none' && activePaperColor ? { backgroundColor: activePaperColor } : undefined}
    >
      {activeTexture !== 'none' && (
        <div className={`entry-texture texture-${activeTexture}`} aria-hidden="true" />
      )}
      <header className="entry-header" style={{ borderBottomColor: mediaSettings?.dividerColor || 'var(--divider-color, var(--cg-light))' }}>
        <h2 className="entry-title" style={{
          ...(titleSize ? { fontSize: `${titleSize}px` } : {}),
          fontFamily: titleFont ? `'${titleFont}', ${titleFont === 'Caveat' ? 'cursive' : titleFont === 'Special Elite' ? 'monospace' : 'serif'}` : 'var(--font-hand)'
        }}>
          {post.title}
        </h2>
        <div className="entry-meta">
          {postDate && <span className="entry-date">{format(postDate, 'MMMM d, yyyy')}</span>}
          {weatherLabel && <span className="entry-weather-icon">{weatherLabel}</span>}
          {moodLabel && <span className="entry-sep">•</span>}
          {moodLabel && <span className="entry-mood">{moodLabel}</span>}
          {post.tags?.length ? (
            <span className="entry-tags">{post.tags.map(t => `#${t}`).join(' ')}</span>
          ) : null}
        </div>
      </header>

      {shouldShowCover && (
        <div className={`entry-media ${activeTexture !== 'none' ? `texture-${activeTexture}` : ''}`}>
          <MediaCard src={coverImage} alt={post.title} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
        </div>
      )}

      <div className="entry-body" style={{
        ...(lineHeight ? { lineHeight } : {}),
        ...(post.bodySize ? { fontSize: `${post.bodySize}px` } : {}),
        fontFamily: bodyFont ? `'${bodyFont}', ${bodyFont === 'Libre Baskerville' || bodyFont === 'Georgia' || bodyFont === 'Merriweather' || bodyFont === 'Lora' || bodyFont === 'Source Serif 4' ? 'serif' : bodyFont === 'Caveat' ? 'cursive' : bodyFont === 'Special Elite' ? 'monospace' : 'serif'}` : 'var(--font-body)'
      }}>
        <MarkdownRenderer 
          content={post.content} 
          className="entry-paragraph" 
          bulletStyle={post.bulletStyle}
          quoteStyle={post.quoteStyle}
        />
      </div>

      {videoUrl && post.type === 'video' && !videoAlreadyInContent && (
        <div className="entry-media">
          <MediaCard src={videoUrl} alt={post.title} frame={activeFrame} frameSize={activeFrameSize} texture={activeTexture} />
        </div>
      )}

      {post.spotifyUrl && (
        <SpotifyPlayer url={post.spotifyUrl} entryId={post._id} />
      )}

      {post.customAudioUrl && (
        <div className="entry-media entry-custom-audio" style={{ marginTop: '16px' }}>
          <audio controls style={{ width: '100%' }}>
            <source src={post.customAudioUrl} type="audio/mpeg" />
            <source src={post.customAudioUrl} type="audio/wav" />
            <source src={post.customAudioUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </article>
  );
};

export default Entry;