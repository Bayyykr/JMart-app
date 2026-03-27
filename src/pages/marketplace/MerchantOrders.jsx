import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Clock, CheckCircle, XCircle, Truck, PackageCheck } from 'lucide-react';
import api from '../../services/api';

const MerchantOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchOrders = async () => {
        try {
            const response = await api.get('/merchant/orders');
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching merchant orders:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/merchant/orders/${orderId}/status`, { status: newStatus });
            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error('Error updating order:', error);
            alert("Gagal mengupdate pesanan");
        }
    };

    const filteredOrders = filterDate ? orders.filter(o => {
        const oDate = o.createdAt ? o.createdAt.split('T')[0] : o.orderDate;
        return oDate === filterDate;
    }) : orders;

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border-b border-gray-100 gap-4">
                <h2 className="text-xl font-black text-[#0a2540]">Daftar Pesanan</h2>
                <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black text-[#667781] uppercase tracking-widest">Filter Tanggal</label>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 bg-[#f0f2f5] border-none rounded-xl text-sm font-bold text-[#111b21] outline-none focus:ring-2 focus:ring-[#25d366]/20 transition-all cursor-pointer"
                    />
                    {filterDate && (
                        <button onClick={() => { setFilterDate(''); setCurrentPage(1); }} className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 tracking-widest bg-red-50 px-3 py-2 rounded-xl">Reset</button>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID Pesanan</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pelanggan</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    Memuat pesanan...
                                </td>
                            </tr>
                        ) : paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-brand-dark-blue">{order.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-brand-dark-blue">{order.customer_name || 'Pembeli'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">Metode: {order.shipping_method || 'N/A'}</p>
                                        {order.driver_name && (
                                            <p className="text-[10px] text-brand-green font-bold mt-1">Driver: {order.driver_name}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black text-brand-green">Rp {(order.total_price || 0).toLocaleString('id-ID')}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            order.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
                                            order.status === 'Dalam Perjalanan' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'Dibatalkan' ? 'bg-red-100 text-red-700' :
                                            order.status === 'Menunggu Konfirmasi' ? 'bg-purple-100 text-purple-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {order.status === 'Menunggu Konfirmasi' && (
                                                <>
                                                    <button 
                                                        onClick={async () => {
                                                            await api.put(`/merchant/orders/${order.id}/accept`);
                                                            fetchOrders();
                                                        }} 
                                                        className="px-3 py-1.5 bg-brand-green text-white text-[10px] font-bold rounded-lg hover:bg-[#124429] transition-all flex items-center gap-1.5 shadow-sm"
                                                        title="Terima Pesanan"
                                                    >
                                                        <CheckCircle size={14} />
                                                        <span>Terima</span>
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            await api.put(`/merchant/orders/${order.id}/reject`);
                                                            fetchOrders();
                                                        }} 
                                                        className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-all flex items-center gap-1.5"
                                                        title="Tolak Pesanan"
                                                    >
                                                        <XCircle size={14} />
                                                        <span>Tolak</span>
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'Diproses' && (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => updateStatus(order.id, 'Dalam Perjalanan')} 
                                                        className="px-3 py-1.5 bg-brand-orange text-white text-[10px] font-black rounded-lg hover:bg-[#c45a16] transition-all flex items-center gap-1.5 shadow-sm"
                                                        title="Kirim (Dikirim)"
                                                    >
                                                        <Truck size={14} />
                                                        <span>DIKIRIM</span>
                                                    </button>
                                                    <button onClick={() => updateStatus(order.id, 'Dibatalkan')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Tolak Pesanan">
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                            {order.status === 'Dalam Perjalanan' && (
                                                <button 
                                                    onClick={() => updateStatus(order.id, 'Selesai')} 
                                                    className="px-3 py-1.5 bg-brand-green text-white text-[10px] font-black rounded-lg hover:bg-[#124429] transition-all flex items-center gap-1.5 shadow-sm"
                                                    title="Terima (Diterima)"
                                                >
                                                    <PackageCheck size={14} />
                                                    <span>DITERIMA</span>
                                                </button>
                                            )}
                                            {(order.status === 'Selesai' || order.status === 'Dibatalkan') && (
                                                <span className="text-xs text-gray-400 italic">No Action</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-12 text-center">
                                    <ShoppingBag className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-sm font-bold text-gray-400">Belum ada pesanan masuk.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#667781] uppercase tracking-widest">
                        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} pesanan
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-[#f0f2f5] hover:bg-[#dfe5e7] text-[#111b21] font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all"
                        >
                            Prev
                        </button>
                        <div className="px-4 py-2 bg-brand-green/10 text-brand-green font-black text-[11px] rounded-xl flex items-center justify-center min-w-[3rem]">
                            {currentPage} / {totalPages}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-[#f0f2f5] hover:bg-[#dfe5e7] text-[#111b21] font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantOrders;
