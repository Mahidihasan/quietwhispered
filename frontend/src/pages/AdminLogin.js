import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { FiLogIn } from 'react-icons/fi';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(credentials);

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('admin', JSON.stringify(response.data.user));
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="login-box">
                    <div className="login-header">
                        <h2>Admin Portal</h2>
                        <p>Secure Access</p>
                        <FiLogIn size={40} />
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="login-input"
                                placeholder="Admin username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="login-input"
                                placeholder="Admin password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Enter Admin Portal'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Demo: admin / changeme123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
