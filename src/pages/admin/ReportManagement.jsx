import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, MoreVertical, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/reports');
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Gagal mengambil data laporan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId, status) => {
        try {
            await api.put('/admin/report/status', { reportId, status });
            toast.success(`Status laporan diperbarui ke ${status}`);
            fetchReports();
        } catch (error) {
            console.error('Error updating report status:', error);
            toast.error('Gagal memperbarui status laporan');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-orange-100 text-orange-700',
            resolved: 'bg-green-100 text-green-700',
            ignored: 'bg-red-100 text-red-700'
        };
        const textMap = {
            pending: 'Menunggu',
            resolved: 'Diselesaikan',
            ignored: 'Ditolak'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {textMap[status] || status}
            </span>
        );
    };

    const filteredReports = reports.filter(r => 
        r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reportedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand-dark-blue mb-1">Manajemen Laporan</h1>
                    <p className="text-gray-500 text-sm font-medium">Tinjau dan tindak lanjuti laporan dari pengguna</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari pelapor, terlapor, atau alasan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-0 focus:border-brand-green/20 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelapor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Terlapor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alasan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4 bg-gray-50/20 h-16"></td>
                                    </tr>
                                ))
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-bold">Tidak ada laporan ditemukan</td>
                                </tr>
                            ) : filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-brand-dark-blue">{report.reporterName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-red-600">{report.reportedName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-brand-dark-blue">{report.reason}</p>
                                        <p className="text-xs text-gray-400 line-clamp-1">{report.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {report.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Selesaikan">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => setSelectedReport(report)}
                                                className="p-2 text-brand-dark-blue hover:bg-blue-50 rounded-lg transition-all" title="View Detail">
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-8 md:pt-16">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-brand-dark-blue">Detail Laporan</h3>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pelapor</p>
                                <p className="text-sm font-bold text-brand-dark-blue">{selectedReport.reporterName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Terlapor</p>
                                <p className="text-sm font-bold text-red-600">{selectedReport.reportedName}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Alasan Laporan</p>
                                <p className="text-sm font-bold text-brand-dark-blue mb-1">{selectedReport.reason}</p>
                                <p className="text-sm text-gray-600">{selectedReport.description || 'Tidak ada deskripsi tambahan.'}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
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

export default ReportManagement;
