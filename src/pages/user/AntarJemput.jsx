import React, { useState, useEffect, useCallback } from 'react';
import { Bike, Star, MapPin, Search, ChevronLeft, ChevronRight, AlertCircle, MessageSquare, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import BookingModal from '../../components/user/BookingModal';
import { useAuth } from '../../context/authContext';
import { useLocation as useGlobalLocation } from '../../context/LocationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Haversine formula on frontend for real-time distance updates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

const AntarJemput = () => {
    const { user } = useAuth();
    const { userLocation, userAreaName, userRegency, locationStatus, isManual, updateLocation, searchLocation } = useGlobalLocation();
    const routerLocation = useLocation();
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const DRIVERS_PER_PAGE = 6;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('Pilih Langsung');

    // Buat Tawaran State
    const [postForm, setPostForm] = useState({
        jemput: '',
        tujuan: '',
        waktuJemput: '',
        catatan: ''
    });

    const [myPosts, setMyPosts] = useState([]);
    const [selectedOffers, setSelectedOffers] = useState(null); // { broadcastId: id, offers: [] }

    useEffect(() => {
        const state = routerLocation.state;
        if (state && state.deliveryRequest) {
            setActiveTab('Buat Tawaran');
            const { product, quantity, total, notes, seller } = state.deliveryRequest;
            setPostForm(prev => ({
                ...prev,
                jemput: seller,
                catatan: `Delivery: ${quantity}x ${product} (${notes || 'Tidak ada catatan'}). Tolong talangi dulu Rp ${total.toLocaleString('id-ID')} ya.`,
            }));
            navigate(routerLocation.pathname, { replace: true });
        }
    }, [routerLocation, navigate]);

    const handleOpenModal = (driver) => {
        setSelectedDriver(driver);
        setIsModalOpen(true);
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/user/broadcasts', {
                pickup_location: postForm.jemput,
                destination_location: postForm.tujuan,
                pickup_time: postForm.waktuJemput,
                notes: postForm.catatan
            });

            // Refresh list
            fetchMyBroadcasts();
            setPostForm({ jemput: '', tujuan: '', waktuJemput: '', catatan: '' });
            toast.success("Postingan berhasil dibuat!");
        } catch (error) {
            console.error('Error creating broadcast:', error);
            toast.error('Gagal membuat postingan.');
        }
    };

    const fetchMyBroadcasts = async () => {
        try {
            const response = await api.get('/user/broadcasts');
            setMyPosts(response.data);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        }
    };

    const fetchOffers = async (broadcastId) => {
        try {
            const response = await api.get(`/user/broadcasts/${broadcastId}/offers`);
            setSelectedOffers({ broadcastId, offers: response.data });
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    };

    const handleAcceptOffer = async (offerId) => {
        if (!confirm('Apakah Anda yakin ingin menerima penawaran ini?')) return;
        try {
            await api.post('/user/broadcasts/accept-offer', { offer_id: offerId });
            toast.success('Penawaran diterima!');
            setSelectedOffers(null);
            fetchMyBroadcasts();
        } catch (error) {
            console.error('Error accepting offer:', error);
            toast.error('Gagal menerima penawaran.');
        }
    };

    useEffect(() => {
        fetchMyBroadcasts();

        if (user) {
            socket.emit('join_personal', user.id);
            socket.on('new_broadcast_offer', (data) => {
                fetchMyBroadcasts();
                // If the selected offers modal is open for this broadcast, refresh it too
                if (selectedOffers && selectedOffers.broadcastId === data.broadcast_id) {
                    fetchOffers(data.broadcast_id);
                }
            });
        }

        return () => {
            socket.off('new_broadcast_offer');
        };
    }, [user, selectedOffers]);


    const fetchDrivers = useCallback(async (coords, areaName, regency, isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (coords) {
                params.append('lat', coords.lat);
                params.append('lng', coords.lng);
            }
            if (areaName) {
                params.append('area', areaName);
            }
            if (regency) {
                params.append('regency', regency);
            }

            const response = await api.get(`/user/drivers?${params.toString()}`);
            const newData = response.data.drivers || response.data;
            
            if (isBackground) {
                // In background mode: merge smartly, don't just replace.
                // Only update drivers that match the current regency to prevent wrong-area flash.
                setData(prevData => {
                    const newDataMap = new Map(newData.map(d => [String(d.id), d]));
                    // Update existing drivers with new data
                    const updated = prevData.map(d => newDataMap.has(String(d.id)) ? { ...d, ...newDataMap.get(String(d.id)) } : d);
                    // Add new drivers from the API that weren't in stale data
                    const existingIds = new Set(prevData.map(d => String(d.id)));
                    const added = newData.filter(d => !existingIds.has(String(d.id)));
                    return [...updated, ...added];
                });
            } else {
                setData(newData);
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, []);

    const locationRef = React.useRef({ userLocation, userAreaName, userRegency });
    useEffect(() => {
        locationRef.current = { userLocation, userAreaName, userRegency };
    }, [userLocation, userAreaName, userRegency]);

    useEffect(() => {
        if (userLocation) {
            fetchDrivers(userLocation, userAreaName, userRegency);
        }
    }, [userLocation, userAreaName, userRegency, fetchDrivers]);

    useEffect(() => {
        const handleDriverUpdate = (onlineDriversArr) => {
            if (!Array.isArray(onlineDriversArr)) return;
            
            setData(prevData => {
                const onlineMap = new Map();
                onlineDriversArr.forEach(od => {
                    const id = od.userId || od.id;
                    if (id) onlineMap.set(String(id), od);
                });

                // Update existing drivers
                const updated = prevData.map(d => {
                    const onlineInfo = onlineMap.get(String(d.id));
                    if (onlineInfo) {
                        return { ...d, ...onlineInfo, status: 'Online' };
                    }
                    // If they were online but now aren't in the store, set to Offline
                    if (d.status === 'Online') {
                        return { ...d, status: 'Offline' };
                    }
                    return d;
                });

                // Add new online drivers that aren't in the list
                const existingIds = new Set(prevData.map(d => String(d.id)));
                const newOnline = onlineDriversArr
                    .filter(od => !existingIds.has(String(od.userId || od.id)))
                    .map(od => ({ ...od, id: od.userId || od.id, status: 'Online' }));

                return [...updated, ...newOnline];
            });
        };

        socket.on('driver_update', handleDriverUpdate);
        socket.on('location_changed', (locData) => {
            setData(prev => prev.map(d => (String(d.id) === String(locData.userId)) ? { ...d, lat: locData.lat, lng: locData.lng, area: locData.area || d.area } : d));
        });

        return () => {
            socket.off('driver_update', handleDriverUpdate);
            socket.off('location_changed');
        };
    }, []);

    const filteredDrivers = data.filter(driver => {
        const query = searchQuery.toLowerCase();
        return (
            (driver.name && driver.name.toLowerCase().includes(query)) ||
            (driver.vehicle_info && driver.vehicle_info.toLowerCase().includes(query)) ||
            (driver.area && driver.area.toLowerCase().includes(query))
        );
    });

    const totalPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
    const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * DRIVERS_PER_PAGE, currentPage * DRIVERS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-1">Antar Jemput</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-gray-500 font-medium">Pilih driver terdekat (Radius 20km) untuk perjalananmu</p>
                    </div>
                </div>
                <div className="relative w-full lg:w-80">
                    {activeTab === 'Pilih Langsung' && (
                        <>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari driver, area, motor..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-gray-800 shadow-sm"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('Pilih Langsung')}
                    className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'Pilih Langsung' ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Pilih Driver Langsung
                    {activeTab === 'Pilih Langsung' && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-green rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('Buat Tawaran')}
                    className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'Buat Tawaran' ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Buat Postingan (Broadcast)
                    {activeTab === 'Buat Tawaran' && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-green rounded-t-full"></span>
                    )}
                </button>
            </div>

            {activeTab === 'Pilih Langsung' ? (
                <>
                    {/* Driver Counter */}
                    {!isLoading && filteredDrivers.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                                    {filteredDrivers.filter(d => d.status === 'Online').length} Online
                                </h2>
                                <span className="text-gray-300">|</span>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    {filteredDrivers.filter(d => d.status === 'Offline').length} Offline
                                </h2>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Halaman {currentPage} dari {totalPages}</p>
                        </div>
                    )}

                    {/* Driver Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                        {!isLoading && paginatedDrivers.map((driver) => (
                            <DriverCard key={driver.id} driver={driver} onBook={handleOpenModal} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {!isLoading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${currentPage === page
                                            ? 'bg-brand-green text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    )}

                    {!isLoading && filteredDrivers.length === 0 && (
                        <div className="text-center py-16">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-semibold">Tidak ada driver di radius 20km</p>
                            <p className="text-gray-400 text-sm mt-1">Gunakan fitur lokasi di header untuk mencari area lain</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Buat Postingan Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-brand-dark-blue mb-1">Buat Permintaan Baru</h2>
                        <p className="text-[10px] text-gray-500 mb-4 flex items-center gap-1 font-bold uppercase tracking-wider">
                            Posting sebagai: <span className="text-brand-green">{user?.name}</span>
                        </p>
                        <form onSubmit={handlePostSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Titik Jemput</label>
                                <input
                                    type="text"
                                    required
                                    value={postForm.jemput}
                                    onChange={(e) => setPostForm({ ...postForm, jemput: e.target.value })}
                                    placeholder="Contoh: Jl. Kalimantan No. 1"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan</label>
                                <input
                                    type="text"
                                    required
                                    value={postForm.tujuan}
                                    onChange={(e) => setPostForm({ ...postForm, tujuan: e.target.value })}
                                    placeholder="Contoh: Kampus UNEJ"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Penjemputan</label>
                                <input
                                    type="time"
                                    required
                                    value={postForm.waktuJemput}
                                    onChange={(e) => setPostForm({ ...postForm, waktuJemput: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Detail / Catatan</label>
                                <textarea
                                    rows="3"
                                    value={postForm.catatan}
                                    onChange={(e) => setPostForm({ ...postForm, catatan: e.target.value })}
                                    placeholder="Ada barang bawaan, minta tolong talangi, atau catatan lainnya..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none resize-none text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#185c37] hover:bg-[#124429] text-white font-bold py-3.5 rounded-xl transition-colors shadow-md mt-2"
                            >
                                Posting Permintaan
                            </button>
                        </form>
                    </div>

                    {/* Postings History */}
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark-blue mb-4">Postingan Saya</h2>
                        {myPosts.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center h-48 flex flex-col justify-center">
                                <p className="text-gray-500 font-medium">Belum ada postingan aktif.</p>
                                <p className="text-gray-400 text-xs mt-1">Buat postingan untuk mendapatkan tawaran dari driver sekitar.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myPosts.map((post) => (
                                    <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-gray-400">{new Date(post.createdAt).toLocaleDateString('id-ID')}</span>
                                            {post.status === 'pending' ? (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full animate-pulse">Menunggu Driver</span>
                                            ) : post.status === 'applied' ? (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-full">Telah Diapply</span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-400 rounded-full">{post.status}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-start gap-2 max-w-[90%]">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-brand-green flex-shrink-0"></div>
                                                <p className="text-sm font-semibold text-brand-dark-blue truncate">{post.pickup_location}</p>
                                            </div>
                                            <div className="ml-1 my-1 border-l-2 border-dashed border-gray-200 h-3"></div>
                                            <div className="flex items-start gap-2 max-w-[90%]">
                                                <MapPin className="w-3 h-3 text-brand-orange mt-0.5 flex-shrink-0" />
                                                <p className="text-sm font-semibold text-brand-dark-blue truncate">{post.destination_location}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 border border-gray-100">
                                            <span className="font-bold">Catatan:</span> {post.notes || '-'}
                                        </div>
                                        
                                        {post.status === 'pending' && (
                                            <div className="mt-2">
                                                {post.offer_count > 0 ? (
                                                    <button 
                                                        onClick={() => fetchOffers(post.id)}
                                                        className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                                                    >
                                                        Lihat {post.offer_count} Tawaran Driver
                                                    </button>
                                                ) : (
                                                    <p className="text-[10px] text-gray-400 font-medium italic">Belum ada tawaran harga.</p>
                                                )}
                                            </div>
                                        )}

                                        {selectedOffers && selectedOffers.broadcastId === post.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase">Daftar Tawaran:</h3>
                                                {selectedOffers.offers.map(offer => (
                                                    <div key={offer.id} className="flex items-center justify-between bg-brand-green/5 p-3 rounded-xl border border-brand-green/10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-brand-green/20 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-green uppercase">
                                                                {offer.driver_name?.substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800">{offer.driver_name}</p>
                                                                <p className="text-[10px] font-bold text-brand-green">Rp {offer.price.toLocaleString('id-ID')}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAcceptOffer(offer.id)}
                                                            className="px-3 py-1.5 bg-brand-green text-white text-[10px] font-bold rounded-lg hover:bg-brand-dark-blue transition-colors"
                                                        >
                                                            Terima
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => setSelectedOffers(null)}
                                                    className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 font-bold"
                                                >
                                                    Tutup Tawaran
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                driver={selectedDriver}
            />
        </div>
    );
};

/* ── Driver Card Component ── */
const DriverCard = ({ driver, onBook }) => {
    const isOnline = driver.status === 'Online';
    const profileImage = driver.profile_image || driver.profile_image_url;
    const navigate = useNavigate();

    return (
        <div className={`group relative bg-white rounded-3xl border transition-all duration-500 hover:shadow-xl ${isOnline
                ? 'border-gray-100 shadow-sm hover:border-brand-green/20'
                : 'border-gray-50 opacity-80'
            }`}>
            <div className="p-6">
                <div className="flex gap-4 items-start mb-6">
                    {/* Profile Image */}
                    <div className="relative shrink-0">
                        <div className={`p-1 rounded-full transition-all duration-500 ${isOnline
                                ? 'bg-brand-green/10'
                                : 'bg-gray-100'
                            }`}>
                            <div className="relative">
                                <img
                                    src={profileImage ? (profileImage.startsWith('http') ? profileImage : `http://localhost:5000${profileImage}`) : `https://ui-avatars.com/api/?name=${driver.name}&background=1e6f85&color=fff&size=128`}
                                    alt={driver.name}
                                    className="w-14 h-14 rounded-full object-cover bg-gray-50 border-2 border-white"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${driver.name}&background=1e6f85&color=fff&size=128`; }}
                                />
                                {isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-base truncate">
                                {driver.name}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[11px] font-bold text-gray-700">{driver.rating || '5.0'}</span>
                                <span className="text-[10px] text-gray-400 font-medium italic">({driver.trips || 0} Trx)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2.5">
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-brand-green/5 group-hover:border-brand-green/10 transition-colors">
                        <Bike className="w-4 h-4 text-brand-green" />
                        <span className="text-xs font-semibold text-gray-700 truncate">
                            {driver.vehicle_info || 'Motorcycle'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-brand-orange/5 group-hover:border-brand-orange/10 transition-colors">
                        <MapPin className="w-4 h-4 text-brand-orange" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{driver.area || 'Jember'}</p>
                        </div>
                        {driver.distance != null && (
                            <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md shrink-0">
                                {driver.distance} KM
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 pt-2">
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const ids = [user?.id, driver.id].sort((a, b) => a - b);
                            const roomId = `room_${ids[0]}_${ids[1]}`;
                            
                            navigate(`/user/chat/${roomId}`, {
                                state: {
                                    partnerName: driver.name,
                                    partnerImage: driver.profile_image || driver.profile_image_url || null,
                                    partnerId: driver.id,
                                    initialMessage: `Halo Kak ${driver.name}, saya ingin negosiasi harga antar jemput / delivery.`
                                }
                            });
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-brand-green/30 hover:text-brand-green"
                    >
                        <MessageSquare size={13} />
                        Chat Driver
                    </button>
                    <button
                        onClick={() => onBook(driver)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-brand-green text-white hover:bg-brand-dark-blue shadow-sm shadow-brand-green/20"
                    >
                        <Check size={13} />
                        Booking Driver
                    </button>
                </div>
            </div>
        </div>
    );
};


export default AntarJemput;
