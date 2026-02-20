import React, { useState, useEffect, useCallback } from 'react';
import Entry from '../components/Entry';
import ArchiveSidebar from '../components/ArchiveSidebar';
import { getEntriesPage, getPublicEntriesPage } from '../services/journalService';
import { getQuote, getPublicQuote } from '../services/quoteService';
import useAuth from '../hooks/useAuth';

const JournalHome = () => {
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
      // Keep default quote on error
    }
  }, [isPrivateMode]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);


  const fetchPosts = useCallback(async (cursor = null) => {
    try {
      setIsLoading(true);
      setLoadError('');
      const fetchFn = isPrivateMode ? getEntriesPage : getPublicEntriesPage;
      const { entries, lastDoc: nextLastDoc } = await fetchFn({ pageSize, lastDoc: cursor });
      setPosts(prev => (cursor ? [...prev, ...entries] : entries));
      setLastDoc(nextLastDoc);
      setHasMore(entries.length === pageSize);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setLoadError(err?.message ? String(err.message) : 'Failed to load posts.');
    } finally {
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

  const showInitialLoading = isInitialLoad && isLoading;
  const showEmptyState = !showInitialLoading && !isLoading && posts.length === 0 && !loadError;

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
          <div className="error-state pixel-card">
            <h3>Could not load entries</h3>
            <p>{loadError}</p>
            {!isPrivateMode && (
              <p>
                If these entries are private, sign in via <a href="#/admin/login">Admin Login</a>.
              </p>
            )}
          </div>
        )}

        {showInitialLoading && (
          <div className="loading minimal">
            <div className="minimal-loader"><span></span></div>
            <p>Loading journal...</p>
          </div>
        )}

        {showEmptyState && (
          <div className="empty-state pixel-card">
            <h3>No entries yet</h3>
            <p>{isPrivateMode ? 'Create your first entry from the admin dashboard.' : 'No public entries are available yet.'}</p>
          </div>
        )}

        {posts.map(post => (
          <Entry key={post._id} post={post} />
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

      {/* ARCHIVE SIDEBAR */}
      {posts.length > 0 && (
        <aside className="quiet-archive">
          <ArchiveSidebar posts={posts} />
        </aside>
      )}
    </div>
  );
};

export default JournalHome;
