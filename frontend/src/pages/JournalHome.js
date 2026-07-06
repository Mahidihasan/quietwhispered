import React, { useState, useEffect, useCallback } from 'react';
import Entry from '../components/Entry';
import { getEntriesPage, getPublicEntriesPage } from '../shared/services/journalService';
import { getQuote, getPublicQuote } from '../shared/services/quoteService';
import { getPublicMediaSettings } from '../shared/services/mediaSettingsService';
import useAuth from '../shared/hooks/useAuth';
import { buildAdminAppUrl } from '../shared/config';

const JournalHome = ({ onPostsChange }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 5;
  const { user, loading: authLoading } = useAuth();
  const isPrivateMode = Boolean(user);
  const [quote, setQuote] = useState({
    text: "",
    author: "",
    imageUrl: "",
    useImageCover: false,
    fontSize: 18
  });
  const [mediaSettings, setMediaSettings] = useState(null);

  const fetchQuote = useCallback(async () => {
    try {
      const data = isPrivateMode ? await getQuote() : await getPublicQuote();
      if (data) {
        setQuote(prev => ({
          ...prev,
          ...data,
          imageUrl: data.imageUrl || '',
          useImageCover: Boolean(data.useImageCover),
          fontSize: Number(data.fontSize) || 18
        }));
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
    }
  }, [isPrivateMode]);

  const fetchMediaSettings = useCallback(async (forceRefresh = false) => {
    try {
      const settings = await getPublicMediaSettings(forceRefresh);
      setMediaSettings(settings);
    } catch (err) {
      console.error('Error fetching media settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchMediaSettings();
  }, [fetchMediaSettings]);

  // Re-fetch media settings when the page becomes visible (e.g. switching back from admin)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMediaSettings(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMediaSettings]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const fetchPosts = useCallback(async (cursor = null) => {
    try {
      setIsLoading(true);
      setLoadError('');
      const fetchFn = isPrivateMode ? getEntriesPage : getPublicEntriesPage;
      const { entries, lastDoc: nextLastDoc } = await fetchFn({ pageSize, lastDoc: cursor });

      setPosts(prevPosts => {
        const updatedPosts = cursor ? [...prevPosts, ...entries] : entries;

        // Pass posts up to App for the Navbar archive button
        if (onPostsChange) onPostsChange(updatedPosts);

        return updatedPosts;
      });
      setLastDoc(nextLastDoc);
      setHasMore(entries.length === pageSize);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setLoadError(err?.message ? String(err.message) : 'Failed to load posts.');
    } finally {
      setIsLoading(false);
    }
  }, [isPrivateMode, onPostsChange]);

  useEffect(() => {
    if (authLoading) return;
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setIsInitialLoad(true);
    setLoadError('');
    fetchPosts(null);
  }, [authLoading, fetchPosts]);

  const showInitialLoading = isInitialLoad && isLoading;
  const showEmptyState = !isInitialLoad && !showInitialLoading && !isLoading && posts.length === 0 && !loadError;
  const activeTexture = mediaSettings?.paperTexture || 'none';

  return (
    <div className={`quiet-page ${activeTexture !== 'none' ? 'texture-applied' : ''}`.trim()}>
      {activeTexture !== 'none' && (
        <div className={`quiet-page-texture texture-${activeTexture}`} aria-hidden="true" />
      )}
      {/* MAIN READING AREA */}
      <main className="quiet-main">
        <div
          className={`journal-quote ${quote.useImageCover && quote.imageUrl ? 'is-image' : ''}`}
          style={quote.useImageCover && quote.imageUrl ? { backgroundImage: `url(${quote.imageUrl})` } : undefined}
        >
          {!quote.useImageCover && (
            <>
              <p style={{ fontSize: `${quote.fontSize || 18}px` }}>{quote.text}</p>
              <span className="journal-quote-author">{quote.author}</span>
            </>
          )}
        </div>

        {loadError && (
          <div className="error-state">
            <h3>Could not load entries</h3>
            <p>{loadError}</p>
            {!isPrivateMode && (
              <p>
                If these entries are private, sign in via <a href={buildAdminAppUrl('/login')}>Admin Login</a>.
              </p>
            )}
          </div>
        )}

        {showInitialLoading && (
          null
        )}

        {showEmptyState && (
          <div className="empty-state">
            <h3>No entries yet</h3>
            <p>{isPrivateMode ? 'Create your first entry from the admin dashboard.' : 'No public entries are available yet.'}</p>
          </div>
        )}

        {posts.map(post => (
          <Entry key={post._id} post={post} mediaSettings={mediaSettings} />
        ))}
        <nav className="journal-pager">
          {hasMore && (
            <button
              type="button"
              onClick={() => fetchPosts(lastDoc)}
              className="pager-link"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </nav>
      </main>
    </div>
  );
};

export default JournalHome;