import React, { useState, useEffect } from 'react';
import { Car, ShoppingBag, Store, Eye, Package, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import ReportModal from '../../components/user/ReportModal';
import { AlertTriangle } from 'lucide-react';

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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    // Filtering & Pagination
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const filteredData = data.filter(order => {
        if (!dateFilter) return true;
        const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
        return orderDate === dateFilter;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter]);

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Order Saya</h1>
                    <p className="text-gray-500 font-medium">Riwayat semua pesanan kamu</p>
                </div>
                {/* Date Filter */}
                <div className="relative w-full md:w-64">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all text-sm font-medium text-gray-800 shadow-sm"
                    />
                    {dateFilter && (
                        <button 
                            onClick={() => setDateFilter('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100/50 border-b border-gray-100 uppercase tracking-widest text-[10px] font-black text-gray-400">
                                <th className="py-5 px-6">Order ID</th>
                                <th className="py-5 px-6 text-center">Tipe</th>
                                <th className="py-5 px-6">Tanggal</th>
                                <th className="py-5 px-6">Status</th>
                                <th className="py-5 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!isLoading && paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-gray-400 font-medium">
                                        Tidak ada pesanan ditemukan
                                    </td>
                                </tr>
                            )}
                            {!isLoading && paginatedData.map((order, index) => {
                                const Icon = getOrderIcon(order.type);
                                const statusColor = getStatusColor(order.status);
                                const dateStr = order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '';

                                return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-6 font-bold text-brand-dark-blue text-sm">
                                            {order.id}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            <div className="flex items-center justify-center">
                                                 <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-brand-green/20 transition-all">
                                                    <Icon size={14} className="text-brand-green" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider">{order.type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-500 font-medium text-xs">
                                            {dateStr}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${statusColor} uppercase tracking-widest`}>
                                                {order.status === 'Diproses' || order.status === 'Dalam Perjalanan' || order.status === 'Selesai' ? 'Accepted' : order.status === 'Dibatalkan' ? 'Rejected' : order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="flex items-center gap-2 text-[11px] font-black uppercase px-4 py-2 bg-brand-light-green text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye size={14} /> Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase">Halaman {currentPage} dari {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
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
                                    <p className="font-medium text-gray-800">
                                        {selectedOrder.type === 'Marketplace' && !selectedOrder.driver_id ? '-' : (selectedOrder.driver_name || 'Menunggu Driver')}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-700 uppercase text-[10px] tracking-wider mb-1">Harga Kesepakatan</p>
                                    <p className="font-bold text-brand-green text-base">
                                        Rp {selectedOrder.total_price ? selectedOrder.total_price.toLocaleString('id-ID') : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                            {(selectedOrder.driver_id || selectedOrder.seller_id) && (
                                <button 
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="w-full py-2 rounded font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={16} /> Laporkan Masalah
                                </button>
                            )}
                            <button onClick={() => setSelectedOrder(null)} className="w-full py-2 rounded font-bold text-sm text-white bg-brand-green hover:bg-[#1a4030] transition-colors">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {selectedOrder && (
                <ReportModal 
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={selectedOrder.seller_id || selectedOrder.driver_id}
                    reportedName={selectedOrder.type === 'Marketplace' ? (selectedOrder.seller || 'Penjual') : (selectedOrder.driver_name || 'Driver')}
                    orderId={selectedOrder.id}
                />
            )}
        </div>
    );
};

export default OrderSaya;
