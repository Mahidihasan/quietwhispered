/**
 * Spotify utility functions for extracting IDs and generating embed URLs
 */

/**
 * Extract Spotify track ID from a Spotify URL or URI
 */
export const getSpotifyTrackId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Extract Spotify playlist ID from a Spotify URL or URI
 */
export const getSpotifyPlaylistId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify:playlist:([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Extract Spotify album ID from a Spotify URL or URI
 */
export const getSpotifyAlbumId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /spotify:album:([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

/**
 * Determine Spotify media type from URL
 */
export const getSpotifyType = (url) => {
  if (!url) return null;
  if (getSpotifyTrackId(url)) return 'track';
  if (getSpotifyPlaylistId(url)) return 'playlist';
  if (getSpotifyAlbumId(url)) return 'album';
  return null;
};

/**
 * Get the Spotify embed URL for track/playlist/album
 */
export const getSpotifyEmbedUrl = (url) => {
  if (!url) return null;
  
  const trackId = getSpotifyTrackId(url);
  if (trackId) {
    return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=0&controls=1&view=compact`;
  }
  
  const playlistId = getSpotifyPlaylistId(url);
  if (playlistId) {
    return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0&autoplay=0&controls=1&view=compact`;
  }
  
  const albumId = getSpotifyAlbumId(url);
  if (albumId) {
    return `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0&autoplay=0&controls=1&view=compact`;
  }
  
  return null;
};
