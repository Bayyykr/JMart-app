import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, PackageCheck, XCircle, Clock, Activity, Truck } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../services/api';

const MerchantDashboard = () => {
    const [stats, setStats] = useState({
        total_products: 0,
        total_orders: 0,
        total_revenue: 0,
        recent_orders: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/merchant/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching merchant stats:', error);
            }
        };
        
        fetchStats();

        const socket = io('');
        socket.on('merchant_dashboard_update', () => {
            fetchStats();
        });

        return () => {
            socket.off('merchant_dashboard_update');
            socket.disconnect();
        };
    }, []);

    const StatCard = ({ title, value, icon, color, suffix = '' }) => (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${color} text-white`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-400">{title}</p>
                    <h3 className="text-2xl font-black text-brand-dark-blue">
                        {suffix}{(value || 0).toLocaleString('id-ID')}
                    </h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-brand-dark-blue mb-6">Ringkasan Toko</h2>
            
            {/* Top Row: Revenue & Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Pendapatan" 
                    value={stats.total_revenue} 
                    icon={<DollarSign size={24} />} 
                    color="bg-brand-orange"
                    suffix="Rp "
                />
                <StatCard 
                    title="Pesanan Selesai" 
                    value={stats.completed_orders} 
                    icon={<PackageCheck size={24} />} 
                    color="bg-[#25d366]"
                />
                <StatCard 
                    title="Pesanan Batal" 
                    value={stats.cancelled_orders} 
                    icon={<XCircle size={24} />} 
                    color="bg-red-500"
                />
                <StatCard 
                    title="Katalog Produk" 
                    value={stats.total_products} 
                    icon={<Package size={24} />} 
                    color="bg-brand-dark-blue"
                />
            </div>

            {/* Second Row: Live Order Status Pipeline */}
            <h3 className="text-lg font-black text-brand-dark-blue mt-8 mb-4">Status Pesanan Aktif</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:ring-2 hover:ring-purple-100 transition-all" onClick={() => window.location.href='/merchant/orders'}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Clock size={20} />
                        </div>
                        <span className="font-bold text-gray-600 text-sm">Menunggu Konfirmasi</span>
                    </div>
                    <span className="text-xl font-black text-brand-dark-blue">{stats.pending_orders || 0}</span>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:ring-2 hover:ring-orange-100 transition-all" onClick={() => window.location.href='/merchant/orders'}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Activity size={20} />
                        </div>
                        <span className="font-bold text-gray-600 text-sm">Sedang Diproses</span>
                    </div>
                    <span className="text-xl font-black text-brand-dark-blue">{stats.processing_orders || 0}</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all" onClick={() => window.location.href='/merchant/orders'}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Truck size={20} />
                        </div>
                        <span className="font-bold text-gray-600 text-sm">Dalam Perjalanan</span>
                    </div>
                    <span className="text-xl font-black text-brand-dark-blue">{stats.shipping_orders || 0}</span>
                </div>
            </div>

            {/* Third Row: Recent Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-brand-dark-blue">Pesanan Terbaru</h3>
                    <button 
                        onClick={() => window.location.href='/merchant/orders'}
                        className="text-xs font-bold text-brand-green hover:underline"
                    >
                        Lihat Semua
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recent_orders && stats.recent_orders.length > 0 ? (
                                stats.recent_orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-brand-dark-blue">#{order.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-brand-dark-blue">{order.customer_name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-brand-green">
                                            Rp {(order.total_price || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                order.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
                                                order.status === 'Dibatalkan' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-xs font-bold">
                                        Belum ada pesanan terbaru.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-between mt-6">
                <div>
                    <h2 className="text-xl font-black text-brand-dark-blue">Kembangkan Bisnis Anda</h2>
                    <p className="text-gray-500 font-medium mt-1">Tambahkan produk baru dan raih lebih banyak pelanggan hari ini.</p>
                </div>
                <button 
                    onClick={() => window.location.href = '/merchant/products'}
                    className="flex items-center gap-2 px-6 py-4 bg-brand-dark-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg shadow-brand-dark-blue/20"
                >
                    Mulai Berjualan <ArrowUpRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default MerchantDashboard;
