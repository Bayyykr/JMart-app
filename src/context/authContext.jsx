import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (savedUser && token) {
                // Set from localStorage immediately for fast render
                setUser(JSON.parse(savedUser));
                
                // Then refresh from API to get latest data (e.g. profile_image_url)
                try {
                    const res = await api.get('/user/me');
                    const freshUser = { ...JSON.parse(savedUser), ...res.data };
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } catch (err) {
                    // Token might be expired; ignore and continue with cached data
                    console.warn('Could not refresh user profile:', err.message);
                }
            }
            setLoading(false);
        };
        
        initAuth();
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (token) localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
