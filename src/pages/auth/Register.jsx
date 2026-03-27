import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
    User, Car, Store, Eye, EyeOff,
    CheckCircle, XCircle, UserPlus, ArrowRight,
    ShieldCheck, Sparkles
} from 'lucide-react';
import logoApp from '../../assets/logo-app.png';

const ROLES = [
    {
        id: 'user',
        label: 'Pengguna',
        icon: User,
        desc: 'Pesan layanan & produk',
        activeClass: 'bg-brand-dark-blue border-brand-dark-blue text-white',
    },
    {
        id: 'driver',
        label: 'Driver',
        icon: Car,
        desc: 'Mitra pengantar',
        activeClass: 'bg-brand-orange border-brand-orange text-white',
    },
    {
        id: 'marketplace',
        label: 'Toko',
        icon: Store,
        desc: 'Jual produk',
        activeClass: 'bg-emerald-600 border-emerald-600 text-white',
    },
];

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [role, setRole] = useState('user');
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

    const strengthInfo = () => {
        const p = form.password;
        if (!p) return null;
        if (p.length < 8) return { label: 'Terlalu Pendek', color: 'text-red-500', bg: 'bg-red-500', w: 'w-1/4' };
        if (p.length < 12) return { label: 'Sedang', color: 'text-yellow-500', bg: 'bg-yellow-400', w: 'w-2/3' };
        return { label: 'Sangat Kuat', color: 'text-green-500', bg: 'bg-green-500', w: 'w-full' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!form.email.toLowerCase().endsWith('@gmail.com')) {
            setError('Hanya alamat email @gmail.com yang diperbolehkan.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password minimal 8 karakter.');
            return;
        }
        if (form.password.length > 30) {
            setError('Password maksimal 30 karakter.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Password dan konfirmasi tidak cocok.');
            return;
        }
        
        setLoading(true);
        try {
            await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, role });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1800);
        } catch (err) {
            setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const str = strengthInfo();
    const pwMatch = form.confirm && form.password === form.confirm;
    const pwNoMatch = form.confirm && form.password !== form.confirm;

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-primary flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-dark-blue/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.18)] flex my-2">
                {/* LEFT — Branding (hidden on mobile) */}
                <div className="hidden md:flex md:w-[40%] bg-brand-dark-blue p-8 flex-col justify-between text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-brand-orange/10" />

                    {/* Top */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <img src={logoApp} alt="JMart Logo" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-black tracking-tight">JMart</span>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-brand-orange/20 border border-brand-orange/30 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-6 text-brand-orange">
                            <Sparkles size={10} />
                            Bergabung Sekarang
                        </div>

                        <h1 className="text-[2.4rem] font-black leading-[1.1] tracking-tighter mb-4">
                            Mulai<br />
                            <span className="text-brand-orange italic">Perjalanan</span><br />
                            Anda
                        </h1>
                        <p className="text-blue-200/70 text-sm font-medium leading-relaxed max-w-[26ch]">
                            Daftar dan nikmati kemudahan berbelanja, buka toko, atau menjadi mitra driver JMart.
                        </p>
                    </div>

                    {/* Middle: Feature list */}
                    <div className="relative z-10 space-y-3">
                        {['Registrasi gratis tanpa biaya', 'Verifikasi admin 1×24 jam', '100% aman & terenkripsi'].map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle size={13} className="text-brand-orange flex-shrink-0" />
                                <span className="text-[11px] text-blue-200/80 font-medium">{t}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom: Flow info */}
                    <div className="relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-blue-200/60 font-medium leading-relaxed mb-2">Alur pendaftaran:</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {['Daftar', '→', 'Login', '→', 'Screening*', '→', 'Dashboard'].map((s, i) => (
                                    <span key={i} className={`text-[9px] font-black ${s === '→' ? 'text-white/20' : s === 'Screening*' ? 'text-brand-orange' : 'text-white/70'}`}>{s}</span>
                                ))}
                            </div>
                            <p className="text-[8px] text-white/30 mt-1.5 font-medium">*Khusus Driver & Toko</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Form */}
                <div className="flex-1 bg-white flex flex-col">
                    {/* Mobile logo */}
                    <div className="flex md:hidden items-center gap-2 p-6 pb-0">
                        <img src={logoApp} alt="JMart Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-black text-brand-dark-blue">JMart</span>
                    </div>

                    <div className="flex-1 p-5 md:p-8 overflow-y-auto flex flex-col justify-center">
                        <div className="w-full max-w-[540px] mx-auto py-2">
                            <h2 className="text-2xl font-black text-brand-dark-blue tracking-tight mb-1">Buat Akun Baru</h2>
                            <p className="text-gray-400 text-sm font-medium mb-4">
                                Sudah punya akun?{' '}
                                <Link to="/login" className="text-brand-orange font-bold hover:underline">Masuk di sini</Link>
                            </p>

                            {error && (
                                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-bold">
                                    <XCircle size={14} className="flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-700 text-xs font-black">Akun berhasil dibuat!</p>
                                        <p className="text-green-600 text-[10px] font-medium">Mengalihkan ke halaman login...</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-2.5">
                                {/* Role Selector */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-0.5">Daftar sebagai</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ROLES.map(({ id, label, icon: Icon, desc, activeClass }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setRole(id)}
                                                className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl border-2 transition-all duration-200 ${role === id
                                                    ? activeClass + ' shadow-md scale-[1.02]'
                                                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                <Icon size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-wide leading-none">{label}</span>
                                                <span className={`text-[8px] font-medium leading-tight text-center ${role === id ? 'opacity-70' : 'text-gray-400'}`}>{desc}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {(role === 'driver' || role === 'marketplace') && (
                                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                                            <ShieldCheck size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                                                Setelah <span className="font-black">daftar → login</span>, Anda akan diarahkan ke halaman screening & verifikasi.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Nama Lengkap</label>
                                    <input
                                        name="name" type="text" value={form.name} onChange={onChange}
                                        placeholder="Contoh: Budi Santoso" required
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Alamat Email</label>
                                    <input
                                        name="email" type="email" value={form.email} onChange={onChange}
                                        placeholder="email@contoh.com" required
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Password</label>
                                    <div className="relative">
                                        <input
                                            name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={onChange}
                                            placeholder="8 - 30 karakter" required
                                            className="w-full p-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all"
                                        />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors p-1">
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {str && (
                                        <div className="flex items-center gap-2 px-0.5 mt-1">
                                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${str.bg} ${str.w} rounded-full transition-all duration-500`} />
                                            </div>
                                            <span className={`text-[9px] font-black ${str.color}`}>{str.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-0.5">Konfirmasi Password</label>
                                    <div className="relative">
                                        <input
                                            name="confirm" type={showCf ? 'text' : 'password'} value={form.confirm} onChange={onChange}
                                            placeholder="Ulangi password" required
                                            className={`w-full p-2.5 pr-11 rounded-xl border focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none font-semibold text-gray-700 placeholder:text-gray-300 text-sm transition-all ${pwNoMatch ? 'border-red-200 bg-red-50/40' : pwMatch ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-gray-50'}`}
                                        />
                                        <button type="button" onClick={() => setShowCf(!showCf)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors p-1">
                                            {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                        {pwMatch && <CheckCircle size={13} className="absolute right-11 top-1/2 -translate-y-1/2 text-green-500" />}
                                        {pwNoMatch && <XCircle size={13} className="absolute right-11 top-1/2 -translate-y-1/2 text-red-400" />}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className={`w-full py-3 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 mt-1 ${loading || success
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-brand-orange text-white hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25'
                                    }`}
                                >
                                    {loading
                                        ? <div className="w-5 h-5 border-[2.5px] border-gray-300 border-b-transparent rounded-full animate-spin" />
                                        : <>
                                            <UserPlus size={17} />
                                            <span>Daftar Sekarang</span>
                                        </>
                                    }
                                </button>
                            </form>

                            <p className="mt-4 text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                                JMart v1.0 — Platform Lokal Terpercaya
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
