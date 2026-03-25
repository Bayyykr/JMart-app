import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, MapPin, Package, Users, ChevronRight, ShoppingBag, Star, X } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const DriverJastip = () => {
    const [jastips, setJastips] = useState([]);
    const [selectedJastip, setSelectedJastip] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formData, setFormData] = useState({
        store_name: '',
        departure_time: '12:00',
        close_order_time: '11:00',
        available_slots: 5,
        fee: 5000
    });

    const fetchMyJastips = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/driver/jastips');
            setJastips(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengambil data Jastip");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyJastips();

        // Real-time slot update listener
        const handleSlotUpdate = (data) => {
            // Update jastip list
            setJastips(prev => prev.map(j =>
                j.id === data.jastip_id
                    ? { ...j, available_slots: data.available_slots, status: data.status }
                    : j
            ));

            // Update selected jastip detail if open
            setSelectedJastip(prev => {
                if (!prev || prev.jastip?.id !== data.jastip_id) return prev;
                return {
                    ...prev,
                    jastip: { ...prev.jastip, available_slots: data.available_slots, status: data.status },
                    items: prev.items.map(item =>
                        item.order_id === data.order_id
                            ? { ...item, orderStatus: data.new_order_status }
                            : item
                    )
                };
            });
        };

        socket.on('jastip_slot_update', handleSlotUpdate);
        return () => socket.off('jastip_slot_update', handleSlotUpdate);
    }, []);

    const handleCreateJastip = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/driver/jastips', formData);
            toast.success("Jastip berhasil diposting!");
            setShowCreateForm(false);
            fetchMyJastips();
            setFormData({
                store_name: '',
                departure_time: '12:00',
                close_order_time: '11:00',
                available_slots: 5,
                fee: 5000
            });
        } catch (err) {
            console.error(err);
            toast.error("Gagal membuat Jastip");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchJastipDetails = async (id) => {
        try {
            const res = await api.get(`/driver/jastips/${id}`);
            setSelectedJastip(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengambil detail Jastip");
        }
    };

    const handleAcceptOrder = async (item, jastipId) => {
        try {
            await api.post('/driver/jastips/accept-order', {
                order_id: item.order_id,
                jastip_id: jastipId
            });
            toast.success(`Pesanan ${item.item_name} diterima!`);
            fetchJastipDetails(jastipId);
            fetchMyJastips();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Gagal menerima pesanan');
        }
    };

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Kelola Jasa Titip</h1>
                    <p className="text-gray-500 font-medium">Buat jadwal belanja dan terima pesanan dari pengguna.</p>
                </div>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all ${
                        showCreateForm ? 'bg-gray-100 text-gray-500' : 'bg-brand-orange text-white hover:brightness-105'
                    }`}
                >
                    {showCreateForm ? 'Tutup Form' : <><Plus size={20} /> Buat Jadwal Jastip</>}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold text-brand-dark-blue mb-6">Informasi Jastip Baru</h2>
                    <form onSubmit={handleCreateJastip} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Toko / Lokasi Beli</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Contoh: Alfamart Mastrip"
                                    className="w-full pl-12 pr-4 py-3 bg-[#f4efe8] border-none rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all font-medium text-gray-700"
                                    value={formData.store_name}
                                    onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Jam Berangkat</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light-blue w-5 h-5" />
                                <input 
                                    type="time" 
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-[#f4efe8] border-none rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all font-medium text-gray-700"
                                    value={formData.departure_time}
                                    onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Batas Order</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light-blue w-5 h-5" />
                                <input 
                                    type="time" 
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-[#f4efe8] border-none rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all font-medium text-gray-700"
                                    value={formData.close_order_time}
                                    onChange={(e) => setFormData({...formData, close_order_time: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Total Slot (Pesanan)</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                                <input 
                                    type="number" 
                                    min="1"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-[#f4efe8] border-none rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all font-medium text-gray-700"
                                    value={formData.available_slots}
                                    onChange={(e) => setFormData({...formData, available_slots: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tarif Jasa per Item (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green font-bold">Rp</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="500"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-[#f4efe8] border-none rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all font-medium text-gray-700"
                                    value={formData.fee}
                                    onChange={(e) => setFormData({...formData, fee: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-brand-green hover:bg-green-800 text-white shadow-green-100'}`}
                            >
                                {isSubmitting ? 'Memproses...' : 'Posting Jastip'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* List of Jastips (Left Column) */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-brand-dark-blue">Jadwal Anda</h2>
                        <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 border border-gray-100 shadow-sm">
                            {jastips.length} Jadwal
                        </span>
                    </div>

                    {jastips.length === 0 && !isLoading && (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                                <Package size={32} />
                            </div>
                            <p className="text-gray-500 font-bold mb-1">Belum ada jadwal jastip</p>
                            <p className="text-gray-400 text-xs">Klik tombol di atas untuk mulai</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 overflow-y-auto pr-1">
                        {jastips.map((j) => (
                            <div 
                                key={j.id}
                                onClick={() => fetchJastipDetails(j.id)}
                                className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${
                                    selectedJastip?.jastip?.id === j.id 
                                    ? 'border-brand-orange bg-[#fdfaf6]' 
                                    : 'border-transparent hover:border-brand-light-blue/20'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 bg-brand-light-blue rounded-xl flex items-center justify-center text-white">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark-blue line-clamp-1">{j.store_name}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{j.departure_time.substring(0, 5)} WIB</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                                        j.status === 'Open' ? 'bg-[#eefcf3] text-brand-green' : 'bg-red-50 text-red-500'
                                    }`}>
                                        {j.status === 'Open' ? 'Buka' : 'Penuh'}
                                    </span>
                                </div>

                                <div className="bg-[#f4efe8] rounded-xl p-3 mb-4 grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                        <Clock size={14} className="text-brand-light-blue" />
                                        <span>Tutup: {j.close_order_time.substring(0, 5)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                        <Users size={14} className="text-brand-orange" />
                                        <span>Slot: {j.available_slots}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Tarif Jasa</p>
                                        <span className="text-brand-green font-bold text-lg">Rp {Number(j.fee).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <ChevronRight size={20} className={selectedJastip?.jastip?.id === j.id ? 'text-brand-orange' : 'text-gray-300'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Jastip Details (Right Column) */}
                <div className="lg:col-span-12 xl:col-span-7">
                    {!selectedJastip ? (
                        <div className="bg-white rounded-2xl h-[580px] border border-gray-100 flex flex-col items-center justify-center text-gray-400 text-center p-12 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                                <ShoppingBag className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark-blue mb-2">Detail Pesanan</h3>
                            <p className="max-w-xs text-sm font-medium">Pilih salah satu jadwal jastip di sebelah kiri untuk melihat daftar pesanan pelanggan.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6">
                                <div className="flex gap-4 items-center">
                                    <div className="w-14 h-14 bg-brand-light-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-light-blue/20">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-brand-dark-blue mb-1">{selectedJastip.jastip.store_name}</h3>
                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Clock size={14} className="text-brand-light-blue" /> Berangkat {selectedJastip.jastip.departure_time.substring(0, 5)}</span>
                                            <span className="flex items-center gap-2"><Users size={14} className="text-brand-orange" /> {selectedJastip.jastip.available_slots} Slot Tersisa</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-brand-green/5 p-4 rounded-xl border border-brand-green/10 text-right">
                                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-widest mb-1">Total Pendapatan</p>
                                    <p className="text-xl font-bold text-brand-green">Rp {Number(selectedJastip.items.length * selectedJastip.jastip.fee).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-lg font-bold text-brand-dark-blue flex items-center gap-3">
                                    Daftar Pelanggan ({selectedJastip.items.length})
                                    <div className="h-0.5 flex-1 bg-gray-50 rounded-full"></div>
                                </h4>

                                {selectedJastip.items.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                        <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold mb-1">Belum ada pesanan masuk</p>
                                        <p className="text-gray-300 text-xs text-center px-8">Bagikan jadwal jastip Anda agar pelanggan tahu!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                        {selectedJastip.items.map((item) => (
                                            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group hover:bg-[#fcf9f5] transition-all shadow-sm">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-[#f4efe8] flex items-center justify-center text-brand-orange flex-shrink-0">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-brand-dark-blue text-sm line-clamp-1">{item.item_name} <span className="text-gray-400 font-medium">x{item.quantity}</span></p>
                                                        <p className="text-[10px] text-gray-500 font-medium truncate">{item.userName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`hidden sm:inline-block px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                        ['Selesai', 'Accepted'].includes(item.orderStatus) ? 'bg-[#eefcf3] text-brand-green' :
                                                        item.orderStatus === 'Menunggu' ? 'bg-yellow-50 text-yellow-600' :
                                                        'bg-orange-50 text-brand-orange'
                                                    }`}>
                                                        {item.orderStatus}
                                                    </span>
                                                    <button onClick={() => setSelectedItem(item)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold transition-colors shadow-sm">
                                                        Detail
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Item Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#fcf9f5]">
                            <h3 className="font-bold text-brand-dark-blue flex items-center gap-2">
                                <ShoppingBag size={18} className="text-brand-orange" />
                                Rincian Pesanan
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-white rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-brand-dark-blue shrink-0">
                                    {selectedItem.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Pemesan</p>
                                    <p className="font-bold text-brand-dark-blue">{selectedItem.userName}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        ['Selesai', 'Accepted'].includes(selectedItem.orderStatus) ? 'bg-[#eefcf3] text-brand-green' :
                                        selectedItem.orderStatus === 'Menunggu' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-orange-50 text-brand-orange'
                                    }`}>
                                        Status: {selectedItem.orderStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white border border-gray-100 rounded-xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Barang</p>
                                    <p className="text-sm font-bold text-brand-dark-blue truncate" title={selectedItem.item_name}>{selectedItem.item_name}</p>
                                </div>
                                <div className="p-3 bg-white border border-gray-100 rounded-xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Jumlah</p>
                                    <p className="text-sm font-bold text-brand-dark-blue">{selectedItem.quantity} pcs</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 px-1">Pengantaran</p>
                                <p className="text-sm font-semibold text-brand-dark-blue flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
                                    <MapPin size={14} className="text-brand-orange shrink-0" />
                                    {selectedItem.delivery_point || 'Alamat tidak ditentukan'}
                                </p>
                            </div>

                            {selectedItem.notes && (
                                <div className="p-3 bg-brand-orange/5 rounded-xl border border-brand-orange/10">
                                    <p className="text-[10px] text-brand-orange font-black uppercase mb-1 flex items-center gap-1">
                                        Catatan
                                    </p>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedItem.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => setSelectedItem(null)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                                Tutup
                            </button>
                            {selectedItem.orderStatus === 'Menunggu' && (
                                <button 
                                    onClick={() => {
                                        handleAcceptOrder(selectedItem, selectedJastip.jastip.id);
                                        setSelectedItem(null); // auto-close on accept
                                    }}
                                    className="flex-1 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:brightness-105 transition-all shadow-sm shadow-brand-green/20"
                                >
                                    Terima Pesanan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverJastip;
