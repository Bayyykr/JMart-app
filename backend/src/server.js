const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Shared In-memory store for real-time driver locations
const driverStore = require('./utils/driverStore');

// Initialize store with mock drivers from Database
const initializeMockOnline = async () => {
    try {
        const db = require('./config/db');
        const [rows] = await db.query(`SELECT dp.*, u.name, u.profile_image_url as profile_image FROM driver_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.status = 'verified' LIMIT 15`);
        rows.forEach(d => {
            driverStore.setDriver(d.user_id, {
                userId: d.user_id,
                id: d.user_id,
                name: d.name,
                profile_image: d.profile_image,
                vehicle_plate: d.vehicle_plate,
                vehicle_model: d.vehicle_model,
                car: `${d.vehicle_model} - ${d.vehicle_plate}`,
                rating: d.rating || 5.0,
                trips: d.total_trips || 0,
                lat: d.latitude,
                lng: d.longitude,
                area: d.area || 'Jember',
                status: 'Online'
            });
        });
        console.log(`[BACKEND] Initialized ${rows.length} mock online drivers from DB (proper IDs)`);
    } catch (e) {
        console.error('Error init mock online drivers:', e);
    }
};
initializeMockOnline();

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
app.set('io', io);

// Socket logic
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Immediately send current online drivers to the new connection
    socket.emit('driver_update', driverStore.getAll());

    // Join room for chat
    socket.on('join_room', (data) => {
        // data can be a roomId string or an object { roomId, userId }
        if (typeof data === 'string') {
            socket.join(data);
            console.log(`User ${socket.id} joined room: ${data}`);
        } else if (data && data.roomId) {
            socket.join(data.roomId);
            if (data.userId) socket.join(`user_${data.userId}`);
            console.log(`User ${socket.id} joined room: ${data.roomId} and personal: user_${data.userId}`);
        }
    });

    // Join personal room only
    socket.on('join_personal', async (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined personal room`);
            
            // Emit initial total unread count
            try {
                const chatController = require('./controllers/chatController');
                const totalUnread = await chatController.getUserTotalUnread(userId);
                socket.emit('total_unread_update', { total: totalUnread });
            } catch (e) {
                console.error('Error in join_personal unread calculation:', e);
            }
        }
    });

    // Real-time Location Updates
    socket.on('driver_online', (data) => {
        // data: { userId, name, vehicle_plate, lat, lng, area }
        driverStore.setDriver(data.userId, { ...data, socketId: socket.id, status: 'Online' });
        io.emit('driver_update', driverStore.getAll());
        console.log(`Driver ${data.name} is now Online`);
    });

    socket.on('update_location', (data) => {
        // data: { userId, lat, lng, area }
        const current = driverStore.getDriver(data.userId);
        if (current) {
            driverStore.setDriver(data.userId, {
                lat: data.lat,
                lng: data.lng,
                area: data.area || current.area
            });
            // Broadcast location change to all users
            io.emit('location_changed', { userId: data.userId, lat: data.lat, lng: data.lng, area: data.area });
        }
    });

    socket.on('driver_offline', (userId) => {
        driverStore.removeDriver(userId);
        io.emit('driver_update', driverStore.getAll());
        console.log(`Driver ${userId} is now Offline`);
    });

    // Chat Messaging
    socket.on('send_message', async (data) => {
        console.log('[MSG] sender:', data.sender_id, '→ receiver:', data.receiver_id, 'room:', data.room);
        try {
            const db = require('./config/db');
            const chatController = require('./controllers/chatController');

            let senderId   = Number(data.sender_id);
            let receiverId = Number(data.receiver_id);
            const messageType = data.message_type || 'text';
            const fileUrl     = data.file_url || null;

            if (!senderId || isNaN(senderId)) {
                console.error('[MSG] Invalid senderId, skipping');
                return;
            }

            // If receiverId is missing or equals sender, look it up from room_chats
            if (!receiverId || isNaN(receiverId) || receiverId === senderId) {
                const incomingRoom = data.room;
                if (incomingRoom) {
                    const [roomRows] = await db.execute(
                        'SELECT user1_id, user2_id FROM room_chats WHERE id = ?',
                        [incomingRoom]
                    );
                    if (roomRows.length > 0) {
                        const r = roomRows[0];
                        receiverId = Number(r.user1_id) === senderId ? Number(r.user2_id) : Number(r.user1_id);
                        console.log(`[MSG] receiverId derived from room_chats: ${receiverId}`);
                    } else {
                        // Last resort: parse from room_id string
                        const match = incomingRoom.match(/^room_(\d+)_(\d+)$/);
                        if (match) {
                            const id1 = Number(match[1]);
                            const id2 = Number(match[2]);
                            receiverId = id1 === senderId ? id2 : id1;
                            console.log(`[MSG] receiverId derived from room_id string: ${receiverId}`);
                        }
                    }
                }
                if (!receiverId || receiverId === senderId) {
                    console.error('[MSG] Cannot determine receiver, skipping');
                    return;
                }
            }

            // Normalise room ID: room_{min}_{max}
            const minId  = Math.min(senderId, receiverId);
            const maxId  = Math.max(senderId, receiverId);
            const roomId = `room_${minId}_${maxId}`;

            // Save message with normalised room id
            const [result] = await db.execute(
                'INSERT INTO messages (sender_id, receiver_id, room_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)',
                [senderId, receiverId, roomId, data.content, messageType, fileUrl]
            );

            // Update room_chats: last_message + increment receiver's unread
            await chatController.updateRoomChat(roomId, senderId, receiverId, data.content, messageType);

            const savedMessage = {
                ...data,
                room: roomId,
                room_id: roomId,
                sender_id: senderId,
                receiver_id: receiverId,
                id: result.insertId,
                createdAt: new Date()
            };

            // 1. Broadcast message to chat room (for open chat windows)
            io.to(roomId).emit('receive_message', savedMessage);

            // 2. Push updated list item to receiver's personal room
            const receiverListItem = await chatController.getChatListItem(receiverId, roomId);
            if (receiverListItem) {
                io.to(`user_${receiverId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await chatController.getUserTotalUnread(receiverId);
                io.to(`user_${receiverId}`).emit('total_unread_update', { total: totalUnread });
            }

            // 3. Push updated list item to sender (unread always 0 for sender after sending)
            const senderListItem = await chatController.getChatListItem(senderId, roomId);
            if (senderListItem) {
                io.to(`user_${senderId}`).emit('chat_list_update', { ...senderListItem, unread: 0 });
            }

        } catch (error) {
            console.error('[MSG ERROR]', error);
        }
    });


    socket.on('disconnect', () => {
        // Driver stays online even if tab is closed, 
        // to comply with user request: "jangan pernah mengofflinekan driver walaupun tidak sedang dalam web"
        /*
        const removedUserId = driverStore.removeDriverBySocket(socket.id);
        if (removedUserId) {
            io.emit('driver_update', driverStore.getAll());
            console.log(`Driver ${removedUserId} disconnected`);
        }
        */
    });
});

// Enhanced Error Handling for Server Listen
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use.`);
        console.error(`[FIX] Please stop any other running instances of the server or use 'taskkill /F /IM node.exe' to clear it.\n`);
        process.exit(1);
    } else {
        throw err;
    }
});

server.listen(PORT, () => {
    console.log(`[BACKEND] Server & Socket.io running on port ${PORT}`);
});

// Graceful shutdown handlers
const shutdown = () => {
    console.log('\n[BACKEND] Shutting down gracefully...');
    server.close(() => {
        console.log('[BACKEND] Server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
