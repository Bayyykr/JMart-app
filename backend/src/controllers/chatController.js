const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// HELPER: Normalise a room ID 
// ─────────────────────────────────────────────────────────────────
const makeRoomId = (idA, idB) => {
    const a = Number(idA);
    const b = Number(idB);
    return `room_${Math.min(a, b)}_${Math.max(a, b)}`;
};
exports.makeRoomId = makeRoomId;

// ─────────────────────────────────────────────────────────────────
// GET CHAT HISTORY
// ─────────────────────────────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const [rows] = await db.execute(
            'SELECT * FROM messages WHERE room_id = ? ORDER BY createdAt ASC',
            [roomId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// INTERNAL: Update room_chats
// ─────────────────────────────────────────────────────────────────
const updateRoomChat = async (roomId, senderId, receiverId, content, messageType) => {
    const sId = Number(senderId);
    const rId = Number(receiverId);
    const minId = Math.min(sId, rId);
    const maxId = Math.max(sId, rId);

    const receiverIsUser1 = rId === minId;
    const senderIsUser1 = sId === minId;
    
    // receiver will get +1 unread, sender will get 0 unread
    const unreadColReceiver = receiverIsUser1 ? 'unread_user1' : 'unread_user2';
    const unreadColSender   = senderIsUser1   ? 'unread_user1' : 'unread_user2';

    await db.execute(`
        INSERT INTO room_chats 
            (id, user1_id, user2_id, last_message, last_message_type, last_message_at, last_sender_id, unread_user1, unread_user2)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            last_message      = VALUES(last_message),
            last_message_type = VALUES(last_message_type),
            last_message_at   = NOW(),
            last_sender_id    = VALUES(last_sender_id),
            ${unreadColReceiver} = ${unreadColReceiver} + 1,
            ${unreadColSender}   = 0
    `, [roomId, minId, maxId, content, messageType || 'text', sId, receiverIsUser1?1:0, receiverIsUser1?0:1]);
};
exports.updateRoomChat = updateRoomChat;

// ─────────────────────────────────────────────────────────────────
// GET CHAT LIST
// ─────────────────────────────────────────────────────────────────
exports.getChatList = async (req, res) => {
    try {
        const uid = Number(req.user.id);
        const [rows] = await db.execute(`
            SELECT rc.*,
                   u1.name as u1_name, u1.profile_image_url as u1_image,
                   u2.name as u2_name, u2.profile_image_url as u2_image
            FROM room_chats rc
            JOIN users u1 ON rc.user1_id = u1.id
            JOIN users u2 ON rc.user2_id = u2.id
            WHERE rc.user1_id = ? OR rc.user2_id = ?
            ORDER BY rc.last_message_at DESC
        `, [uid, uid]);

        res.json(rows.map(r => ({
            room_id: r.id,
            user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image, unread: Number(r.unread_user1) },
            user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image, unread: Number(r.unread_user2) },
            last_message: r.last_message || '',
            last_message_type: r.last_message_type || 'text',
            last_message_at: r.last_message_at,
            last_sender_id: r.last_sender_id ? Number(r.last_sender_id) : null
        })));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET CHAT ITEM (FOR SOCKET)
// ─────────────────────────────────────────────────────────────────
exports.getChatListItem = async (userId, roomId) => {
    try {
        const [rows] = await db.execute(`
            SELECT rc.*,
                   u1.name as u1_name, u1.profile_image_url as u1_image,
                   u2.name as u2_name, u2.profile_image_url as u2_image
            FROM room_chats rc
            JOIN users u1 ON rc.user1_id = u1.id
            JOIN users u2 ON rc.user2_id = u2.id
            WHERE rc.id = ?
        `, [roomId]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            room_id: r.id,
            user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image, unread: Number(r.unread_user1) },
            user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image, unread: Number(r.unread_user2) },
            last_message: r.last_message,
            last_message_type: r.last_message_type,
            last_message_at: r.last_message_at,
            last_sender_id: r.last_sender_id ? Number(r.last_sender_id) : null
        };
    } catch (e) { return null; }
};

