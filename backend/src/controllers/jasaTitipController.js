const db = require('../config/db');

// --- USER ENDPOINTS ---

exports.getJastips = async (req, res) => {
    try {
        // Get open jastips joined with driver info from driver_profiles and users
        const [rows] = await db.query(`
            SELECT 
                j.id,
                j.driver_id,
                j.store_name as storeName, 
                j.departure_time as departureTime,
                j.close_order_time as closeOrderTime,
                j.available_slots as availableSlots,
                j.fee,
                j.status,
                u.name as driverName,
                COALESCE(NULLIF(u.profile_image_url, ''), CONCAT('https://i.pravatar.cc/150?u=', u.id)) as driverPhoto,
                dp.rating, 
                dp.total_trips as trips
            FROM jastips j
            JOIN users u ON j.driver_id = u.id
            LEFT JOIN driver_profiles dp ON u.id = dp.user_id
            WHERE j.status = 'Open' 
              AND CURTIME() < j.close_order_time
            ORDER BY j.created_at DESC
        `);
        console.log("JASTIP ROWS FROM DB:", JSON.stringify(rows, null, 2));
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.joinJastip = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { jastip_id, item_name, quantity, notes, delivery_point } = req.body;
        const userId = req.user.id;

        // 1. Get Jastip details
        const [jastipRows] = await connection.query('SELECT * FROM jastips WHERE id = ?', [jastip_id]);
        if (jastipRows.length === 0) {
            return res.status(404).json({ message: 'Jastip not found' });
        }
        const jastip = jastipRows[0];

        if (jastip.available_slots <= 0) {
            return res.status(400).json({ message: 'No slots available' });
        }

        // 2. Create Order in 'orders' table
        const orderId = `ORDER-JSTP-${Date.now()}`;
        const total_price = quantity * jastip.fee;

        await connection.query(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes, total_price, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, 'Jasa Titip', 'Menunggu', new Date(), `Jastip: ${item_name}. Notes: ${notes}`, total_price, jastip.driver_id]
        );

        // 3. Create Jastip Item entry
        await connection.query(
            'INSERT INTO jastip_items (jastip_id, user_id, order_id, item_name, quantity, notes, delivery_point) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [jastip_id, userId, orderId, item_name, quantity, notes, delivery_point]
        );

        // 4. Send automated chat message
        const roomId = `room_${Math.min(userId, jastip.driver_id)}_${Math.max(userId, jastip.driver_id)}`;
        const messageContent = `Halo, saya ingin titip ${item_name} sebanyak ${quantity} di ${jastip.store_name}. Catatan: ${notes || '-'}`;

        // Insert message
        await connection.query(
            'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
            [roomId, userId, jastip.driver_id, messageContent, 'text']
        );

        // Update room_chats (using a simplified version of updateRoomChat logic to avoid complex imports)
        const sId = Number(userId);
        const rId = Number(jastip.driver_id);
        const minId = Math.min(sId, rId);
        const maxId = Math.max(sId, rId);
        const receiverIsUser1 = rId === minId;
        const unreadColReceiver = receiverIsUser1 ? 'unread_user1' : 'unread_user2';
        const unreadColSender = !receiverIsUser1 ? 'unread_user1' : 'unread_user2';

        await connection.query(`
            INSERT INTO room_chats 
                (id, user1_id, user2_id, last_message, last_message_type, last_message_at, last_sender_id, unread_user1, unread_user2)
            VALUES (?, ?, ?, ?, 'text', NOW(), ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                last_message      = VALUES(last_message),
                last_message_type = VALUES(last_message_type),
                last_message_at   = NOW(),
                last_sender_id    = VALUES(last_sender_id),
                ${unreadColReceiver} = ${unreadColReceiver} + 1,
                ${unreadColSender}   = 0
        `, [roomId, minId, maxId, messageContent, sId, receiverIsUser1 ? 1 : 0, receiverIsUser1 ? 0 : 1]);

        await connection.commit();

        // 5. Emit socket events AFTER commit (so message is persisted before broadcasting)
        const io = req.app.get('io');
        if (io) {
            const chatController = require('./chatController');

            // Build message object to broadcast
            const [savedMsg] = await db.query('SELECT * FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT 1', [roomId]);
            const msgObj = savedMsg[0];
            if (msgObj) {
                io.to(roomId).emit('receive_message', {
                    ...msgObj,
                    room: roomId,
                    room_id: roomId,
                    isMine: false
                });
            }

            // Push chat list update to driver
            const driverListItem = await chatController.getChatListItem(jastip.driver_id, roomId);
            if (driverListItem) {
                io.to(`user_${jastip.driver_id}`).emit('chat_list_update', driverListItem);
                const totalUnread = await chatController.getUserTotalUnread(jastip.driver_id);
                io.to(`user_${jastip.driver_id}`).emit('total_unread_update', { total: totalUnread });
            }

            // Push chat list update to user (sender, unread=0)
            const userListItem = await chatController.getChatListItem(Number(userId), roomId);
            if (userListItem) {
                io.to(`user_${userId}`).emit('chat_list_update', { ...userListItem, unread: 0 });
            }

            // Broadcast slot update
            const newSlots = jastip.available_slots - quantity;
            const newStatus = newSlots === 0 ? "Closed" : jastip.status;
            io.emit('jastip_slot_update', {
                jastip_id: jastip.id,
                available_slots: newSlots,
                status: newStatus
            });
        }

        res.json({ message: 'Successfully joined jastip', orderId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// --- DRIVER ENDPOINTS ---

exports.createJastip = async (req, res) => {
    try {
        const { store_name, departure_time, close_order_time, available_slots, fee } = req.body;
        const driverId = req.user.id;

        const [result] = await db.query(
            'INSERT INTO jastips (driver_id, store_name, departure_time, close_order_time, available_slots, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [driverId, store_name, departure_time, close_order_time, available_slots, fee, 'Open']
        );

        res.status(201).json({ message: 'Jastip post created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDriverJastips = async (req, res) => {
    try {
        const driverId = req.user.id;
        const [rows] = await db.query('SELECT * FROM jastips WHERE driver_id = ? ORDER BY created_at DESC', [driverId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getJastipDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Get jastip info
        const [jastipRows] = await db.query('SELECT * FROM jastips WHERE id = ?', [id]);
        if (jastipRows.length === 0) return res.status(404).json({ message: 'Not found' });

        // Get items/people who joined
        const [itemRows] = await db.query(`
            SELECT ji.*, u.name as userName, o.status as orderStatus
            FROM jastip_items ji
            JOIN users u ON ji.user_id = u.id
            JOIN orders o ON ji.order_id = o.id
            WHERE ji.jastip_id = ?
        `, [id]);

        res.json({
            jastip: jastipRows[0],
            items: itemRows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.acceptJastipOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { order_id, jastip_id } = req.body;
        const driverId = req.user.id;

        // 1. Verify Jastip belongs to driver and has slots
        const [jastipRows] = await connection.query('SELECT * FROM jastips WHERE id = ? AND driver_id = ?', [jastip_id, driverId]);
        if (jastipRows.length === 0) {
            return res.status(404).json({ message: 'Jastip not found or unauthorized' });
        }
        const jastip = jastipRows[0];

        if (jastip.available_slots <= 0) {
            return res.status(400).json({ message: 'No slots available for this jastip' });
        }

        // 2. Update Order status
        const [orderResult] = await connection.query('UPDATE orders SET status = "Accepted" WHERE id = ? AND driver_id = ? AND status = "Menunggu"', [order_id, driverId]);
        if (orderResult.affectedRows === 0) {
            return res.status(400).json({ message: 'Order not found, already accepted, or unauthorized' });
        }

        // 3. Update Jastip slots
        await connection.query(
            'UPDATE jastips SET available_slots = available_slots - 1, status = IF(available_slots - 1 <= 0, "Full", "Open") WHERE id = ?',
            [jastip_id]
        );

        // Fetch User ID to send message
        const [orderInfo] = await connection.query('SELECT user_id FROM orders WHERE id = ?', [order_id]);
        const userId = orderInfo[0]?.user_id;

        await connection.commit();

        // 4. Get updated jastip data for real-time broadcast
        const [updatedJastip] = await db.query('SELECT * FROM jastips WHERE id = ?', [jastip_id]);
        const newSlots = updatedJastip[0]?.available_slots ?? jastip.available_slots - 1;
        const newStatus = updatedJastip[0]?.status ?? jastip.status;

        // 5. Emit real-time slot update to all connected clients and send chat
        const io = req.app.get('io');
        if (io) {
            io.emit('jastip_slot_update', {
                jastip_id,
                available_slots: newSlots,
                status: newStatus,
                order_id,
                new_order_status: 'Accepted'
            });

            if (userId) {
                const chatController = require('./chatController');
                const roomId = chatController.makeRoomId(driverId, userId);
                const sysMsg = `Pesanan Jastip Anda telah saya terima. Tolong tunggu, barang Anda akan diantar ke lokasi tujuan.`;

                const [msgResult] = await db.execute(
                    'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
                    [roomId, driverId, userId, sysMsg, 'text']
                );
                await chatController.updateRoomChat(roomId, driverId, userId, sysMsg, 'text');

                const savedMessage = {
                    id: msgResult.insertId,
                    room: roomId,
                    room_id: roomId,
                    sender_id: driverId,
                    receiver_id: userId,
                    content: sysMsg,
                    message_type: 'text',
                    createdAt: new Date()
                };
                io.to(roomId).emit('receive_message', savedMessage);

                const receiverListItem = await chatController.getChatListItem(userId, roomId);
                if (receiverListItem) {
                    io.to(`user_${userId}`).emit('chat_list_update', receiverListItem);
                    const totalUnread = await chatController.getUserTotalUnread(userId);
                    io.to(`user_${userId}`).emit('total_unread_update', { total: totalUnread });
                }
            }
        }

        res.json({ message: 'Order accepted and slot reduced', available_slots: newSlots, status: newStatus });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};
