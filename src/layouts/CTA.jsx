import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CTA = () => {
    const navigate = useNavigate();

    return (
        <section className="py-16 overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-brand-dark-blue rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20"
                >
                    <div className="relative z-10">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-primary font-black text-white mb-6 leading-tight tracking-tight"
                        >
                            Siap untuk <br className="hidden md:block"/> Mengembangkan Bisnis?
                        </motion.h2>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-blue-50/70 mb-10 max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed"
                        >
                            Bergabunglah dengan ribuan pengusaha yang telah sukses bersama ekosistem JMart yang powerful.
                        </motion.p>
                        
                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(249, 115, 22, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 rounded-xl bg-brand-orange text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-600 transition-colors shadow-2xl group"
                        >
                            <span className="flex items-center gap-3">
                                Mulai Sekarang Juga
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.span>
                            </span>
                        </motion.button>
                    </div>
                    
                    {/* Animated background elements */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-48 -mt-48 blur-2xl"
                    ></motion.div>
                    
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            rotate: [0, -90, 0]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-brand-green/20 to-transparent rounded-full -ml-32 -mb-32 blur-2xl"
                    ></motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;
