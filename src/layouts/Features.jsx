import React from 'react';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, Package, Headphones, CheckCircle2, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
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

    const trustBadges = [
        { icon: <ShieldCheck size={16} />, text: "Keamanan Terjamin" },
        { icon: <Headphones size={16} />, text: "Layanan 24/7" },
        { icon: <CheckCircle2 size={16} />, text: "Driver Terverifikasi" }
    ];

    const services = [
        { 
            title: 'Antar Jemput', 
            desc: 'Layanan transportasi cepat dengan driver terpercaya. Pilih driver, lihat harga, dan pesan langsung.', 
            icon: <Truck className="text-white" size={24} />,
            color: 'bg-brand-dark-blue',
            accent: 'text-brand-dark-blue'
        },
        { 
            title: 'Jasa Titip', 
            desc: 'Butuh barang dari tempat tertentu? Driver kami siap membelikan dan mengantarkan ke lokasi Anda.', 
            icon: <Package className="text-white" size={24} />,
            color: 'bg-brand-orange',
            accent: 'text-brand-orange'
        },
        { 
            title: 'Marketplace', 
            desc: 'Belanja produk dari berbagai penjual dalam satu platform. Tambahkan ke keranjang dan checkout mudah.', 
            icon: <ShoppingBag className="text-white" size={24} />,
            color: 'bg-brand-green',
            accent: 'text-brand-green'
        },
        { 
            title: 'Pusat UMKM', 
            desc: 'Dukung bisnis lokal! Buka toko Anda sendiri atau beli produk unggulan langsung dari UMKM pilihan.', 
            icon: <Store className="text-white" size={24} />,
            color: 'bg-brand-light-blue',
            accent: 'text-brand-light-blue'
        }
    ];

    return (
        <section id="features" className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center mb-16">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-4 block"
                >
                    Layanan Kami
                </motion.span>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-4xl font-primary font-black mb-4 text-brand-dark-blue leading-tight tracking-tight"
                >
                    Solusi Lengkap dalam Satu Platform
                </motion.h2>
            </div>
            
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
                >
                    {services.map((service, idx) => (
                        <motion.div 
                            key={idx} 
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-[2rem] border border-gray-50 bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all group relative flex flex-col h-full"
                        >
                            <div className={`w-12 h-12 rounded-xl ${service.color} mb-6 flex items-center justify-center transition-transform group-hover:rotate-6 shadow-lg shadow-gray-50`}>
                                {React.cloneElement(service.icon, { size: 20 })}
                            </div>
                            <h3 className="text-lg md:text-xl font-primary font-black mb-3 text-brand-dark-blue">{service.title}</h3>
                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 flex-grow">
                                {service.desc}
                            </p>
                            <a href="#" className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${service.accent} group-hover:gap-3 transition-all mt-auto`}>
                                Selengkapnya <ArrowRight size={14} />
                            </a>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Trust Badges */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
                >
                    {trustBadges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-3 text-brand-dark-blue/60 group">
                            <div className="w-10 h-10 rounded-xl bg-[#FDF8F3] flex items-center justify-center text-brand-orange shadow-sm border border-brand-orange/10 group-hover:scale-110 transition-transform">
                                {React.cloneElement(badge.icon, { size: 16 })}
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest">{badge.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;
