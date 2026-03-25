import React, { useState, useEffect } from 'react';
import StatCard from '../../components/user/StatCard';
import ActionCard from '../../components/user/ActionCard';
import RecentOrderList from '../../components/user/RecentOrderList';
import { ClipboardList, Car, ShoppingBag, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';

const DashboardHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalOrder: 0, antarJemput: 0, jasaTitip: 0, marketplace: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/user/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Selamat Datang! 👋</h1>
                <p className="text-gray-500 font-medium">Apa yang ingin kamu lakukan hari ini?</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Total Order"
                    value={stats.totalOrder.toString()}
                    subtext="Semua transaksi berjalan"
                    icon={<ClipboardList size={24} />}
                    variant="dark"
                />
                <StatCard
                    title="Antar Jemput"
                    value={stats.antarJemput.toString()}
                    subtext="Perjalanan"
                    icon={<Car size={24} />}
                />
                <StatCard
                    title="Jasa Titip"
                    value={stats.jasaTitip.toString()}
                    subtext="Titipan"
                    icon={<ShoppingBag size={24} />}
                />
                <StatCard
                    title="Marketplace"
                    value={stats.marketplace.toString()}
                    subtext="Pembelian"
                    icon={<Store size={24} />}
                />
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <ActionCard
                    title="Pesan Antar Jemput"
                    description="Layanan antar jemput cepat & aman"
                    icon={<Car size={32} />}
                    buttonOrder="Pesan Sekarang"
                    variant="green"
                    onClick={() => navigate('/user/antar-jemput')}
                />
                <ActionCard
                    title="Jasa Titip"
                    description="Titipkan belanja ke driver terpercaya"
                    icon={<ShoppingBag size={32} />}
                    buttonOrder="Titip Sekarang"
                    variant="blue"
                    onClick={() => navigate('/user/jasa-titip')}
                />
                <ActionCard
                    title="Marketplace"
                    description="Belanja produk dari seller terdekat"
                    icon={<Store size={32} />}
                    buttonOrder="Lihat Produk"
                    variant="light"
                    onClick={() => navigate('/user/marketplace')}
                />
            </div>

            {/* Recent Orders */}
            <RecentOrderList />
        </div>
    );
};

export default DashboardHome;
