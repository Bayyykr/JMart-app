import React from 'react';
import { motion } from 'framer-motion';

const Stats = () => {
    const stats = [
        { label: "Pengguna Aktif", value: "50,000+" },
        { label: "Driver Terverifikasi", value: "5,000+" },
        { label: "Order Selesai", value: "100K+" },
        { label: "Rating Aplikasi", value: "4.9/5" }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <section id="stats" className="relative pt-12 pb-20 bg-white overflow-hidden">
            <div className="container mx-auto px-6 text-center mb-12 relative z-10">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-4 block"
                >
                    Statistik
                </motion.span>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-4xl font-primary font-black mb-4 text-brand-dark-blue leading-tight tracking-tight"
                >
                    Dipercaya Ribuan Pengguna
                </motion.h2>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="bg-brand-dark-blue/5 p-10 rounded-[2.5rem] text-center border border-brand-dark-blue/5 hover:border-brand-orange/20 transition-all group"
                    >
                        <div className="text-3xl md:text-4xl font-primary font-black text-brand-dark-blue mb-3 tracking-tight group-hover:scale-110 transition-transform">
                            {stat.value}
                        </div>
                        <div className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Stats;
