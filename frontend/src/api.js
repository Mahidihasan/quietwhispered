import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.get('/auth/logout'),
    getMe: () => api.get('/auth/me'),
};

// Posts API calls
export const postsAPI = {
    getAll: (params) => api.get('/posts', { params }),
    getPublic: (id) => api.get(`/posts/public/${id}`),
    getAdminAll: () => api.get('/posts/admin/all'),
    create: (data) => api.post('/posts', data),
    update: (id, data) => api.put(`/posts/${id}`, data),
    delete: (id) => api.delete(`/posts/${id}`),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Quote API calls
export const quoteAPI = {
    get: () => api.get('/quote', {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    }),
    update: (data) => api.put('/quote', data),
};

export default api;
