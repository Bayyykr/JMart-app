import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/authContext';
import {
    ShieldCheck,
    UserCheck,
    IdCard,
    Truck,
    Upload,
    Camera,
    LogOut,
    CheckCircle,
    XCircle,
    FileText
} from 'lucide-react';

const DriverOnboarding = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [formData, setFormData] = useState({
        ktp_number: '',
        vehicle_type: 'Motor',
        vehicle_model: '', // New field
        plate_prefix: '',
        plate_number: '',
        plate_suffix: ''
    });
    const [files, setFiles] = useState({
        ktp_file: null,
        selfie_file: null
    });
    const [previews, setPreviews] = useState({
        ktp_preview: null,
        selfie_preview: null
    });

    const ktpInputRef = useRef(null);
    const selfieInputRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await api.get('/driver/status');
            if (res.data.status === 'verified') {
                navigate('/driver/dashboard');
            } else if (res.data.status === 'pending') {
                setStatus('pending');
            } else {
                setStatus('none');
            }
        } catch (err) {
            console.error(err);
            setStatus('none');
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [`${type}_file`]: file }));
            setPreviews(prev => ({ ...prev, [`${type}_preview`]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!files.ktp_file || !files.selfie_file) {
            setMessage('Mohon upload foto KTP dan Selfie Terlebih dahulu.');
            return;
        }

        setSubmitting(true);
        setMessage('');

        try {
            const submitData = new FormData();
            
            // Safe string construction to prevent crashes
            const prefix = (formData.plate_prefix || '').toUpperCase();
            const number = (formData.plate_number || '');
            const suffix = (formData.plate_suffix || '').toUpperCase();
            const full_plate = `${prefix} ${number} ${suffix}`.trim();
            
            submitData.append('ktp_number', formData.ktp_number || '');
            submitData.append('vehicle_type', formData.vehicle_type || 'Motor');
            submitData.append('vehicle_model', formData.vehicle_model || '');
            submitData.append('vehicle_plate', full_plate);
            
            if (files.ktp_file) submitData.append('ktp_file', files.ktp_file);
            if (files.selfie_file) submitData.append('selfie_file', files.selfie_file);

            console.log('[DriverOnboarding] Sending data...', {
                ktp_number: formData.ktp_number,
                vehicle_plate: full_plate
            });

            const response = await api.post('/driver/onboard', submitData);

            console.log('[DriverOnboarding] Response:', response.data);
            setMessage('Data berhasil dikirim! Mohon tunggu verifikasi admin.');
            setStatus('pending');
        } catch (err) {
            console.error('[DriverOnboarding] Submission Error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            const errorMsg = err.response?.data?.message || 'Gagal mengirim data. Silakan coba lagi.';
            setMessage(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const BackgroundDashboard = () => (
        <div className="fixed inset-0 overflow-hidden pointer-events-none flex scale-[1.01] bg-brand-cream/10">
            {/* Sidebar Ghost */}
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 gap-6 opacity-30">
                <div className="h-10 w-32 bg-gray-100 rounded-xl mb-6"></div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 w-full bg-gray-50 rounded-xl"></div>
                ))}
            </div>

            <div className="flex-1 flex flex-col">
                {/* Header Ghost */}
                <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 opacity-30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                        <div className="h-5 w-48 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-full"></div>
                        <div className="w-10 h-10 bg-gray-50 rounded-full"></div>
                    </div>
                </div>

                <div className="flex-1 p-12 opacity-30">
                    {/* Welcome Ghost */}
                    <div className="mb-10">
                        <div className="h-10 w-80 bg-gray-200 rounded-xl mb-3"></div>
                        <div className="h-5 w-64 bg-gray-100 rounded-lg"></div>
                    </div>

                    {/* Stats Grid Ghost */}
                    <div className="grid grid-cols-4 gap-8 mb-12">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-36 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl mb-4"></div>
                                <div className="h-5 w-24 bg-gray-100 rounded-full"></div>
                            </div>
                        ))}
                    </div>

                    {/* Actions Grid Ghost */}
                    <div className="grid grid-cols-3 gap-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-56 bg-white rounded-[3rem] border border-gray-100 shadow-sm"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (status === 'loading') return (
        <div className="flex items-center justify-center min-h-screen bg-brand-cream font-primary">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9fa] relative font-primary overflow-hidden flex items-center justify-center py-4 px-6">
            <BackgroundDashboard />
            <div className="fixed inset-0 bg-brand-dark-blue/50 backdrop-blur-[30px] z-20"></div>

            <input
                type="file"
                ref={ktpInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'ktp')}
            />
            <input
                type="file"
                ref={selfieInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'selfie')}
            />

            <div className="relative z-30 w-full max-w-5xl transform animate-in fade-in zoom-in duration-700">
                {status === 'pending' ? (
                    <div className="mx-auto max-w-lg p-12 bg-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.25)] text-center border border-white/20">
                        <div className="w-28 h-28 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <ShieldCheck className="text-brand-orange" size={56} />
                        </div>
                        <h2 className="text-3xl font-black text-brand-dark-blue mb-4">Verifikasi Diproses</h2>
                        <div className="space-y-4 mb-10">
                            <p className="text-gray-500 font-bold leading-relaxed">
                                Dokumen Anda sedang dalam tahap screening oleh tim verifikasi JMart.
                            </p>
                            <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-orange/10">
                                <p className="text-sm text-brand-dark-blue/80 font-bold">
                                    Dokumen Anda akan diverifikasi dalam <span className="text-brand-orange">1x24 jam</span>. Konfirmasi pendaftaran (Diterima/ACC) akan diinformasikan melalui email yang Anda daftarkan.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full py-4 bg-brand-dark-blue text-white rounded-2xl font-bold hover:bg-brand-dark-blue/90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <LogOut size={20} />
                            <span>Selesai & Keluar</span>
                        </button>
                    </div>
                ) : (
                    <div className="shadow-[0_50px_120px_rgba(0,0,0,0.35)] rounded-[3rem] overflow-hidden border border-white/40 bg-white/95 flex flex-col md:flex-row h-auto max-h-[92vh]">
                        {/* Branding Side */}
                        <div className="md:w-[30%] bg-brand-dark-blue p-8 flex flex-col justify-between text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-brand-orange px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-6">
                                    Assessment
                                </div>
                                <h1 className="text-4xl font-black mb-4 italic leading-[1.1] tracking-tighter">Screening<br />Driver</h1>
                                <p className="text-blue-200 font-medium text-sm leading-relaxed opacity-80">Lengkapi profil profesional Anda untuk bergabung sebagai mitra Merchant JMart.</p>
                            </div>

                            <div className="relative z-10 p-5 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md mt-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheck className="text-brand-orange" size={18} />
                                    <span className="font-bold text-xs">Verified System</span>
                                </div>
                                <p className="text-[9px] text-blue-200/60 leading-relaxed font-medium">Data dienkripsi secara end-to-end dan hanya diakses oleh tim kepatuhan JMart.</p>
                            </div>

                            <UserCheck className="absolute -right-16 -bottom-16 text-white/5 w-72 h-72" />
                        </div>

                        {/* Form Side */}
                        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar bg-white/50">
                            {message && (
                                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {message.includes('berhasil') ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-8">
                                    {/* Identitas Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                            <div className="w-8 h-8 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                                                <IdCard className="text-brand-orange" size={16} />
                                            </div>
                                            <h2 className="font-bold text-brand-dark-blue text-sm uppercase tracking-wider">Identitas</h2>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">NIK KTP (Sesuai Kartu)</label>
                                            <input
                                                type="text"
                                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm"
                                                placeholder="16 Digit Nomor Induk"
                                                value={formData.ktp_number}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setFormData({ ...formData, ktp_number: val });
                                                    e.target.setCustomValidity('');
                                                }}
                                                onInvalid={(e) => e.target.setCustomValidity('NIK KTP harus berisi tepat 16 digit angka.')}
                                                required
                                                pattern="\d{16}"
                                                maxLength="16"
                                            />
                                        </div>
                                    </div>

                                    {/* Kendaraan Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                            <div className="w-8 h-8 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                                                <Truck className="text-brand-orange" size={16} />
                                            </div>
                                            <h2 className="font-bold text-brand-dark-blue text-sm uppercase tracking-wider">Kendaraan</h2>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipe</label>
                                                <select
                                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-gray-700 text-sm"
                                                    value={formData.vehicle_type}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                                >
                                                    <option value="Motor">Motor</option>
                                                    <option value="Mobil">Mobil</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2 lg:col-span-2">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Merk/Model Motor</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm"
                                                    placeholder="Contoh: Honda Vario 150"
                                                    value={formData.vehicle_model}
                                                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="lg:col-span-2 space-y-2">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 text-right lg:text-left">Plat Nomor</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="w-[70px] p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm text-center"
                                                        placeholder="P"
                                                        value={formData.plate_prefix}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, plate_prefix: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() });
                                                            e.target.setCustomValidity('');
                                                        }}
                                                        onInvalid={(e) => e.target.setCustomValidity('Isi kode depan plat.')}
                                                        required
                                                        maxLength="2"
                                                    />
                                                    <input
                                                        type="text"
                                                        className="flex-1 min-w-[100px] p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm text-center"
                                                        placeholder="1234"
                                                        value={formData.plate_number}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, plate_number: e.target.value.replace(/\D/g, '') });
                                                            e.target.setCustomValidity('');
                                                        }}
                                                        onInvalid={(e) => e.target.setCustomValidity('Isi nomor plat (angka).')}
                                                        required
                                                        maxLength="4"
                                                    />
                                                    <input
                                                        type="text"
                                                        className="w-[90px] p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-gray-700 placeholder:text-gray-300 text-sm text-center"
                                                        placeholder="ABC"
                                                        value={formData.plate_suffix}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, plate_suffix: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() });
                                                            e.target.setCustomValidity('');
                                                        }}
                                                        onInvalid={(e) => e.target.setCustomValidity('Isi kode belakang plat.')}
                                                        required
                                                        maxLength="3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dokumentasi Section */}
                                    <div className="bg-brand-cream/30 p-6 rounded-[2.5rem] border border-brand-orange/10 border-dashed">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Upload className="text-brand-orange" size={18} />
                                            <h3 className="font-bold text-brand-dark-blue text-xs uppercase tracking-wider">Upload Dokumen</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div
                                                onClick={() => ktpInputRef.current.click()}
                                                className="group relative flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 border-dashed rounded-[2rem] hover:border-brand-orange/30 hover:bg-white transition-all cursor-pointer overflow-hidden"
                                            >
                                                {previews.ktp_preview ? (
                                                    <img src={previews.ktp_preview} alt="KTP Preview" className="absolute inset-0 w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform duration-500" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center mb-3 group-hover:bg-brand-orange/10 transition-colors">
                                                            <FileText className="text-gray-400 group-hover:text-brand-orange transition-colors" size={24} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-gray-400 group-hover:text-brand-orange uppercase tracking-widest text-center">Foto KTP</p>
                                                    </>
                                                )}
                                                {previews.ktp_preview && (
                                                    <div className="absolute inset-0 bg-brand-dark-blue/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                        <Camera size={24} className="mb-2" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">Ganti Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => selfieInputRef.current.click()}
                                                className="group relative flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 border-dashed rounded-[2rem] hover:border-brand-orange/30 hover:bg-white transition-all cursor-pointer overflow-hidden"
                                            >
                                                {previews.selfie_preview ? (
                                                    <img src={previews.selfie_preview} alt="Selfie Preview" className="absolute inset-0 w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform duration-500" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center mb-3 group-hover:bg-brand-orange/10 transition-colors">
                                                            <Camera className="text-gray-400 group-hover:text-brand-orange transition-colors" size={24} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-gray-400 group-hover:text-brand-orange uppercase tracking-widest text-center">Selfie Profil</p>
                                                    </>
                                                )}
                                                {previews.selfie_preview && (
                                                    <div className="absolute inset-0 bg-brand-dark-blue/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                        <Camera size={24} className="mb-2" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">Ganti Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { logout(); navigate('/login'); }}
                                            className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors border-b border-transparent hover:border-red-200 pb-1"
                                        >
                                            Batalkan & Keluar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={`px-10 py-3.5 rounded-2xl text-white font-black text-sm shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-3 ${submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/30 shadow-lg'}`}
                                        >
                                            {submitting ? (
                                                <div className="w-5 h-5 border-4 border-white border-b-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={18} />
                                                    <span>Kirim Assessment</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.2em] text-center italic">Sistem Verifikasi Otomatis JMart v1.0 — Demo Stage</p>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverOnboarding;
