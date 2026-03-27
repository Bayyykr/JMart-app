import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DriverVerification = () => {
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/drivers');
            setPendingDrivers(response.data.filter(d => d.status === 'pending'));
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

    return (
        <div className="space-y-6">
            <div className="bg-brand-orange/5 border border-brand-orange/20 p-6 rounded-3xl flex items-center gap-4">
                <AlertTriangle className="text-brand-orange" size={24} />
                <div>
                    <h3 className="text-sm font-black text-brand-dark-blue uppercase tracking-widest">Konfirmasi Keamanan</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">Harap periksa kecocokan foto selfie dengan KTP sebelum melakukan verifikasi.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Driver</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kendaraan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokumen</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pendingDrivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-brand-dark-blue">{driver.name}</p>
                                            <p className="text-xs text-gray-400">{driver.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-gray-500">NIK: {driver.ktp}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-1">Sesuai Database</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-gray-500">{driver.vehicle_type}</p>
                                        <p className="text-xs text-brand-orange font-black uppercase tracking-tighter">{driver.vehicle_plate}</p>
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
                                        <div className="flex items-center gap-2">
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
                            ))}
                        </tbody>
                    </table>
                </div>
                {!isLoading && pendingDrivers.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-sm font-bold text-gray-400">Tidak ada pengajuan driver baru saat ini.</p>
                    </div>
                )}
            </div>

            {/* Modal for viewing driver documents */}
            {selectedDriver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto w-full min-h-screen">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-xl border border-gray-100 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-brand-dark-blue">Berkas Driver: {selectedDriver.name}</h3>
                            <button onClick={() => setSelectedDriver(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={28} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Foto KTP</p>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 aspect-video flex flex-col items-center justify-center overflow-hidden">
                                    {selectedDriver.identity_url ? (
                                        <img src={`${selectedDriver.identity_url}`} alt="KTP" className="w-full h-full object-contain" />
                                    ) : (
                                        <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Foto Selfie dengan KTP</p>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 aspect-video flex flex-col items-center justify-center overflow-hidden">
                                    {selectedDriver.selfie_url ? (
                                        <img src={`${selectedDriver.selfie_url}`} alt="Selfie KTP" className="w-full h-full object-contain" />
                                    ) : (
                                        <p className="text-xs text-gray-400 font-bold">Berkas Belum Diunggah</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6">
                            <button 
                                onClick={() => setSelectedDriver(null)}
                                className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
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
