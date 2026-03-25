import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { LayoutDashboard, Users, UserCheck, LogOut, ShieldCheck, Store } from 'lucide-react';
import LogoutModal from '../components/common/LogoutModal';

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
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-brand-dark-blue rounded-xl flex items-center justify-center text-white">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="font-black text-xl text-brand-dark-blue tracking-tight">Admin JMart</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                                location.pathname === item.path 
                                ? 'bg-brand-dark-blue text-white shadow-lg shadow-brand-dark-blue/20' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                        Keluar
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-xl font-black text-brand-dark-blue">
                        {menuItems.find(m => m.path === location.pathname)?.name || 'Admin Panel'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-brand-dark-blue">Super Admin</p>
                            <p className="text-xs text-brand-orange font-black uppercase tracking-widest">System Controller</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black">
                            SA
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={handleLogout} 
            />
        </div>
    );
};

export default AdminLayout;
