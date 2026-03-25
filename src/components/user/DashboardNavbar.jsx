import React from 'react';
import { Bell, PanelLeft, MapPin, RefreshCw } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/authContext';
import LocationPickerModal from './LocationPickerModal';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';

const navSocket = io('http://localhost:5000', { autoConnect: false });

const DashboardNavbar = ({ toggleSidebar }) => {
  const { userAreaName, locationStatus, isManual } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Fetch initial unread count and set up sync
  React.useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
      try {
        const res = await api.get(`/chat/unread-total`);
        setUnreadCount(res.data.total || 0);
      } catch (err) {
        console.error('Fetch unread error:', err);
      }
    };
    fetchUnread();
  }, [user]);

  // Reset badge count locally only when on chat page
  React.useEffect(() => {
    if (routerLocation.pathname.startsWith('/user/chat')) {
      // We don't necessarily set to 0 here because markAsRead will trigger a global update via socket
    }
  }, [routerLocation.pathname]);

  // Connect socket and listen for incoming messages to count unread
  React.useEffect(() => {
    if (!user) return;
    navSocket.connect();
    navSocket.emit('join_personal', user.id);

    const handleTotalUpdate = (data) => {
      setUnreadCount(data.total || 0);
    };

    navSocket.on('total_unread_update', handleTotalUpdate);
    return () => {
      navSocket.off('total_unread_update', handleTotalUpdate);
    };
  }, [user]);

  const profileImage = user?.profile_image_url;

  return (
    <header className="h-20 shrink-0 bg-white flex items-center justify-between px-8 sticky top-0 z-10 border-b border-gray-100">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <PanelLeft size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Global Location Display & Manual Override */}
        <div
          onClick={() => setIsPickerOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-[#f4efe8] px-4 py-2 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-[#ece6db] transition-all cursor-pointer group"
        >
          <div className={`p-1.5 rounded-xl transition-colors ${isManual ? "bg-brand-orange/10 text-brand-orange" : "bg-brand-green/10 text-brand-green"}`}>
            <MapPin size={16} fill="currentColor" className="opacity-80" />
          </div>
          <div className="flex flex-col min-w-[140px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">
              {locationStatus === 'loading' ? 'Menyinkronkan...' : (isManual ? 'Lokasi Manual' : 'Lokasi GPS')}
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold truncate max-w-[150px] ${locationStatus === 'loading' ? 'text-gray-400 italic font-medium' : 'text-brand-dark-blue'}`}>
                {locationStatus === 'loading' ? 'Mencari Lokasi...' : (userAreaName || 'Pilih Lokasi...')}
              </span>
            </div>
          </div>
          <div className={`ml-2 p-1.5 bg-white/50 rounded-lg transition-all ${locationStatus === 'loading' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <RefreshCw size={12} className={`text-gray-400 ${locationStatus === 'loading' ? 'animate-spin text-brand-green' : ''}`} />
          </div>
        </div>

        <LocationPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
        />

        {/* Bell icon with real-time unread badge */}
        <button
          onClick={() => { setUnreadCount(0); navigate('/user/chat'); }}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            alert('Silahkan logout terlebih dahulu untuk mengganti sesi ke role lain dengan aman, atau selesaikan proses onboarding untuk role baru.');
            navigate('/login');
          }}
          className="hidden lg:block bg-brand-cream border border-brand-cream/80 text-brand-dark-blue px-4 py-2 rounded-xl font-medium text-sm hover:brightness-95 transition-all"
        >
          Ganti Role
        </button>

        {/* Profile avatar — white background */}
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-white cursor-pointer shadow-sm">
          {profileImage ? (
            <img
              src={profileImage.startsWith('http') ? profileImage : `http://localhost:5000${profileImage}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-600 font-bold text-sm">{user?.name?.charAt(0) || 'U'}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
