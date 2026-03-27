import React, { useState, useEffect } from 'react';
import { Store, MapPin, CheckCircle, XCircle, Search, CreditCard, Mail, Eye, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MerchantVerification = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredMerchants = merchants.filter(merchant => 
        merchant.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.ktp_number?.includes(searchQuery)
    );

    return (
        <div className="space-y-10">
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

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Pemilik</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Bisnis</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokumen & Verifikasi</th>
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
                            ) : filteredMerchants.length > 0 ? (
                                filteredMerchants.map((merchant) => (
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
                                                            <span className="max-w-[180px]">{merchant.store_address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {merchant.product_description && (
                                                    <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 max-w-[250px] group-hover:bg-white transition-colors">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <Info size={10} /> Deskripsi Produk
                                                        </p>
                                                        <p className="text-[11px] font-medium text-gray-600 line-clamp-2 leading-relaxed">
                                                            {merchant.product_description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                                                    <CreditCard size={14} className="text-gray-400" />
                                                    <span className="font-mono text-xs font-black text-brand-dark-blue tracking-wider">{merchant.ktp_number}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {merchant.ktp_image_url && (
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-white text-brand-green border border-brand-green/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-green hover:text-white transition-all shadow-sm">
                                                            <Eye size={12} /> Berkas KTP
                                                        </button>
                                                    )}
                                                    {merchant.selfie_image_url && (
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-white text-brand-orange border border-brand-orange/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all shadow-sm">
                                                            <Eye size={12} /> Foto Toko
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                {merchant.status === 'pending' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(merchant.user_id, 'verified')}
                                                            className="w-12 h-12 bg-green-50 text-green-500 hover:bg-green-500 hover:text-white rounded-[1.2rem] transition-all shadow-sm shadow-green-100 flex items-center justify-center group/btn active:scale-90"
                                                            title="Approve Merchant"
                                                        >
                                                            <CheckCircle size={22} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(merchant.user_id, 'rejected')}
                                                            className="w-12 h-12 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-[1.2rem] transition-all shadow-sm shadow-red-100 flex items-center justify-center group/btn active:scale-90"
                                                            title="Reject Merchant"
                                                        >
                                                            <XCircle size={22} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                        merchant.status === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        {merchant.status}
                                                    </div>
                                                )}
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
        </div>
    );
};

export default MerchantVerification;
