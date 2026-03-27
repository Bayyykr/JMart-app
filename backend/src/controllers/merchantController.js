const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [products] = await db.query('SELECT COUNT(*) as total_products FROM products WHERE seller_id = ?', [userId]);
        const [orderStats] = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'Menunggu Konfirmasi' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'Diproses' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'Dalam Perjalanan' THEN 1 END) as shipping_orders,
                COUNT(CASE WHEN status = 'Selesai' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'Dibatalkan' THEN 1 END) as cancelled_orders,
                SUM(CASE WHEN status = 'Selesai' THEN total_price ELSE 0 END) as total_revenue,
                COUNT(*) as total_orders
            FROM orders WHERE seller_id = ?
        `, [userId]);
        
        const [recentOrders] = await db.query(`
            SELECT o.*, u.name as customer_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.seller_id = ? AND o.type = 'Marketplace'
            ORDER BY o.createdAt DESC LIMIT 5
        `, [userId]);
        
        const stats = orderStats[0];
        res.json({
            total_products: products[0].total_products,
            total_orders: stats.total_orders || 0,
            pending_orders: stats.pending_orders || 0,
            processing_orders: stats.processing_orders || 0,
            shipping_orders: stats.shipping_orders || 0,
            completed_orders: stats.completed_orders || 0,
            cancelled_orders: stats.cancelled_orders || 0,
            total_revenue: stats.total_revenue || 0,
            recent_orders: recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM products WHERE seller_id = ? ORDER BY createdAt DESC', [userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitOnboarding = async (req, res) => {
    try {
        const userId = req.user.id;
        const { store_name, ktp_number, product_description, village, district, city, full_address, latitude, longitude } = req.body;
        
        const ktp_image_url = req.files && req.files['ktp_file'] ? `/uploads/${req.files['ktp_file'][0].filename}` : null;
        const selfie_image_url = req.files && req.files['selfie_file'] ? `/uploads/${req.files['selfie_file'][0].filename}` : null;

        const parsedLat = latitude ? parseFloat(latitude) : null;
        const parsedLng = longitude ? parseFloat(longitude) : null;

        // Check if profile exists
        const [existing] = await db.query('SELECT * FROM merchant_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            let updateQuery = 'UPDATE merchant_profiles SET store_name = ?, village = ?, district = ?, city = ?, full_address = ?, ktp_number = ?, product_description = ?, status = "pending"';
            let updateParams = [store_name, village || '', district || '', city || '', full_address || '', ktp_number, product_description || ''];
            
            if (ktp_image_url) {
                updateQuery += ', ktp_image_url = ?';
                updateParams.push(ktp_image_url);
            }
            if (selfie_image_url) {
                updateQuery += ', selfie_image_url = ?';
                updateParams.push(selfie_image_url);
            }
            if (parsedLat !== null && parsedLng !== null) {
                updateQuery += ', latitude = ?, longitude = ?';
                updateParams.push(parsedLat, parsedLng);
            }
            
            updateQuery += ' WHERE user_id = ?';
            updateParams.push(userId);
            
            await db.execute(updateQuery, updateParams);
        } else {
            await db.execute(
                'INSERT INTO merchant_profiles (user_id, store_name, village, district, city, full_address, ktp_number, product_description, ktp_image_url, selfie_image_url, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
                [userId, store_name, village || '', district || '', city || '', full_address || '', ktp_number, product_description || '', ktp_image_url, selfie_image_url, parsedLat, parsedLng]
            );
        }

        res.status(200).json({ message: 'Onboarding data submitted for review' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [profile] = await db.query('SELECT * FROM merchant_profiles WHERE user_id = ?', [userId]);
        
        if (profile.length === 0) {
            // Check if user is actually a merchant role
            const [user] = await db.query('SELECT name, role FROM users WHERE id = ?', [userId]);
            if (user[0] && (user[0].role === 'marketplace' || user[0].role === 'admin')) {
                // Return a skeleton instead of 404 to avoid frontend errors
                return res.json({ 
                    store_name: user[0].name,
                    status: 'pending',
                    is_new: true
                });
            }
            return res.status(404).json({ message: 'Merchant profile not found' });
        }
        res.json(profile[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};
        const { store_name, product_description, village, district, city, full_address, latitude, longitude } = body;
        const store_image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const parseCoord = (val, fallback) => {
            if (val === undefined || val === null || val === '') return fallback;
            const p = parseFloat(val);
            return isNaN(p) ? fallback : p;
        };

        const [profile] = await db.query('SELECT * FROM merchant_profiles WHERE user_id = ?', [userId]);
        
        if (profile.length === 0) {
            // INSERT if not exists
            console.log(`[MerchantProfile] Creating NEW profile for User ID: ${userId}`);
            await db.execute(`
                INSERT INTO merchant_profiles 
                (user_id, store_name, village, district, city, full_address, product_description, latitude, longitude, store_image_url, ktp_number, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, 
                store_name || 'Toko Baru', 
                village || '', 
                district || '', 
                city || '', 
                full_address || '', 
                product_description || '', 
                parseCoord(latitude, null), 
                parseCoord(longitude, null),
                store_image_url,
                'PENDING', // Temp KTP
                'verified'
            ]);
        } else {
            // UPDATE existing
            const existing = profile[0];
            console.log(`[MerchantProfile] Updating existing profile for User ID: ${userId}`);

            let updateFields = [
                'store_name = ?',
                'village = ?',
                'district = ?',
                'city = ?',
                'full_address = ?',
                'product_description = ?',
                'latitude = ?',
                'longitude = ?'
            ];
            
            let params = [
                store_name || existing.store_name, 
                village !== undefined ? village : existing.village, 
                district !== undefined ? district : existing.district, 
                city !== undefined ? city : existing.city, 
                full_address !== undefined ? full_address : existing.full_address, 
                product_description !== undefined ? product_description : existing.product_description, 
                parseCoord(latitude, existing.latitude), 
                parseCoord(longitude, existing.longitude)
            ];

            if (store_image_url) {
                updateFields.push('store_image_url = ?');
                params.push(store_image_url);
            }

            params.push(userId);
            const finalQuery = `UPDATE merchant_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`;

            await db.execute(finalQuery, params);
        }

        // Update name in users and products table for consistency
        if (store_name) {
            await db.execute('UPDATE users SET name = ? WHERE id = ?', [store_name, userId]);
            await db.execute('UPDATE products SET seller = ? WHERE seller_id = ?', [store_name, userId]);
        }

        res.json({ 
            message: 'Profile updated successfully',
            profile: {
                store_name: store_name,
                store_image_url: store_image_url
            }
        });
    } catch (error) {
        console.error('Error updating merchant profile:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message,
            code: error.code
        });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [profile] = await db.query('SELECT status, store_name FROM merchant_profiles WHERE user_id = ?', [userId]);

        if (profile.length === 0) {
            return res.json({ status: 'unregistered' });
        }

        res.json({ status: profile[0].status, store_name: profile[0].store_name });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, category, price, description, condition_status, open_time, close_time } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        // Get seller name from user table
        const [userRows] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
        const sellerName = userRows[0].name;

        // Get static coordinates from merchant profile to duplicate into products for fast read
        const [profile] = await db.query('SELECT latitude, longitude FROM merchant_profiles WHERE user_id = ?', [userId]);
        const latitude = profile.length > 0 ? profile[0].latitude : null;
        const longitude = profile.length > 0 ? profile[0].longitude : null;

        const [result] = await db.execute(
            'INSERT INTO products (name, seller, seller_id, category, price, description, image_url, condition_status, latitude, longitude, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, sellerName, userId, category, price, description || null, image_url, condition_status || null, latitude, longitude, open_time || null, close_time || null]
        );

        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;
        const { name, category, price, description, condition_status, open_time, close_time } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        let query = 'UPDATE products SET name = ?, category = ?, price = ?, description = ?, condition_status = ?, open_time = ?, close_time = ?';
        let params = [name, category, price, description || null, condition_status || null, open_time || null, close_time || null];

        if (image_url) {
            query += ', image_url = ?';
            params.push(image_url);
        }

        query += ' WHERE id = ? AND seller_id = ?';
        params.push(productId, userId);

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;

        const [result] = await db.execute('DELETE FROM products WHERE id = ? AND seller_id = ?', [productId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT o.*, u.name as customer_name, d.name as driver_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            LEFT JOIN users d ON o.driver_id = d.id
            WHERE o.type = 'Marketplace' AND o.seller_id = ?
            ORDER BY o.createdAt DESC
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message,
            code: error.code
        });
    }
};

