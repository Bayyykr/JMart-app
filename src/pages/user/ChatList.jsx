import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';
import { io } from 'socket.io-client';

const socket = io('', { autoConnect: false });

const ChatList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeChats, setActiveChats] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    const formatChats = React.useCallback((rawData, currentUserId) => {
        return rawData.map(room => {
            const isU1 = Number(currentUserId) === Number(room.user1.id);
            const partner = isU1 ? room.user2 : room.user1;
            const myUnread = isU1 ? room.user1.unread : room.user2.unread;
            const isMe = String(room.last_sender_id) === String(currentUserId);

            return {
                id: room.room_id,
                partnerId: partner.id,
                name: partner.name || 'Driver / Seller',
                profile_image: partner.image
                    ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`)
                    : null,
                lastMessage: room.last_message || '',
                isMe,
                time: room.last_message_at
                    ? new Date(room.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--',
                unread: myUnread || 0,
                type: room.room_id?.startsWith('driver') ? 'Driver' : 'Seller'
            };
        });
    }, []);

    const fetchChats = React.useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/chat/list');
            setActiveChats(formatChats(res.data, user.id));
        } catch (err) {
            console.error('Fetch Chats Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, formatChats]);

    React.useEffect(() => {
        if (user) fetchChats();
    }, [user, fetchChats]);

    // Socket: listen for chat_list_update (new format with user1/user2)
    React.useEffect(() => {
        if (!user) return;
        socket.connect();
        socket.emit('join_personal', user.id);

        const handleChatListUpdate = (data) => {
            const isU1 = Number(user.id) === Number(data.user1.id);
            const partner = isU1 ? data.user2 : data.user1;
            const myUnread = isU1 ? data.user1.unread : data.user2.unread;
            const isMe = String(data.last_sender_id) === String(user.id);

            const updatedItem = {
                id: data.room_id,
                partnerId: partner.id,
                name: partner.name || 'Pengguna JMart',
                profile_image: partner.image
                    ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`)
                    : null,
                lastMessage: data.last_message || '',
                isMe,
                time: new Date(data.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                unread: myUnread || 0,
                type: data.room_id?.startsWith('driver') ? 'Driver' : 'Seller'
            };

            setActiveChats(prev => {
                const existingIndex = prev.findIndex(c => c.id === data.room_id);
                if (existingIndex !== -1) {
                    const newChats = [...prev];
                    newChats.splice(existingIndex, 1);
                    return [updatedItem, ...newChats];
                }
                return [updatedItem, ...prev];
            });
        };

        socket.on('chat_list_update', handleChatListUpdate);
        return () => {
            socket.off('chat_list_update', handleChatListUpdate);
            socket.disconnect();
        };
    }, [user]);

    const handleChatClick = (chat) => {
        setActiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
        navigate(`/user/chat/${chat.id}`, {
            state: {
                partnerName: chat.name,
                partnerImage: chat.profile_image,
                partnerId: chat.partnerId
            }
        });
    };

    const filtered = activeChats.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-dark-blue flex items-center gap-3">
                    <MessageCircle className="text-brand-green" size={32} />
                    PesanMasuk
                </h1>
                <p className="text-gray-500 font-medium mt-2">Kelola semua obrolan Anda di sini</p>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-[2rem] shadow-sm w-full max-w-5xl border border-gray-100 overflow-hidden min-h-[60vh] flex flex-col">

                {/* Search Bar */}
                <div className="p-6 lg:p-8 bg-gray-50/50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari obrolan..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 text-[15px] font-medium text-gray-800 shadow-sm"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 bg-white divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400 font-medium">Memuat obrolan...</div>
                    ) : filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark-blue mb-2">Belum Ada Obrolan</h3>
                            <p className="text-gray-500 font-medium max-w-sm">Mulai pesan produk dari Marketplace atau hubungi Driver di halaman Antar Jemput untuk memulai percakapan.</p>
                        </div>
                    ) : (
                        filtered.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatClick(chat)}
                                className={`flex items-center gap-4 hover:bg-gray-50 px-6 py-4 cursor-pointer transition-colors ${chat.unread > 0 ? 'bg-brand-green/5' : ''}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 bg-white rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-600 text-xl border-2 border-gray-200 shadow-sm">
                                        {chat.profile_image ? (
                                            <img
                                                src={chat.profile_image}
                                                alt={chat.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('fallback-shown'); }}
                                            />
                                        ) : (
                                            chat.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {chat.unread > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-brand-green border-[2px] border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                            {chat.unread > 99 ? '99+' : chat.unread}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`font-bold text-base truncate ${chat.unread > 0 ? 'text-gray-900' : 'text-gray-800'}`}>{chat.name}</h3>
                                        <span className={`text-xs font-bold flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-brand-green' : 'text-gray-400'}`}>
                                            {chat.time}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-[13px] truncate pr-3 ${chat.unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500 font-medium'}`}>
                                            {chat.isMe && <span className="text-gray-400">Anda: </span>}
                                            {(chat.lastMessage || '').replace(/\[STATUS:(PENDING|ACCEPTED|REJECTED)\]/g, '').replace(/\[ORDER_ID:.*?\]/g, '').replace(/\[PESANAN_BARU_MARKETPLACE\]/g, '').trim()}
                                        </p>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${chat.unread > 0 ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {chat.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatList;
