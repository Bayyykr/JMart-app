import React, { useState, useEffect } from 'react';
import { Store, MapPin, CheckCircle, XCircle, Search, CreditCard, Mail, Eye, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MerchantVerification = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState(null);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/merchants');
            setMerchants(response.data);
        } catch (error) {
            console.error('Error fetching merchants:', error);
            toast.error('Gagal mengambil data merchant');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const handleUpdateStatus = async (merchantId, newStatus) => {
        try {
            await api.put('/admin/merchant/status', {
                userId: merchantId,
                status: newStatus
            });

            toast.success(`Merchant berhasil ${newStatus === 'verified' ? 'disetujui' : 'ditolak'}`);
            fetchMerchants();
        } catch (error) {
            console.error('Error updating merchant status:', error);
            toast.error('Gagal memperbarui status merchant');
        }
    };

    const pendingMerchants = merchants.filter(merchant =>
        merchant.status === 'pending' && (
            merchant.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            merchant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            merchant.ktp_number?.includes(searchQuery)
        )
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
                <div>
                    <h2 className="text-2xl font-black text-brand-dark-blue mb-1">Verifikasi Merchant</h2>
                    <p className="text-gray-500 text-sm font-medium">Otorisasi pendaftaran toko baru di ekosistem JMart</p>
                </div>

                <div className="relative w-full xl:max-w-md group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-green transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari toko, pemilik, atau NIK..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold text-brand-dark-blue focus:ring-0 focus:border-brand-green/20 focus:bg-white transition-all outline-none placeholder:text-gray-300 shadow-sm"
                    />
                </div>
            </div>

            {/* Alert Banner Parity with Driver */}
            <div className="bg-brand-orange/5 border border-brand-orange/20 p-6 rounded-3xl flex items-center gap-4">
                <Info className="text-brand-orange" size={24} />
                <div>
                    <h3 className="text-sm font-black text-brand-dark-blue uppercase tracking-widest">Konfirmasi Keamanan</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">Harap periksa kecocokan foto identitas dan kesesuaian toko sebelum verifikasi.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Pemilik</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Bisnis</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokumen</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Keputusan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-8 h-24">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-50 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-50 rounded w-1/3"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : pendingMerchants.length > 0 ? (
                                pendingMerchants.map((merchant) => (
                                    <tr key={merchant.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-brand-green/5 flex flex-col items-center justify-center text-brand-green font-black text-xl border border-brand-green/10 group-hover:scale-110 transition-transform shadow-sm">
                                                    {merchant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-brand-dark-blue text-sm">{merchant.name}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold mt-1">
                                                        <Mail size={12} className="text-gray-300" />
                                                        {merchant.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-brand-orange/5 rounded-xl border border-brand-orange/10">
                                                        <Store size={16} className="text-brand-orange shrink-0" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-brand-dark-blue">{merchant.store_name}</p>
                                                        <div className="flex items-start gap-1.5 text-[11px] text-gray-400 font-bold mt-1 leading-relaxed">
                                                            <MapPin size={12} className="mt-0.5 shrink-0 text-gray-300" />
                                                            <span className="max-w-[180px]">{merchant.village}, {merchant.district}, {merchant.city}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedMerchant(merchant)}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-brand-dark-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                            >
                                                <Eye size={14} /> Lihat Berkas
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(merchant.user_id, 'verified')}
                                                    className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Approve">
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(merchant.user_id, 'rejected')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject">
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 italic">
                                            <Search size={40} className="mb-4 opacity-20" />
                                            <p className="font-black uppercase tracking-widest text-xs">Pendaftaran Tidak Ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for viewing merchant documents */}
            {selectedMerchant && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto w-full min-h-screen">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-xl border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-brand-dark-blue">Berkas Merchant: {selectedMerchant.store_name}</h3>
                            <button onClick={() => setSelectedMerchant(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={28} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Foto KTP Pemilik</p>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 aspect-video flex flex-col items-center justify-center overflow-hidden">
                                    {selectedMerchant.ktp_image_url ? (
                                        <img src={`${selectedMerchant.ktp_image_url}`} alt="KTP" className="w-full h-full object-contain" />
                                    ) : (
                                        <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                    )}
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">NIK Terdaftar</p>
                                    <p className="font-mono font-bold text-brand-dark-blue">{selectedMerchant.ktp_number}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Foto Toko / Produk</p>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 aspect-video flex flex-col items-center justify-center overflow-hidden">
                                    {selectedMerchant.selfie_image_url ? (
                                        <img src={`${selectedMerchant.selfie_image_url}`} alt="Store" className="w-full h-full object-contain" />
                                    ) : (
                                        <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                    )}
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deskripsi Produk</p>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{selectedMerchant.product_description || 'Tidak ada deskripsi'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setSelectedMerchant(null)}
                                className="px-8 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantVerification;
