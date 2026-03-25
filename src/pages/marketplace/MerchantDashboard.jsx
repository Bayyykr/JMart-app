import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

const MerchantDashboard = () => {
    const [stats, setStats] = useState({
        total_products: 0,
        total_orders: 0,
        total_revenue: 0
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
                        {suffix}{value.toLocaleString('id-ID')}
                    </h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Produk" 
                    value={stats.total_products} 
                    icon={<Package size={24} />} 
                    color="bg-brand-dark-blue"
                />
                <StatCard 
                    title="Pesanan Masuk" 
                    value={stats.total_orders} 
                    icon={<ShoppingCart size={24} />} 
                    color="bg-brand-green"
                />
                <StatCard 
                    title="Total Pendapatan" 
                    value={stats.total_revenue} 
                    icon={<DollarSign size={24} />} 
                    color="bg-brand-orange"
                    suffix="Rp "
                />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-between">
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