// ─────────────────────────────────────────────────────────────────
// GET ROOM DETAILS
// ─────────────────────────────────────────────────────────────────
exports.getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;
        const [rows] = await db.execute(`
            SELECT rc.*,
                   u1.name as u1_name, u1.profile_image_url as u1_image,
                   u2.name as u2_name, u2.profile_image_url as u2_image
            FROM room_chats rc
            JOIN users u1 ON rc.user1_id = u1.id
            JOIN users u2 ON rc.user2_id = u2.id
            WHERE rc.id = ?
        `, [roomId]);

        if (rows.length > 0) {
            const r = rows[0];
            return res.json({
                user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image },
                user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image }
            });
        }
        res.status(404).json({ message: 'Room not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
    try {
        const { room_id, receiver_id, content, message_type } = req.body;
        const sId = Number(req.user.id);
        const rId = Number(receiver_id);
        if (!room_id || !content) return res.status(400).json({ message: 'room_id and content are required' });
        if (!rId || rId === sId) return res.status(400).json({ message: 'Invalid receiver_id' });

        const normalRoomId = makeRoomId(sId, rId);
        const [result] = await db.execute('INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)', [normalRoomId, sId, rId, content, message_type || 'text']);
        await updateRoomChat(normalRoomId, sId, rId, content, message_type || 'text');

        const savedMessage = { 
            id: result.insertId, 
            room: normalRoomId,
            room_id: normalRoomId, 
            sender_id: sId, 
            receiver_id: rId, 
            content, 
            message_type: message_type || 'text', 
            createdAt: new Date() 
        };

        const io = req.app.get('io');
        if (io) {
            io.to(normalRoomId).emit('receive_message', savedMessage);
            const receiverListItem = await exports.getChatListItem(rId, normalRoomId);
            if (receiverListItem) {
                io.to(`user_${rId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await exports.getUserTotalUnread(rId);
                io.to(`user_${rId}`).emit('total_unread_update', { total: totalUnread });
            }
            const senderListItem = await exports.getChatListItem(sId, normalRoomId);
            if (senderListItem) {
                io.to(`user_${sId}`).emit('chat_list_update', { ...senderListItem, unread: 0 });
            }
        }

        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// MARK AS READ
// ─────────────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
    try {
        const { roomId } = req.params;
        const uid = Number(req.user.id);

        await db.execute('UPDATE messages SET is_read = 1 WHERE room_id = ? AND receiver_id = ? AND is_read = 0', [roomId, uid]);
        const [roomRows] = await db.execute('SELECT user1_id, user2_id FROM room_chats WHERE id = ?', [roomId]);
        if (roomRows.length > 0) {
            const room = roomRows[0];
            const isU1 = (Number(room.user1_id) === uid);
            const col = isU1 ? 'unread_user1' : 'unread_user2';
            await db.execute(`UPDATE room_chats SET ${col} = 0 WHERE id = ?`, [roomId]);
        }

        const io = req.app.get('io');
        if (io) {
            const totalUnread = await exports.getUserTotalUnread(uid);
            io.to(`user_${uid}`).emit('total_unread_update', { total: totalUnread });
            const listItem = await exports.getChatListItem(uid, roomId);
            if (listItem) io.to(`user_${uid}`).emit('chat_list_update', listItem);
        }
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserTotalUnread = async (userId) => {
    try {
        const uid = Number(userId);
        const [rows] = await db.execute(`
            SELECT
                COALESCE(SUM(CASE WHEN user1_id = ? THEN unread_user1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN user2_id = ? THEN unread_user2 ELSE 0 END), 0) AS total
            FROM room_chats WHERE user1_id = ? OR user2_id = ?
        `, [uid, uid, uid, uid]);
        return Number(rows[0]?.total) || 0;
    } catch (e) { return 0; }
};

exports.getTotalUnreadApi = async (req, res) => {
    try {
        const total = await exports.getUserTotalUnread(req.user.id);
        res.json({ total });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.createOrGetRoom = async (req, res) => {
    try {
        const { partnerId } = req.body;
        const sId = Number(req.user.id);
        const pId = Number(partnerId);
        if (!pId || pId === sId) return res.status(400).json({ message: 'Invalid partnerId' });
        const roomId = makeRoomId(sId, pId);
        const minId = Math.min(sId, pId);
        const maxId = Math.max(sId, pId);
        await db.execute('INSERT INTO room_chats (id, user1_id, user2_id, unread_user1, unread_user2) VALUES (?, ?, ?, 0, 0) ON DUPLICATE KEY UPDATE id = id', [roomId, minId, maxId]);
        const [rows] = await db.execute(`
            SELECT rc.*, u1.name as u1_name, u1.profile_image_url as u1_image, u2.name as u2_name, u2.profile_image_url as u2_image
            FROM room_chats rc JOIN users u1 ON rc.user1_id = u1.id JOIN users u2 ON rc.user2_id = u2.id WHERE rc.id = ?
        `, [roomId]);
        const r = rows[0];
        res.json({
            room_id: r.id,
            user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image },
            user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image }
        });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.clearChat = async (req, res) => {
    try {
        const { roomId } = req.params;
        await db.execute('DELETE FROM messages WHERE room_id = ?', [roomId]);
        await db.execute('UPDATE room_chats SET last_message = NULL, last_message_at = NOW(), unread_user1 = 0, unread_user2 = 0 WHERE id = ?', [roomId]);
        res.json({ message: 'Chat cleared successfully' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const file_url = `/uploads/${req.file.filename}`;
        const { room_id, sender_id, receiver_id, content } = req.body;
        const sId = Number(sender_id);
        const rId = Number(receiver_id);
        const message_type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
        const msgContent = content || (message_type === 'image' ? 'Mengirim gambar' : 'Mengirim file');
        const normalRoomId = makeRoomId(sId, rId);

        // 1. Save to DB
        const [result] = await db.execute('INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)', [normalRoomId, sId, rId, msgContent, message_type, file_url]);
        await updateRoomChat(normalRoomId, sId, rId, msgContent, message_type);

        const savedMessage = {
            id: result.insertId,
            room: normalRoomId,
            room_id: normalRoomId,
            sender_id: sId,
            receiver_id: rId,
            content: msgContent,
            message_type: message_type,
            file_url: file_url,
            createdAt: new Date()
        };

        // 2. Emit Socket Events immediately from backend to prevent frontend double-emit
        const io = req.app.get('io');
        if (io) {
            // Emit to room members
            io.to(normalRoomId).emit('receive_message', savedMessage);
            
            // Sync chat lists
            const receiverListItem = await exports.getChatListItem(rId, normalRoomId);
            if (receiverListItem) {
                io.to(`user_${rId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await exports.getUserTotalUnread(rId);
                io.to(`user_${rId}`).emit('total_unread_update', { total: totalUnread });
            }
            const senderListItem = await exports.getChatListItem(sId, normalRoomId);
            if (senderListItem) {
                io.to(`user_${sId}`).emit('chat_list_update', { ...senderListItem, unread: 0 });
            }
        }

        res.status(201).json(savedMessage);
    } catch (error) { 
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error' }); 
    }
};

// ─────────────────────────────────────────────────────────────────
// ACCEPT PROPOSAL (Create Order & Update Revenue)
// ─────────────────────────────────────────────────────────────────
exports.acceptProposal = async (req, res) => {
    try {
        const { driver_id, room_id, message_id, biaya, jemput, tujuan } = req.body;
        const sId = Number(req.user.id);
        const rId = Number(driver_id);
        const price = Number(biaya);

        // 1. Create Order
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];
        const notes = `Dari: ${jemput}, Ke: ${tujuan}`;

        await db.execute(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes, total_price, driver_id) VALUES (?, ?, ?, "Diproses", ?, ?, ?, ?)',
            [orderId, sId, 'Antar Jemput', orderDate, notes, price, rId]
        );

        // 2. Update Driver Revenue
        await db.execute('UPDATE driver_profiles SET revenue = revenue + ? WHERE user_id = ?', [price, rId]);

        // 3. Update Message Status
        await db.execute("UPDATE messages SET content = REPLACE(content, '[STATUS:PENDING]', '[STATUS:ACCEPTED]') WHERE id = ?", [message_id]);
        await db.execute("UPDATE room_chats SET last_message = REPLACE(last_message, '[STATUS:PENDING]', '[STATUS:ACCEPTED]') WHERE id = ?", [room_id]);

        const [msgRows] = await db.execute('SELECT * FROM messages WHERE id = ?', [message_id]);
        if (msgRows.length > 0) {
            const io = req.app.get('io');
            if (io) io.to(room_id).emit('update_message', msgRows[0]);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Accept Proposal Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.rejectProposal = async (req, res) => {
    try {
        const { room_id, message_id } = req.body;

        // Update Message Status
        await db.execute("UPDATE messages SET content = REPLACE(content, '[STATUS:PENDING]', '[STATUS:REJECTED]') WHERE id = ?", [message_id]);
        await db.execute("UPDATE room_chats SET last_message = REPLACE(last_message, '[STATUS:PENDING]', '[STATUS:REJECTED]') WHERE id = ?", [room_id]);

        const [msgRows] = await db.execute('SELECT * FROM messages WHERE id = ?', [message_id]);
        if (msgRows.length > 0) {
            const io = req.app.get('io');
            if (io) io.to(room_id).emit('update_message', msgRows[0]);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Reject Proposal Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
