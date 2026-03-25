import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';
import logo from '../assets/logo-app.png';

const Footer = () => {
    return (
        <footer id="footer" className="bg-brand-dark-blue text-white pt-24 pb-12">
            <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                        <div className="flex flex-col items-center md:items-start">
                            <div className="flex items-center gap-3 mb-6">
                                <img src={logo} alt="JMart" className="w-10 h-10 object-contain" />
                                <span className="text-xl font-primary font-black tracking-tight text-white">JMart</span>
                            </div>
                            <p className="text-white/60 text-xs leading-relaxed mb-8 font-medium max-w-xs text-center md:text-left">
                                Melayani antar jemput, Jasa Titip, dan jual beli di pasar digital dalam satu aplikasi.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-white/80 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all">
                                        <Mail size={14} />
                                    </div>
                                    <span className="text-xs font-bold">halo@jmart.com</span>
                                </div>
                                <div className="flex items-center gap-4 text-white/80 group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all">
                                        <Phone size={14} />
                                    </div>
                                    <span className="text-xs font-bold">+62 821 1234 5678</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-brand-orange uppercase tracking-[0.2em] mb-8 text-center md:text-left">Layanan</h4>
                            <ul className="space-y-4 text-center md:text-left">
                                {['Antar Jemput', 'Jasa Titip', 'Marketplace', 'Driver Partner'].map((item) => (
                                    <li key={item}><a href="#" className="text-white/60 hover:text-white text-xs font-bold transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-brand-orange uppercase tracking-[0.2em] mb-8 text-center md:text-left">Perusahaan</h4>
                            <ul className="space-y-4 text-center md:text-left">
                                {['Tentang Kami', 'Karir', 'Kebijakan Privasi', 'Syarat & Ketentuan'].map((item) => (
                                    <li key={item}><a href="#" className="text-white/60 hover:text-white text-xs font-bold transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-brand-orange uppercase tracking-[0.2em] mb-8 text-center md:text-left">Ikuti Kami</h4>
                            <p className="text-white/60 text-[10px] font-bold mb-6 text-center md:text-left uppercase tracking-widest leading-relaxed">
                                Terhubung dengan kami di media sosial.
                            </p>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                {[
                                    { icon: <Instagram size={18} />, label: "Instagram" },
                                    { icon: <Twitter size={18} />, label: "Twitter" },
                                    { icon: <Facebook size={18} />, label: "Facebook" }
                                ].map((social, i) => (
                                    <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all text-white/60" aria-label={social.label}>
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                <div className="container mx-auto px-6 pt-10 border-t border-white/5 text-center">
                    <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">
                        © 2024 JMart. All rights reserved.
                    </p>
                </div>
        </footer>
    );
};

export default Footer;
