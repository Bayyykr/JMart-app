import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-app.png';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();

    const navLinks = [
        { name: "Beranda", href: "#hero" },
        { name: "Layanan", href: "#features" },
        { name: "Cara Kerja", href: "#how-it-works" },
        { name: "Statistik", href: "#stats" },
        { name: "Kontak", href: "#footer" }
    ];

    return (
        <div className="fixed top-6 left-0 right-0 z-50 px-6 pointer-events-none">
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-5xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] pointer-events-auto"
            >
                <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 pl-4">
                        <img src={logo} alt="JMart" className="w-9 h-9 object-contain" />
                        <span className="text-lg font-primary font-black tracking-tight text-brand-dark-blue">JMart</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        {['Layanan', 'Tentang', 'Cara Kerja', 'Statistik'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="text-[10px] font-black text-brand-dark-blue/70 hover:text-brand-orange transition-all tracking-[0.2em] uppercase"
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/login')}
                            className="group flex items-center gap-3 px-6 py-3 bg-[#111827] text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                        >
                            Mulai Sekarang
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.header>
        </div>
    );
};

export default Navbar;
