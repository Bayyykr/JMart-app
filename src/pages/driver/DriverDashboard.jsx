import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useDriver } from '../../context/DriverContext';
import StatCard from '../../components/user/StatCard';
import ActionCard from '../../components/user/ActionCard';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import { useNavigate } from 'react-router-dom';
import {
    Car,
    ShoppingBag,
    CheckCircle,
    Star,
    History,
    Power,
    MapPin,
    ClipboardList,
    MessageSquare,
    Wallet
} from 'lucide-react';

const DriverDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isOnline, toggleOnline, profile, loading: driverLoading, socket } = useDriver();
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [stats, setStats] = useState({ total_trips: 0, completed_orders: 0, rating: 5.0, total_jasa_titip: 0, revenue: 0 });
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchDriverStats(),
                    fetchDriverOrders()
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const fetchDriverStats = async () => {
        try {
            const res = await api.get('/driver/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchDriverOrders = async () => {
        try {
            const res = await api.get('/driver/orders');
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'id' } }
            );
            const data = await response.json();
            const addr = data.address;

            // Extract Kecamatan (Sub-district)
            const primaryKecamatan = addr.subdistrict || addr.city_district || addr.town || addr.municipality || addr.district || '';
            const fallbackKecamatan = addr.subdivision || addr.village_district || addr.neighbourhood || addr.suburb || addr.village || addr.hamlet || '';
            const kecamatanName = primaryKecamatan || fallbackKecamatan;

            // Extract Kabupaten (Regency/City)
            const kabupaten = addr.city || addr.county || addr.regency || addr.state_district || '';
            const kabupatenName = kabupaten.replace(/kabupaten\s*/i, '').trim() || addr.state || '';

            if (kecamatanName && kabupatenName) {
                return `${kecamatanName}, ${kabupatenName}`;
            }
            return kecamatanName || kabupatenName || 'Area Terdeteksi';
        } catch {
            return 'Area Terdeteksi';
        }
    };

    const updateLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung browser Anda");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const areaName = await reverseGeocode(latitude, longitude);
                // We logic: frontend still hits /location for "base" location if needed, 
                // but socket handles real-time
                await api.put('/driver/location', { latitude, longitude, area: areaName });
                setLocation({ lat: latitude, lng: longitude });
                if (socket) {
                    socket.emit('update_location', { userId: user.id, lat: latitude, lng: longitude, area: areaName });
                }
                alert("Lokasi diperbarui!");
            } catch (err) {
                alert("Gagal memperbarui lokasi");
            } finally {
                setIsLoading(false);
            }
        }, () => {
            alert("Gagal mendapatkan lokasi");
            setIsLoading(false);
        });
    };

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Selamat Datang! 👋</h1>
                    <p className="text-gray-500 font-medium">Siap melayani pesanan hari ini?</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleOnline}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl shadow-lg transition-all font-bold text-sm ${isOnline
                            ? 'bg-brand-green text-white hover:opacity-90'
                            : 'bg-white text-gray-400 border border-gray-100'
                            }`}
                    >
                        <Power size={16} />
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid - Matching User template variants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Total Antar Jemput"
                    value={stats.total_trips.toString()}
                    subtext="Semua perjalanan aktif"
                    icon={<Car size={24} />}
                    variant="dark"
                />
                <StatCard
                    title="Pesanan Selesai"
                    value={stats.completed_orders.toString()}
                    subtext="Perjalanan"
                    icon={<CheckCircle size={24} />}
                />
                <StatCard
                    title="Rating Driver"
                    value={stats.rating.toString()}
                    subtext="Ulasan"
                    icon={<Star size={24} />}
                />
                <StatCard
                    title="Pendapatan Keseluruhan"
                    value={`Rp ${stats.revenue ? stats.revenue.toLocaleString('id-ID') : '0'}`}
                    subtext="Total bersih"
                    icon={<Wallet size={24} />}
                />
            </div>

            {/* Actions Grid - Matching User template variants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <ActionCard
                    title="Pesanan Aktif"
                    description="Kelola pesanan yang sedang berjalan"
                    icon={<ClipboardList size={32} />}
                    buttonOrder="Lihat Pesanan"
                    variant="green"
                    onClick={() => { }}
                />
                <ActionCard
                    title="Chat Pelanggan"
                    description="Komunikasi langsung dengan pelanggan"
                    icon={<MessageSquare size={32} />}
                    buttonOrder="Buka Chat"
                    variant="blue"
                    onClick={() => navigate('/driver/chat')}
                />
                <ActionCard
                    title="Riwayat"
                    description="Lihat semua riwayat pekerjaan Anda"
                    icon={<History size={32} />}
                    buttonOrder="Lihat Riwayat"
                    variant="light"
                    onClick={() => { }}
                />
            </div>

            {/* Recent Orders List */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Riwayat Pengantaran</h2>
                
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <p className="font-medium text-sm">Belum ada aktivitas terbaru hari ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-5 px-6 font-semibold text-gray-500 rounded-tl-xl">Order ID</th>
                                    <th className="py-5 px-6 font-semibold text-gray-500">Tanggal</th>
                                    <th className="py-5 px-6 font-semibold text-gray-500">Detail Pelanggan</th>
                                    <th className="py-5 px-6 font-semibold text-gray-500 rounded-tr-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-brand-dark-blue">
                                            {order.id}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 border-b-0 space-y-1">
                                            <div className="text-sm font-medium">{new Date(order.orderDate).toISOString().split('T')[0]}</div>
                                            <div className="text-xs text-gray-400">Rp {order.total_price?.toLocaleString('id-ID')}</div>
                                        </td>
                                        <td className="py-4 px-6 border-b-0 space-y-1">
                                            <div className="text-sm font-semibold text-gray-800">👤 {order.customer_name}</div>
                                            <div className="text-xs text-gray-500 mt-1">📍 {order.notes || '-'}</div>
                                        </td>
                                        <td className="py-4 px-6 border-b-0">
                                            <span className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-bold uppercase tracking-wider">
                                                Accepted
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
