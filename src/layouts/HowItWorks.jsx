import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, CreditCard, CheckCircle2 } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            title: "Daftar Akun",
            desc: "Buat akun Anda melalui aplikasi JMart.",
            icon: <UserPlus size={24} />,
            number: 1
        },
        {
            title: "Pilih Layanan",
            desc: "Pilih antar jemput, jasa titip, atau belanja marketplace.",
            icon: <Search size={24} />,
            number: 2
        },
        {
            title: "Pesan & Bayar",
            desc: "Konfirmasi pesanan dan lakukan pembayaran.",
            icon: <CreditCard size={24} />,
            number: 3
        },
        {
            title: "Selesai",
            desc: "Driver menjemput pesanan. Lacak status real-time.",
            icon: <CheckCircle2 size={24} />,
            number: 4
        }
    ];

    return (
        <section id="how-it-works" className="py-20 bg-brand-dark-blue text-white overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-80 h-80 bg-brand-orange rounded-full blur-[100px] -ml-40 -mt-40"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-green rounded-full blur-[100px] -mr-40 -mb-40"></div>
            </div>

            <div className="container mx-auto px-6 text-center mb-16 relative z-10">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-4 block"
                >
                    Cara Kerja
                </motion.span>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-4xl font-primary font-black mb-4 leading-tight tracking-tight"
                >
                    Mudah & Cepat dalam 4 Langkah
                </motion.h2>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-4 gap-8 lg:gap-12 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-[40px] left-0 w-full h-[1px] bg-white/10 -z-1"></div>

                    {steps.map((step, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            className="text-center group"
                        >
                            <div className="relative mb-8 inline-block">
                                <div className="w-20 h-20 rounded-[1.8rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover:bg-brand-orange group-hover:scale-110 shadow-2xl">
                                    <div className="text-white group-hover:scale-110 transition-transform">
                                        {React.cloneElement(step.icon, { size: 28 })}
                                    </div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-white text-brand-dark-blue font-black flex items-center justify-center text-[10px] shadow-lg border-2 border-brand-dark-blue">
                                    {step.number}
                                </div>
                            </div>
                            <h4 className="text-lg font-primary font-black mb-3">{step.title}</h4>
                            <p className="text-white/70 text-xs font-medium leading-relaxed max-w-[180px] mx-auto">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
