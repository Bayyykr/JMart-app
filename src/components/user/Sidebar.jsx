import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, ShoppingBag, Store, History, User, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import LogoutModal from '../common/LogoutModal';
import logo from '../../assets/logo-app.png';

const Sidebar = ({ isOpen = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/user' },
    { icon: <Car size={20} />, label: 'Antar Jemput', path: '/user/antar-jemput' },
    { icon: <ShoppingBag size={20} />, label: 'Jasa Titip', path: '/user/jasa-titip' },
    { icon: <Store size={20} />, label: 'Marketplace', path: '/user/marketplace' },
    { icon: <History size={20} />, label: 'Order Saya', path: '/user/order' },
    { icon: <MessageCircle size={20} />, label: 'Chat', path: '/user/chat' },
    { icon: <User size={20} />, label: 'Profil', path: '/user/profil' },
  ];

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <>
    <div className={`h-screen bg-brand-dark-blue text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`p-6 flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
          <img src={logo} alt="JMart" className="w-full h-full object-contain" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight text-white tracking-wide">JMart</h1>
            <p className="text-xs text-[#8f9eb2]">Customer</p>
          </div>
        )}
      </div>

      <nav className="flex-1 mt-4">
        {menuItems.map((item, index) => {
          // Special case for dashboard to not highlight on sub-routes unless exact
          const isActive = item.path === '/user'
            ? location.pathname === '/user'
            : location.pathname.startsWith(item.path);

          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex items-center ${isOpen ? 'gap-3 px-6' : 'justify-center'} py-4 cursor-pointer transition-colors ${isActive
                ? 'bg-brand-light-blue border-r-4 border-brand-orange text-white'
                : 'text-gray-400 hover:bg-brand-light-blue/50 hover:text-white'
                }`}
            >
              {item.icon}
              {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </div>
          );
        })}
      </nav>

      <div className="p-6">
        <div 
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center ${isOpen ? 'gap-3 px-6' : 'justify-center'} text-gray-400 hover:text-red-400 cursor-pointer transition-colors`}
        >
          <LogOut size={20} />
          {isOpen && <span className="font-medium whitespace-nowrap">Keluar</span>}
        </div>
      </div>
    </div>

    <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogout} 
    />
    </>
  );
};

export default Sidebar;
