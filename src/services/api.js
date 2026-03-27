import axios from 'axios';
import { getCookie } from '../context/authContext';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for JWT
api.interceptors.request.use((config) => {
    const token = getCookie('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
