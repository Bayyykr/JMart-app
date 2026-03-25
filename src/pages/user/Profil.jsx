import React, { useState, useEffect } from 'react';
import { Camera, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const Profil = () => {
    const { user, login } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        birthdate: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                phone: user.phone || '',
                birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
                address: user.address || ''
            });
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await api.put('/user/profile', form);
            login(res.data.user); // Refresh the global session without touching token
            
            // Show custom alert
            setAlertMsg('Profil berhasil diperbarui!');
            setTimeout(() => setAlertMsg(''), 3000);
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan profil, pastikan server backend sudah dinyalakan ulang (restart).');
        } finally {
            setIsSaving(false);
        }
    };

    const fileInputRef = React.useRef(null);
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/user/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            login(res.data.user);
            setAlertMsg('Foto profil berhasil diubah!');
            setTimeout(() => setAlertMsg(''), 3000);
        } catch (error) {
            console.error(error);
            alert('Gagal mengunggah foto profil. Pastikan backend sudah direstart.');
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Profil Saya</h1>
                </div>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-3xl animate-pulse">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                        <div>
                            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 relative">
            {alertMsg && (
                <div className="fixed top-24 right-6 md:top-24 md:right-4 bg-brand-green text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 transition-all duration-300">
                    <CheckCircle className="text-white bg-green-500 rounded-full p-0.5" size={24} />
                    <span className="font-bold">{alertMsg}</span>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Profil Saya</h1>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-3xl">
                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-10">
                    <div className="relative">
                        {user?.profile_image_url ? (
                            <img 
                                src={user.profile_image_url.startsWith('http') ? user.profile_image_url : `http://localhost:5000${user.profile_image_url}`} 
                                alt={user.name} 
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm" 
                            />
                        ) : (
                            <div className="w-24 h-24 bg-[#1e6f85] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {(user?.name || 'Driver').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-orange-600 transition-colors"
                        >
                            <Camera size={14} />
                        </button>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark-blue">{user?.name || 'User'}</h2>
                        <p className="text-gray-500 capitalize">{user?.role || 'Customer'}</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Nama Lengkap</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Email</label>
                        <input
                            type="email"
                            defaultValue={user?.email || ''}
                            disabled
                            className="w-full bg-gray-100 text-gray-500 px-4 py-3 rounded-xl focus:outline-none cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-brand-dark-blue mb-2">No. Telepon</label>
                        <input
                            type="tel"
                            maxLength={13}
                            value={form.phone}
                            onInput={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setForm({ ...form, phone: val });
                            }}
                            placeholder="Contoh: 081234567890"
                            className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Tanggal Lahir</label>
                        <div className="relative border-none">
                            <input
                                type="date"
                                value={form.birthdate}
                                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                                className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 cursor-pointer text-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer flex items-center justify-between"
                                style={{ colorScheme: 'light' }}
                                onClick={(e) => {
                                    try {
                                        e.target.showPicker();
                                    } catch (err) {}
                                }}
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Alamat Utama</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Contoh: Jl. Kalimantan No. 123"
                            className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-brand-green hover:bg-green-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition-colors"
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </div>
    );
};

export default Profil;
