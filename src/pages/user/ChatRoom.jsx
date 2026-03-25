import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Send, MoreVertical, Image, Paperclip, CheckCheck, Trash2, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const socket = io('http://localhost:5000');

const ChatRoom = () => {
    const { id } = useParams(); // e.g. "driver-5" or room UUID
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [partnerName, setPartnerName] = useState('Driver / Seller');
    const [partnerImage, setPartnerImage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const partnerIdFromId = id.includes('-') && !isNaN(id.split('-')[1]) ? id.split('-')[1] : null;
    const [partnerId, setPartnerId] = useState(partnerIdFromId);

    useEffect(() => {
        const state = routerLocation.state;
        if (state && state.partnerName) {
            setPartnerName(state.partnerName);
            setPartnerImage(state.partnerImage);
            setPartnerId(state.partnerId);
        } else {
            // Fetch partner details from backend
            const fetchDetails = async () => {
                try {
                    const res = await api.get(`/chat/details/${id}`);
                    setPartnerName(res.data.partnerName);
                    setPartnerImage(res.data.partnerImage);
                    setPartnerId(res.data.partnerId);
                } catch (err) {
                    console.error('Fetch Details Error:', err);
                }
            };
            fetchDetails();
        }

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${id}`);
                const history = res.data.map(m => ({
                    ...m,
                    room: m.room_id,
                    time: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    isMine: String(m.sender_id) === String(user?.id)
                }));
                setMessages(history);
            } catch (err) {
                console.error('Fetch History Error:', err);
            }
        };

        if (user) fetchHistory();

        socket.connect();
        socket.emit('join_room', id);

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onReceiveMessage = (data) => {
            // If message is from partner and we don't have their name, refresh details
            if (String(data.sender_id) !== String(user?.id)) {
                // Could refresh details here if needed
            }
            setMessages((prev) => [...prev, {
                ...data,
                isMine: String(data.sender_id) === String(user?.id)
            }]);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('receive_message', onReceiveMessage);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('receive_message', onReceiveMessage);
            socket.disconnect();
        };
    }, [id, routerLocation.state, user]);

    const getTime = () => {
        return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const handleSendMessage = (e, type = 'text', fileData = null) => {
        if (e) e.preventDefault();
        // Extract partnerId from state or from the room ID (e.g., "driver-6" → 6)
        const resolvedPartnerId = partnerId || (id.includes('-') ? id.split('-').pop() : null);
        if ((!newMessage.trim() && !fileData) || !user || !resolvedPartnerId) return;

        const messageData = {
            room: id,
            sender_id: user.id.toString(),
            receiver_id: resolvedPartnerId.toString(),
            content: newMessage,
            message_type: type,
            file_url: fileData?.file_url || null,
            time: getTime(),
            isMine: true
        };

        socket.emit('send_message', messageData);
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const resolvedPartnerId = partnerId || (id.includes('-') ? id.split('-').pop() : null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('room_id', id);
        formData.append('sender_id', user.id);
        formData.append('receiver_id', resolvedPartnerId);

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const messageData = {
                room: id,
                sender_id: user.id.toString(),
                receiver_id: partnerId,
                content: res.data.content,
                message_type: res.data.message_type,
                file_url: res.data.file_url,
                time: getTime(),
                isMine: true
            };

            socket.emit('send_message', messageData);
            setMessages(prev => [...prev, messageData]);
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Gagal mengunggah file');
        }
    };

    const handleClearChat = async () => {
        if (!window.confirm('Hapus semua pesan di obrolan ini?')) return;
        try {
            await api.delete(`/chat/clear/${id}`);
            setMessages([]);
            setShowMenu(false);
        } catch (err) {
            console.error('Clear Chat Error:', err);
        }
    };

    const handleAcceptOrder = () => {
        const acceptMessage = `✅ *PESANAN DITERIMA*\n\nDriver ${user.name} telah menyetujui pesanan Anda. Silakan tunggu, driver sedang menuju ke lokasi.`;
        
        const messageData = {
            room: id,
            sender_id: user.id.toString(),
            receiver_id: partnerId,
            content: acceptMessage,
            message_type: 'text',
            time: getTime(),
            isMine: true
        };

        socket.emit('send_message', messageData);
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex h-[calc(100vh-80px)] bg-gray-50 p-4 lg:p-6 pb-20 lg:pb-6 font-primary">
            <div className="flex flex-col flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden max-w-5xl mx-auto w-full relative">

                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {partnerImage ? (
                                    <img
                                        src={partnerImage.startsWith('http') ? partnerImage : `http://localhost:5000${partnerImage}`}
                                        alt={partnerName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-gray-600 text-lg shadow-sm border-2 border-gray-200" style={{display: partnerImage ? 'none' : 'flex'}}>
                                    {(partnerName || 'D').charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div>
                                <h2 className="font-bold text-brand-dark-blue lg:text-lg">{partnerName || 'Driver / Seller'}</h2>
                                <p className="text-xs font-semibold text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    {isConnected ? 'Online' : 'Menghubungkan...'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30">
                                <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                    <Trash2 size={18} />
                                    Hapus Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfaf8]">
                    <div className="flex justify-center my-6">
                        <span className="bg-gray-200/50 text-gray-500 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                            Hari Ini
                        </span>
                    </div>

                    {messages.map((msg, idx) => {
                        const isMine = msg.isMine;
                        const isOrder = msg.content?.includes('*Lokasi Jemput:*') || msg.content?.includes('🚩 *PESANAN BARU*');
                        
                        return (
                            <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
                                <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm font-medium transition-all ${isMine
                                        ? 'bg-[#1e4d3a] text-white rounded-br-none'
                                        : isOrder ? 'bg-white border-2 border-brand-green/30 text-gray-800 rounded-bl-none shadow-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    
                                    {isOrder ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 border-b border-brand-green/10 pb-2 mb-2">
                                                <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green">
                                                    <Paperclip size={16} />
                                                </div>
                                                <span className="font-bold text-brand-green uppercase text-[11px] tracking-wider">Detail Pesanan</span>
                                            </div>
                                            <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>
                                            
                                            {!isMine && user?.role === 'driver' && !msg.content?.includes('PESANAN DITERIMA') && (
                                                <button 
                                                    onClick={handleAcceptOrder}
                                                    className="w-full mt-2 py-3 bg-brand-green hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-green/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCheck size={16} />
                                                    Terima Pesanan Ini
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {msg.message_type === 'image' ? (
                                                <div className="space-y-2">
                                                    <img src={`http://localhost:5000${msg.file_url}`} alt="Chat Attachment" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(`http://localhost:5000${msg.file_url}`)} />
                                                    {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                                                </div>
                                            ) : msg.message_type === 'file' ? (
                                                <a href={`http://localhost:5000${msg.file_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-green shadow-sm">
                                                        <Paperclip size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate text-gray-800">File Attachment</p>
                                                        <p className="text-[10px] text-gray-400 uppercase">Klik untuk buka</p>
                                                    </div>
                                                </a>
                                            ) : (
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            )}
                                        </>
                                    )}

                                    <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMine ? 'text-green-200' : 'text-gray-400'}`}>
                                        <span className="text-[10px] font-bold">{msg.time || getTime()}</span>
                                        {isMine && <CheckCheck size={14} className="text-green-300" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 z-20">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                    
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <button type="button" onClick={() => imageInputRef.current.click()} className="p-2.5 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors hidden sm:block">
                        <Image size={20} />
                    </button>

                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green/30 transition-all">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan..."
                            className="w-full bg-transparent px-5 py-3.5 text-sm font-medium outline-none text-gray-800 placeholder:text-gray-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-brand-green disabled:bg-gray-200 text-white disabled:text-gray-400 p-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 disabled:shadow-none disabled:active:scale-100 ml-1"
                    >
                        <Send size={18} className="translate-x-0.5" />
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ChatRoom;
