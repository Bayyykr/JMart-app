import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { LocationProvider } from '../context/LocationContext';
import { DriverProvider } from '../context/DriverContext';
import DashboardNavbar from '../components/user/DashboardNavbar';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, LogOut, Radio } from 'lucide-react';
import LogoutModal from '../components/common/LogoutModal';

const DriverLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        { label: 'Dashboard', path: '/driver', icon: <LayoutDashboard size={20} /> },
        { label: 'Pesanan', path: '/driver/orders', icon: <ShoppingCart size={20} /> },
        { label: 'Jasa Titip', path: '/driver/jastip', icon: <Package size={20} /> },
        { label: 'Broadcast', path: '/driver/broadcasts', icon: <Radio size={20} /> },
        { label: 'Chat', path: '/driver/chat', icon: <MessageSquare size={20} /> },
        { label: 'Profil', path: '/driver/profile', icon: <Package size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <LocationProvider>
            <DriverProvider>
                <div className="min-h-screen bg-brand-cream flex font-primary">
                    {/* Sidebar matches User/Merchant Sidebar exactly in style */}
                    <div className={`h-screen bg-brand-dark-blue text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex`}>
                        <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-xl">
                                <img src="/src/assets/logo-app.png" alt="JMart" className="w-8 h-8 object-contain" />
                            </div>
                            {isSidebarOpen && (
                                <div className="overflow-hidden uppercase tracking-wider">
                                    <h1 className="font-bold text-lg leading-tight text-white">JMart</h1>
                                    <p className="text-[10px] text-brand-light-blue font-bold">Driver Partner</p>
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
                                        {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
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
                        <div className="flex-1 overflow-y-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
                <LogoutModal 
                    isOpen={showLogoutModal} 
                    onClose={() => setShowLogoutModal(false)} 
                    onConfirm={handleLogout} 
                />
            </DriverProvider>
        </LocationProvider>
    );
};

export default DriverLayout;
