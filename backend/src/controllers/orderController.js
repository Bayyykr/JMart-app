const db = require('../config/db');

exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT o.*, d.name AS driver_name 
            FROM orders o 
            LEFT JOIN users d ON o.driver_id = d.id 
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
        const { type, notes } = req.body;
        
        // Generate a simple Order ID
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];

        const [result] = await db.execute(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes) VALUES (?, ?, ?, "Diproses", ?, ?)',
            [orderId, userId, type, orderDate, notes || null]
        );

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
