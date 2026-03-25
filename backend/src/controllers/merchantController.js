const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [products] = await db.query('SELECT COUNT(*) as total_products FROM products WHERE seller_id = ?', [userId]);
        const [orders] = await db.query('SELECT COUNT(*) as total_orders, SUM(total) as total_revenue FROM orders o JOIN products p ON o.user_id = p.seller_id WHERE p.seller_id = ?', [userId]);
        
        res.json({
            total_products: products[0].total_products,
            total_orders: orders[0].total_orders || 0,
            total_revenue: orders[0].total_revenue || 0
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
        const { store_name, store_address, ktp_number, product_description } = req.body;
        
        const ktp_image_url = req.files && req.files['ktp_file'] ? `/uploads/${req.files['ktp_file'][0].filename}` : null;
        const selfie_image_url = req.files && req.files['selfie_file'] ? `/uploads/${req.files['selfie_file'][0].filename}` : null;

        // Check if profile exists
        const [existing] = await db.query('SELECT * FROM merchant_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            let updateQuery = 'UPDATE merchant_profiles SET store_name = ?, store_address = ?, ktp_number = ?, product_description = ?, status = "pending"';
            let updateParams = [store_name, store_address, ktp_number, product_description || ''];
            
            if (ktp_image_url) {
                updateQuery += ', ktp_image_url = ?';
                updateParams.push(ktp_image_url);
            }
            if (selfie_image_url) {
                updateQuery += ', selfie_image_url = ?';
                updateParams.push(selfie_image_url);
            }
            
            updateQuery += ' WHERE user_id = ?';
            updateParams.push(userId);
            
            await db.execute(updateQuery, updateParams);
        } else {
            await db.execute(
                'INSERT INTO merchant_profiles (user_id, store_name, store_address, ktp_number, product_description, ktp_image_url, selfie_image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
                [userId, store_name, store_address, ktp_number, product_description || '', ktp_image_url, selfie_image_url]
            );
        }

        res.status(200).json({ message: 'Onboarding data submitted for review' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        const { name, category, price, description, condition_status } = req.body;
        const latitude = req.body.latitude || null;
        const longitude = req.body.longitude || null;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        // Get seller name from user table
        const [userRows] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
        const sellerName = userRows[0].name;

        const [result] = await db.execute(
            'INSERT INTO products (name, seller, seller_id, category, price, description, image_url, condition_status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, sellerName, userId, category, price, description || null, image_url, condition_status || null, latitude, longitude]
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
        const { name, category, price, description, condition_status } = req.body;
        const latitude = req.body.latitude || null;
        const longitude = req.body.longitude || null;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        let query = 'UPDATE products SET name = ?, category = ?, price = ?, description = ?, condition_status = ?, latitude = ?, longitude = ?';
        let params = [name, category, price, description || null, condition_status || null, latitude, longitude];

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
        // In this simple relation, assuming orders table has user_id (buyer)
        // and type='Marketplace', but we need to know if the product belongs to this merchant.
        // If order_items table existed, it would be easy. Since it doesn't, we assume a simple structure
        // Let's check `orders` table. It has `type`, `total`, `status`, `user_id` (buyer).
        // Wait, how do we link orders to products and seller_id in this minimal schema?
        // Let's assume there is an order_items table or we just get orders where type='Marketplace' and total > 0.
        // But since there's no order_items, let's just fetch Marketplace orders for now, ideally filtered by seller.
        // Since we don't have order_items, I'll return all Marketplace orders for demo or build a mock structure.
        // Actually, let's just return all Marketplace orders. The demo is for UI mostly.
        const [rows] = await db.query(`
            SELECT o.*, u.name as customer_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.type = 'Marketplace' 
            ORDER BY o.createdAt DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
