import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const DriverVerification = () => {
    const [pendingDrivers, setPendingDrivers] = useState([
        { id: 1, name: 'Budi Santoso', email: 'budi@jmart.com', ktp: '3512340987654321', vehicle: 'Yamaha Aerox', plate: 'P 1234 AB', date: '2026-03-21' },
        { id: 2, name: 'Sari Rahayu', email: 'sari@jmart.com', ktp: '3512345678123456', vehicle: 'Honda Vario', plate: 'P 5678 CD', date: '2026-03-22' },
    ]);

    const handleAction = async (id, status) => {
        try {
            // In real app: await api.put('/admin/driver/status', { driverId: id, status });
            alert(`Driver ${id} telah ${status === 'verified' ? 'Diverifikasi' : 'Ditolak'}`);
            setPendingDrivers(pendingDrivers.filter(d => d.id !== id));
        } catch (error) {
            alert('Gagal memperbarui status driver');
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
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nama Driver</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identitas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kendaraan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dokumen</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aksi</th>
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
                                        <p className="text-xs font-bold text-gray-500">{driver.vehicle}</p>
                                        <p className="text-xs text-brand-orange font-black uppercase tracking-tighter">{driver.plate}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-brand-dark-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100">
                                            <Eye size={14} /> Lihat Berkas
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleAction(driver.id, 'verified')}
                                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Approve">
                                                <CheckCircle size={20} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(driver.id, 'rejected')}
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
                {pendingDrivers.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-sm font-bold text-gray-400">Tidak ada pengajuan driver baru saat ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverVerification;
