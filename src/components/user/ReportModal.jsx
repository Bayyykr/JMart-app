import React, { useState } from 'react';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReportModal = ({ isOpen, onClose, reportedUserId, orderId, reportedName }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        'Penipuan / Fraud',
        'Perilaku Tidak Sopan',
        'Barang Tidak Sesuai Deskripsi',
        'Driver Tidak Melakukan Pengantaran',
        'Pungutan Liar / Harga Tidak Sesuai',
        'Lainnya'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            toast.error('Silakan pilih alasan pelaporan.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/user/reports', {
                reported_user_id: reportedUserId,
                order_id: orderId,
                reason,
                description
            });
            toast.success('Laporan berhasil dikirim. Kami akan segera menindaklanjuti.');
            onClose();
            // Reset form
            setReason('');
            setDescription('');
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error(error.response?.data?.message || 'Gagal mengirim laporan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-red-900 leading-tight">Laporkan Pengguna</h2>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Laporan Keamanan & Fraud</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-red-300 hover:text-red-500 hover:bg-white rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Melaporkan</p>
                        <p className="font-bold text-brand-dark-blue">{reportedName}</p>
                        {orderId && (
                            <p className="text-[10px] font-bold text-brand-green mt-1">ORDER ID: {orderId}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Alasan Pelaporan</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium text-gray-700 appearance-none cursor-pointer"
                        >
                            <option value="">Pilih Alasan...</option>
                            {reasons.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Detail Kejadian</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Jelaskan secara detail apa yang terjadi..."
                            rows="4"
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-700 resize-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                        Laporan palsu dapat berakibat pada penangguhan akun Anda. Gunakan fitur ini dengan bijak untuk menjaga keamanan komunitas JMart.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
