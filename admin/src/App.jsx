import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { firebaseInitError } from './shared/firebase';
import useAuth from './shared/hooks/useAuth';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) {
    return null;
  }
  return user ? children : <Navigate to="/login" replace />;
};

const RootRedirect = ({ user, loading }) => {
  if (loading) {
    return null;
  }
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

function App() {
  const { user, loading } = useAuth();

  return (
    <Router>
      <div className="App">
        {firebaseInitError && (
          <div className="error-state">
            <h3>Firebase configuration issue</h3>
            <p>{String(firebaseInitError.message || firebaseInitError)}</p>
          </div>
        )}
        <Routes>
          <Route path="/" element={<RootRedirect user={user} loading={loading} />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
