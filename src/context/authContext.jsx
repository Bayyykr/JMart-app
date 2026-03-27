import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import DeactivatedModal from '../components/common/DeactivatedModal';

const AuthContext = createContext();

const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

export const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const eraseCookie = (name) => {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeactivated, setShowDeactivated] = useState(false);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        eraseCookie('token');
    };

    useEffect(() => {
        const initAuth = async () => {
            const savedUser = localStorage.getItem('user');
            const token = getCookie('token');
            
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
                    if (err.response?.status === 403 && err.response?.data?.message === 'DEACTIVATED') {
                        setShowDeactivated(true);
                        logout();
                    } else {
                        // Token might be expired; ignore and continue with cached data
                        console.warn('Could not refresh user profile:', err.message);
                    }
                }
            }
            setLoading(false);
        };
        
        initAuth();
    }, []);

    // Global Interceptor for Deactivation
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 403 && error.response?.data?.message === 'DEACTIVATED') {
                    setShowDeactivated(true);
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        setShowDeactivated(false);
        localStorage.setItem('user', JSON.stringify(userData));
        if (token) setCookie('token', token, 3); // Persistent for 3 days
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
            <DeactivatedModal 
                isOpen={showDeactivated} 
                onClose={() => setShowDeactivated(false)} 
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
