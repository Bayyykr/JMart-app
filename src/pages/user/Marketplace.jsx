import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Star, ShoppingCart, Wrench, Package, ChevronLeft, ChevronRight, MapPin, Utensils, Briefcase, ShoppingBag, RefreshCw, Clock } from 'lucide-react';
import api from '../../services/api';
import TopLoadingBar from '../../components/ui/TopLoadingBar';
import { useLocation } from '../../context/LocationContext';
import MarketplaceModal from '../../components/user/MarketplaceModal';
import ReportModal from '../../components/user/ReportModal';
import { AlertTriangle } from 'lucide-react';

const categories = [
    { key: 'Semua', label: 'Semua', icon: Package, emoji: '🛒' },
    { key: 'Makanan', label: 'Makanan', icon: Utensils, emoji: '🍜' },
    { key: 'Jasa', label: 'Jasa', icon: Briefcase, emoji: '🔧' },
    { key: 'Barang', label: 'Barang', icon: ShoppingBag, emoji: '📦' },
];

const ITEMS_PER_PAGE = 8;
const REALTIME_INTERVAL = 60000; // background sync every 60s

const Marketplace = () => {
    const { userLocation, userRegency, locationStatus } = useLocation();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Reporting state
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingProduct, setReportingProduct] = useState(null);

    // Refs to store latest state for silent background fetching/effects
    const coordsRef = useRef(userLocation);
    const lastRegencyRef = useRef(userRegency || "");
    const activeCategoryRef = useRef(activeCategory);

    useEffect(() => {
        coordsRef.current = userLocation;
    }, [userLocation]);

    useEffect(() => {
        activeCategoryRef.current = activeCategory;
    }, [activeCategory]);

    const handleOrder = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleReport = (product) => {
        setReportingProduct(product);
        setIsReportModalOpen(true);
    };

    const fetchProducts = useCallback(async (category, coords, regency, silent = false) => {
        if (!silent) setIsLoading(true);
        console.log(`[Marketplace] Fetching for Category: ${category}, Regency: ${regency}, Coords:`, coords);
        try {
            const queryParams = new URLSearchParams();
            if (category && category !== 'Semua') {
                queryParams.append('category', category);
            }
            if (coords && coords.lat && coords.lng) {
                queryParams.append('lat', coords.lat);
                queryParams.append('lng', coords.lng);
            }
            if (regency) {
                queryParams.append('regency', regency);
            }

            const url = `/user/products?${queryParams.toString()}`;
            const response = await api.get(url);
            console.log(`[Marketplace] Received ${response.data.length} items. Distances:`, response.data.map(d => d.distance));
            setData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // Fetch on category change (once, with latest known coords/regency)
    useEffect(() => {
        fetchProducts(activeCategory, coordsRef.current, lastRegencyRef.current, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory]);

    // One-time initial location-aware fetch once location resolves (or changes significantly)
    const locationFetchedRef = useRef(false);
    useEffect(() => {
        if (locationStatus === 'granted' && userLocation && userRegency) {
            // Only fetch if it's the first time OR if regency actually changed
            if (!locationFetchedRef.current || lastRegencyRef.current !== userRegency) {
                locationFetchedRef.current = true;
                lastRegencyRef.current = userRegency;
                console.log(`[Marketplace] Location-aware fetch triggered. Regency: ${userRegency}`);
                fetchProducts(activeCategoryRef.current, userLocation, userRegency, true); // silent: no loading spinner
            }
        }
    }, [locationStatus, userLocation, userRegency, fetchProducts]);

    // Background silent refresh every 60s
    useEffect(() => {
        const timer = setInterval(() => {
            if (coordsRef.current && userRegency) {
                fetchProducts(activeCategoryRef.current, coordsRef.current, userRegency, true);
            }
        }, REALTIME_INTERVAL);
        return () => clearInterval(timer);
    }, [fetchProducts, userRegency]);

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setSearchQuery('');
        setCurrentPage(1);
    };

    const filteredData = useMemo(() => {
        let result = data;

        if (activeCategory !== 'Semua') {
            result = result.filter(p => p.category === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.seller.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }

        return result;
    }, [data, activeCategory, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset page on search/category change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeCategory]);

    return (
        <div className="flex-1 flex flex-col p-8 bg-[#fdfaf6] min-h-0">
            <TopLoadingBar isLoading={isLoading} />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark-blue mb-1">Marketplace</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Temukan makanan, jasa, dan barang terbaik di sekitar Anda</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari menu, jasa, atau barang..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-gray-800 shadow-sm"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-3 mb-8 flex-wrap">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryChange(cat.key)}
                            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2.5 text-sm ${isActive
                                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30 scale-[1.05]'
                                : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-white' : 'text-brand-green'} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {!isLoading && paginatedData.map((product) => (
                    <ProductCard key={product.id} product={product} onOrder={handleOrder} onReport={handleReport} />
                ))}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-auto pb-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                        })
                        .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                    <span className="text-gray-300 text-sm px-1">...</span>
                                )}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl text-sm font-extrabold transition-all duration-200 ${currentPage === page
                                        ? 'bg-brand-green text-white shadow-md shadow-brand-green/20'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredData.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-inner">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Search size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-bold text-xl">Tidak ada produk ditemukan</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">Coba cari dengan kata kunci lain atau pilih kategori yang berbeda</p>
                </div>
            )}

            {/* Checkout Modal */}
            <MarketplaceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
            />

            {/* Report Modal */}
            {reportingProduct && (
                <ReportModal 
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={reportingProduct.seller_id}
                    reportedName={reportingProduct.seller || 'Penjual'}
                    orderId={null}
                />
            )}
        </div>
    );
};

