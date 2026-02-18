import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';
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
        return (
            <div className="loading minimal">
                <div className="minimal-loader"><span></span></div>
                <p>Checking access...</p>
            </div>
        );
    }
    return user ? children : <Navigate to="/admin/login" />;
};

// Ensure direct hits to /admin/login or other paths normalize to hash URLs
const HashNormalizer = () => {
    useEffect(() => {
        const { hash, pathname, search } = window.location;
        const hasHash = hash && hash !== '#' && hash !== '#/';
        if (!hasHash && pathname && pathname !== '/') {
            window.location.hash = `#${pathname}${search || ''}`;
        }
    }, []);
    return null;
};

function App() {
    const { user, loading } = useAuth();
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <Router>
            <div className="App">
                <HashNormalizer />
                <Navbar onToggleTheme={handleToggleTheme} theme={theme} />
                {firebaseInitError && (
                    <div className="error-state firebase-error">
                        <h3>Firebase configuration issue</h3>
                        <p>{String(firebaseInitError.message || firebaseInitError)}</p>
                    </div>
                )}
                <Routes>
                    <Route
                        path="/"
                        element={<JournalHome />}
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
