import React, { useState, useEffect } from 'react';
import { Car, ShoppingBag, Store, Eye, Package } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';

const getOrderIcon = (type) => {
    switch (type) {
        case 'Antar Jemput': return Car;
        case 'Jasa Titip': return ShoppingBag;
        case 'Marketplace': return Store;
        default: return Package;
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Selesai': return 'bg-green-100 text-green-700';
        case 'Dalam Perjalanan': return 'bg-blue-100 text-blue-700';
        case 'Diproses': return 'bg-orange-100 text-orange-700';
        case 'Dibatalkan': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const OrderSaya = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/user/orders');
                setData(response.data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Order Saya</h1>
                <p className="text-gray-500 font-medium">Riwayat semua pesanan kamu</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-5 px-6 font-semibold text-gray-500">Order ID</th>
                                <th className="py-5 px-6 font-semibold text-gray-500">Tipe</th>
                                <th className="py-5 px-6 font-semibold text-gray-500">Tanggal</th>
                                <th className="py-5 px-6 font-semibold text-gray-500">Status</th>
                                <th className="py-5 px-6 font-semibold text-gray-500 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!isLoading && data.map((order, index) => {
                                const Icon = getOrderIcon(order.type);
                                const statusColor = getStatusColor(order.status);

                                // Format the exact date properly if its a DB timestamp string
                                const dateStr = order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '';

                                return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-brand-dark-blue">
                                            {order.id}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Icon size={18} className="text-gray-400" />
                                                {order.type}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            {dateStr}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor} uppercase tracking-wider`}>
                                                {order.status === 'Diproses' || order.status === 'Dalam Perjalanan' || order.status === 'Selesai' ? 'Accepted' : order.status === 'Dibatalkan' ? 'Rejected' : order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-brand-light-green text-brand-green rounded-md hover:bg-brand-green hover:text-white transition-colors"
                                                >
                                                    <Eye size={16} /> Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-sm animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Package size={20} className="text-brand-green" />
                                Detail Pesanan
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                                &times;
                            </button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-600 pb-2">
                            <div>
                                <p className="font-semibold text-gray-700 uppercase text-[10px] tracking-wider mb-1">Rute Perjalanan</p>
                                <p className="font-medium text-gray-800">{selectedOrder.notes || '-'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-700 uppercase text-[10px] tracking-wider mb-1">Driver</p>
                                    <p className="font-medium text-gray-800">{selectedOrder.driver_name || 'Menunggu Driver'}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-700 uppercase text-[10px] tracking-wider mb-1">Harga Kesepakatan</p>
                                    <p className="font-bold text-brand-green text-base">
                                        Rp {selectedOrder.total_price ? selectedOrder.total_price.toLocaleString('id-ID') : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button onClick={() => setSelectedOrder(null)} className="w-full py-2 rounded font-bold text-sm text-white bg-brand-green hover:bg-[#1a4030] transition-colors">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderSaya;
