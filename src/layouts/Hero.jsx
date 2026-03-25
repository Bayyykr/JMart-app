import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Zap, Star, MapPin, ShoppingBag, Truck, Users, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import HeroIcon from '../assets/icon-hero.png';

const Hero = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const floatingCard = (icon, title, desc, colorClass, delay = 0) => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
                opacity: 1, 
                x: 0,
                y: [0, -10, 0]
            }}
            transition={{
                opacity: { duration: 0.5, delay },
                x: { duration: 0.5, delay },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
            }}
            className="absolute z-20 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 w-48"
        >
            <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-white shrink-0`}>
                {icon}
            </div>
            <div>
                <h4 className="text-[10px] font-black text-brand-dark-blue leading-none mb-1">{title}</h4>
                <p className="text-[8px] text-gray-400 font-bold">{desc}</p>
            </div>
        </motion.div>
    );

    return (
        <section id="hero" className="relative min-h-screen flex flex-col lg:flex-row bg-[#FDF8F3] overflow-hidden pt-28">
            {/* Left Content - Aligned to standard container edges */}
            <div className="flex-1 flex items-center justify-center lg:justify-start px-6 lg:pl-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] py-12 lg:py-0">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="z-10 text-center lg:text-left max-w-xl"
                >
                    
                    <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-primary font-extrabold mb-8 leading-tight text-brand-dark-blue tracking-tight">
                        Antar Jemput, <br className="hidden lg:block" />
                        Jasa Titip & <br className="hidden lg:block" />
                        <span className="relative inline-block">
                            <span className="relative z-10 text-brand-orange">Marketplace</span>
                            <motion.svg 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 1, duration: 0.8 }}
                                className="absolute -bottom-2 left-0 h-2 text-brand-orange/30 -rotate-1" 
                                viewBox="0 0 100 10" 
                                preserveAspectRatio="none"
                            >
                                <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                            </motion.svg>
                        </span> <br className="hidden lg:block" />
                        dalam Satu Aplikasi
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-sm md:text-base text-gray-500 mb-10 max-w-md font-medium leading-relaxed mx-auto lg:mx-0">
                        JMart menghubungkan pengguna dengan driver terpercaya untuk layanan transportasi, 
                        jasa titip barang, dan belanja marketplace.
                    </motion.p>
                    
                    <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-12 justify-center lg:justify-start">
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl bg-brand-orange text-white font-extrabold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-orange-100 transition-all active:scale-95"
                        >
                            Mulai Sekarang
                        </button>
                        <button className="px-8 py-4 rounded-xl bg-white border border-gray-100 text-gray-400 font-extrabold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                            Pelajari Lebih
                        </button>
                    </motion.div>
                    
                    <motion.div 
                        variants={itemVariants} 
                        className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-0 bg-white/50 backdrop-blur-sm p-4 lg:p-1 rounded-3xl border border-white max-w-fit mx-auto lg:mx-0 shadow-sm"
                    >
                        <div className="flex items-center gap-4 px-6 py-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                                <Truck size={20} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-brand-dark-blue tracking-tight leading-none">5,000+</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Driver</div>
                            </div>
                        </div>

                        <div className="hidden lg:block w-px h-10 bg-gray-200/60"></div>

                        <div className="flex items-center gap-4 px-6 py-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-brand-dark-blue tracking-tight leading-none">50K+</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">User</div>
                            </div>
                        </div>

                        <div className="hidden lg:block w-px h-10 bg-gray-200/60"></div>

                        <div className="flex items-center gap-4 px-6 py-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                                <Smile size={20} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-brand-dark-blue tracking-tight leading-none">99%</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Puas</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
            
            {/* Right Content - Truly Full-Bleed High-Impact Visual */}
            <div className="flex-1 relative min-h-[50vh] lg:min-h-0 bg-white shadow-2xl z-0">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img 
                        src={HeroIcon} 
                        className="w-full h-full object-cover lg:object-center select-none" 
                        alt="JMart Full Bleed Visual" 
                    />
                    {/* Subtle Gradient Overlay to blend transition (optional, keeping it pure if requested) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
