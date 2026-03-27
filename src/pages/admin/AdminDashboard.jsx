import React, { useState, useEffect } from 'react';
import { Users, Truck, ShoppingBag, TrendingUp, AlertCircle, FileText, Download, Clock, Star, Store } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDrivers: 0,
        totalOrders: 0,
        totalMerchants: 0
    });
    const [activity, setActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, activityRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/activity')
            ]);
            setStats(statsRes.data);
            setActivity(activityRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Gagal mengambil data dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            const response = await api.get('/admin/export/pdf/summary', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'system_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Laporan PDF berhasil diunduh');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Gagal mengunduh laporan PDF');
        }
    };

    const handleExportCSV = async (resource) => {
        try {
            const response = await api.get(`/admin/export/csv/${resource}`);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${resource}_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Export CSV ${resource} berhasil`);
        } catch (error) {
            console.error('CSV Export Error:', error);
            toast.error('Gagal melakukan export CSV');
        }
    };

    const StatCard = ({ title, value, icon, color, suffix = '' }) => (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${color} text-white`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-400">{title}</p>
                    <h3 className="text-2xl font-black text-brand-dark-blue">
                        {isLoading ? (
                            <div className="h-6 w-16 bg-gray-100 animate-pulse rounded-lg"></div>
                        ) : (
                            `${suffix}${(value || 0).toLocaleString('id-ID')}`
                        )}
                    </h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-black text-brand-dark-blue">Dashboard</h2>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => handleExportCSV('users')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-brand-dark-blue rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={14} className="text-brand-green" /> CSV Users
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-sm"
                    >
                        <FileText size={14} /> Export PDF Report
                    </button>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Pengguna" 
                    value={stats.totalUsers} 
                    icon={<Users size={24} />} 
                    color="bg-brand-orange"
                />
                <StatCard 
                    title="Driver Aktif" 
                    value={stats.totalDrivers} 
                    icon={<Truck size={24} />} 
                    color="bg-[#25d366]"
                />
                <StatCard 
                    title="Total Merchant" 
                    value={stats.totalMerchants} 
                    icon={<Store size={24} />} 
                    color="bg-red-500"
                />
                <StatCard 
                    title="Total Pesanan" 
                    value={stats.totalOrders} 
                    icon={<ShoppingBag size={24} />} 
                    color="bg-brand-dark-blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-black text-brand-dark-blue flex items-center gap-2">
                            <Clock size={20} className="text-brand-green" /> Aktivitas Terbaru
                        </h3>
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-2 bg-gray-50 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))
                        ) : activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400 font-bold text-xs">
                                <p>Belum ada aktivitas.</p>
                            </div>
                        ) : activity.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    act.type === 'order' ? 'bg-green-50 text-brand-green' : 'bg-blue-50 text-brand-dark-blue'
                                }`}>
                                    {act.userName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-brand-dark-blue">
                                        <span className="text-brand-orange">{act.userName}</span> {act.type === 'order' ? `baru saja melakukan pesanan #${act.id}` : 'baru saja mendaftar'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Alerts & Information */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                        <AlertCircle size={20} className="text-brand-orange" />
                        <h3 className="text-lg font-black text-brand-dark-blue">Notifikasi</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer hover:ring-2 hover:ring-orange-100 transition-all" onClick={() => window.location.href='/admin/drivers'}>
                            <p className="text-xs font-bold text-orange-900 mb-1">Verifikasi Driver/Merchant</p>
                            <p className="text-[10px] text-orange-800 opacity-80 mb-2">Pantau pendaftaran baru untuk diaktifkan as soon as possible.</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all" onClick={() => window.location.href='/admin/reports'}>
                            <p className="text-xs font-bold text-brand-dark-blue mb-1">Laporan Keluhan</p>
                            <p className="text-[10px] text-brand-dark-blue/80 mb-2">Tinjau keluhan terbaru yang masuk di tiket dukungan.</p>
                        </div>
                    </div>
                    <div className="mt-auto p-6 pt-0">
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-green shadow-sm">
                                <Star size={14} className="fill-brand-green" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-900">Sistem Berjalan</p>
                                <p className="text-[10px] text-green-700">Semua layanan fungsional</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
