import React from 'react';
import { motion } from 'framer-motion';
import { User, Truck, ShieldCheck, Store, CheckCircle2 } from 'lucide-react';

const About = () => {
    const roles = [
        {
            title: "User",
            desc: "Pesan antar jemput, gunakan jasa titip, belanja di marketplace, dan lacak status order Anda.",
            icon: <User size={24} />,
            color: "text-brand-orange",
            bgColor: "bg-brand-orange/10",
            features: ["Dashboard Pribadi", "Antar Jemput", "Jasa Titip", "Marketplace", "Riwayat Order"]
        },
        {
            title: "UMKM",
            desc: "Buka toko Anda, kelola produk marketplace, dan tingkatkan penjualan dengan jangkauan luas.",
            icon: <Store size={24} />,
            color: "text-brand-light-blue",
            bgColor: "bg-blue-500/10",
            features: ["Buka Toko", "Kelola Produk", "Penjualan", "Analitik Toko", "Promo Menarik"]
        },
        {
            title: "Driver",
            desc: "Terima order antar jemput & jasa titip, atur harga sendiri, dan kelola penghasilan Anda.",
            icon: <Truck size={24} />,
            color: "text-brand-dark-blue",
            bgColor: "bg-brand-dark-blue/10",
            features: ["Terima Order", "Atur Harga", "Jenis Layanan", "Riwayat Order", "Dashboard Driver"]
        },
        {
            title: "Admin",
            desc: "Kontrol penuh: kelola user, driver, order, marketplace, dan lihat statistik aplikasi.",
            icon: <ShieldCheck size={24} />,
            color: "text-brand-green",
            bgColor: "bg-brand-green/10",
            features: ["Kelola User & Driver", "Semua Order", "Marketplace", "Statistik", "Full Control"]
        }
    ];

    return (
        <section id="about" className="relative pt-20 pb-12 bg-[#FDF8F3]/50 overflow-hidden">
            <div className="container mx-auto px-6 text-center mb-12 relative z-10">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-4 block"
                >
                    Role Sistem
                </motion.span>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-4xl font-primary font-black mb-4 text-brand-dark-blue leading-tight tracking-tight"
                >
                    Empat Role, Satu Ekosistem
                </motion.h2>
            </div>

            <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles.map((role, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all group h-full flex flex-col"
                    >
                        <div className={`w-12 h-12 rounded-xl ${role.bgColor} ${role.color} mb-6 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm shrink-0`}>
                            {React.cloneElement(role.icon, { size: 22 })}
                        </div>
                        <h3 className="text-lg md:text-xl font-primary font-black mb-4 text-brand-dark-blue">{role.title}</h3>
                        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-8 flex-grow">
                            {role.desc}
                        </p>
                        <div className="space-y-3">
                            {role.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-brand-dark-blue/80">
                                    <div className={`w-1.5 h-1.5 rounded-full ${role.color.replace('text-', 'bg-')}`}></div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default About;
