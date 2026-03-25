import React, { useState, useEffect } from 'react';
import { Package, Car, MapPin, Search } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';

const DriverOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/driver/orders');
                setOrders(response.data);
            } catch (error) {
                console.error("Error fetching driver orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(
        (order) =>
            order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 pb-24 font-primary">
            <TopLoadingBar isLoading={isLoading} />
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Semua Pesanan Anda</h1>
                    <p className="text-gray-500 font-medium">Lacak seluruh riwayat pengantaran yang telah diselesaikan. </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari ID, Pelanggan, atau Rute..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none text-sm font-medium transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 font-medium">Memuat pesanan...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-gray-50/50">
                            <Package size={40} className="text-gray-300" />
                        </div>
                        <p className="font-semibold text-lg text-gray-600">Tidak Ada Pesanan</p>
                        <p className="text-sm font-medium mt-1">Belum ada pesanan yang terselesaikan atau cocok dengan pencarian.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider text-[10px] font-bold text-gray-500">
                                    <th className="py-4 px-6 rounded-tl-[24px]">Order ID</th>
                                    <th className="py-4 px-6">Tanggal</th>
                                    <th className="py-4 px-6">Detail Pelanggan</th>
                                    <th className="py-4 px-6">Pendapatan</th>
                                    <th className="py-4 px-6 rounded-tr-[24px]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order, index) => (
                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                                                    <Car size={16} />
                                                </div>
                                                <span className="font-semibold text-brand-dark-blue text-sm">{order.id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            <div className="text-sm font-medium">{new Date(order.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                                    👤 {order.customer_name}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-start gap-1">
                                                    <MapPin size={12} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]">{order.notes || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-bold text-brand-green">
                                                Rp {order.total_price?.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-brand-light-green text-brand-dark-green rounded-full text-xs font-bold uppercase tracking-wider border border-brand-green/20">
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

export default DriverOrders;
