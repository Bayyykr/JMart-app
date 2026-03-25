import React, { useState } from 'react';
import api from '../../services/api';
import { X, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const JastipModal = ({ isOpen, onClose, jastip }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        pesanan: '',
        jumlah: 1,
        catatan: '',
        delivery_point: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/user/jastips/join', {
                jastip_id: jastip.id,
                item_name: formData.pesanan,
                quantity: formData.jumlah,
                notes: formData.catatan,
                delivery_point: formData.delivery_point
            });

            toast.success("Berhasil ikut Jastip!");
            onClose();
        } catch (error) {
            console.error('Error participating in jastip:', error);
            toast.error(error.response?.data?.message || 'Gagal mengikuti jastip.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col md:flex-row min-h-[500px]">
                {/* Left Side: Jastip Info Summary */}
                <div className="md:w-5/12 bg-gradient-to-br from-[#f4efe8] to-white p-8 flex flex-col justify-between border-r border-gray-50">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                <img 
                                    src={jastip?.driverPhoto ? (jastip.driverPhoto.startsWith('http') ? jastip.driverPhoto : `http://localhost:5000${jastip.driverPhoto}`) : `https://i.pravatar.cc/150?u=${jastip?.driver_id || jastip?.driverName}`} 
                                    alt={jastip?.driverName} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${jastip?.driverName}&background=1e6f85&color=fff&size=128`; }}
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-brand-dark-blue">Ikut Jastip</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{jastip?.driverName}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-sm backdrop-blur-sm">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Informasi Belanja</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Toko / Lokasi</p>
                                            <p className="text-sm font-bold text-brand-dark-blue">{jastip?.storeName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-light-blue/10 flex items-center justify-center text-brand-light-blue">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Driver</p>
                                            <p className="text-sm font-bold text-brand-dark-blue">{jastip?.driverName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-green/5 p-5 rounded-2xl border border-brand-green/10">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-[10px] text-brand-green font-bold uppercase tracking-widest">Tarif Jasa</p>
                                        <p className="text-xl font-black text-brand-green">Rp {Number(jastip?.fee || 0).toLocaleString('id-ID')} <span className="text-[9px] text-gray-400">/ item</span></p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-green/10">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Tutup Order</p>
                                        <p className="text-xs font-bold text-brand-dark-blue">{jastip?.closeOrderTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Berangkat</p>
                                        <p className="text-xs font-bold text-brand-dark-blue">{jastip?.departureTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100/50">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Estimasi Biaya Jasa</p>
                        <p className="text-4xl font-black text-brand-orange">
                            Rp {Number((formData.jumlah || 0) * (jastip?.fee || 0)).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">*Belum termasuk harga barang</p>
                    </div>
                </div>

                {/* Right Side: Join Form */}
                <div className="md:w-7/12 p-8 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
                    >
                        <X size={24} />
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                        <div className="flex-1 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detail Pesanan</label>
                                <textarea
                                    name="pesanan"
                                    required
                                    rows="2"
                                    value={formData.pesanan}
                                    onChange={handleChange}
                                    placeholder="Contoh: Nasi Goreng Spesial 1 bungkus"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-brand-green/20 outline-none transition-all placeholder:text-gray-300 font-bold text-brand-dark-blue text-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titik Pengantaran (Alamat Lengkap)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="delivery_point"
                                        required
                                        value={formData.delivery_point}
                                        onChange={handleChange}
                                        placeholder="Contoh: Perumahan Mastrip Blok A-1"
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-brand-green/20 outline-none transition-all font-bold text-brand-dark-blue text-sm placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Item</label>
                                    <input
                                        type="number"
                                        name="jumlah"
                                        min="1"
                                        required
                                        value={formData.jumlah}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-brand-green/20 outline-none transition-all font-bold text-brand-dark-blue text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan Tambahan</label>
                                    <input
                                        type="text"
                                        name="catatan"
                                        value={formData.catatan}
                                        onChange={handleChange}
                                        placeholder="Misal: Jangan pedas"
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-brand-green/20 outline-none transition-all font-bold text-brand-dark-blue text-sm placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3 ${
                                    isSubmitting 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-brand-orange text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                            >
                                {isSubmitting ? 'Memproses...' : (
                                    <>
                                        <span>Titip Sekarang</span>
                                        <Package size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JastipModal;
