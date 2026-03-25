import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const MarketplaceModal = ({ isOpen, onClose, product }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        jumlah: 1,
        metode: 'COD',
        catatan: ''
    });

    if (!isOpen || !product) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const total = formData.jumlah * product.price;

        if (formData.metode === 'Delivery') {
            // Redirect to Antar Jemput page and pass product details in state
            navigate('/user/antar-jemput', {
                state: {
                    deliveryRequest: {
                        product: product.name,
                        seller: product.seller,
                        price: product.price,
                        quantity: formData.jumlah,
                        total,
                        notes: formData.catatan
                    }
                }
            });
            onClose();
            return;
        }

        // COD (Pesan Antar) Flow
        try {
            // 1. Create Order in Backend
            await api.post('/user/orders', {
                type: 'Marketplace',
                total,
                items: [{ id: product.id, name: product.name, quantity: formData.jumlah }],
                notes: formData.catatan
            });

            // 2. Draft Message for Chat
            const textArea = `Halo ${product.seller}, saya ingin memesan:
*Produk:* ${product.name}
*Jumlah:* ${formData.jumlah} pcs
*Total Harga:* Rp ${total.toLocaleString('id-ID')}
*Metode:* ${formData.metode}
*Catatan:* ${formData.catatan || '-'}

Mohon konfirmasinya. Terima kasih.`;

            // Redirect ke Chat Room Internal 
            const userId = user?.id;
            const sellerId = product.seller_id;
            const ids = [userId, sellerId].sort((a, b) => a - b);
            const roomId = `room_${ids[0]}_${ids[1]}`;

            navigate(`/user/chat/${roomId}`, {
                state: {
                    partnerName: product.seller,
                    partnerId: sellerId,
                    initialMessage: textArea
                }
            });

            alert("Pesanan berhasil dibuat! Anda akan dialihkan ke chat penjual.");
            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Gagal membuat pesanan. Silakan coba lagi.');
        }
    };

    const isJasa = product.category === 'Jasa';

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
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                            {product.emoji}
                        </div>
                        <div>
                            <p className="font-bold text-brand-dark-blue text-lg">{product.name}</p>
                            <p className="text-sm font-semibold text-brand-green">Rp {product.price.toLocaleString('id-ID')} {isJasa ? '' : '/ pcs'}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Package size={12} /> Penjual: {product.seller}
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
                        <label className="block text-sm font-semibold text-gray-700">Metode Pembelian (Hanya COD & Delivery yang tersedia)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.metode === 'COD' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-brand-green/50'}`}>
                                <input
                                    type="radio"
                                    name="metode"
                                    value="COD"
                                    checked={formData.metode === 'COD'}
                                    onChange={handleChange}
                                    className="text-brand-green focus:ring-brand-green"
                                />
                                <span className="font-bold text-brand-dark-blue text-sm">COD (Pesan Antar)</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.metode === 'Delivery' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-brand-green/50'}`}>
                                <input
                                    type="radio"
                                    name="metode"
                                    value="Delivery"
                                    checked={formData.metode === 'Delivery'}
                                    onChange={handleChange}
                                    className="text-brand-green focus:ring-brand-green"
                                />
                                <span className="font-bold text-brand-dark-blue text-sm">Delivery (Kirim Reguler)</span>
                            </label>
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
                        className="w-full bg-[#185c37] hover:bg-[#124429] text-white font-bold text-lg py-3.5 rounded-xl mt-4 transition-colors shadow-lg shadow-green-900/20"
                    >
                        Pesan & Bayar
                    </button>

                </form>
            </div>
        </div>
    );
};

export default MarketplaceModal;
