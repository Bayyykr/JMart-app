import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import { ShoppingBag, MapPin, Clock, Search, Send, User, ChevronRight } from 'lucide-react';

const DriverBroadcasts = () => {
    const { user } = useAuth();
    const [availableBroadcasts, setAvailableBroadcasts] = useState([]);
    const [offerPrices, setOfferPrices] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(null);

    const fetchAvailableBroadcasts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/driver/broadcasts/available');
            setAvailableBroadcasts(res.data);
        } catch (err) {
            console.error("Error fetching available broadcasts:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableBroadcasts();
        const interval = setInterval(fetchAvailableBroadcasts, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleMakeOffer = async (broadcastId) => {
        const price = offerPrices[broadcastId];
        if (!price || isNaN(price)) {
            toast.error('Masukkan harga penawaran yang valid');
            return;
        }

        setIsSubmitting(broadcastId);
        try {
            await api.post('/driver/broadcasts/offer', {
                broadcast_id: broadcastId,
                price: parseInt(price)
            });
            toast.success('Penawaran terkirim via Chat!');
            setOfferPrices(prev => {
                const updated = { ...prev };
                delete updated[broadcastId];
                return updated;
            });
            fetchAvailableBroadcasts();
        } catch (err) {
            console.error("Error making offer:", err);
            toast.error(err.response?.data?.message || 'Gagal mengirim penawaran.');
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <TopLoadingBar isLoading={isLoading} />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-brand-dark-blue tracking-tight mb-2">Broadcast Antar-Jemput</h1>
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                            <p className="text-sm font-medium">Memantau permintaan aktif di sekitarmu...</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Stats/Filter Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ringkasan</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm font-medium">Tersedia</span>
                                    <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-bold">{availableBroadcasts.length} Post</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm font-medium">Area Anda</span>
                                    <span className="text-brand-dark-blue text-xs font-bold">Banyuwangi</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-dark-blue p-6 rounded-[24px] shadow-xl text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Tips Driver</h3>
                                <p className="text-xs text-blue-100 leading-relaxed opacity-80">Berikan harga bersaing untuk meningkatkan peluang dipilih oleh pelanggan.</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-10">
                                <ShoppingBag size={80} />
                            </div>
                        </div>
                    </div>

                    {/* Main List Column */}
                    <div className="lg:col-span-3">
                        {availableBroadcasts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">Belum ada broadcast baru</h3>
                                <p className="text-gray-400 text-sm mb-6">Tunggu sebentar atau coba segarkan halaman.</p>
                                <button 
                                    onClick={fetchAvailableBroadcasts}
                                    className="px-6 py-2.5 bg-brand-green text-white text-sm font-bold rounded-xl hover:bg-brand-dark-blue transition-all"
                                >
                                    Cek Sekarang
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableBroadcasts.map((bc) => (
                                    <div key={bc.id} className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Pelanggan</p>
                                                        <p className="text-sm font-bold text-brand-dark-blue capitalize">{bc.user_name}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                    {new Date(bc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div className="relative pl-6">
                                                    <div className="absolute left-[7px] top-[7px] bottom-[7px] w-0.5 bg-gray-100"></div>
                                                    
                                                    <div className="mb-4 relative">
                                                        <div className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-brand-green border-2 border-white shadow-sm"></div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jemput</p>
                                                        <p className="text-sm font-bold text-brand-dark-blue mt-0.5 line-clamp-1">{bc.pickup_location}</p>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-brand-orange border-2 border-white shadow-sm"></div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tujuan</p>
                                                        <p className="text-sm font-bold text-brand-dark-blue mt-0.5 line-clamp-1">{bc.destination_location}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {bc.pickup_time && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/5 text-brand-green rounded-lg border border-brand-green/10">
                                                            <Clock size={12} className="font-bold" />
                                                            <span className="text-[10px] font-extrabold uppercase">{bc.pickup_time}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 italic flex-1">
                                                        <span className="text-[10px] font-medium truncate">"{bc.notes || 'Tidak ada catatan'}"</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-gray-50 flex items-center gap-2">
                                                {bc.already_bid > 0 ? (
                                                    <div className="flex-1 bg-brand-green/10 text-brand-green px-4 py-3 rounded-2xl text-center font-bold text-xs uppercase tracking-widest border border-brand-green/20">
                                                        Penawaran Telah Terkirim
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="relative flex-1 group/input">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">Rp</span>
                                                            <input 
                                                                type="number"
                                                                placeholder="Harga"
                                                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 text-sm font-bold text-brand-dark-blue outline-none focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all transition-all"
                                                                value={offerPrices[bc.id] || ''}
                                                                onChange={(e) => setOfferPrices({ ...offerPrices, [bc.id]: e.target.value })}
                                                            />
                                                        </div>
                                                        <button 
                                                            disabled={isSubmitting === bc.id || bc.already_bid > 0}
                                                            onClick={() => {
                                                                setIsSubmitting(bc.id);
                                                                handleMakeOffer(bc.id);
                                                            }}
                                                            className="h-12 w-12 flex items-center justify-center bg-brand-green text-white rounded-2xl hover:bg-brand-dark-blue transition-all shadow-lg shadow-brand-green/10 active:scale-95 disabled:opacity-50"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverBroadcasts;