/* ── Product Card Component ── */
const ProductCard = ({ product, onOrder, onReport }) => {
    const { locationStatus } = useLocation();
    const isMakanan = product.category === 'Makanan';
    const isJasa = product.category === 'Jasa';
    const isBarang = product.category === 'Barang';

    const categoryBadge = () => {
        if (isMakanan) return { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Makanan' };
        if (isJasa) return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Jasa' };
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Barang' };
    };

    const badge = categoryBadge();

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 flex flex-col group cursor-pointer hover:-translate-y-2 overflow-hidden h-full">
            {/* Image area */}
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#fcfbf9] to-[#f4efe8] flex items-center justify-center text-6xl group-hover:scale-[1.08] transition-transform duration-700 ease-out overflow-hidden">
                {product.image_url ? (
                    <img src={`${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="drop-shadow-2xl animate-float">{product.emoji || '📦'}</span>
                )}

                {/* Category badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`flex items-center gap-1.5 ${badge.bg} ${badge.text} text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider`}>
                        {badge.label}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onReport(product); }}
                        className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 uppercase tracking-wider hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                    >
                        <AlertTriangle size={10} /> Laporkan
                    </button>
                </div>

                {/* Distance badge */}
                {(product.distance !== null && product.distance !== undefined) ? (
                    <div className="absolute top-4 right-4 bg-[#eef4ff] text-[#2563eb] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#dbeafe] shadow-sm flex items-center gap-1.5 transition-colors duration-300">
                        <MapPin size={10} className="text-[#3b82f6]" strokeWidth={3} />
                        {product.distance >= 1 ? `${product.distance.toFixed(1)} km` : `${(product.distance * 1000).toFixed(0)} m`}
                    </div>
                ) : (
                    locationStatus === 'loading' ? (
                        <div className="absolute top-4 right-4 bg-gray-50 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-100 flex items-center gap-1.5 animate-pulse">
                            <RefreshCw size={10} className="animate-spin" />
                            Mencari...
                        </div>
                    ) : null
                )}

                {/* Condition badge — only for Barang */}
                {isBarang && product.condition_status && (
                    <span className={`absolute bottom-4 left-4 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-tighter ${product.condition_status === 'Baru'
                        ? 'bg-brand-green text-white'
                        : 'bg-white text-brand-dark-blue'
                        }`}>
                        {product.condition_status === 'Baru' ? '✨ Baru' : ' Bekas'}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col flex-1">
                <div className="mb-3">
                    <h3 className="font-extrabold text-brand-dark-blue text-base leading-tight line-clamp-1 group-hover:text-brand-green transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold mt-1.5">
                        <Package size={12} className="text-brand-green" />
                        <span className="truncate">{product.seller}</span>
                    </div>
                </div>

                {/* Opening Hours for Makanan */}
                {isMakanan && product.open_time && product.close_time && (
                    <div className="flex items-center gap-1.5 text-[10px] text-brand-orange font-bold mt-1.5 mb-2 bg-brand-orange/5 px-2 py-1 rounded-lg w-fit">
                        <Clock size={12} />
                        Buka: {product.open_time.substring(0,5)} - {product.close_time.substring(0,5)}
                    </div>
                )}
                
                {product.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-4 leading-relaxed font-medium italic opacity-80">{product.description}</p>
                )}

                {/* Rating & Stats */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-lg">
                            <Star size={12} className="fill-brand-orange" />
                            <span className="text-xs font-black">{product.rating}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{product.sold} {isJasa ? 'pengguna' : 'terjual'}</span>
                    </div>
                </div>

                {/* Price & Action */}
                <div className="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center group/footer">
                    <div>
                        {isJasa && <span className="text-[9px] text-gray-400 block font-black uppercase tracking-widest mb-0.5">Tarif mulai</span>}
                        <span className="font-black text-brand-green text-xl tracking-tight">
                            Rp {product.price.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOrder(product); }}
                        className="w-12 h-12 rounded-2xl bg-[#f4efe8] flex items-center justify-center text-brand-dark-blue hover:bg-brand-green hover:text-white transition-all transform hover:rotate-6 hover:scale-110 shadow-sm active:scale-95"
                    >
                        {isJasa ? <Wrench size={22} /> : <ShoppingCart size={22} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;
