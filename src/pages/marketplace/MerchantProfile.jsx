import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Store, MapPin, CheckCircle, Info, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MerchantProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    
    const [formData, setFormData] = useState({
        store_name: '',
        village: '',
        district: '',
        city: '',
        full_address: '',
        product_description: '',
        latitude: '',
        longitude: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/merchant/profile');
            const data = res.data;
            setProfile(data);
            setFormData({
                store_name: data.store_name || '',
                village: data.village || '',
                district: data.district || '',
                city: data.city || '',
                full_address: data.full_address || '',
                product_description: data.product_description || '',
                latitude: data.latitude || '',
                longitude: data.longitude || ''
            });
            if (data.store_image_url) {
                setImagePreview(`${data.store_image_url}`);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching merchant profile:', error);
            toast.error('Gagal memuat profil');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Forward Geocoding: Village + District + City -> Coords
    const performGeocoding = useCallback(async () => {
        const { village, district, city } = formData;
        if (!village || !district || !city) return;

        setGeocoding(true);
        try {
            const query = `${village}, ${district}, ${city}, Indonesia`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                { 
                    headers: { 
                        'Accept-Language': 'id',
                        'User-Agent': 'JMart-App-Merchant-Onboarding'
                    } 
                }
            );
            const results = await response.json();

            if (results && results.length > 0) {
                const { lat, lon } = results[0];
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lon
                }));
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setGeocoding(false);
        }
    }, [formData.village, formData.district, formData.city]);

    // Debounce geocoding
    useEffect(() => {
        const timer = setTimeout(() => {
            performGeocoding();
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData.village, formData.district, formData.city, performGeocoding]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Ensure we don't send null as string "null"
            data.append(key, formData[key] || '');
        });
        if (imageFile) {
            data.append('store_image', imageFile);
        }

        try {
            await api.put('/merchant/profile', data);
            toast.success('Profil toko berhasil diperbarui!');
            fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Gagal memperbarui profil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-8 pb-20">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-3xl">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-2 max-w-4xl animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Profil Toko</h1>
                <p className="text-gray-500 font-medium">Lengkapi identitas toko Anda agar mudah ditemukan pelanggan.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-3xl">
                {/* Profile Header (Matched with User Profile) */}
                <div className="flex items-center gap-8 mb-12">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-[#f4efe8] flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Store" className="w-full h-full object-cover" />
                            ) : (
                                <Store size={40} className="text-brand-green" />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            <Camera size={14} />
                        </button>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark-blue">{formData.store_name || 'Toko JMart'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                                <CheckCircle size={10} /> Verified Merchant
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Nama Toko</label>
                            <input
                                type="text"
                                name="store_name"
                                value={formData.store_name}
                                onChange={handleChange}
                                placeholder="Contoh: Toko Berkah Jaya"
                                className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Deskripsi Layanan (Makanan/Jasa)</label>
                            <textarea
                                name="product_description"
                                value={formData.product_description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Jelaskan apa yang Anda tawarkan..."
                                className="w-full bg-[#f4efe8] text-gray-800 px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 resize-none font-medium"
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-6 pt-6 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-brand-dark-blue uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={16} className="text-brand-green" /> Lokasi Toko
                            </h3>
                            {geocoding && (
                                <div className="flex items-center gap-2 bg-brand-green/5 px-3 py-1.5 rounded-lg text-[10px] font-black text-brand-green animate-pulse">
                                    <Loader2 size={12} className="animate-spin" /> MENDETEKSI KOORDINAT...
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Desa</label>
                                <input
                                    type="text" name="village" value={formData.village} onChange={handleChange}
                                    placeholder="Sumbersari"
                                    className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kecamatan</label>
                                <input
                                    type="text" name="district" value={formData.district} onChange={handleChange}
                                    placeholder="Sumbersari"
                                    className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kota</label>
                                <input
                                    type="text" name="city" value={formData.city} onChange={handleChange}
                                    placeholder="Jember"
                                    className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-brand-dark-blue mb-2">Detail Alamat (Jalan/No)</label>
                                <input
                                    type="text" name="full_address" value={formData.full_address} onChange={handleChange}
                                    placeholder="Jl. Kalimantan No. 37"
                                    className="w-full bg-[#f4efe8] text-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                />
                            </div>
                        </div>

                        {/* Coords Info (Subtle) */}
                        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Latitude</p>
                                <p className="font-mono text-xs text-brand-dark-blue font-bold">{formData.latitude || '-'}</p>
                             </div>
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Longitude</p>
                                <p className="font-mono text-xs text-brand-dark-blue font-bold">{formData.longitude || '-'}</p>
                             </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={saving}
                        className="w-full bg-brand-green hover:bg-green-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={20} className="animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MerchantProfile;
