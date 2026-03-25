import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

const LocationPickerModal = ({ isOpen, onClose }) => {
    const { searchLocation, selectLocation, locationStatus, updateLocation } = useLocation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGpsClicked, setIsGpsClicked] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setIsGpsClicked(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isGpsClicked) {
            if (locationStatus === 'granted') {
                const timer = setTimeout(() => {
                    onClose();
                    setIsGpsClicked(false);
                }, 800);
                return () => clearTimeout(timer);
            } else if (locationStatus === 'denied' || locationStatus === 'unavailable') {
                setIsGpsClicked(false);
            }
        }
    }, [locationStatus, isGpsClicked, onClose]);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setQuery(val);
        
        if (val.length < 3) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        const data = await searchLocation(val);
        setResults(data);
        setIsSearching(false);
    };

    const handleSelect = (result) => {
        selectLocation(result);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-white/20" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-[#fdfbf9]">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark-blue flex items-center gap-2">
                             Cari Lokasi
                        </h2>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Pilih area untuk menyesuaikan layanan di sekitarmu</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Search Input */}
                    <div className="relative mb-6">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-brand-green' : 'text-gray-400'}`} size={18} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Cari desa, kecamatan, atau kota..."
                            value={query}
                            onChange={handleSearch}
                            className="w-full bg-[#f4efe8] border-2 border-transparent focus:border-brand-green/20 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-brand-green/5 transition-all outline-none text-gray-700 font-semibold placeholder:text-gray-400"
                        />
                        {isSearching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-brand-green" size={18} />
                            </div>
                        )}
                    </div>

                    {/* GPS Button */}
                    <button
                        onClick={() => {
                            setIsGpsClicked(true);
                            updateLocation();
                        }}
                        disabled={locationStatus === 'loading'}
                        className="w-full mb-6 flex items-center gap-3 p-4 bg-brand-green/5 hover:bg-brand-green/10 text-brand-green rounded-2xl transition-all group border border-brand-green/10 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <div className={`bg-brand-green text-white p-2 rounded-xl group-hover:scale-110 transition-transform ${locationStatus === 'loading' ? 'animate-pulse' : ''}`}>
                            {locationStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} fill="currentColor" />}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm">{locationStatus === 'loading' ? 'Menarik Koordinat GPS...' : 'Gunakan Lokasi Saat Ini'}</p>
                            <p className="text-[10px] opacity-70">{locationStatus === 'loading' ? 'Tunggu sejenak, sedang mengambil data...' : 'Detect otomatis menggunakan GPS perangkat'}</p>
                        </div>
                    </button>

                    {/* Results */}
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((item, idx) => {
                                const addr = item.address;
                                const title = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || addr.city_district || addr.town || item.display_name.split(',')[0];
                                const subtitle = item.display_name.split(',').slice(1).join(',').trim();
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="bg-gray-100 text-gray-400 p-2.5 rounded-xl group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors">
                                            <MapPin size={18} />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate">{title}</p>
                                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{subtitle}</p>
                                        </div>
                                    </button>
                                );
                            })
                        ) : query.length >= 3 && !isSearching ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-gray-300" size={24} />
                                </div>
                                <p className="text-gray-400 font-bold text-sm">Lokasi tidak ditemukan</p>
                                <p className="text-[10px] text-gray-300 mt-1 px-8">Coba ketik nama daerah yang lebih spesifik</p>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-30 grayscale pointer-events-none">
                                <img src="/vite.svg" alt="placeholder" className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Menunggu Input...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ddd;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default LocationPickerModal;
