import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const BookingModal = ({ isOpen, onClose, driver }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        lokasiJemput: '',
        lokasiTujuan: '',
        tanggal: '',
        waktu: '',
        catatan: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/user/orders', {
                type: 'Antar Jemput',
                notes: `Dari: ${formData.lokasiJemput}, Ke: ${formData.lokasiTujuan}. Waktu: ${formData.tanggal} ${formData.waktu}. Catatan: ${formData.catatan}`
            });

            const templateMessage =
                `Halo Kak ${driver?.name}, saya ingin booking antar jemput! 🛵

📍 *Lokasi Jemput:* ${formData.lokasiJemput}
🏁 *Lokasi Tujuan:* ${formData.lokasiTujuan}
📅 *Tanggal:* ${formData.tanggal}
🕐 *Waktu:* ${formData.waktu}
📝 *Catatan:* ${formData.catatan || '-'}

Mohon konfirmasi ketersediaan dan harganya ya. Terima kasih! 🙏`;

            onClose();

            const userId = user?.id;
            const driverId = driver?.id;

            // Normalise room ID: room_{min}_{max}
            const minId = Math.min(userId, driverId);
            const maxId = Math.max(userId, driverId);
            const roomId = `room_${minId}_${maxId}`;

            // Send booking message via chat
            await api.post('/chat/send', {
                room_id: roomId,
                receiver_id: driverId,
                content: templateMessage,
                message_type: 'text'
            });

            navigate(`/user/chat/${roomId}`, {
                state: {
                    partnerName: driver?.name,
                    partnerId: driver?.id
                }
            });
        } catch (error) {
            console.error('Error booking driver:', error);
            alert('Gagal membuat pemesanan.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark-blue flex items-center gap-2">
                            Form Pemesanan
                        </h2>
                        {driver && (
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                Driver: {driver.name} • {driver.car}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-3">

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Lokasi Jemput</label>
                        <input
                            type="text"
                            name="lokasiJemput"
                            required
                            value={formData.lokasiJemput}
                            onChange={handleChange}
                            placeholder="Masukkan alamat jemput..."
                            className="w-full px-4 py-2 bg-[#f5efe6] border-none rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Lokasi Tujuan</label>
                        <input
                            type="text"
                            name="lokasiTujuan"
                            required
                            value={formData.lokasiTujuan}
                            onChange={handleChange}
                            placeholder="Masukkan alamat tujuan..."
                            className="w-full px-4 py-2 bg-[#f5efe6] border-none rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Tanggal</label>
                            <input
                                type="date"
                                name="tanggal"
                                required
                                value={formData.tanggal}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-[#f5efe6] border-none rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all font-medium text-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Waktu</label>
                            <input
                                type="time"
                                name="waktu"
                                required
                                value={formData.waktu}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-[#f5efe6] border-none rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all font-medium text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Catatan</label>
                        <input
                            type="text"
                            name="catatan"
                            value={formData.catatan}
                            onChange={handleChange}
                            placeholder="Catatan tambahan (opsional)"
                            className="w-full px-4 py-2 bg-[#f5efe6] border-none rounded-xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#185c37] hover:bg-[#124429] text-white font-bold text-lg py-3 rounded-xl mt-4 transition-colors shadow-lg shadow-green-900/10"
                    >
                        Pesan Sekarang
                    </button>

                </form>
            </div>
        </div>
    );
};

export default BookingModal;
