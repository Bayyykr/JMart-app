import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Package, Star } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import JastipModal from '../../components/user/JastipModal';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const JasaTitip = () => {
    const [jastips, setJastips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJastip, setSelectedJastip] = useState(null);

    const handleOpenModal = (jastip) => {
        setSelectedJastip(jastip);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchJastips = async () => {
            try {
                const response = await api.get('/user/jastips');
                setJastips(response.data);
            } catch (error) {
                console.error("Error fetching jastips:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJastips();

        // Real-time slot update listener
        const handleSlotUpdate = (data) => {
            setJastips(prev => prev.map(j =>
                j.id === data.jastip_id
                    ? { ...j, availableSlots: data.available_slots, status: data.status }
                    : j
            ));
            // Also keep the modal jastip in sync
            setSelectedJastip(prev =>
                prev && prev.id === data.jastip_id
                    ? { ...prev, availableSlots: data.available_slots, status: data.status }
                    : prev
            );
        };

        socket.on('jastip_slot_update', handleSlotUpdate);
        return () => socket.off('jastip_slot_update', handleSlotUpdate);
    }, []);

    return (
        <div className="p-8">
            <TopLoadingBar isLoading={isLoading} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Jasa Titip (Jastip)</h1>
                <p className="text-gray-500 font-medium">Ikut jadwal Jastip driver yang sedang buka untuk hemat ongkir!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {!isLoading && jastips.map((jastip) => (
                    <div key={jastip.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-brand-light-blue flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-white shadow-sm">
                                    <img 
                                        src={jastip.driverPhoto ? (jastip.driverPhoto.startsWith('http') ? jastip.driverPhoto : `http://localhost:5000${jastip.driverPhoto}`) : `https://i.pravatar.cc/150?u=${jastip.driver_id || jastip.driverName}`} 
                                        alt={jastip.driverName} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${jastip.driverName}&background=1e6f85&color=fff&size=128`; }}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark-blue">{jastip.driverName}</h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Star className="w-4 h-4 fill-brand-orange text-brand-orange" />
                                        <span className="font-medium text-gray-700">{jastip.rating}</span>
                                        <span>• {jastip.trips} trip</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jastip.status === 'Open' ? 'bg-[#eefcf3] text-[#2ebd59]' : 'bg-red-50 text-red-500'}`}>
                                {jastip.status === 'Open' ? 'Buka' : 'Penuh'}
                            </span>
                        </div>

                        <div className="bg-[#f4efe8] rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex items-start gap-3 text-brand-dark-blue">
                                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-orange" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Lokasi Beli</p>
                                    <p className="font-semibold">{jastip.storeName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-brand-dark-blue">
                                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-light-blue" />
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Tutup Order</p>
                                        <p className="font-semibold">{jastip.closeOrderTime} WIB</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Berangkat</p>
                                        <p className="font-semibold">{jastip.departureTime} WIB</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-brand-dark-blue">
                                <Package className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-green" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Sisa Slot</p>
                                    <p className="font-semibold">{jastip.availableSlots} pesanan</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Tarif Jasa per item</p>
                                <span className="font-bold text-brand-green text-xl">
                                    Rp {Number(jastip.fee).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <button
                                onClick={() => handleOpenModal(jastip)}
                                className={`px-6 py-3 rounded-xl font-medium transition-colors ${jastip.status === 'Open'
                                    ? 'bg-brand-green text-white hover:bg-green-800'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                disabled={jastip.status !== 'Open'}
                            >
                                Ikut Titip
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            <JastipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jastip={selectedJastip}
            />
        </div>
    );
};

export default JasaTitip;
