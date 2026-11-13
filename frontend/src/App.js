import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './styles/theme.css';
import './styles/textures.css';
import Navbar from './components/Navbar';
import JournalHome from './pages/JournalHome';
import PostPage from './pages/PostPage';
import { firebaseInitError } from './shared/firebase';

function AppContent() {
    const [posts, setPosts] = useState([]);
    const location = useLocation();
    const isStandaloneShare = location.pathname.startsWith('/share/');

    return (
        <div className="App">
            <Navbar posts={posts} hideArchive={isStandaloneShare} />
            {firebaseInitError && (
                <div className="error-state">
                    <h3>Firebase configuration issue</h3>
                    <p>{String(firebaseInitError.message || firebaseInitError)}</p>
                </div>
            )}
            <Routes>
                <Route
                    path="/"
                    element={<JournalHome onPostsChange={setPosts} />}
                />
                <Route
                    path="/post/:id"
                    element={<PostPage />}
                />
                <Route
                    path="/share/:id"
                    element={<PostPage standalone />}
                />
            </Routes>
        </div>
    );
}

function App() {
    return <Router><AppContent /></Router>;
}

export default App;
