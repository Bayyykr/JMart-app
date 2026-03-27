import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import io from 'socket.io-client';
import { MessageCircle, Send, ArrowLeft, MoreVertical, Search, Paperclip, Image, CheckCheck, Trash2, Package, ShoppingCart, Truck, Wallet, FileText, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const socket = io('');

const MerchantChat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(() => {
        const urlPath = window.location.pathname;
        const idFromPath = urlPath.split('/').pop();
        const id = idFromPath !== 'chat' ? idFromPath : null;

        if (id) {
            return {
                id: id,
                name: routerLocation.state?.partnerName || 'Pelanggan',
                image: routerLocation.state?.partnerImage,
                partnerId: routerLocation.state?.partnerId
            };
        }
        return null;
    });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    // Initial Fetch & Socket Listeners
    useEffect(() => {
        if (!user) return;

        socket.emit('join_personal', user.id);

        const fetchChats = async () => {
            try {
                const res = await api.get('/chat/list');
                const formattedChats = res.data.map(room => {
                    const isU1 = Number(user.id) === Number(room.user1.id);
                    const partner = isU1 ? room.user2 : room.user1;
                    const myUnread = isU1 ? room.user1.unread : room.user2.unread;

                    return {
                        id: room.room_id,
                        room_id: room.room_id,
                        name: partner.name || 'Pengguna JMart',
                        image: partner.image ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`) : null,
                        partnerId: partner.id,
                        lastMsg: room.last_message,
                        time: room.last_message_at ? new Date(room.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                        unread: myUnread || 0,
                        isMe: String(room.last_sender_id) === String(user.id)
                    };
                });
                setChats(formattedChats);
            } catch (err) {
                console.error('Fetch Chats Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();

        const handleChatListUpdate = (data) => {
            setChats(prev => {
                const existingIndex = prev.findIndex(c => c.id === data.room_id);
                const isU1 = Number(user.id) === Number(data.user1.id);
                const partner = isU1 ? data.user2 : data.user1;
                const myUnread = isU1 ? data.user1.unread : data.user2.unread;

                const updatedItem = {
                    id: data.room_id,
                    room_id: data.room_id,
                    name: partner.name || 'Pengguna JMart',
                    image: partner.image ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`) : null,
                    partnerId: partner.id,
                    lastMsg: data.last_message,
                    time: new Date(data.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    unread: data.room_id === activeChat?.id ? 0 : (myUnread || 0),
                    isMe: String(data.last_sender_id) === String(user.id)
                };

                if (existingIndex !== -1) {
                    const newChats = [...prev];
                    newChats.splice(existingIndex, 1);
                    return [updatedItem, ...newChats];
                } else {
                    return [updatedItem, ...prev];
                }
            });

            if (data.room_id === activeChat?.id && String(data.sender_id) !== String(user?.id)) {
                api.put(`/chat/read/${activeChat.id}`).catch(err => console.error('Mark read error:', err));
            }
        };

        socket.on('chat_list_update', handleChatListUpdate);
        return () => socket.off('chat_list_update', handleChatListUpdate);
    }, [user?.id, activeChat?.id]);

    // Room History
    useEffect(() => {
        if (!activeChat) return;

        socket.emit('join_room', activeChat.id);

        const fetchHistory = async () => {
            try {
                const detailRes = await api.get(`/chat/details/${activeChat.id}`);
                const { user1, user2 } = detailRes.data;
                
                if (user1 && user2) {
                    const isU1 = Number(user.id) === Number(user1.id);
                    const partner = isU1 ? user2 : user1;
                    
                    setActiveChat(prev => ({
                        ...prev,
                        name: partner.name,
                        image: partner.image ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`) : null,
                        partnerId: partner.id
                    }));
                }

                const res = await api.get(`/chat/history/${activeChat.id}`);
                setMessages(res.data.map(m => ({
                    ...m,
                    isMine: String(m.sender_id) === String(user?.id),
                    time: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                })));
                api.put(`/chat/read/${activeChat.id}`).catch(err => console.error('Mark read error:', err));
            } catch (err) {
                console.error('History Error:', err);
            }
        };

        fetchHistory();

        const handleReceiveMessage = (data) => {
            if (data.room === activeChat.id || data.room_id === activeChat.id) {
                setMessages(prev => [...prev, {
                    ...data,
                    isMine: String(data.sender_id) === String(user?.id),
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                }]);

                if (String(data.sender_id) !== String(user?.id)) {
                    api.put(`/chat/read/${activeChat.id}`).catch(err => console.error('Mark read error:', err));
                    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread: 0 } : c));
                }
            }
        };

        const handleUpdateMessage = (data) => {
            if (data.room_id === activeChat.id) {
                setMessages(prev => prev.map(m => m.id === data.id ? {
                    ...m,
                    content: data.content,
                    isMine: String(data.sender_id) === String(user?.id)
                } : m));
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('update_message', handleUpdateMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('update_message', handleUpdateMessage);
        };
    }, [activeChat?.id, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || !activeChat) return;

        const messageData = {
            room: activeChat.id,
            sender_id: user.id.toString(),
            receiver_id: activeChat.partnerId?.toString(),
            content: message,
            message_type: 'text',
        };

        socket.emit('send_message', messageData);
        setMessage('');
    };

    const sendCustomMessage = (content) => {
        if (!activeChat || !activeChat.partnerId) return;
        const messageData = {
            room: activeChat.id,
            sender_id: user.id.toString(),
            receiver_id: activeChat.partnerId.toString(),
            content,
            message_type: 'text',
        };
        socket.emit('send_message', messageData);
    };

    const handleAcceptOrder = async (msg) => {
        try {
            const orderIdMatch = msg.content.match(/\[ORDER_ID:(.*?)\]/);
            const orderId = orderIdMatch ? orderIdMatch[1] : null;
            if (!orderId) throw new Error('Order ID not found');

            await api.put(`/merchant/orders/${orderId}/accept`, {
                message_id: msg.id,
                room_id: msg.room_id
            });
            toast.success('Pesanan diterima!');
        } catch (error) {
            console.error('Accept Order Error:', error);
            toast.error('Gagal menerima pesanan');
        }
    };

    const handleRejectOrder = async (msg) => {
        try {
            const orderIdMatch = msg.content.match(/\[ORDER_ID:(.*?)\]/);
            const orderId = orderIdMatch ? orderIdMatch[1] : null;
            if (!orderId) throw new Error('Order ID not found');

            await api.put(`/merchant/orders/${orderId}/reject`, {
                message_id: msg.id,
                room_id: msg.room_id
            });
            toast.error('Pesanan ditolak');
        } catch (error) {
            console.error('Reject Order Error:', error);
            toast.error('Gagal menolak pesanan');
        }
    };

    const filteredChats = chats.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMsg?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] font-primary bg-[#f0f2f5]">
            <div className="flex-1 flex overflow-hidden shadow-2xl relative">
                {/* ── LEFT: Chat List (Sidebar) ───────────────────────── */}
                <div className={`w-full md:w-[400px] border-r border-[#d1d7db] flex flex-col bg-white transition-all duration-300 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Sidebar Header */}
                    <div className="px-4 py-3 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <span className="font-bold text-gray-700 hidden lg:block">Chat Toko</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500">
                            <MessageCircle size={22} className="cursor-pointer hover:text-brand-green transition-colors" />
                            <MoreVertical size={22} className="cursor-pointer hover:text-brand-green transition-colors" />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-2 bg-white flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari pelanggan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-1.5 bg-[#f0f2f5] border-none rounded-lg focus:ring-0 outline-none text-sm font-medium text-gray-800 placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="w-6 h-6 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">Belum ada pelanggan</p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-gray-50
                                        ${activeChat?.id === chat.id
                                            ? 'bg-[#f0f2f5]'
                                            : 'hover:bg-[#f5f6f6]'}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#dfe5e7] flex items-center justify-center border border-black/5">
                                            {chat.image ? (
                                                <img
                                                    src={chat.image}
                                                    alt={chat.name}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-full h-full bg-[#dfe5e7] flex items-center justify-center font-bold text-gray-500 text-lg"
                                                style={{ display: chat.image ? 'none' : 'flex' }}
                                            >
                                                {(chat.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className={`font-semibold text-[15px] truncate text-[#111b21]`}>
                                                {chat.name}
                                            </h3>
                                            <span className={`text-[11px] font-medium flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-[#00a884]' : 'text-[#667781]'}`}>
                                                {chat.time}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                <p className={`text-[13px] truncate ${chat.unread > 0 ? 'font-bold text-[#111b21]' : 'text-[#667781]'}`}>
                                                    {chat.lastMsg?.replace(/\[STATUS:(PENDING|ACCEPTED|REJECTED)\]/g, '').replace(/\[PESANAN_BARU_MARKETPLACE\]/g, 'Pesanan Baru').trim() || ''}
                                                </p>
                                            </div>
                                            {chat.unread > 0 && (
                                                <span className="min-w-[20px] h-[20px] px-1 bg-[#25d366] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                                    {chat.unread > 99 ? '99+' : chat.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex items-center justify-center bg-[#f8f9fa]' : 'flex bg-[#efeae2]'}`}>
                    {activeChat ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-2 bg-[#f0f2f5] border-b border-[#d1d7db] z-30">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-[#667781] hover:text-[#111b21] transition-colors"><ArrowLeft size={20} /></button>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <div className="w-10 h-10 bg-[#dfe5e7] rounded-full flex items-center justify-center font-bold text-gray-500 text-lg border border-black/5 overflow-hidden">
                                            {activeChat.image ? <img src={activeChat.image} className="w-full h-full object-cover" /> : activeChat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-[#111b21] leading-tight">{activeChat.name}</h2>
                                            <p className="text-[11px] text-[#667781] font-medium">Klik untuk info kontak</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[#667781] relative">
                                    <Search size={20} className="hidden sm:block cursor-pointer hover:text-[#111b21]" />
                                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1 custom-scrollbar" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8d974415812b722.jpg')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: '#efeae2', opacity: 0.9 }}>
                                {messages.map((msg, idx) => {
                                    const isMine = msg.isMine;
                                    const isOrder = msg.content?.includes('🚩 *PESANAN BARU') || msg.content?.includes('[PESANAN_BARU_MARKETPLACE]');
                                    const displayContent = msg.content?.replace(/\[ORDER_ID:.*?\]/g, '')
                                                                        .replace(/\[STATUS:.*?\]/g, '')
                                                                        .replace(/\[PESANAN_BARU_MARKETPLACE\]/g, '')
                                                                        .trim();

                                    return (
                                        <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full transition-all duration-200 animate-in fade-in slide-in-from-bottom-1`}>
                                            <div className={`relative px-3 py-1.5 min-w-[60px] max-w-[85%] sm:max-w-[65%] shadow-sm text-[14.5px] leading-relaxed rounded-lg
                                                ${isMine
                                                    ? 'bg-[#dcf8c6] text-[#111b21] rounded-tr-none'
                                                    : 'bg-white text-[#111b21] rounded-tl-none'
                                                }
                                                ${isOrder ? 'border-l-4 border-brand-green' : ''}`}>
                                                <div className={`absolute top-0 w-2 h-2.5 ${isMine ? '-right-2 border-l-[8px] border-l-[#dcf8c6] border-b-[10px] border-b-transparent' : '-left-2 border-r-[8px] border-r-white border-b-[10px] border-b-transparent'}`} />
                                                {isOrder && !isMine ? (
                                                    <div className="space-y-4 min-w-[260px]">
                                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                                            <div className="w-8 h-8 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                                                <Package size={14} />
                                                            </div>
                                                            <div>
                                                                <span className="block font-black text-[11px] text-[#0a2540] uppercase tracking-wider leading-tight">Pesanan Baru</span>
                                                                <span className="block text-[10px] text-gray-500 font-medium">Marketplace</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {(() => {
                                                            const text = displayContent || '';
                                                            const getVal = (regex) => {
                                                                const m = text.match(regex);
                                                                return m ? m[1].trim() : '-';
                                                            };
                                                            const product = getVal(/\*Produk:\*\s*(.*)/);
                                                            const qty = getVal(/\*Jumlah:\*\s*(.*)/);
                                                            const method = getVal(/\*Metode:\*\s*(.*)/);
                                                            const total = getVal(/\*Total Harga:\*\s*(.*)/);
                                                            const notes = getVal(/\*Catatan:\*\s*(.*)/);

                                                            return (
                                                                <div className="space-y-4 text-[#0a2540]">
                                                                    <div className="space-y-1 text-left">
                                                                        <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Produk</p>
                                                                        <p className="text-sm font-black flex items-center gap-2">{product}</p>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-100">
                                                                        <div className="space-y-1 text-left">
                                                                            <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Qty</p>
                                                                            <p className="text-sm font-bold flex items-center gap-1.5"><ShoppingCart size={14} className="text-gray-400" /> {qty}</p>
                                                                        </div>
                                                                        <div className="space-y-1 text-left">
                                                                            <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Metode</p>
                                                                            <p className="text-sm font-bold flex items-center gap-1.5"><Truck size={14} className="text-gray-400" /> {method}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1 text-left">
                                                                        <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest text-left">Total Bayar</p>
                                                                        <p className="text-xl font-black text-brand-green flex items-center gap-2">
                                                                            <Wallet size={18} /> {total}
                                                                        </p>
                                                                    </div>

                                                                    {notes && notes !== '-' && (
                                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-[11px] text-gray-600 leading-relaxed text-left">
                                                                            "{notes}"
                                                                        </div>
                                                                    )}

                                                                    <div className="pt-2">
                                                                        <button 
                                                                            onClick={() => navigate('/merchant/orders')}
                                                                            className="w-full py-2.5 mb-3 bg-gray-50 hover:bg-gray-100 text-[#0a2540] rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 transition-all active:scale-[0.98]"
                                                                        >
                                                                            Lihat Pesanan Toko
                                                                        </button>

                                                                        {msg.content?.includes('[STATUS:ACCEPTED]') ? (
                                                                            <div className="flex items-center justify-center gap-2 py-3 bg-[#e8fbe5] border border-[#25d366]/20 rounded-xl mt-2">
                                                                                <CheckCircle2 size={16} className="text-[#25d366]" />
                                                                                <span className="text-[#25d366] text-[11px] font-black uppercase tracking-wider">Disetujui</span>
                                                                            </div>
                                                                        ) : msg.content?.includes('[STATUS:REJECTED]') ? (
                                                                            <div className="flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 rounded-xl mt-2">
                                                                                <XCircle size={16} className="text-red-500" />
                                                                                <span className="text-red-500 text-[11px] font-black uppercase tracking-wider">Ditolak</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex gap-2">
                                                                                <button 
                                                                                    onClick={() => handleAcceptOrder(msg)}
                                                                                    className="flex-1 py-3 bg-brand-green text-white text-[10px] font-black rounded-xl hover:bg-[#124429] transition-all shadow-sm uppercase tracking-widest"
                                                                                >
                                                                                    Terima
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleRejectOrder(msg)}
                                                                                    className="flex-1 py-3 bg-red-50 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest"
                                                                                >
                                                                                    Tolak
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                                                )}
                                                <div className={`flex items-center justify-end gap-1.5 mt-1 ${isMine ? 'text-[#667781]' : 'text-[#667781]'}`}>
                                                    <span className="text-[10px] font-medium">{msg.time}</span>
                                                    {isMine && <CheckCheck size={13} className="text-[#53bdeb]" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[#667781]">
                                    <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><Image size={20} /></button>
                                    <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><Paperclip size={20} /></button>
                                </div>
                                <div className="flex-1 bg-white rounded-xl px-4 py-2 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand-green/30 transition-all">
                                    <input
                                        type="text"
                                        placeholder="Ketik pesan..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                        className="w-full bg-transparent py-1.5 text-[14.5px] font-medium text-[#111b21] outline-none placeholder:text-[#667781]"
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                    className="w-10 h-10 bg-brand-green disabled:bg-gray-300 text-white disabled:text-gray-400 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all flex-shrink-0"
                                >
                                    <Send size={18} className="translate-x-0.5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 bg-[#f8f9fa] border-b-[6px] border-[#25d366]">
                            <div className="w-80 h-80 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                                <MessageCircle size={100} className="text-[#25d366]" />
                            </div>
                            <h2 className="text-[32px] font-light text-[#41525d] mb-4">JMart Web Chat</h2>
                            <p className="text-[14px] text-[#667781] max-w-md leading-relaxed mb-10">
                                Kirim dan terima pesan dari pelanggan Anda tanpa kendala.<br />
                                Gunakan JMart untuk kenyamanan transaksi toko Anda.
                            </p>
                            <div className="absolute bottom-10 flex items-center justify-center gap-1.5 text-[#8696a0] text-[12px]">
                                <span>🔒</span> Terenkripsi secara end-to-end
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}} />
        </div>
    );
};

export default MerchantChat;
