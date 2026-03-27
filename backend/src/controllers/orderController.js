const db = require('../config/db');

exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT o.*, d.name AS driver_name, s.name AS seller 
            FROM orders o 
            LEFT JOIN users d ON o.driver_id = d.id 
            LEFT JOIN users s ON o.seller_id = s.id
            WHERE o.user_id = ? 
              AND NOT (o.driver_id IS NULL AND (o.total_price IS NULL OR o.total_price = 0))
            ORDER BY o.createdAt DESC
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("GET ORDERS ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, notes, shipping_method, total_price, seller_id, product_id, quantity, items } = req.body;
        
        // Generate a simple Order ID
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];

        // For Marketplace, use 'Menunggu Konfirmasi'
        const initialStatus = type === 'Marketplace' ? 'Menunggu Konfirmasi' : 'Diproses';

        const [result] = await db.execute(
            'INSERT INTO orders (id, user_id, seller_id, product_id, quantity, type, shipping_method, status, orderDate, notes, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, seller_id || null, product_id || null, quantity || 1, type, shipping_method || null, initialStatus, orderDate, notes || null, total_price || 0]
        );

        // --- AUTOMATED CHAT MESSAGE ---
        if (type === 'Marketplace' && seller_id) {
            try {
                const [buyerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [userId]);
                const [sellerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [seller_id]);
                
                if (buyerRows.length > 0 && sellerRows.length > 0) {
                    const buyer = buyerRows[0];
                    const seller = sellerRows[0];
                    console.log(`[ORDER_DEBUG] Creating automated message for ${seller.name}`);
                    
                    const minId = Math.min(Number(userId), Number(seller_id));
                    const maxId = Math.max(Number(userId), Number(seller_id));
                    const roomId = `room_${minId}_${maxId}`;

                    const productName = items && items[0] ? items[0].name : 'Produk';
                    const content = `🚩 *PESANAN BARU (MARKETPLACE)* [PESANAN_BARU_MARKETPLACE]
[STATUS:PENDING] [ORDER_ID:${orderId}]
Halo ${seller.name}, saya telah memesan:
*Produk:* ${productName}
*Jumlah:* ${quantity}
*Total Harga:* Rp ${Number(total_price).toLocaleString('id-ID')}
*Metode:* ${shipping_method}
*Catatan:* ${notes || '-'}

Mohon konfirmasinya. Terima kasih.`;

console.log('[ORDER_DEBUG] Message Content:', content);
                    // --- Ensure room_chats is updated ---
                    const chatController = require('./chatController');
                    await chatController.updateRoomChat(roomId, userId, seller_id, content, 'text');

                    const [msgResult] = await db.execute(
                        'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
                        [roomId, userId, seller_id, content, 'text']
                    );
                    
                    // --- SOCKET EMISSION ---
                    const io = req.app.get('io');
                    if (io) {
                        const savedMessage = {
                            id: msgResult.insertId,
                            room: roomId,
                            room_id: roomId,
                            sender_id: userId,
                            sender_name: buyer.name,
                            sender_image: buyer.profile_image_url,
                            receiver_id: seller_id,
                            receiver_name: seller.name,
                            receiver_image: seller.profile_image_url,
                            content: content,
                            message_type: 'text',
                            createdAt: new Date()
                        };

                        io.to(roomId).emit('receive_message', savedMessage);
                        
                        // Sync Overview for BOTH Buyer and Seller
                        const buyerListItem = await chatController.getChatListItem(userId, roomId);
                        const merchantListItem = await chatController.getChatListItem(seller_id, roomId);

                        if (buyerListItem) {
                            io.to(`user_${userId}`).emit('chat_list_update', { ...buyerListItem, unread: 0 });
                        }
                        if (merchantListItem) {
                            io.to(`user_${seller_id}`).emit('chat_list_update', merchantListItem);
                        }
                        
                        // Update total unread counts
                        const buyerUnread = await chatController.getUserTotalUnread(userId);
                        const merchantUnread = await chatController.getUserTotalUnread(seller_id);
                        io.to(`user_${userId}`).emit('total_unread_update', { total: buyerUnread });
                        io.to(`user_${seller_id}`).emit('total_unread_update', { total: merchantUnread });
                        io.emit('merchant_dashboard_update');
                    }

                    console.log(`[Order] Automated card message and room update for ${roomId}`);
                }
            } catch (chatError) {
                console.error('Error creating automated chat message:', chatError);
                // Don't fail the order if chat creation fails
            }
        }

        res.status(201).json({ 
            message: 'Order created successfully', 
            orderId,
            success: true 
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
