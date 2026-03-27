import React from 'react';
import { XCircle, Mail, X } from 'lucide-react';

const DeactivatedModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-brand-dark-blue/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Visual Header */}
                <div className="h-32 bg-red-500 flex items-center justify-center relative">
                    <div className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer transition-colors" onClick={onClose}>
                        <X size={24} />
                    </div>
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <XCircle className="text-white w-14 h-14" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="p-10 text-center">
                    <h3 className="text-2xl font-black text-brand-dark-blue mb-4 tracking-tight">Akun Dinonaktifkan</h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Mohon maaf, sistem mendeteksi bahwa akun Anda telah dinonaktifkan. Anda tidak dapat masuk ke aplikasi saat ini.
                    </p>
                    
                    <div className="bg-red-50 p-6 rounded-[1.5rem] border border-red-100 mb-8">
                        <div className="flex items-center justify-center gap-3 text-red-600 mb-2">
                            <Mail size={18} strokeWidth={2.5} />
                            <span className="font-black text-xs uppercase tracking-[0.2em]">Hubungi Kami</span>
                        </div>
                        <p className="text-lg font-black text-brand-dark-blue break-all">
                            jmart@gmail.com
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 rounded-xl font-black bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90 shadow-xl shadow-brand-dark-blue/20 transition-all active:scale-[0.98]"
                    >
                        Tutup
                    </button>
                    
                    <p className="mt-6 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        JMart Support Team
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeactivatedModal;