exports.sewaDriver = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        // 1. Get Order Details
        const [orders] = await db.query('SELECT o.*, u.address as customer_address FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        const order = orders[0];

        // 2. Get Merchant Profile for Store Location
        const [profiles] = await db.query('SELECT store_name, full_address, store_address FROM merchant_profiles WHERE user_id = ?', [userId]);
        const pickupLoc = profiles.length > 0 ? (profiles[0].full_address || profiles[0].store_address) : 'Lokasi Toko';
        const storeName = profiles.length > 0 ? profiles[0].store_name : 'Toko';

        // 3. Create BROADCAST instead of auto-assigning
        const destinationLoc = order.customer_address || 'Alamat Pelanggan';
        const notes = `Pengiriman Makanan dari ${storeName} (Order #${orderId})`;

        await db.execute(
            'INSERT INTO broadcasts (user_id, pickup_location, destination_location, notes, category, order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, pickupLoc, destinationLoc, notes, 'Makanan', orderId, 'pending']
        );

        // 4. Update order status to indicate searching for driver
        await db.execute('UPDATE orders SET status = "Mencari Driver" WHERE id = ?', [orderId]);

        res.json({ 
            message: 'Permintaan pengiriman telah disebarkan ke semua driver!', 
            success: true 
        });
    } catch (error) {
        console.error('Sewa Driver Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        
        // Automated Chat Notifications & Balance Update
        try {
            const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
            if (orderRows.length > 0) {
                const o = orderRows[0];
                const sellerId = o.seller_id || req.user.id;
                const buyerId = o.user_id;

                let chatContent = '';
                if (status === 'Dalam Perjalanan') {
                    chatContent = 'Pesanan Anda sedang dalam pengiriman! Mohon tunggu ya.';
                } else if (status === 'Selesai') {
                    chatContent = 'Pesanan Anda telah diterima. Terima kasih sudah berbelanja di toko kami!';
                }

                if (chatContent) {
                    const minId = Math.min(Number(sellerId), Number(buyerId));
                    const maxId = Math.max(Number(sellerId), Number(buyerId));
                    const roomId = `room_${minId}_${maxId}`;

                    // Insert message
                    const [msgResult] = await db.execute(
                        'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
                        [roomId, sellerId, buyerId, chatContent, 'text']
                    );

                    // Update room_chats
                    const isU1 = Number(sellerId) === minId;
                    const roomQuery = `
                        INSERT INTO room_chats 
                            (id, user1_id, user2_id, last_message, last_message_type, last_message_at, last_sender_id, unread_user1, unread_user2)
                        VALUES (?, ?, ?, ?, 'text', NOW(), ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            last_message = VALUES(last_message), 
                            last_message_type = VALUES(last_message_type),
                            last_message_at = NOW(), 
                            last_sender_id = VALUES(last_sender_id), 
                            unread_user1 = CASE WHEN user1_id != VALUES(last_sender_id) THEN unread_user1 + 1 ELSE 0 END,
                            unread_user2 = CASE WHEN user2_id != VALUES(last_sender_id) THEN unread_user2 + 1 ELSE 0 END
                    `;
                    await db.query(roomQuery, [roomId, minId, maxId, chatContent, sellerId, isU1 ? 0 : 1, isU1 ? 1 : 0]);

                    // Socket Emit
                    const io = req.app.get('io');
                    if (io) {
                        const [sellerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [sellerId]);
                        const [buyerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [buyerId]);
                        
                        if (sellerRows.length > 0 && buyerRows.length > 0) {
                            const seller = sellerRows[0];
                            const buyer = buyerRows[0];
                            const savedMessage = { 
                                id: msgResult.insertId, room: roomId, room_id: roomId, 
                                sender_id: sellerId, sender_name: seller.name, sender_image: seller.profile_image_url, 
                                receiver_id: buyerId, receiver_name: buyer.name, receiver_image: buyer.profile_image_url, 
                                content: chatContent, message_type: 'text', createdAt: new Date() 
                            };
                            io.to(roomId).emit('receive_message', savedMessage);
                            
                            // Update sidebar for both
                            const [rRows] = await db.execute('SELECT rc.*, u1.name as u1_name, u1.profile_image_url as u1_image, u2.name as u2_name, u2.profile_image_url as u2_image FROM room_chats rc JOIN users u1 ON rc.user1_id = u1.id JOIN users u2 ON rc.user2_id = u2.id WHERE rc.id = ?', [roomId]);
                            if (rRows.length > 0) {
                                const r = rRows[0];
                                const getListItem = (uId) => ({
                                    room_id: r.id,
                                    user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image, unread: Number(r.unread_user1) },
                                    user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image, unread: Number(r.unread_user2) },
                                    last_message: r.last_message, last_message_at: r.last_message_at, last_sender_id: Number(r.last_sender_id)
                                });
                                io.to(`user_${sellerId}`).emit('chat_list_update', getListItem(sellerId));
                                io.to(`user_${buyerId}`).emit('chat_list_update', getListItem(buyerId));
                            }
                        }
                    }
                }
            }
        } catch (chatErr) {
            console.error('Automated Chat Notification Error:', chatErr);
        }

        const io = req.app.get('io');
        if (io) io.emit('merchant_dashboard_update');

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.acceptOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id; // Merchant User ID
        const { message_id, room_id } = req.body;

        // Verify ownership
        const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ? AND seller_id = ?', [orderId, userId]);
        if (orderRows.length === 0) return res.status(403).json({ message: 'Unauthorised' });
        const o = orderRows[0];

        await db.execute('UPDATE orders SET status = "Diproses" WHERE id = ?', [orderId]);
        
        const io = req.app.get('io');
        if (io) io.emit('merchant_dashboard_update');

        // Send confirmation chat & update order stamp
        try {
            if (message_id && room_id) {
                await db.execute("UPDATE messages SET content = REPLACE(content, '[STATUS:PENDING]', '[STATUS:ACCEPTED]') WHERE id = ?", [message_id]);
                await db.execute("UPDATE room_chats SET last_message = REPLACE(last_message, '[STATUS:PENDING]', '[STATUS:ACCEPTED]') WHERE id = ?", [room_id]);

                const [msgRows] = await db.execute('SELECT * FROM messages WHERE id = ?', [message_id]);
                if (msgRows.length > 0) {
                    const io = req.app.get('io');
                    if (io) io.to(room_id).emit('update_message', msgRows[0]);
                }
            }

            const [buyerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [o.user_id]);
            const [sellerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [userId]);

            if (buyerRows.length > 0 && sellerRows.length > 0) {
                const buyer = buyerRows[0];
                const seller = sellerRows[0];
                const minId = Math.min(Number(userId), Number(o.user_id));
                const maxId = Math.max(Number(userId), Number(o.user_id));
                const roomId = `room_${minId}_${maxId}`;
                const content = 'Pesanan Anda telah saya terima. Akan segera saya proses!';

                // Update room_chats
                const isU1 = Number(userId) === minId;
                const query = `
                    INSERT INTO room_chats 
                        (id, user1_id, user2_id, last_message, last_message_type, last_message_at, last_sender_id, unread_user1, unread_user2)
                    VALUES (?, ?, ?, ?, 'text', NOW(), ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        last_message = VALUES(last_message), 
                        last_message_type = VALUES(last_message_type),
                        last_message_at = NOW(), 
                        last_sender_id = VALUES(last_sender_id), 
                        unread_user1 = CASE WHEN user1_id != VALUES(last_sender_id) THEN unread_user1 + 1 ELSE 0 END,
                        unread_user2 = CASE WHEN user2_id != VALUES(last_sender_id) THEN unread_user2 + 1 ELSE 0 END
                `;
                const params = [roomId, minId, maxId, content, userId, isU1 ? 0 : 1, isU1 ? 1 : 0];
                try {
                    await db.query(query, params);
                } catch (roomErr) {
                    console.error('[ChatRoom] Error:', roomErr.message, 'Params:', params);
                }

                const [msgResult] = await db.execute(
                    'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
                    [roomId, userId, o.user_id, content, 'text']
                );

                const io = req.app.get('io');
                if (io) {
                    const savedMessage = { id: msgResult.insertId, room: roomId, room_id: roomId, sender_id: userId, sender_name: seller.name, sender_image: seller.profile_image_url, receiver_id: o.user_id, receiver_name: buyer.name, receiver_image: buyer.profile_image_url, content, message_type: 'text', createdAt: new Date() };
                    io.to(roomId).emit('receive_message', savedMessage);
                    
                    const [rRows] = await db.execute('SELECT rc.*, u1.name as u1_name, u1.profile_image_url as u1_image, u2.name as u2_name, u2.profile_image_url as u2_image FROM room_chats rc JOIN users u1 ON rc.user1_id = u1.id JOIN users u2 ON rc.user2_id = u2.id WHERE rc.id = ?', [roomId]);
                    if (rRows.length > 0) {
                        const r = rRows[0];
                        const listItem = { room_id: r.id, user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image, unread: Number(r.unread_user1) }, user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image, unread: Number(r.unread_user2) }, last_message: r.last_message, last_message_at: r.last_message_at, last_sender_id: Number(r.last_sender_id) };
                        io.to(`user_${o.user_id}`).emit('chat_list_update', listItem);
                    }
                }
            }
        } catch (chatErr) { console.error('Accept Order Chat Error:', chatErr); }

        res.json({ message: 'Pesanan diterima dan sedang diproses', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.rejectOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const { message_id, room_id } = req.body;

        // Verify ownership
        const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ? AND seller_id = ?', [orderId, userId]);
        if (orderRows.length === 0) return res.status(403).json({ message: 'Unauthorised' });
        const o = orderRows[0];

        await db.execute('UPDATE orders SET status = "Dibatalkan" WHERE id = ?', [orderId]);
        
        const io = req.app.get('io');
        if (io) io.emit('merchant_dashboard_update');

        // Send rejection chat & update order stamp
        try {
            if (message_id && room_id) {
                await db.execute("UPDATE messages SET content = REPLACE(content, '[STATUS:PENDING]', '[STATUS:REJECTED]') WHERE id = ?", [message_id]);
                await db.execute("UPDATE room_chats SET last_message = REPLACE(last_message, '[STATUS:PENDING]', '[STATUS:REJECTED]') WHERE id = ?", [room_id]);

                const [msgRows] = await db.execute('SELECT * FROM messages WHERE id = ?', [message_id]);
                if (msgRows.length > 0) {
                    const io = req.app.get('io');
                    if (io) io.to(room_id).emit('update_message', msgRows[0]);
                }
            }

            const [buyerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [o.user_id]);
            const [sellerRows] = await db.query('SELECT name, profile_image_url FROM users WHERE id = ?', [userId]);

            if (buyerRows.length > 0 && sellerRows.length > 0) {
                const buyer = buyerRows[0];
                const seller = sellerRows[0];
                const minId = Math.min(Number(userId), Number(o.user_id));
                const maxId = Math.max(Number(userId), Number(o.user_id));
                const roomId = `room_${minId}_${maxId}`;
                const content = 'Mohon maaf, pesanan Anda saya tolak untuk saat ini.';

                // Update room_chats
                const isU1 = Number(userId) === minId;
                const query = `
                    INSERT INTO room_chats 
                        (id, user1_id, user2_id, last_message, last_message_type, last_message_at, last_sender_id, unread_user1, unread_user2)
                    VALUES (?, ?, ?, ?, 'text', NOW(), ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        last_message = VALUES(last_message), 
                        last_message_type = VALUES(last_message_type),
                        last_message_at = NOW(), 
                        last_sender_id = VALUES(last_sender_id), 
                        unread_user1 = CASE WHEN user1_id != VALUES(last_sender_id) THEN unread_user1 + 1 ELSE 0 END,
                        unread_user2 = CASE WHEN user2_id != VALUES(last_sender_id) THEN unread_user2 + 1 ELSE 0 END
                `;
                const params = [roomId, minId, maxId, content, userId, isU1 ? 0 : 1, isU1 ? 1 : 0];
                try {
                    await db.query(query, params);
                } catch (roomErr) {
                    console.error('[ChatRoom] Error updating room_chats (Reject):', roomErr.message, 'Params:', params);
                }

                const [msgResult] = await db.execute(
                    'INSERT INTO messages (room_id, sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?, ?)',
                    [roomId, userId, o.user_id, content, 'text']
                );

                const io = req.app.get('io');
                if (io) {
                    const savedMessage = { id: msgResult.insertId, room: roomId, room_id: roomId, sender_id: userId, sender_name: seller.name, sender_image: seller.profile_image_url, receiver_id: o.user_id, receiver_name: buyer.name, receiver_image: buyer.profile_image_url, content, message_type: 'text', createdAt: new Date() };
                    io.to(roomId).emit('receive_message', savedMessage);
                    
                    const [rRows] = await db.execute('SELECT rc.*, u1.name as u1_name, u1.profile_image_url as u1_image, u2.name as u2_name, u2.profile_image_url as u2_image FROM room_chats rc JOIN users u1 ON rc.user1_id = u1.id JOIN users u2 ON rc.user2_id = u2.id WHERE rc.id = ?', [roomId]);
                    if (rRows.length > 0) {
                        const r = rRows[0];
                        const listItem = { room_id: r.id, user1: { id: Number(r.user1_id), name: r.u1_name, image: r.u1_image, unread: Number(r.unread_user1) }, user2: { id: Number(r.user2_id), name: r.u2_name, image: r.u2_image, unread: Number(r.unread_user2) }, last_message: r.last_message, last_message_at: r.last_message_at, last_sender_id: Number(r.last_sender_id) };
                        io.to(`user_${o.user_id}`).emit('chat_list_update', listItem);
                    }
                }
            }
        } catch (chatErr) { console.error('Reject Order Chat Error:', chatErr); }

        res.json({ message: 'Pesanan ditolak', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
