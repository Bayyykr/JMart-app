import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const MarketplaceModal = ({ isOpen, onClose, product }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        jumlah: 1,
        metode: product && product.category === 'Barang' ? 'COD' : 'Delivery',
        catatan: ''
    });

    React.useEffect(() => {
        if (product) {
            setFormData(prev => ({
                ...prev,
                metode: product.category === 'Barang' ? 'COD' : 'Delivery'
            }));
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const total = formData.jumlah * product.price;
        const userId = user?.id;
        const sellerId = product.seller_id;
        
        try {
            // Create Order in Backend
            const response = await api.post('/user/orders', {
                type: 'Marketplace',
                shipping_method: formData.metode,
                total_price: total,
                seller_id: sellerId,
                product_id: product.id,
                quantity: formData.jumlah,
                items: [{ id: product.id, name: product.name, quantity: formData.jumlah }],
                notes: formData.catatan
            });

            toast.success("Pesanan berhasil dibuat! Menghubungkan ke penjual...");

             // Navigate to Chat Room
            const ids = [userId, sellerId].sort((a, b) => Number(a) - Number(b));
            const roomId = `room_${ids[0]}_${ids[1]}`;
            
            navigate(`/user/chat/${roomId}`, {
                state: {
                    partnerName: product.seller,
                    partnerId: sellerId
                }
            });

            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error(error.response?.data?.message || 'Gagal membuat pesanan.');
        }
    };

    const isJasa = product.category === 'Jasa';
    const isMakanan = product.category === 'Makanan';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark-blue flex items-center gap-2">
                            <ShoppingBag className="text-brand-green" /> Checkout Pesanan
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                    {/* Product Info */}
                    <div className="bg-[#f5efe6] p-4 rounded-xl flex gap-4 items-center border border-[#e8ddcd]">
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-black/5">
                            {product.image_url ? (
                                <img 
                                    src={`${product.image_url}`} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl">{product.emoji || '📦'}</span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-brand-dark-blue text-lg leading-tight mb-1">{product.name}</p>
                            <p className="text-base font-black text-brand-green">Rp {product.price.toLocaleString('id-ID')} {isJasa ? '' : '/ pcs'}</p>
                            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                <Package size={12} className="text-brand-green" /> Penjual: {product.seller}
                            </p>
                        </div>
                    </div>

                    {/* Quantity */}
                    {!isJasa && (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Jumlah Pesanan</label>
                            <input
                                type="number"
                                name="jumlah"
                                min="1"
                                required
                                value={formData.jumlah}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all font-medium text-gray-700"
                            />
                        </div>
                    )}

                    {/* Metode */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Metode Pengiriman</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {product.category === 'Barang' && (
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.metode === 'COD' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="metode"
                                        value="COD"
                                        checked={formData.metode === 'COD'}
                                        onChange={handleChange}
                                        className="text-brand-green focus:ring-brand-green"
                                    />
                                    <span className="font-bold text-brand-dark-blue text-sm">COD (Barang)</span>
                                </label>
                            )}
                            {(isMakanan || isJasa) && (
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.metode === 'Delivery' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="metode"
                                        value="Delivery"
                                        checked={formData.metode === 'Delivery'}
                                        onChange={handleChange}
                                        className="text-brand-green focus:ring-brand-green"
                                    />
                                    <span className="font-bold text-brand-dark-blue text-sm">Delivery (Kurir)</span>
                                </label>
                            )}
                            {isMakanan && (
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.metode === 'Takeaway' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="metode"
                                        value="Takeaway"
                                        checked={formData.metode === 'Takeaway'}
                                        onChange={handleChange}
                                        className="text-brand-green focus:ring-brand-green"
                                    />
                                    <span className="font-bold text-brand-dark-blue text-sm">Takeaway (Ambil)</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Catatan untuk Penjual</label>
                        <input
                            type="text"
                            name="catatan"
                            value={formData.catatan}
                            onChange={handleChange}
                            placeholder="Opsional: misal tanpa sedotan, warna merah, dll."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                        />
                    </div>

                    <div className="pt-5 border-t border-gray-100 flex justify-between items-center mt-2">
                        <span className="text-gray-500 font-medium text-sm">Total Belanja:</span>
                        <span className="text-2xl font-black text-brand-green">
                            Rp {((formData.jumlah || 1) * product.price).toLocaleString('id-ID')}
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#185c37] hover:bg-[#124429] text-white font-bold text-lg py-3.5 rounded-xl mt-4 transition-colors shadow-lg shadow-green-900/20 active:scale-[0.98]"
                    >
                        Pesan & Bayar
                    </button>

                </form>
            </div>
        </div>
    );
};

export default MarketplaceModal;
