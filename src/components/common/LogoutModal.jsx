import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark-blue/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <LogOut className="text-red-500 w-10 h-10 ml-2" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-brand-dark-blue mb-2">Konfirmasi Keluar</h3>
                        <p className="text-sm font-medium text-gray-500">
                            Apakah Anda yakin ingin keluar dari akun ini?
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 py-3.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                        >
                            Ya, Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
