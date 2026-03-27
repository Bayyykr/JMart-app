import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Info, Search, Mail, Truck, UserCheck, ShieldCheck, CreditCard, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DriverVerification = () => {
    const [drivers, setDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/drivers');
            setDrivers(response.data);
        } catch (error) {
            console.error('Error fetching drivers', error);
            toast.error('Gagal memuat data driver');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (userId, status) => {
        try {
            await api.put('/admin/driver/status', { userId, status });
            toast.success(`Driver telah ${status === 'verified' ? 'Diverifikasi' : 'Ditolak'}`);
            fetchDrivers();
        } catch (error) {
            toast.error('Gagal memperbarui status driver');
        }
    };

    const pendingDrivers = drivers.filter(driver => 
        driver.status === 'pending' && (
            driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.ktp_number?.includes(searchQuery) ||
            driver.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
                <div>
                    <h2 className="text-2xl font-black text-brand-dark-blue mb-1">Verifikasi Driver</h2>
                    <p className="text-gray-500 text-sm font-medium">Otorisasi mitra pengemudi baru di ekosistem JMart</p>
                </div>

                <div className="relative w-full xl:max-w-md group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Cari nama, NIK, atau plat..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold text-brand-dark-blue focus:ring-0 focus:border-brand-orange/20 focus:bg-white transition-all outline-none placeholder:text-gray-300 shadow-sm"
                    />
                </div>
            </div>

            {/* Alert Banner Parity with Merchant */}
            <div className="bg-brand-orange/5 border border-brand-orange/20 p-6 rounded-3xl flex items-center gap-4">
                <ShieldCheck className="text-brand-orange" size={24} />
                <div>
                    <h3 className="text-sm font-black text-brand-dark-blue uppercase tracking-widest">Konfirmasi Keamanan</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">Harap periksa kecocokan foto selfie dengan KTP sebelum melakukan verifikasi.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Driver</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kendaraan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokumen</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Keputusan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-8 h-24">
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
                            ) : pendingDrivers.length > 0 ? (
                                pendingDrivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-brand-orange/5 flex flex-col items-center justify-center text-brand-orange font-black text-xl border border-brand-orange/10 group-hover:scale-110 transition-transform shadow-sm">
                                                    {driver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-brand-dark-blue text-sm">{driver.name}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold mt-1">
                                                        <Mail size={12} className="text-gray-300" />
                                                        {driver.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-bold text-gray-500">NIK: {driver.ktp_number}</p>
                                                <div className="flex items-center gap-1.5 text-[9px] text-brand-green font-black uppercase tracking-wider">
                                                    <ShieldCheck size={10} /> Sesuai Database
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <p className="text-xs font-bold text-gray-500">{driver.vehicle_type} - {driver.vehicle_model}</p>
                                                <p className="text-xs text-brand-orange font-black uppercase tracking-tighter mt-1">{driver.vehicle_plate}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => setSelectedDriver(driver)}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-brand-dark-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                            >
                                                <Eye size={14} /> Lihat Berkas
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button 
                                                    onClick={() => handleAction(driver.user_id, 'verified')}
                                                    className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Approve">
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(driver.user_id, 'rejected')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject">
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
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

            {/* Modal for viewing driver documents */}
            {selectedDriver && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto w-full min-h-screen pt-8 md:pt-16">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-xl border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="font-black text-2xl text-brand-dark-blue leading-none">Berkas Driver</h3>
                                <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">{selectedDriver.name} • {selectedDriver.vehicle_plate}</p>
                            </div>
                            <button onClick={() => setSelectedDriver(null)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl">
                                <XCircle size={32} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Foto KTP Pengemudi</p>
                                <div className="bg-gray-50 rounded-3xl border border-gray-100 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden shadow-inner group relative">
                                    {selectedDriver.ktp_image_url ? (
                                        <img src={`${selectedDriver.ktp_image_url}`} alt="KTP" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <ShieldCheck size={48} className="mx-auto text-gray-200 mb-3" />
                                            <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor Induk Kependudukan</p>
                                    <p className="font-mono font-black text-lg text-brand-dark-blue tracking-wider">{selectedDriver.ktp_number}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selfie dengan KTP</p>
                                <div className="bg-gray-50 rounded-3xl border border-gray-100 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden shadow-inner group relative">
                                    {selectedDriver.selfie_image_url ? (
                                        <img src={`${selectedDriver.selfie_image_url}`} alt="Selfie KTP" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <UserCheck size={48} className="mx-auto text-gray-200 mb-3" />
                                            <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Model Kendaraan</p>
                                    <p className="font-black text-lg text-brand-dark-blue uppercase">{selectedDriver.vehicle_model} ({selectedDriver.vehicle_type})</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-8">
                            <button 
                                onClick={() => setSelectedDriver(null)}
                                className="px-10 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest shadow-sm"
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

export default DriverVerification;
