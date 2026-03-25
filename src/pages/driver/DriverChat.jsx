import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import io from 'socket.io-client';
import { MessageCircle, Send, ArrowLeft, MoreVertical, Search, Paperclip, Image, CheckCheck, Trash2, FileSignature, MapPin, Flag, Calendar, Clock, AlignLeft, Bookmark, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import { useLocation as useRouterLocation } from 'react-router-dom';

const socket = io('http://localhost:5000');

const DriverChat = () => {
    const { user } = useAuth();
    const routerLocation = useRouterLocation();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(() => {
        const urlPath = window.location.pathname;
        const idFromPath = urlPath.split('/').pop();
        const id = idFromPath !== 'chat' ? idFromPath : null;

        if (id) {
            // Normalise to room_{min}_{max}
            let roomId = id;
            const legacyMatch = id.match(/(?:driver|user|merchant)-(\d+)-(?:driver|user|merchant)-(\d+)/);
            if (legacyMatch) {
                const idA = parseInt(legacyMatch[1]);
                const idB = parseInt(legacyMatch[2]);
                roomId = `room_${Math.min(idA, idB)}_${Math.max(idA, idB)}`;
            }
            const partnerImage = routerLocation.state?.partnerImage;
            return {
                id: roomId,
                name: routerLocation.state?.partnerName || 'Partner',
                image: partnerImage ? (partnerImage.startsWith('http') ? partnerImage : `http://localhost:5000${partnerImage}`) : null,
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
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalData, setProposalData] = useState({ jemput: '', tujuan: '', biaya: '' });
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

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
                        image: partner.image ? (partner.image.startsWith('http') ? partner.image : `http://localhost:5000${partner.image}`) : null,
                        partnerId: partner.id,
                        lastMsg: room.last_message,
                        time: room.last_message_at ? new Date(room.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                        unread: myUnread || 0,
                        isMe: String(room.last_sender_id) === String(user.id)
                    };
                });
                setChats(formattedChats);
                
                // If we have an activeChat from URL but it's not in the list yet, we might need to add it or refresh
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
                    image: partner.image ? (partner.image.startsWith('http') ? partner.image : `http://localhost:5000${partner.image}`) : null,
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

            // Mark read if it's the active room and NOT from me
            const isFromMe = String(data.sender_id) === String(user?.id);
            if (data.room_id === activeChat?.id && !isFromMe) {
                api.put(`/chat/read/${activeChat.id}`).catch(err => console.error('Mark read error:', err));
            }
        };

        socket.on('chat_list_update', handleChatListUpdate);
        return () => socket.off('chat_list_update', handleChatListUpdate);
    }, [user?.id, activeChat?.id]);

    // Room Specific Listeners
    useEffect(() => {
        if (!activeChat) return;

        socket.emit('join_room', activeChat.id);

        const fetchHistory = async () => {
            try {
                // Always fetch /details for authoritative partner name from room_chats
                const detailRes = await api.get(`/chat/details/${activeChat.id}`);
                const { user1, user2 } = detailRes.data;
                
                if (user1 && user2) {
                    const isU1 = Number(user.id) === Number(user1.id);
                    const partner = isU1 ? user2 : user1;
                    
                    setActiveChat(prev => ({
                        ...prev,
                        name: partner.name,
                        image: partner.image ? (partner.image.startsWith('http') ? partner.image : `http://localhost:5000${partner.image}`) : null,
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
            const incomingRoom = data.room || data.room_id;
            if (incomingRoom === activeChat.id) {
                setMessages(prev => {
                    if (data.id && prev.some(m => m.id === data.id)) return prev;
                    return [...prev, {
                        ...data,
                        isMine: String(data.sender_id) === String(user?.id),
                        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    }];
                });

                if (String(data.sender_id) !== String(user?.id)) {
                    api.put(`/chat/read/${activeChat.id}`).catch(err => console.error('Mark read error:', err));
                 setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread: 0 } : c));
                }
            }
        };

        const handleUpdateMessage = (data) => {
            setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content } : m));
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

        const partnerId = activeChat.partnerId;
        const messageData = {
            room: activeChat.id,
            sender_id: user.id.toString(),
            receiver_id: partnerId?.toString(),
            content: message,
            message_type: 'text',
        };

        socket.emit('send_message', messageData);
        setMessage('');
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file || !activeChat) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('room_id', activeChat.id);
        formData.append('sender_id', user.id);
        formData.append('receiver_id', activeChat.partnerId);
        formData.append('content', type === 'image' ? 'Sent an image' : 'Sent a file');

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Media message is now emitted directly by the backend during upload
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Gagal mengirim file');
        }
    };

    const handleClearChat = async () => {
        if (!activeChat || !window.confirm('Hapus semua pesan di percakapan ini?')) return;
        try {
            await api.delete(`/chat/clear/${activeChat.id}`);
            setMessages([]);
            setShowMenu(false);
        } catch (err) {
            console.error('Clear Chat Error:', err);
        }
    };

    const handleProposePrice = (jemput, tujuan) => {
        setProposalData({ jemput, tujuan, biaya: '' });
        setShowProposalModal(true);
    };

    const handleManualProposal = () => {
        setShowProposalModal(true);
    };

    const submitProposal = () => {
        const { jemput, tujuan, biaya } = proposalData;
        if (!jemput || !tujuan || !biaya) return;

        let acceptMessage = `✅ *MENGAJUKAN PENAWARAN*\nHalo! Saya bersedia mengantar Anda.\n\n📍 *Dari:* ${jemput}\n🏁 *Ke:* ${tujuan}\n\n💰 *Harga Penawaran:* Rp ${biaya}\n\n[STATUS:PENDING]`;

        const messageData = {
            room: activeChat.id,
            sender_id: user.id.toString(),
            receiver_id: activeChat.partnerId?.toString(),
            content: acceptMessage,
            message_type: 'text'
        };
        socket.emit('send_message', messageData);
        setShowProposalModal(false);
        setProposalData({ jemput: '', tujuan: '', biaya: '' });
    };

    const filteredChats = chats.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMsg?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] font-primary bg-[#f0f2f5]">
            <div className="flex-1 flex overflow-hidden shadow-2xl relative">
                {/* Sidebar */}
                <div className={`w-full md:w-[400px] border-r border-[#d1d7db] flex flex-col bg-white transition-all duration-300 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="px-4 py-3 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0a2540] flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-[#0a2540] hidden lg:block">Driver Chat</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500">
                            <MessageCircle size={22} className="cursor-pointer hover:text-[#0a2540] transition-colors" />
                            <MoreVertical size={22} className="cursor-pointer hover:text-[#0a2540] transition-colors" />
                        </div>
                    </div>

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

                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="w-6 h-6 border-3 border-[#0a2540] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">Belum ada obrolan</p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => {
                                        setActiveChat(chat);
                                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                                        api.put(`/chat/read/${chat.id}`).catch(err => console.error('Mark read error:', err));
                                    }}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-gray-50
                                        ${activeChat?.id === chat.id ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                                >
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
                                            <div className="w-full h-full bg-[#dfe5e7] flex items-center justify-center font-bold text-gray-500 text-lg" style={{ display: chat.image ? 'none' : 'flex' }}>
                                                {(chat.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="font-semibold text-[15px] truncate text-[#111b21]">{chat.name}</h3>
                                            <span className={`text-[11px] font-medium flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-[#00a884]' : 'text-[#667781]'}`}>{chat.time}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-[13px] truncate ${chat.unread > 0 ? 'font-bold text-[#111b21]' : 'text-[#667781]'}`}>
                                                {chat.lastMsg}
                                            </p>
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

                {/* Chat Window */}
                <div className={`flex-1 flex flex-col bg-[#efeae2] relative transition-all duration-300 ${!activeChat ? 'hidden md:flex items-center justify-center bg-[#f8f9fa] border-b-[6px] border-[#0a2540]' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-2 bg-[#f0f2f5] border-b border-[#d1d7db] z-30">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-[#667781] hover:text-[#111b21] transition-colors">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#dfe5e7] flex items-center justify-center border border-black/5">
                                            {activeChat.image ? (
                                                <img src={activeChat.image} alt={activeChat.name} className="w-full h-full object-cover" />
                                            ) : null}
                                            <div className="w-full h-full bg-[#dfe5e7] flex items-center justify-center font-bold text-gray-500 text-lg" style={{ display: activeChat.image ? 'none' : 'flex' }}>
                                                {(activeChat.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-[#111b21] leading-tight">{activeChat.name}</h2>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">User Online</span></div>
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
                                            <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left text-[14px] text-red-500 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50">
                                                <Trash2 size={16} /> Hapus Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                    const isOrder = msg.content?.includes('*Lokasi Jemput:*') || msg.content?.includes('🚩 *PESANAN BARU*');
                                    const isProposal = msg.content?.includes('✅ *MENGAJUKAN PENAWARAN*');
                                    
                                    // Parse statuses from content
                                    const isPending = msg.content?.includes('[STATUS:PENDING]');
                                    const isAccepted = msg.content?.includes('[STATUS:ACCEPTED]');
                                    const isRejected = msg.content?.includes('[STATUS:REJECTED]');
                                    
                                    // Remove the status tags for display
                                    const displayContent = msg.content?.replace(/\[STATUS:(PENDING|ACCEPTED|REJECTED)\]/g, '').trim();

                                    return (
                                        <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} w-full transition-all duration-200`}>
                                            <div className={`relative px-3 py-1.5 min-w-[60px] max-w-[85%] sm:max-w-[65%] shadow-sm text-[14.5px] leading-relaxed
                                                ${isMine ? 'bg-[#dcf8c6] text-[#111b21] rounded-lg rounded-tr-none' : 'bg-white text-[#111b21] rounded-lg rounded-tl-none'}
                                                ${isOrder ? 'border-l-4 border-[#0a2540]' : ''}`}
                                            >
                                                <div className={`absolute top-0 w-2 h-2.5 ${isMine ? '-right-2 border-l-[8px] border-l-[#dcf8c6] border-b-[10px] border-b-transparent' : '-left-2 border-r-[8px] border-r-white border-b-[10px] border-b-transparent'}`} />
                                                
                                                {msg.message_type === 'image' ? (
                                                    <div className="space-y-1.5">
                                                        <img src={`http://localhost:5000${msg.file_url}`} alt="Attachment" className="max-w-full rounded cursor-pointer border border-black/5" onClick={() => window.open(`http://localhost:5000${msg.file_url}`)} />
                                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                                    </div>
                                                ) : msg.message_type === 'file' ? (
                                                    <a href={`http://localhost:5000${msg.file_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/5 rounded-md hover:bg-black/10 transition-colors">
                                                        <div className="w-9 h-9 bg-white rounded flex items-center justify-center text-[#0a2540] border border-gray-200 shadow-sm"><Paperclip size={18} /></div>
                                                        <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">File Berkas</p><p className="text-[10px] text-gray-500 uppercase tracking-tighter">Buka di Tab Baru</p></div>
                                                    </a>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        {msg.message_type === 'broadcast_offer' ? (
                                                            <div className="bg-white/50 p-3 rounded-xl border border-brand-green/20">
                                                                <div className="flex items-center gap-2 mb-2 text-brand-green">
                                                                    <div className="p-1.5 bg-brand-green/10 rounded-lg">
                                                                        <MessageCircle size={14} />
                                                                    </div>
                                                                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Penawaran Anda</span>
                                                                </div>
                                                                
                                                                {(() => {
                                                                    try {
                                                                        const data = JSON.parse(msg.content);
                                                                        return (
                                                                            <div className="space-y-2">
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Rute</p>
                                                                                <p className="text-xs font-bold text-brand-dark-blue line-clamp-1">{data.pickup} → {data.destination}</p>
                                                                                <div className="pt-2 border-t border-gray-100">
                                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Harga Penawaran</p>
                                                                                    <p className="text-base font-black text-brand-green">Rp {data.price?.toLocaleString('id-ID')}</p>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } catch (e) {
                                                                        return <p className="text-xs italic text-gray-400">Gagal memuat detail penawaran</p>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        ) : isProposal ? (
                                                            <div className="bg-white/50 p-3 rounded-xl border border-brand-green/20">
                                                                <div className="flex items-center gap-2 mb-2 text-brand-green">
                                                                    <div className="p-1.5 bg-brand-green/10 rounded-lg">
                                                                        <MessageCircle size={14} />
                                                                    </div>
                                                                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                                                                        {isMine ? 'Penawaran Anda' : 'Penawaran Antar Jemput'}
                                                                    </span>
                                                                </div>
                                                                
                                                                {(() => {
                                                                    const dariMatch = msg.content?.match(/📍 \*Dari:\*\s*(.*)/);
                                                                    const keMatch = msg.content?.match(/🏁 \*Ke:\*\s*(.*)/);
                                                                    const hargaMatch = msg.content?.match(/💰 \*Harga Penawaran:\*\s*Rp\s*([\d,.]+)/);
                                                                    
                                                                    const pickup = dariMatch ? dariMatch[1].trim() : '-';
                                                                    const destination = keMatch ? keMatch[1].trim() : '-';
                                                                    const priceStr = hargaMatch ? hargaMatch[1].trim() : '-';

                                                                    return (
                                                                        <div className="space-y-3">
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                                                                    <span>Rute</span>
                                                                                </div>
                                                                                <p className="text-xs font-bold text-[#0a2540] line-clamp-1">{pickup} → {destination}</p>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-end justify-between gap-4 pt-2 border-t border-gray-100">
                                                                                <div>
                                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Harga Penawaran</p>
                                                                                    <p className="text-lg font-black text-[#0a2540]">Rp {priceStr}</p>
                                                                                </div>
                                                                            </div>
                                                                            {!isPending && (
                                                                                <div className={`mt-2 px-3 py-1.5 rounded-md text-xs font-bold text-center border uppercase tracking-wider ${isAccepted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                    {isAccepted ? 'Penawaran Diterima' : 'Penawaran Ditolak'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : isOrder ? (
                                                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] w-full">
                                                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#0a2540] to-blue-800 text-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                                                        <Bookmark size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-black text-[11px] text-[#0a2540] uppercase tracking-wider leading-tight">Detail Pesanan</span>
                                                                        <span className="block text-[10px] text-gray-500 font-medium">{isMine ? 'Permintaan Terkirim' : 'Permintaan Baru'}</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {(() => {
                                                                    const text = displayContent || msg.content || '';
                                                                    const isJastip = text.includes('Jasa Titip');
                                                                    
                                                                    const getVal = (regex) => {
                                                                        const m = text.match(regex);
                                                                        return m ? m[1].trim() : '-';
                                                                    };

                                                                    if (isJastip) {
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
                                                                
                                                                {/* Offer button for drivers if Anjem Request */}
                                                                {!isMine && !displayContent?.includes('Jasa Titip') && (
                                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                                        <button 
                                                                            onClick={() => {
                                                                                const m1 = msg.content?.match(/📍 \*Lokasi Jemput:\*\s*(.*)/);
                                                                                const m2 = msg.content?.match(/🏁 \*Lokasi Tujuan:\*\s*(.*)/);
                                                                                handleProposePrice(m1 ? m1[1].trim() : '', m2 ? m2[1].trim() : '');
                                                                            }}
                                                                            className="w-full px-3 py-2 bg-[#0a2540] text-white text-xs font-bold rounded shadow-sm hover:bg-[#1a3a5a] transition-colors text-center"
                                                                        >
                                                                            Ajukan Penawaran
                                                                        </button>
                                                                    </div>
                                                                )}
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

                            <div className="px-4 py-2 bg-[#f0f2f5] flex items-center gap-2 z-30">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleFileUpload(e, 'file')} />
                                <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />

                                <div className="flex items-center gap-1">
                                    <button title="Buat Penawaran" onClick={handleManualProposal} className="p-2 text-[#0a2540] hover:text-[#1a3a5a] transition-colors"><FileSignature size={22} /></button>
                                    <button onClick={() => imageInputRef.current.click()} className="p-2 text-[#667781] hover:text-[#111b21] transition-colors"><Image size={22} /></button>
                                    <button onClick={() => fileInputRef.current.click()} className="p-2 text-[#667781] hover:text-[#111b21] transition-colors"><Paperclip size={22} /></button>
                                </div>

                                <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-1 shadow-sm border border-gray-100">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(e)}
                                        className="w-full bg-transparent py-1.5 text-[15px] outline-none text-[#111b21] placeholder:text-[#667781]"
                                    />
                                </div>

                                <button onClick={handleSendMessage} disabled={!message.trim()} className={`p-2 rounded-full transition-all ${message.trim() ? 'text-[#00a884]' : 'text-[#667781]'}`}>
                                    <Send size={24} className={message.trim() ? 'fill-[#00a884]' : ''} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-32 h-32 bg-[#0a2540]/5 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-[#0a2540]/5">
                                <MessageCircle size={64} className="text-[#0a2540]" />
                            </div>
                            <h3 className="text-3xl font-light text-[#41525d] mb-4">Driver Web Chat</h3>
                            <p className="text-[#667781] text-[14px] max-w-sm mx-auto leading-relaxed font-medium">
                                Kelola komunikasi dengan pelanggan JMart secara real-time.<br/>
                                <span className="font-bold">Balas pesan dengan cepat untuk layanan terbaik.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Proposal Modal */}
            {showProposalModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-sm animate-in slide-in-from-bottom-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileSignature size={20} className="text-brand-green" />
                            Buat Penawaran
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Lokasi Jemput</label>
                                <input type="text" value={proposalData.jemput} onChange={e => setProposalData({ ...proposalData, jemput: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-green" placeholder="Contoh: Stasiun Baru" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Lokasi Tujuan</label>
                                <input type="text" value={proposalData.tujuan} onChange={e => setProposalData({ ...proposalData, tujuan: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-green" placeholder="Contoh: Pantai Boom" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Harga (Rp)</label>
                                <input type="number" value={proposalData.biaya} onChange={e => setProposalData({ ...proposalData, biaya: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-green" placeholder="15000" />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowProposalModal(false)} className="flex-1 py-2 rounded font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
                            <button onClick={submitProposal} disabled={!proposalData.jemput || !proposalData.tujuan || !proposalData.biaya} className="flex-1 py-2 rounded font-bold text-sm text-white bg-brand-green hover:bg-[#1a4030] disabled:opacity-50 transition-colors">Kirim</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
            `}} />
        </div>
    );
};

export default DriverChat;
