import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';
import Navbar from './components/Navbar';
import JournalHome from './pages/JournalHome';
import PostPage from './pages/PostPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/admin/login" />;
};

function App() {
    useEffect(() => {
        // Set API base URL if not already set
        if (!process.env.REACT_APP_API_URL) {
            process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
        }
    }, []);

    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/" element={<JournalHome />} />
                    <Route path="/post/:id" element={<PostPage />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute>
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