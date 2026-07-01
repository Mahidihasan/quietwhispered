import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/theme.css';
import './styles/textures.css';
import Navbar from './components/Navbar';
import JournalHome from './pages/JournalHome';
import PostPage from './pages/PostPage';
import { firebaseInitError } from './shared/firebase';

function App() {
    const [posts, setPosts] = useState([]);

    return (
        <Router>
            <div className="App">
                <Navbar posts={posts} />
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
                </Routes>
            </div>
        </Router>
    );
}

export default App;