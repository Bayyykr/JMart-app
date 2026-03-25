import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            // Save token to localStorage for interceptor
            localStorage.setItem('token', token);

            // Update context
            login(user);

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'driver') {
                try {
                    // Check if driver is verified immediately after login
                    const statusRes = await api.get('/driver/status');
                    if (statusRes.data.status === 'verified') {
                        navigate('/driver/dashboard');
                    } else {
                        navigate('/driver/onboarding');
                    }
                } catch (err) {
                    // Fallback to onboarding if check fails
                    navigate('/driver/onboarding');
                }
            } else if (user.role === 'marketplace') {
                try {
                    const statusRes = await api.get('/merchant/status');
                    if (statusRes.data.status === 'verified') {
                        navigate('/merchant');
                    } else {
                        navigate('/merchant/onboarding');
                    }
                } catch (err) {
                    navigate('/merchant/onboarding');
                }
            } else {
                navigate('/user');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Login to JMart</h2>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full p-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        className="w-full p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
