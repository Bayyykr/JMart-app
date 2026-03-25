import React, { useState, useEffect } from 'react';
import { Users, Truck, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 1540,
        totalDrivers: 86,
        totalOrders: 3220,
        activeOrders: 42,
        revenue: 12500000
    });

    const StatCard = ({ title, value, icon, color, trend }) => (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={`p-4 rounded-2xl ${color} text-white`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm font-bold text-gray-500">{title}</p>
                <h3 className="text-2xl font-black text-brand-dark-blue mt-1">
                    {typeof value === 'number' && title.includes('Pendapatan') 
                        ? `Rp ${value.toLocaleString('id-ID')}` 
                        : value}
                </h3>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Pengguna" 
                    value={stats.totalUsers} 
                    icon={<Users size={24} />} 
                    color="bg-brand-dark-blue"
                    trend="+12% bulan ini"
                />
                <StatCard 
                    title="Driver Terverifikasi" 
                    value={stats.totalDrivers} 
                    icon={<Truck size={24} />} 
                    color="bg-brand-orange"
                />
                <StatCard 
                    title="Total Pesanan" 
                    value={stats.totalOrders} 
                    icon={<ShoppingBag size={24} />} 
                    color="bg-brand-green"
                />
                <StatCard 
                    title="Pendapatan Sistem" 
                    value={stats.revenue} 
                    icon={<TrendingUp size={24} />} 
                    color="bg-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-black text-brand-dark-blue uppercase tracking-widest text-sm">Aktivitas Terbaru</h2>
                        <button className="text-xs font-black text-brand-orange hover:underline uppercase tracking-widest">Lihat Semua</button>
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-brand-dark-blue font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-brand-dark-blue">
                                        <span className="text-brand-orange">User {i}</span> baru saja melakukan pemesanan Marketplace
                                    </p>
                                    <p className="text-xs text-gray-400">2 menit yang lalu</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Alerts */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                        <AlertCircle size={18} className="text-brand-orange" />
                        <h2 className="font-black text-brand-dark-blue uppercase tracking-widest text-sm">Pemberitahuan</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-xs font-bold text-orange-800">12 Driver Baru menunggu verifikasi</p>
                            <button className="mt-2 text-[10px] font-black text-brand-orange uppercase tracking-widest">Periksa Sekarang</button>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-xs font-bold text-red-800">Laporan keluhan layanan Antar Jemput #452</p>
                            <button className="mt-2 text-[10px] font-black text-brand-orange uppercase tracking-widest">Tinjau Laporan</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
