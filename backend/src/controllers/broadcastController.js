const db = require('../config/db');

exports.createBroadcast = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickup_location, destination_location, pickup_time, notes } = req.body;

        if (!pickup_location || !destination_location) {
            return res.status(400).json({ message: 'Pickup and destination are required' });
        }

        const [result] = await db.execute(
            'INSERT INTO broadcasts (user_id, pickup_location, destination_location, pickup_time, notes) VALUES (?, ?, ?, ?, ?)',
            [userId, pickup_location, destination_location, pickup_time, notes]
        );

        res.status(201).json({ 
            message: 'Broadcast created successfully', 
            broadcastId: result.insertId,
            success: true 
        });
    } catch (error) {
        console.error('Create Broadcast Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyBroadcasts = async (req, res) => {
    try {
        const userId = req.user.id;
        // Also look for older table broadcast_requests just in case, but prioritize broadcasts
        const [rows] = await db.query(`
            SELECT b.*, 
            (SELECT COUNT(*) FROM broadcast_offers WHERE broadcast_id = b.id) as offer_count
            FROM broadcasts b 
            WHERE b.user_id = ? 
            AND b.createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY b.createdAt DESC
        `, [userId]);
        
        // If empty, check if there's any in broadcast_requests that we should show or migrate
        if (rows.length === 0) {
            const [oldRows] = await db.query('SELECT id, user_id, pickup_location, destination_location, pickup_time, notes, status, createdAt FROM broadcast_requests WHERE user_id = ?', [userId]);
            if (oldRows.length > 0) {
                // Return them as a combined list or just the old ones
                return res.json(oldRows.map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    pickup_location: r.pickup_location,
                    destination_location: r.destination_location,
                    pickup_time: r.pickup_time,
                    notes: r.notes,
                    status: (r.status === 'Mencari Driver' ? 'pending' : (r.status === 'Selesai' ? 'applied' : 'pending')),
                    createdAt: r.createdAt,
                    offer_count: 0
                })));
            }
        }
        res.json(rows);
    } catch (error) {
        console.error('Get My Broadcasts Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAvailableBroadcasts = async (req, res) => {
    try {
        // Drivers see all pending broadcasts
        const driverId = req.user.id;
        // Joint with broadcast_offers to check if this driver already bid
        const [rows] = await db.query(`
            SELECT b.*, u.name as user_name,
            (SELECT COUNT(*) FROM broadcast_offers WHERE broadcast_id = b.id AND driver_id = ?) as already_bid
            FROM broadcasts b
            JOIN users u ON b.user_id = u.id
            WHERE b.status = 'pending'
            AND b.createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY b.createdAt DESC
        `, [driverId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.makeOffer = async (req, res) => {
    const chatController = require('./chatController');
    try {
        const driverId = req.user.id;
        const { broadcast_id, price } = req.body;

        if (!broadcast_id || !price) {
            return res.status(400).json({ message: 'Broadcast ID and price are required' });
        }

        // 0. Check if this driver already bid
        const [existingOffer] = await db.query(
            'SELECT id FROM broadcast_offers WHERE broadcast_id = ? AND driver_id = ?',
            [broadcast_id, driverId]
        );
        if (existingOffer.length > 0) {
            return res.status(400).json({ message: 'Anda sudah memberikan penawaran untuk postingan ini.' });
        }

        // 1. Get broadcast details
        const [bc] = await db.query('SELECT user_id, pickup_location, destination_location, status FROM broadcasts WHERE id = ?', [broadcast_id]);
        if (bc.length === 0 || bc[0].status !== 'pending') {
            return res.status(400).json({ message: 'Broadcast is no longer available' });
        }

        const userId = bc[0].user_id;
        const roomId = chatController.makeRoomId(driverId, userId);

        // 1. Create offer in DB for tracking
        const [offerResult] = await db.execute(
            'INSERT INTO broadcast_offers (broadcast_id, driver_id, price) VALUES (?, ?, ?)',
            [broadcast_id, driverId, price]
        );
        const offerId = offerResult.insertId;

        // 2. Format message content with metadata
        const offerContent = JSON.stringify({
            broadcast_id: broadcast_id,
            offer_id: offerId,
            price: price,
            pickup: bc[0].pickup_location,
            destination: bc[0].destination_location,
            text: `Halo, saya menawarkan harga Rp ${price.toLocaleString('id-ID')} untuk permintaan antar-jemput Anda.`
        });

        // 3. Send specialized message
        const [result] = await db.execute(
            'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
            [roomId, driverId, userId, offerContent, 'broadcast_offer']
        );

        // 4. Update room chat status
        await chatController.updateRoomChat(roomId, driverId, userId, `Penawaran Harga: Rp ${price.toLocaleString('id-ID')}`, 'broadcast_offer');

        // 5. Emit via socket
        const io = req.app.get('io');
        if (io) {
            const savedMessage = {
                id: result.insertId,
                room: roomId,
                room_id: roomId,
                sender_id: driverId,
                receiver_id: userId,
                content: offerContent,
                message_type: 'broadcast_offer',
                createdAt: new Date()
            };
            io.to(roomId).emit('receive_message', savedMessage);
            
            const receiverListItem = await chatController.getChatListItem(userId, roomId);
            if (receiverListItem) {
                io.to(`user_${userId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await chatController.getUserTotalUnread(userId);
                io.to(`user_${userId}`).emit('total_unread_update', { total: totalUnread });
            }

            // Notify about the new offer globally for broadcast list update
            io.to(`user_${userId}`).emit('new_broadcast_offer', {
                broadcast_id,
                driver_id: driverId,
                price
            });
        }

        res.status(201).json({ message: 'Offer sent successfully via chat', success: true });
    } catch (error) {
        console.error('Make Offer Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getBroadcastOffers = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT o.*, u.name as driver_name, u.profile_image_url
            FROM broadcast_offers o
            JOIN users u ON o.driver_id = u.id
            WHERE o.broadcast_id = ?
            ORDER BY o.createdAt DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.acceptOffer = async (req, res) => {
    const chatController = require('./chatController');
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { offer_id, broadcast_id, driver_id, message_id } = req.body;
        const userId = req.user.id;

        let offer;
        if (offer_id) {
            const [offerRows] = await connection.query('SELECT * FROM broadcast_offers WHERE id = ?', [offer_id]);
            if (offerRows.length > 0) offer = offerRows[0];
        } else if (broadcast_id && driver_id) {
            const [offerRows] = await connection.query('SELECT * FROM broadcast_offers WHERE broadcast_id = ? AND driver_id = ? AND status = "pending"', [broadcast_id, driver_id]);
            if (offerRows.length > 0) offer = offerRows[0];
        }

        if (!offer) {
            await connection.rollback();
            return res.status(404).json({ message: 'Offer not found or already processed' });
        }

        const broadcastId = offer.broadcast_id;
        const driverId = offer.driver_id;
        const price = offer.price;

        // Verify ownership
        const [bcRows] = await connection.query('SELECT * FROM broadcasts WHERE id = ?', [broadcastId]);
        if (bcRows.length === 0 || bcRows[0].user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Unauthorized or broadcast not found' });
        }

        // 1. Update accepted offer
        await connection.execute('UPDATE broadcast_offers SET status = "accepted" WHERE id = ?', [offer.id]);

        // 2. Reject other offers
        await connection.execute('UPDATE broadcast_offers SET status = "rejected" WHERE broadcast_id = ? AND id != ?', [broadcastId, offer.id]);

        // 3. Update broadcast status
        await connection.execute('UPDATE broadcasts SET status = "applied" WHERE id = ?', [broadcastId]);

        // 4. Create Order (IMPORTANT)
        const orderId = `ORD-BC-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];
        const notes = `Broadcast: ${bcRows[0].pickup_location} -> ${bcRows[0].destination_location}`;

        await connection.execute(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes, total_price, driver_id) VALUES (?, ?, ?, "Diproses", ?, ?, ?, ?)',
            [orderId, userId, 'Antar Jemput', orderDate, notes, price, driverId]
        );

        // 5. Update Driver Revenue (Money adding)
        await connection.execute('UPDATE driver_profiles SET revenue = revenue + ? WHERE user_id = ?', [price, driverId]);

        await connection.commit();

        // 6. Notify Driver via Chat (System Message)
        const roomId = chatController.makeRoomId(userId, driverId);
        const sysMsg = `Hore! Penawaran Anda sebesar Rp ${price.toLocaleString('id-ID')} telah diterima. Silakan cek menu Pesanan Saya.`;
        
        const [msgResult] = await db.execute(
            'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
            [roomId, userId, driverId, sysMsg, 'text']
        );
        await chatController.updateRoomChat(roomId, userId, driverId, sysMsg, 'text');

        // Update the original offer message content to include "status":"accepted"
        if (message_id) {
            const [msgRows] = await connection.query('SELECT content FROM messages WHERE id = ?', [message_id]);
            if (msgRows.length > 0) {
                let parsedContent = JSON.parse(msgRows[0].content || '{}');
                parsedContent.status = 'accepted';
                await connection.execute('UPDATE messages SET content = ? WHERE id = ?', [JSON.stringify(parsedContent), message_id]);
                
                const io = req.app.get('io');
                if (io) {
                    io.to(roomId).emit('update_message', { id: message_id, content: JSON.stringify(parsedContent) });
                }
            }
        }

        // 7. Emit Sockets
        const io = req.app.get('io');
        if (io) {
            // New message in chat
            io.to(roomId).emit('receive_message', {
                id: msgResult.insertId,
                room: roomId,
                sender_id: userId,
                receiver_id: driverId,
                content: sysMsg,
                message_type: 'text',
                createdAt: new Date()
            });
            
            // Global notification for driver
            io.to(`user_${driverId}`).emit('order_created', { order_id: orderId, message: 'Pesanan baru dari broadcast!' });

            // SYNC CHAT LISTS (Real-time sidebar update)
            const receiverListItem = await chatController.getChatListItem(driverId, roomId);
            if (receiverListItem) {
                io.to(`user_${driverId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await chatController.getUserTotalUnread(driverId);
                io.to(`user_${driverId}`).emit('total_unread_update', { total: totalUnread });
            }
            const senderListItem = await chatController.getChatListItem(userId, roomId);
            if (senderListItem) {
                io.to(`user_${userId}`).emit('chat_list_update', { ...senderListItem, unread: 0 });
            }
        }

        res.json({ message: 'Penawaran diterima! Saldo driver bertambah.', success: true });
    } catch (error) {
        if (connection && connection.rollback) await connection.rollback();
        console.error('Accept Offer Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
};

exports.rejectOffer = async (req, res) => {
    const chatController = require('./chatController');
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { offer_id, broadcast_id, driver_id, message_id } = req.body;
        const userId = req.user.id;

        let offer;
        if (offer_id) {
            const [offerRows] = await connection.query('SELECT * FROM broadcast_offers WHERE id = ?', [offer_id]);
            if (offerRows.length > 0) offer = offerRows[0];
        } else if (broadcast_id && driver_id) {
            const [offerRows] = await connection.query('SELECT * FROM broadcast_offers WHERE broadcast_id = ? AND driver_id = ? AND status = "pending"', [broadcast_id, driver_id]);
            if (offerRows.length > 0) offer = offerRows[0];
        }

        if (!offer) {
            await connection.rollback();
            return res.status(404).json({ message: 'Offer not found or already processed' });
        }

        const broadcastId = offer.broadcast_id;
        const driverId = offer.driver_id;
        const price = offer.price;

        const [bcRows] = await connection.query('SELECT * FROM broadcasts WHERE id = ?', [broadcastId]);
        if (bcRows.length === 0 || bcRows[0].user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // 1. Update rejected offer
        await connection.execute('UPDATE broadcast_offers SET status = "rejected" WHERE id = ?', [offer.id]);
        await connection.commit();

        // 2. Notify Driver via Chat
        const roomId = chatController.makeRoomId(userId, driverId);
        const sysMsg = `Maaf, penawaran Anda sebesar Rp ${price.toLocaleString('id-ID')} telah ditolak.`;
        
        const [msgResult] = await db.execute(
            'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
            [roomId, userId, driverId, sysMsg, 'text']
        );
        await chatController.updateRoomChat(roomId, userId, driverId, sysMsg, 'text');

        // Update the original offer message content to include "status":"rejected"
        if (message_id) {
            const [msgRows] = await connection.query('SELECT content FROM messages WHERE id = ?', [message_id]);
            if (msgRows.length > 0) {
                let parsedContent = JSON.parse(msgRows[0].content || '{}');
                parsedContent.status = 'rejected';
                await connection.execute('UPDATE messages SET content = ? WHERE id = ?', [JSON.stringify(parsedContent), message_id]);
                
                const io = req.app.get('io');
                if (io) {
                    io.to(roomId).emit('update_message', { id: message_id, content: JSON.stringify(parsedContent) });
                }
            }
        }

        // 3. Emit Sockets
        const io = req.app.get('io');
        if (io) {
            io.to(roomId).emit('receive_message', {
                id: msgResult.insertId,
                room: roomId,
                sender_id: userId,
                receiver_id: driverId,
                content: sysMsg,
                message_type: 'text',
                createdAt: new Date()
            });

            const receiverListItem = await chatController.getChatListItem(driverId, roomId);
            if (receiverListItem) {
                io.to(`user_${driverId}`).emit('chat_list_update', receiverListItem);
                const totalUnread = await chatController.getUserTotalUnread(driverId);
                io.to(`user_${driverId}`).emit('total_unread_update', { total: totalUnread });
            }
            const senderListItem = await chatController.getChatListItem(userId, roomId);
            if (senderListItem) {
                io.to(`user_${userId}`).emit('chat_list_update', { ...senderListItem, unread: 0 });
            }
        }

        res.json({ message: 'Penawaran ditolak.', success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Reject Offer Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
};
