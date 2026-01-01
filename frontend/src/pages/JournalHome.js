import React, { useState, useEffect, useCallback } from 'react';
import Entry from '../components/Entry';
import ArchiveSidebar from '../components/ArchiveSidebar';
import { postsAPI, quoteAPI } from '../api';

const JournalHome = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [quote, setQuote] = useState({
    text: "The pen is mightier than the sword.",
    author: "— Edward Bulwer-Lytton"
  });

  const fetchQuote = useCallback(async () => {
    try {
      const response = await quoteAPI.get();
      if (response.data.success) {
        setQuote(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      // Keep default quote on error
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getAll({ sort: 'newest', page, limit: 10 });
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  if (loading) {
    return (
      <div className="quiet-page">
        <div className="loading">
          <div className="pixel-spinner"></div>
          <p>Loading journal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiet-page">
      {/* MAIN READING AREA */}
      <main className="quiet-main">
        {page === 1 && (
          <div className="journal-quote">
            <p>{quote.text}</p>
            <span className="journal-quote-author">{quote.author}</span>
          </div>
        )}
        
        {posts.map(post => (
          <Entry key={post._id} post={post} />
        ))}
        <nav className="journal-pager">
          {page > 1 && (
            <a href="#" onClick={(e) => { e.preventDefault(); setPage(page - 1); }} className="pager-link">← Newer posts</a>
          )}
          {page < totalPages && (
            <a href="#" onClick={(e) => { e.preventDefault(); setPage(page + 1); }} className="pager-link">Older posts →</a>
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
