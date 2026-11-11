import React, { useState, useEffect, useCallback, useRef } from 'react';
import Entry from '../components/Entry';
import { getEntriesPage, getPublicEntriesPage } from '../shared/services/journalService';
import { getQuote, getPublicQuote } from '../shared/services/quoteService';
import { subscribeToMediaSettings } from '../shared/services/mediaSettingsService';
import useAuth from '../shared/hooks/useAuth';
import { buildAdminAppUrl } from '../shared/config';

const JournalHome = ({ onPostsChange }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);
  const loadingRef = useRef(false);
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

  // Subscribe to real-time media settings so changes from admin sync instantly
  useEffect(() => {
    const unsubscribe = subscribeToMediaSettings((settings) => {
      setMediaSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Sync posts to parent component for Navbar archive button safely
  useEffect(() => {
    if (onPostsChange) {
      onPostsChange(posts);
    }
  }, [posts, onPostsChange]);

  const fetchPosts = useCallback(async (cursor = null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setIsLoading(true);
      setLoadError('');
      const fetchFn = isPrivateMode ? getEntriesPage : getPublicEntriesPage;
      const { entries, lastDoc: nextLastDoc } = await fetchFn({ pageSize, lastDoc: cursor });

      setPosts(prevPosts => {
        const updatedPosts = cursor ? [...prevPosts, ...entries] : entries;
        return updatedPosts;
      });
      setLastDoc(nextLastDoc);
      setHasMore(entries.length === pageSize);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setLoadError(err?.message ? String(err.message) : 'Failed to load posts.');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [isPrivateMode]);

  useEffect(() => {
    if (authLoading) return;
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setIsInitialLoad(true);
    setLoadError('');
    fetchPosts(null);
  }, [authLoading, fetchPosts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || isLoading || loadError || !posts.length) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchPosts(lastDoc);
    }, { rootMargin: '500px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, isLoading, lastDoc, loadError, posts.length]);

  const showInitialLoading = isInitialLoad && (authLoading || isLoading);
  const showEmptyState = !isInitialLoad && !showInitialLoading && !isLoading && posts.length === 0 && !loadError;

  return (
    <div className="quiet-page">
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
          <div className="journal-initial-loading" role="status" aria-live="polite">
            <div className="journal-loading-card">
              <span className="journal-loading-label">Loading<span className="journal-loading-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>
            </div>
          </div>
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
        <div className="journal-pager" ref={loadMoreRef} aria-live="polite">
          {isLoading && !isInitialLoad && (
            <div className="journal-loading-more" role="status">
              <span className="journal-loading-label">Loading more entries<span className="journal-loading-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>
            </div>
          )}
          {loadError && posts.length > 0 && hasMore && (
            <button type="button" onClick={() => fetchPosts(lastDoc)} className="pager-link">
              Retry loading entries
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default JournalHome;
