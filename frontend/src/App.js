import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';
import './styles/textures.css';
import Navbar from './components/Navbar';
import JournalHome from './pages/JournalHome';
import PostPage from './pages/PostPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import useAuth from './hooks/useAuth';
import { firebaseInitError } from './firebase';

// Protected Route Component
const ProtectedRoute = ({ children, user, loading }) => {
    if (loading) {
        return null;
    }
    return user ? children : <Navigate to="/admin/login" replace />;
};

function App() {
    const { user, loading } = useAuth();
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
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute user={user} loading={loading}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;