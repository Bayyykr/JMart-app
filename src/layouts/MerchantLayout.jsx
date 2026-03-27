import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { LocationProvider } from '../context/LocationContext';
import DashboardNavbar from '../components/user/DashboardNavbar';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, LogOut, User } from 'lucide-react';
import LogoutModal from '../components/common/LogoutModal';
import logoApp from '../assets/logo-app.png';

const MerchantLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        { name: 'Dashboard', path: '/merchant', icon: <LayoutDashboard size={20} /> },
        { name: 'Produk Saya', path: '/merchant/products', icon: <Package size={20} /> },
        { name: 'Pesanan', path: '/merchant/orders', icon: <ShoppingCart size={20} /> },
        { name: 'Chat', path: '/merchant/chat', icon: <MessageSquare size={20} /> },
        { name: 'Profil', path: '/merchant/profile', icon: <User size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <LocationProvider>
            <div className="min-h-screen bg-brand-cream flex font-primary">
            {/* Sidebar matches User/Driver Sidebar exactly in style */}
            <div className={`h-screen bg-brand-dark-blue text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex`}>
                <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm shadow-black/10">
                        <img src={logoApp} alt="JMart Square Logo" className="w-full h-full object-contain drop-shadow-sm bg-transparent" />
                    </div>
                    {isSidebarOpen && (
                        <div className="overflow-hidden">
                            <h1 className="font-bold text-lg leading-tight text-white tracking-wide">JMart</h1>
                            <p className="text-xs text-[#8f9eb2]">Seller Panel</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 mt-4">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <div
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-6' : 'justify-center'} py-4 cursor-pointer transition-colors ${isActive
                                    ? 'bg-brand-light-blue border-r-4 border-brand-orange text-white'
                                    : 'text-gray-400 hover:bg-brand-light-blue/50 hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <div
                        onClick={() => setShowLogoutModal(true)}
                        className={`flex items-center ${isSidebarOpen ? 'gap-3 px-6' : 'justify-center'} text-gray-400 hover:text-red-400 cursor-pointer transition-colors`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium whitespace-nowrap">Keluar</span>}
                    </div>
                </div>
            </div>

            {/* Main Content Area - Matching User layout exactly */}
            <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <DashboardNavbar toggleSidebar={toggleSidebar} />
                <div className={`flex-1 overflow-y-auto ${location.pathname.startsWith('/merchant/chat') ? 'p-0' : 'p-6 lg:p-10'}`}>
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation matching user style */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center p-1 transition-colors ${location.pathname === item.path ? 'text-brand-dark-blue ring-2 ring-brand-orange/10 rounded-lg' : 'text-gray-400'}`}
                    >
                        {item.icon}
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-widest">{item.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
        <LogoutModal 
            isOpen={showLogoutModal} 
            onClose={() => setShowLogoutModal(false)} 
            onConfirm={handleLogout} 
        />
        </LocationProvider>
    );
};

export default MerchantLayout;
