import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import io from 'socket.io-client';
import { MessageCircle, Send, ArrowLeft, MoreVertical, Search, Phone, Paperclip, Image, CheckCheck } from 'lucide-react';

const socket = io('http://localhost:5000');

const MerchantChat = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([
        { id: 'room-m1', name: 'User Satu', lastMsg: 'Apakah produk ini ready?', time: '14:20', active: true, unread: 2 },
        { id: 'room-m2', name: 'Lisa', lastMsg: 'Baik, terima kasih', time: 'Kemarin', active: false, unread: 0 },
    ]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (activeChat) {
            socket.emit('join_room', activeChat.id);
        }

        const handleReceiveMessage = (data) => {
            if (data.room === activeChat?.id) {
                setMessages((prev) => [...prev, data]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (message.trim() && activeChat) {
            const messageData = {
                room: activeChat.id,
                author: user?.name || 'Seller',
                message: message,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                isMine: true
            };

            await socket.emit('send_message', messageData);
            setMessages((prev) => [...prev, messageData]);
            setMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] font-primary p-4 lg:p-8 pt-0">
            {!activeChat && (
                <div className="mb-6 hidden md:block">
                    <h1 className="text-3xl font-bold text-brand-dark-blue flex items-center gap-3">
                        <MessageCircle className="text-brand-green" size={32} />
                        Pesan Pembeli
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Balas pertanyaan pelanggan dan kelola pesanan Anda.</p>
                </div>
            )}

            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex overflow-hidden">
                {/* Sidebar List */}
                <div className={`w-full md:w-96 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 lg:p-8 bg-gray-50/50 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari obrolan..."
                                className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-green/30 outline-none transition-all placeholder:text-gray-400 text-[15px] font-medium text-gray-800 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center font-bold text-xl">
                                        {chat.name.charAt(0).toUpperCase()}
                                    </div>
                                    {chat.unread > 0 && (
                                        <span className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-red-500 border-[3px] border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-gray-800 text-base truncate">{chat.name}</h3>
                                        <span className="text-xs font-bold text-gray-400">
                                            {chat.time}
                                        </span>
                                    </div>
                                    <p className="text-[13px] truncate font-medium text-gray-500">
                                        {chat.lastMsg}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-[#fbfaf8] ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors">
                                        <ArrowLeft size={24} />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-lg">
                                                {activeChat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-brand-dark-blue lg:text-lg">{activeChat.name}</h2>
                                            <p className="text-xs font-semibold text-green-500 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                Online
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 text-brand-green hover:bg-brand-green/10 rounded-full transition-colors">
                                        <Phone size={20} />
                                    </button>
                                    <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfaf8]">
                                {messages.map((msg, idx) => {
                                    const isMine = msg.isMine || msg.author === user?.name;
                                    return (
                                        <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
                                            <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm font-medium ${isMine
                                                ? 'bg-brand-green text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                }`}>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMine ? 'text-green-200' : 'text-gray-400'}`}>
                                                    <span className="text-[10px] font-bold">{msg.time}</span>
                                                    {isMine && <CheckCheck size={14} className="text-green-300" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                                <button type="button" className="p-2.5 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors">
                                    <Paperclip size={20} />
                                </button>
                                <button type="button" className="p-2.5 text-gray-400 hover:text-brand-dark-blue hover:bg-gray-50 rounded-full transition-colors hidden sm:block">
                                    <Image size={20} />
                                </button>

                                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green/30 transition-all">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Ketik balasan..."
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        className="w-full bg-transparent px-5 py-3.5 text-sm font-medium outline-none text-gray-800 placeholder:text-gray-400"
                                    />
                                </div>

                                <button
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    className="bg-brand-green disabled:bg-gray-200 text-white disabled:text-gray-400 p-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 disabled:shadow-none disabled:active:scale-100 ml-1"
                                >
                                    <Send size={18} className="translate-x-0.5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-12">
                            <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageCircle size={48} className="text-brand-green/50" />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-dark-blue mb-2">Pilih Pesan</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">Pilih salah satu obrolan untuk mulai membalas pesan dari pelanggan Anda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MerchantChat;
