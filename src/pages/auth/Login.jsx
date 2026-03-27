import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';
import { Eye, EyeOff, XCircle, LogIn, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import logoApp from '../../assets/logo-app.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const { token, user } = data;
            login(user, token);

            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'driver') {
                try {
                    const statusRes = await api.get('/driver/status');
                    navigate(statusRes.data.status === 'verified' ? '/driver/dashboard' : '/driver/onboarding');
                } catch {
                    navigate('/driver/onboarding');
                }
            } else if (user.role === 'marketplace') {
                try {
                    const statusRes = await api.get('/merchant/status');
                    navigate(statusRes.data.status === 'verified' ? '/merchant' : '/merchant/onboarding');
                } catch {
                    navigate('/merchant/onboarding');
                }
            } else {
                navigate('/user');
            }
        } catch (err) {
            // Global interceptor handles 403 DEACTIVATED, so we only handle other errors here
            if (err.response?.status !== 403 || err.response?.data?.message !== 'DEACTIVATED') {
                setError(err.response?.data?.message || 'Email atau password salah.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-primary flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-dark-blue/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.18)] flex">
                {/* LEFT — Branding */}
                <div className="hidden md:flex md:w-[45%] bg-brand-dark-blue p-8 flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-brand-orange/10" />

                    {/* Top: Logo + badge */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <img src={logoApp} alt="JMart Logo" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-black tracking-tight">JMart</span>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-brand-orange/20 border border-brand-orange/30 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-6 text-brand-orange">
                            <Sparkles size={10} />
                            Selamat Datang Kembali
                        </div>

                        <h1 className="text-[2.4rem] font-black leading-[1.1] tracking-tighter mb-4">
                            Masuk ke<br />
                            <span className="text-brand-orange italic">Akun</span><br />
                            Anda
                        </h1>
                        <p className="text-blue-200/70 text-sm font-medium leading-relaxed max-w-[26ch]">
                            Nikmati layanan lengkap JMart — belanja, antar jemput, jastip, dan lebih banyak lagi.
                        </p>
                    </div>

                    {/* Middle: Feature list */}
                    <div className="relative z-10 space-y-3">
                        {[
                            'Login aman dengan enkripsi JWT',
                            'Akses instan ke semua fitur',
                            'Sesi disimpan otomatis',
                        ].map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <ShieldCheck size={13} className="text-brand-orange flex-shrink-0" />
                                <span className="text-[11px] text-blue-200/80 font-medium">{t}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom: Alur info */}
                    <div className="relative z-10 mt-2">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-blue-200/60 font-medium leading-relaxed mb-2">Alur masuk pengguna:</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {['Login', '→', 'Screening*', '→', 'Dashboard'].map((s, i) => (
                                    <span key={i} className={`text-[9px] font-black ${s === '→' ? 'text-white/20' : s === 'Screening*' ? 'text-brand-orange' : 'text-white/70'}`}>{s}</span>
                                ))}
                            </div>
                            <p className="text-[8px] text-white/30 mt-1.5 font-medium">*Khusus Driver & Toko</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Form */}
                <div className="flex-1 bg-white p-6 md:p-8 flex flex-col justify-center min-h-[500px]">
                    {/* Mobile logo */}
                    <div className="flex md:hidden items-center gap-2 mb-6">
                        <img src={logoApp} alt="JMart Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-black text-brand-dark-blue">JMart</span>
                    </div>

                    <div className="w-full max-w-[440px] mx-auto py-4">
                        <h2 className="text-2xl font-black text-brand-dark-blue tracking-tight mb-1">Masuk</h2>
                        <p className="text-gray-400 text-sm font-medium mb-6">
                            Belum punya akun?{' '}
                            <Link to="/register" className="text-brand-orange font-bold hover:underline">Daftar gratis</Link>
                        </p>

                        {error && (
                            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-bold">
                                <XCircle size={14} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alamat Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    placeholder="email@gmail.com"
                                    required
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="Masukkan password"
                                        required
                                        className="w-full p-3.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors p-1"
                                    >
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 mt-2 ${loading
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-brand-orange text-white hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25'
                                }`}
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-[2.5px] border-gray-300 border-b-transparent rounded-full animate-spin" />
                                    : <>
                                        <LogIn size={17} />
                                        <span>Masuk Sekarang</span>
                                    </>
                                }
                            </button>
                        </form>

                        <p className="mt-6 text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                            JMart v1.0 — Platform Lokal Terpercaya
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
