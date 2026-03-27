import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { io } from 'socket.io-client';
import {
    MessageCircle, Send, ArrowLeft, MoreVertical, Search,
    Paperclip, Image, CheckCheck, Trash2, MapPin, Flag, Calendar, Clock, AlignLeft, Bookmark, CheckSquare,
    Package, ShoppingCart, Truck, Wallet, FileText
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const socket = io('');

const UserChat = () => {
    const { id } = useParams();
    const routerLocation = useLocation();
    const { user } = useAuth();
    
    // Initialize activeChat from router location state or URL
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(() => {
        if (id && user) {
            // Normalise to room_{min}_{max} format
            let roomId = id;
            let partnerId = null;

            const match = id.match(/^room_(\d+)_(\d+)$/);
            if (match) {
                partnerId = String(match[1]) === String(user.id) ? match[2] : match[1];
            } else {
                // Legacy: driver-6-user-5 → convert to room_{min}_{max}
                const legacyMatch = id.match(/(?:driver|user|merchant)-(\d+)-(?:driver|user|merchant)-(\d+)/);
                if (legacyMatch) {
                    const idA = parseInt(legacyMatch[1]);
                    const idB = parseInt(legacyMatch[2]);
                    roomId = `room_${Math.min(idA, idB)}_${Math.max(idA, idB)}`;
                    partnerId = String(legacyMatch[1]) === String(user.id) ? legacyMatch[2] : legacyMatch[1];
                }
            }

            const partnerImage = routerLocation.state?.partnerImage;
            return {
                id: roomId,
                name: routerLocation.state?.partnerName || 'Partner',
                image: partnerImage ? (partnerImage.startsWith('http') ? partnerImage : `${partnerImage}`) : null,
                partnerId: partnerId
            };
        }
        return null;
    });
    
    const [message, setMessage] = useState(routerLocation.state?.initialMessage || '');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    // Auto-select chat from URL if not already selected via state

    useEffect(() => {
        if (id && !activeChat && chats.length > 0) {
            const foundChat = chats.find(c => c.id === id);
            if (foundChat) {
                setActiveChat(foundChat);
            }
        }
    }, [id, activeChat, chats]);


    // ── Fetch Chat List ──────────────────────────────────────────────
    const fetchChats = async () => {
        try {
            const res = await api.get('/chat/list');
            const formatted = res.data.map(room => {
                const isU1 = Number(user.id) === Number(room.user1.id);
                const partner = isU1 ? room.user2 : room.user1;
                const myUnread = isU1 ? room.user1.unread : room.user2.unread;

                return {
                    id: room.room_id,
                    room_id: room.room_id,
                    name: partner.name || 'Pengguna JMart',
                    image: partner.image ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`) : null,
                    partnerId: partner.id,
                    lastMsg: room.last_message || '',
                    time: room.last_message_at ? new Date(room.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                    unread: myUnread || 0,
                    type: room.room_id?.includes('driver') ? 'Driver' : 'Seller',
                    isMe: String(room.last_sender_id) === String(user.id)
                };
            });
            setChats(formatted);
        } catch (err) {
            console.error('Fetch Chats Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (roomId) => {
        try {
            await api.put(`/chat/read/${roomId}`);
            // Reset badge locally only for the room we explicitly opened
            setChats(prev => prev.map(c => c.id === roomId ? { ...c, unread: 0 } : c));
        } catch (err) {
            console.error('Mark as Read Error:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchChats();
            // Join personal room for notifications even when not in a specific chat
            socket.emit('join_personal', user.id);
        }

        // Listen for real-time chat list updates (new messages from anyone)
        const handleGlobalUpdate = (data) => {
            setChats(prev => {
                const existingIndex = prev.findIndex(c => c.id === data.room_id);

                // Identify partner and unread for THIS user
                const isU1 = Number(user.id) === Number(data.user1.id);
                const partner = isU1 ? data.user2 : data.user1;
                const myUnread = isU1 ? data.user1.unread : data.user2.unread;

                const updatedItem = {
                    id: data.room_id,
                    room_id: data.room_id,
                    name: partner.name || 'Pengguna JMart',
                    image: partner.image ? (partner.image.startsWith('http') ? partner.image : `${partner.image}`) : null,
                    partnerId: partner.id,
                    lastMsg: data.last_message || '',
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

            // Mark read if it's the active room and NOT from me
            // data already contains partner info via user1/user2
            const isFromMe = String(data.sender_id) === String(user?.id);
            if (data.room_id === activeChat?.id && !isFromMe) {
                markAsRead(activeChat.id);
            }
        };

        socket.on('chat_list_update', handleGlobalUpdate);
        return () => {
            socket.off('chat_list_update', handleGlobalUpdate);
        };
    }, [user?.id, activeChat?.id]);

    // ── Fetch History when activeChat changes ────────────────────────
    useEffect(() => {
        if (!activeChat) return;

        const fetchHistory = async () => {
            try {
                // Always fetch from /details to get the definitive partner info from room_chats
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
                const history = res.data.map(m => ({
                    ...m,
                    room: m.room_id,
                    time: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    isMine: String(m.sender_id) === String(user?.id),
                }));
                setMessages(history);
            } catch (err) {
                console.error('Fetch History Error:', err);
            }
        };

        fetchHistory();
        socket.emit('join_room', activeChat.id);
        // Mark messages as read when the room is opened
        markAsRead(activeChat.id);

        const handleReceive = (data) => {
            // data.room is now normalised by server
            const incomingRoom = data.room || data.room_id;
            if (incomingRoom === activeChat?.id) {
                // Mark read immediately if message from partner arrives while room is open
                if (String(data.sender_id) !== String(user?.id)) {
                    markAsRead(activeChat.id);
                }

                setMessages(prev => {
                    // Avoid duplicates
                    if (data.id && prev.some(m => m.id === data.id)) return prev;
                    return [...prev, {
                        ...data,
                        id: data.id,
                        room_id: data.room || data.room_id,
                        sender_id: data.sender_id,
                        receiver_id: data.receiver_id,
                        content: data.content,
                        message_type: data.message_type || 'text',
                        isMine: String(data.sender_id) === String(user?.id),
                        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    }];
                });
            }
        };

        socket.on('receive_message', handleReceive);

        const handleUpdateMessage = (data) => {
            setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content } : m));
        };
        socket.on('update_message', handleUpdateMessage);

        return () => {
            socket.off('receive_message', handleReceive);
            socket.off('update_message', handleUpdateMessage);
        };
    }, [activeChat?.id, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send Message ─────────────────────────────────────────────────
    const sendMessage = (e, type = 'text', fileData = null) => {
        if (e) e.preventDefault();
        if ((!message.trim() && !fileData) || !activeChat) return;
        if (!activeChat.partnerId) {
            console.warn('[SEND] No partnerId in activeChat, cannot send');
            return;
        }

        const messageData = {
            room: activeChat.id,
            sender_id: user.id.toString(),
            receiver_id: activeChat.partnerId.toString(),
            content: message,
            message_type: type,
            file_url: fileData?.file_url || null,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
        };

        // Send via socket
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
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
        };
        socket.emit('send_message', messageData);
    };

    const handleAcceptBroadcastOffer = async (msg) => {
        try {
            const data = JSON.parse(msg.content);
            await api.post('/user/broadcasts/accept-offer', {
                broadcast_id: data.broadcast_id,
                offer_id: data.offer_id,
                driver_id: msg.sender_id,
                message_id: msg.id
            });
            toast.success('Penawaran diterima! Pesanan telah dibuat.');
            
            // Send a confirmation message
            sendCustomMessage(`Saya telah menyetujui penawaran Anda senilai Rp ${data.price?.toLocaleString('id-ID')}. Mohon segera menuju lokasi jemput.`);
            
            // Update local state to show 'Diterima' badge
            const newData = { ...data, status: 'accepted' };
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: JSON.stringify(newData) } : m));
        } catch (err) {
            console.error('Accept Broadcast Offer Error:', err);
            toast.error(err.response?.data?.message || 'Gagal menyetujui penawaran.');
        }
    };

    const handleRejectBroadcastOffer = async (msg) => {
        try {
            const data = JSON.parse(msg.content);
            await api.post('/user/broadcasts/reject-offer', {
                offer_id: data.offer_id,
                broadcast_id: data.broadcast_id,
                driver_id: msg.sender_id,
                message_id: msg.id
            });
            toast.success('Penawaran ditolak.');
            sendCustomMessage(`Maaf, saya menolak penawaran Anda.`);
            
            // Update local state to show 'Ditolak' badge
            const newData = { ...data, status: 'rejected' };
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: JSON.stringify(newData) } : m));
        } catch (err) {
            console.error('Reject Broadcast Offer Error:', err);
            toast.error(err.response?.data?.message || 'Gagal menolak penawaran.');
        }
    };

    const handleAcceptProposal = async (msg) => {
        try {
            const dariMatch = msg.content?.match(/📍 \*Dari:\*\s*(.*)/);
            const keMatch = msg.content?.match(/🏁 \*Ke:\*\s*(.*)/);
            const hargaMatch = msg.content?.match(/💰 \*Harga Penawaran:\*\s*Rp\s*([\d,.]+)/);
            
            const pickup = dariMatch ? dariMatch[1].trim() : '-';
            const destination = keMatch ? keMatch[1].trim() : '-';
            const priceStr = hargaMatch ? hargaMatch[1].trim() : '0';
            const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);

            await api.post('/chat/proposal/accept', {
                driver_id: msg.sender_id,
                room_id: msg.room_id,
                message_id: msg.id,
                biaya: price,
                jemput: pickup,
                tujuan: destination
            });
            toast.success('Penawaran diterima! Pesanan telah dibuat.');
            sendCustomMessage(`Saya telah menyetujui penawaran Antar Jemput Anda sebesar Rp ${price.toLocaleString('id-ID')}. Mohon segera menuju lokasi jemput.`);
        } catch (error) {
            console.error('Accept Proposal Error:', error);
            toast.error('Gagal menyetujui penawaran.');
        }
    };

    const handleRejectProposal = async (msg) => {
        try {
            await api.post('/chat/proposal/reject', {
                room_id: msg.room_id,
                message_id: msg.id
            });
            toast.success('Penawaran ditolak.');
            sendCustomMessage('Maaf, saya menolak penawaran Antar Jemput Anda.');
        } catch (error) {
            console.error('Reject Proposal Error:', error);
            toast.error('Gagal menolak penawaran.');
        }
    };

    // ── File Upload ──────────────────────────────────────────────────
    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('room_id', activeChat.id);
        formData.append('sender_id', user.id);
        formData.append('receiver_id', activeChat.partnerId);

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Media message is now emitted directly by the backend during upload
        } catch (err) {
            console.error('Upload Error:', err);
            toast.error('Gagal mengunggah file');
        }
    };

    // ── Clear Chat ───────────────────────────────────────────────────
    const handleClearChat = async () => {
        if (!window.confirm('Hapus semua pesan di obrolan ini?')) return;
        try {
            await api.delete(`/chat/clear/${activeChat.id}`);
            setMessages([]);
            setShowMenu(false);
        } catch (err) {
            console.error('Clear Chat Error:', err);
        }
    };

    const filteredChats = chats.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMsg || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Avatar helper ─────────────────────────────────────────────────
    const Avatar = ({ src, name, size = 14 }) => (
        <div className={`relative w-${size} h-${size} rounded-full overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0 flex items-center justify-center`}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
            ) : null}
            <div
                className="w-full h-full bg-white flex items-center justify-center font-bold text-gray-600 text-xl"
                style={{ display: src ? 'none' : 'flex' }}
            >
                {(name || '?').charAt(0).toUpperCase()}
            </div>
        </div>
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
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-700 hidden lg:block">Pesan JMart</span>
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
                                placeholder="Cari atau mulai chat baru"
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
                                <p className="text-gray-500 font-medium">Belum ada percakapan</p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => {
                                        setActiveChat(chat);
                                        // Optimistically clear badge locally; backend will confirm
                                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                                        markAsRead(chat.id);
                                    }}
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
                                                {chat.room_id?.startsWith('driver') && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-tighter">DRIVER</span>}
                                                <p className={`text-[13px] truncate ${chat.unread > 0 ? 'font-bold text-[#111b21]' : 'text-[#667781]'}`}>
                                                    {chat.lastMsg?.replace(/\[STATUS:(PENDING|ACCEPTED|REJECTED)\]/g, '').trim() || ''}
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

                {/* ── RIGHT: Chat Window ───────────────────────────────── */}
                <div className={`flex-1 flex flex-col bg-[#efeae2] relative transition-all duration-300 ${!activeChat ? 'hidden md:flex items-center justify-center bg-[#f8f9fa] border-b-[6px] border-[#25d366]' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            {/* Chat Window Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-[#f0f2f5] border-b border-[#d1d7db] z-30">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="md:hidden p-2 -ml-2 text-[#667781] hover:text-[#111b21] transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#dfe5e7] flex items-center justify-center border border-black/5">
                                            {activeChat.image ? (
                                                <img
                                                    src={activeChat.image}
                                                    alt={activeChat.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : null}
                                            <div
                                                className="w-full h-full bg-[#dfe5e7] flex items-center justify-center font-bold text-gray-500 text-lg"
                                                style={{ display: activeChat.image ? 'none' : 'flex' }}
                                            >
                                                {(activeChat.name || '?').charAt(0).toUpperCase()}
                                            </div>
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
                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-40 overflow-hidden ring-1 ring-black/5">
                                            <button onClick={() => { setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-[14px] text-[#111b21] hover:bg-gray-100 flex items-center gap-3">
                                                Info Kontak
                                            </button>
                                            <button onClick={() => { setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-[14px] text-[#111b21] hover:bg-gray-100 flex items-center gap-3">
                                                Pilih Pesan
                                            </button>
                                            <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left text-[14px] text-red-500 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50">
                                                <Trash2 size={16} />
                                                Hapus Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div 
                                className="flex-1 overflow-y-auto px-6 py-4 space-y-2 relative custom-scrollbar"
                                style={{
                                    backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8d974415812b722.jpg')",
                                    backgroundSize: 'cover',
                                    backgroundBlendMode: 'overlay',
                                    backgroundColor: '#efeae2'
                                }}
                            >
                                <div className="flex justify-center mb-6">
                                    <span className="px-3 py-1.5 bg-white/80 rounded-lg text-[11px] font-bold text-[#667781] uppercase tracking-wider shadow-sm border border-gray-200">
                                        Pesan terenkripsi secara end-to-end
                                    </span>
                                </div>

                                {messages.map((msg, idx) => {
                                    const isMine = msg.isMine;
                                    const isOrder = msg.content?.includes('*Lokasi Jemput:*') || msg.content?.includes('🚩 *PESANAN BARU*') || msg.content?.includes('[PESANAN_BARU_MARKETPLACE]');
                                    const isProposal = msg.content?.includes('✅ *MENGAJUKAN PENAWARAN*');
                                    
                                    const isPending = msg.content?.includes('[STATUS:PENDING]');
                                    const isAccepted = msg.content?.includes('[STATUS:ACCEPTED]');
                                    const isRejected = msg.content?.includes('[STATUS:REJECTED]');
                                    
                                    const displayContent = msg.content?.replace(/\[STATUS:(PENDING|ACCEPTED|REJECTED)\]/g, '')
                                                                        .replace(/\[ORDER_ID:.*?\]/g, '')
                                                                        .replace(/\[PESANAN_BARU_MARKETPLACE\]/g, '')
                                                                        .trim();

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full transition-all duration-200 animate-in fade-in slide-in-from-bottom-1`}
                                        >
                                            <div className={`relative px-3 py-1.5 min-w-[60px] max-w-[85%] sm:max-w-[65%] shadow-sm text-[14.5px] leading-relaxed
                                                ${isMine
                                                    ? 'bg-[#dcf8c6] text-[#111b21] rounded-lg rounded-tr-none'
                                                    : 'bg-white text-[#111b21] rounded-lg rounded-tl-none'
                                                }
                                                ${isOrder ? 'border-l-4 border-brand-green' : ''}`}
                                            >
                                                <div className={`absolute top-0 w-2 h-2.5 ${isMine ? '-right-2 border-l-[8px] border-l-[#dcf8c6] border-b-[10px] border-b-transparent' : '-left-2 border-r-[8px] border-r-white border-b-[10px] border-b-transparent'}`} />

                                                {msg.message_type === 'image' ? (
                                                    <div className="space-y-1.5">
                                                        <img src={`${msg.file_url}`} alt="Attachment" className="max-w-full rounded cursor-pointer border border-black/5" onClick={() => window.open(`${msg.file_url}`)} />
                                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                                    </div>
                                                ) : msg.message_type === 'file' ? (
                                                    <a href={`${msg.file_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/5 rounded-md hover:bg-black/10 transition-colors">
                                                        <div className="w-9 h-9 bg-white rounded flex items-center justify-center text-brand-green border border-gray-200 shadow-sm"><Paperclip size={18} /></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold truncate">File Berkas</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Buka di Tab Baru</p>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        {msg.message_type === 'broadcast_offer' ? (
                                                            <div className="bg-white/50 p-3 rounded-xl border border-brand-green/20">
                                                                <div className="flex items-center gap-2 mb-2 text-brand-green"><div className="p-1.5 bg-brand-green/10 rounded-lg"><MessageCircle size={14} /></div><span className="text-[11px] font-extrabold uppercase tracking-wider">Penawaran Antar Jemput</span></div>
                                                                {(() => {
                                                                    try {
                                                                        const data = JSON.parse(msg.content);
                                                                        const isPending = !data.status || data.status === 'pending';
                                                                        const isAccepted = data.status === 'accepted';
                                                                        const isRejected = data.status === 'rejected';
                                                                        return (
                                                                            <div className="space-y-3">
                                                                                <div className="space-y-1"><div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><span>Rute</span></div><p className="text-xs font-bold text-brand-dark-blue line-clamp-1">{data.pickup} → {data.destination}</p></div>
                                                                                <div className="flex items-end justify-between gap-4 pt-2 border-t border-gray-100">
                                                                                    <div><p className="text-[10px] text-gray-400 font-bold uppercase">Harga</p><p className="text-lg font-black text-brand-green">Rp {data.price?.toLocaleString('id-ID')}</p></div>
                                                                                    {!isMine && isPending && (
                                                                                        <div className="flex gap-2">
                                                                                            <button onClick={() => handleAcceptBroadcastOffer(msg)} className="px-4 py-2 bg-brand-green text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95">Terima</button>
                                                                                            <button onClick={() => handleRejectBroadcastOffer(msg)} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">Tolak</button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {!isPending && (
                                                                                    <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-bold text-center border uppercase tracking-wider ${isAccepted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{isAccepted ? 'Penawaran Diterima' : 'Penawaran Ditolak'}</div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } catch (e) { return <p className="text-xs italic text-gray-400">Gagal memuat detail penawaran</p>; }
                                                                })()}
                                                            </div>
                                                        ) : isProposal ? (
                                                            <div className="bg-white/50 p-3 rounded-xl border border-brand-green/20">
                                                                <div className="flex items-center gap-2 mb-2 text-brand-green"><div className="p-1.5 bg-brand-green/10 rounded-lg"><MessageCircle size={14} /></div><span className="text-[11px] font-extrabold uppercase tracking-wider">{isMine ? 'Penawaran Anda' : 'Penawaran Antar Jemput'}</span></div>
                                                                {(() => {
                                                                    const text = displayContent || '';
                                                                    const getVal = (reg) => { const m = text.match(reg); return m ? m[1].trim() : '-'; };
                                                                    const pickup = getVal(/📍 \*Dari:\*\s*(.*)/);
                                                                    const dest = getVal(/🏁 \*Ke:\*\s*(.*)/);
                                                                    const price = getVal(/💰 \*Harga Penawaran:\*\s*Rp\s*([\d,.]+)/);
                                                                    return (
                                                                        <div className="space-y-3">
                                                                            <div className="space-y-1"><div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><span>Rute</span></div><p className="text-xs font-bold text-brand-dark-blue line-clamp-1">{pickup} → {dest}</p></div>
                                                                            <div className="flex items-end justify-between gap-4 pt-2 border-t border-gray-100">
                                                                                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Harga Penawaran</p><p className="text-lg font-black text-brand-green">Rp {price}</p></div>
                                                                                {!isMine && isPending && (
                                                                                    <div className="flex gap-2">
                                                                                        <button onClick={() => handleAcceptProposal(msg)} className="px-4 py-2 bg-brand-green text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95">Terima</button>
                                                                                        <button onClick={() => handleRejectProposal(msg)} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">Tolak</button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {!isPending && (
                                                                                <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-bold text-center border uppercase tracking-wider ${isAccepted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{isAccepted ? 'Penawaran Diterima' : 'Penawaran Ditolak'}</div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : isOrder ? (
                                                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                                                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0"><Bookmark size={14} /></div>
                                                                    <div>
                                                                        <span className="block font-black text-[11px] text-[#0a2540] uppercase tracking-wider leading-tight">Detail Pesanan</span>
                                                                        <span className="block text-[10px] text-gray-500 font-medium">{isMine ? 'Permintaan Terkirim' : 'Permintaan Baru'}</span>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const text = displayContent || '';
                                                                    const getVal = (reg) => { const m = text.match(reg); return m ? m[1].trim() : '-'; };
                                                                    const isMarketplace = text.includes('MARKETPLACE');
                                                                    const isJastip = text.includes('JASTIP');

                                                                    if (isMarketplace) {
                                                                        const product = getVal(/\*Produk:\*\s*(.*)/);
                                                                        const qty = getVal(/\*Jumlah:\*\s*(.*)/);
                                                                        const method = getVal(/\*Metode:\*\s*(.*)/);
                                                                        const total = getVal(/\*Total Harga:\*\s*(.*)/);
                                                                        const nt = getVal(/\*Catatan:\*\s*(.*)/);
                                                                        return (
                                                                            <div className="space-y-4">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Produk</p>
                                                                                    <p className="text-sm font-black text-[#0a2540] flex items-center gap-2">
                                                                                        <Package size={16} className="text-brand-green" /> {product}
                                                                                    </p>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-100">
                                                                                    <div className="space-y-1">
                                                                                        <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Jumlah</p>
                                                                                        <p className="text-sm font-bold text-[#111b21] flex items-center gap-1.5"><ShoppingCart size={14} className="text-gray-400" /> {qty}</p>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Metode</p>
                                                                                        <p className="text-sm font-bold text-[#111b21] flex items-center gap-1.5"><Truck size={14} className="text-gray-400" /> {method}</p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] text-[#667781] font-bold uppercase tracking-widest">Total Harga</p>
                                                                                    <p className="text-xl font-black text-brand-green flex items-center gap-2">
                                                                                        <Wallet size={18} /> {total}
                                                                                    </p>
                                                                                </div>

                                                                                {nt && nt !== '-' && (
                                                                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-[11px] text-gray-600 leading-relaxed">
                                                                                        "{nt}"
                                                                                    </div>
                                                                                )}

                                                                                <div className="space-y-2 pt-2">
                                                                                    <button 
                                                                                        onClick={() => navigate('/user/orders')}
                                                                                        className="w-full py-2.5 bg-[#e1f5fe]/50 hover:bg-[#e1f5fe] text-[#0288d1] rounded-xl text-xs font-black uppercase tracking-widest border border-[#b3e5fc] transition-all active:scale-[0.98]"
                                                                                    >
                                                                                        Lihat Pesanan Saya
                                                                                    </button>

                                                                                    {isAccepted ? (
                                                                                        <div className="px-3 py-2 bg-green-50 rounded-xl text-[10px] font-black text-green-600 text-center uppercase tracking-widest border border-green-200">Pesanan Diterima</div>
                                                                                    ) : isRejected ? (
                                                                                        <div className="px-3 py-2 bg-red-50 rounded-xl text-[10px] font-black text-red-600 text-center uppercase tracking-widest border border-red-200">Pesanan Ditolak</div>
                                                                                    ) : (
                                                                                        <div className="px-3 py-2 bg-brand-green/5 rounded-xl text-[10px] font-black text-brand-green text-center uppercase tracking-widest border border-brand-green/20 animate-pulse">Menunggu Konfirmasi</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else if (isJastip) {
                                                                        const barang = getVal(/🛒 \*Barang:\*\s*(.*)/);
                                                                        const harga = getVal(/💰 \*Harga Estimasi:\*\s*(.*)/) || getVal(/💰 \*Harga Barang:\*\s*(.*)/);
                                                                        const note = getVal(/📝 \*Catatan:\*\s*(.*)/) || getVal(/📝 \*Detail Tambahan:\*\s*(.*)/);
                                                                        
                                                                        return (
                                                                            <div className="space-y-3">
                                                                                <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                                                                                    <div className="mt-0.5 w-5 h-5 bg-orange-50 text-orange-500 rounded flex items-center justify-center"><CheckSquare size={12}/></div>
                                                                                    <div>
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Barang Titipan</p>
                                                                                        <p className="text-xs font-bold text-[#111b21] leading-snug">{barang}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {harga && harga !== '-' && (
                                                                                    <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                                                                                        <div className="mt-0.5 w-5 h-5 bg-green-50 text-green-600 rounded flex items-center justify-center"><CheckSquare size={12}/></div>
                                                                                        <div>
                                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Harga Estimasi</p>
                                                                                            <p className="text-xs font-bold text-[#111b21]">{harga}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {note && note !== '-' && (
                                                                                    <div className="mt-2 p-2.5 bg-yellow-50/50 rounded-lg border border-yellow-100/50">
                                                                                        <p className="text-[10px] text-yellow-600 font-bold uppercase flex items-center gap-1 mb-1"><AlignLeft size={10}/> Catatan</p>
                                                                                        <p className="text-[11px] text-gray-700 italic leading-relaxed">"{note}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        // Anjem
                                                                        const pickup = getVal(/📍 \*Lokasi Jemput:\*\s*(.*)/);
                                                                        const dropoff = getVal(/🏁 \*Lokasi Tujuan:\*\s*(.*)/);
                                                                        const date = getVal(/📅 \*Tanggal:\*\s*(.*)/) || getVal(/📅 \*Tgl:\*\s*(.*)/);
                                                                        const time = getVal(/⏰ \*Waktu:\*\s*(.*)/) || getVal(/⏰ \*Jam:\*\s*(.*)/);
                                                                        const note = getVal(/📝 \*Catatan:\*\s*(.*)/);
                                                                        
                                                                        return (
                                                                            <div className="space-y-3">
                                                                                <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                                                                                    <div className="mt-0.5 w-5 h-5 bg-blue-50 text-blue-500 rounded flex items-center justify-center"><MapPin size={12}/></div>
                                                                                    <div>
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Lokasi Jemput</p>
                                                                                        <p className="text-xs font-bold text-[#111b21] leading-snug">{pickup}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                                                                                    <div className="mt-0.5 w-5 h-5 bg-brand-green/10 text-brand-green rounded flex items-center justify-center"><Flag size={12}/></div>
                                                                                    <div>
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Lokasi Tujuan</p>
                                                                                        <p className="text-xs font-bold text-[#111b21] leading-snug">{dropoff}</p>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-gray-50/50 rounded-lg border border-gray-100/50">
                                                                                    <div>
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Calendar size={10}/> Tanggal</p>
                                                                                        <p className="text-xs font-bold text-[#111b21]">{date}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Clock size={10}/> Waktu</p>
                                                                                        <p className="text-xs font-bold text-[#111b21]">{time}</p>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {note && note !== '-' && (
                                                                                    <div className="mt-2 p-2.5 bg-yellow-50/50 rounded-lg border border-yellow-100/50">
                                                                                        <p className="text-[10px] text-yellow-600 font-bold uppercase flex items-center gap-1 mb-1"><AlignLeft size={10}/> Catatan</p>
                                                                                        <p className="text-[11px] text-gray-700 italic leading-relaxed">"{note}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="whitespace-pre-wrap">{displayContent || msg.content}</p>
                                                            </>

                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-[#667781] font-medium">{msg.time}</span>
                                                    {isMine && <CheckCheck size={14} className="text-[#53bdeb]" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="px-4 py-2 bg-[#f0f2f5] flex items-center gap-2 z-30">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'file')} />
                                <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />

                                <div className="flex items-center gap-1">
                                    <button onClick={() => imageInputRef.current.click()} className="p-2 text-[#667781] hover:text-[#111b21] transition-colors">
                                        <Image size={22} />
                                    </button>
                                    <button onClick={() => fileInputRef.current.click()} className="p-2 text-[#667781] hover:text-[#111b21] transition-colors">
                                        <Paperclip size={22} />
                                    </button>
                                </div>

                                <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-1 shadow-sm border border-gray-100">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        onKeyDown={e => e.key === 'Enter' && sendMessage(e)}
                                        className="w-full bg-transparent py-1.5 text-[15px] outline-none text-[#111b21] placeholder:text-[#667781]"
                                    />
                                </div>

                                <button
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    className={`p-2 rounded-full transition-all ${message.trim() ? 'text-[#00a884]' : 'text-[#667781]'}`}
                                >
                                    <Send size={24} className={message.trim() ? 'fill-[#00a884]' : ''} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-32 h-32 bg-[#25d366]/5 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-[#25d366]/5">
                                <MessageCircle size={64} className="text-[#25d366]" />
                            </div>
                            <h3 className="text-3xl font-light text-[#41525d] mb-4">JMart Web Chat</h3>
                            <p className="text-[#667781] text-[14px] max-w-sm mx-auto leading-relaxed font-medium">
                                Kirim dan terima pesan tanpa perlu menjaga ponsel Anda tetap online.<br/>
                                <span className="font-bold">Gunakan JMart untuk kenyamanan transaksi Anda.</span>
                            </p>
                            <div className="mt-20 flex items-center gap-2 text-[#8696a0] text-xs font-medium">
                                <span className="w-3 h-3 bg-brand-green/20 rounded-full flex items-center justify-center text-[8px] text-brand-green">🔒</span>
                                Terenkripsi secara end-to-end
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background-color: transparent;
                }
            `}} />
        </div>
    );
};

export default UserChat;
