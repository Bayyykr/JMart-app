import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { LayoutDashboard, Users, UserCheck, LogOut, ShieldCheck, Store, AlertTriangle } from 'lucide-react';
import LogoutModal from '../components/common/LogoutModal';
import logoApp from '../assets/logo-app.png';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const menuItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'User Management', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Driver Verification', path: '/admin/drivers', icon: <UserCheck size={20} /> },
        { name: 'Merchant Verification', path: '/admin/merchants', icon: <Store size={20} /> },
        { name: 'Laporan Masuk', path: '/admin/reports', icon: <AlertTriangle size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-brand-cream flex font-primary relative">
            {/* Sidebar matches User/Driver Sidebar exactly in style */}
            <div className="w-64 bg-brand-dark-blue text-white flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 z-50 hidden md:flex">
                <div className="p-6 flex items-center gap-3">
                    <img src={logoApp} alt="JMart Logo" className="h-10 w-auto object-contain" />
                    <div className="overflow-hidden">
                        <h1 className="font-bold text-lg leading-tight text-white tracking-wide">Admin Panel</h1>
                        <p className="text-xs text-[#8f9eb2]">JMart Console</p>
                    </div>
                </div>
                
                <nav className="flex-1 mt-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-colors ${
                                    isActive 
                                    ? 'bg-brand-light-blue border-r-4 border-brand-orange text-white' 
                                    : 'text-gray-400 hover:bg-brand-light-blue/50 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span className="font-medium whitespace-nowrap">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-3 px-6 w-full text-gray-400 hover:text-red-400 transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>Keluar</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col transition-all duration-300 ml-0 md:ml-64 min-w-0">
                {/* Header Navbar - Solid White with Shadow */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-6 lg:px-10 shrink-0 sticky top-0 z-40 shadow-sm transition-all duration-300">
                    {/* Mobile Branding */}
                    <div className="flex md:hidden flex-1 items-center gap-3">
                        <img src={logoApp} alt="JMart Logo" className="h-8 w-auto object-contain" />
                        <h1 className="font-bold text-lg text-brand-dark-blue">Admin</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-brand-dark-blue">Super Admin</p>
                            <p className="text-[10px] text-gray-500 font-medium">System Controller</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-light-blue flex items-center justify-center text-white font-bold shadow-sm">
                            AD
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    <Outlet />
                </div>
            </main>
            
            {/* Mobile Bottom Navigation */}
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

            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={handleLogout} 
            />
        </div>
    );
};

export default AdminLayout;
