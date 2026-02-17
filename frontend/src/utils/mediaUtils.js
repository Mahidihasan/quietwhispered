/**
 * Media utility functions for handling various media types
 */

/**
 * Detect if a URL is a YouTube link and extract video ID
 */
export const getYouTubeId = (url) => {
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

/**
 * Detect if a URL is a Vimeo link and extract video ID
 */
export const getVimeoId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Determine media type from URL or file path
 */
export const getMediaType = (mediaUrl) => {
  if (!mediaUrl) return null;
  
  if (getYouTubeId(mediaUrl)) return 'youtube';
  if (getVimeoId(mediaUrl)) return 'vimeo';
  
  const extension = mediaUrl.split('.').pop().toLowerCase();
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  
  if (videoExtensions.includes(extension)) return 'video';
  if (imageExtensions.includes(extension)) return 'image';
  
  return null;
};

/**
 * Get embed URL for video platforms
 */
export const getEmbedUrl = (mediaUrl) => {
  const youtubeId = getYouTubeId(mediaUrl);
  if (youtubeId) {
    // Use privacy-enhanced domain and minimize UI chrome
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0&controls=1&iv_load_policy=3&fs=0&playsinline=1&disablekb=1&cc_load_policy=0`;
  }
  
  const vimeoId = getVimeoId(mediaUrl);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&badge=0&controls=1&autopause=1&dnt=1`;
  }
  
  return null;
};
