import React, { useState, useEffect } from 'react';
import { Store, MapPin, CheckCircle, XCircle, Search, CreditCard, Mail } from 'lucide-react';
import api from '../../services/api';

const MerchantVerification = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMerchants = async () => {
        try {
            const response = await api.get('/admin/merchants');
            setMerchants(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching merchants:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const handleUpdateStatus = async (merchantId, newStatus) => {
        if (window.confirm(`Are you sure you want to mark this merchant as ${newStatus}?`)) {
            try {
                await api.put('/admin/merchant/status', {
                    userId: merchantId, // the user_id
                    status: newStatus
                });
                
                // Optimistic UI update
                setMerchants(merchants.map(m => 
                    m.user_id === merchantId ? { ...m, status: newStatus } : m
                ));
            } catch (error) {
                console.error('Error updating merchant status:', error);
                alert('Failed to update status.');
            }
        }
    };

    const filteredMerchants = merchants.filter(merchant => 
        merchant.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.ktp_number.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Verifikasi Merchant</h1>
                    <p className="text-sm text-gray-500 mt-1">Review pendaftaran toko baru dari pengguna Marketplace</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Cari toko, pemilik, NIK..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Pemilik</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Detail Toko</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Dokumen</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMerchants.length > 0 ? (
                                filteredMerchants.map((merchant) => (
                                    <tr key={merchant.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex flex-col items-center justify-center text-brand-green font-bold">
                                                    {merchant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{merchant.name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                        <Mail className="w-3 h-3" />
                                                        {merchant.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-start gap-2">
                                                    <Store className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{merchant.store_name}</p>
                                                        <div className="flex items-start gap-1 text-xs text-gray-500 mt-0.5 max-w-[200px]">
                                                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                            <span className="truncate">{merchant.store_address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {merchant.product_description && (
                                                    <div className="mt-1 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 line-clamp-2 max-w-[250px]" title={merchant.product_description}>
                                                        <span className="font-semibold text-gray-700 block mb-0.5">Deskripsi Produk:</span>
                                                        {merchant.product_description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                                    <span className="font-mono text-xs font-bold">{merchant.ktp_number}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {merchant.ktp_image_url && (
                                                        <a href={`http://localhost:5000${merchant.ktp_image_url}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded hover:bg-brand-green hover:text-white transition-colors">
                                                            KTP
                                                        </a>
                                                    )}
                                                    {merchant.selfie_image_url && (
                                                        <a href={`http://localhost:5000${merchant.selfie_image_url}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded hover:bg-brand-orange hover:text-white transition-colors">
                                                            Selfie/Toko
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                                merchant.status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
                                                merchant.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {merchant.status === 'verified' ? 'Verified' : 
                                                 merchant.status === 'rejected' ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {merchant.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(merchant.user_id, 'verified')}
                                                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(merchant.user_id, 'rejected')}
                                                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-xs text-gray-400 italic">No Action</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        {loading ? 'Memuat data...' : 'Tidak ada data pendaftaran merchant.'}
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
