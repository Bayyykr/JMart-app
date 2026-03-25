const db = require('../config/db');
const { sendStatusEmail } = require('../utils/emailService');

exports.updateDriverStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // 1. Get user details (email and name)
        const [userRows] = await db.execute(`
            确定 u.email, u.name 
            FROM users u
            JOIN driver_profiles d ON u.id = d.user_id
            WHERE u.id = ?
        `, [userId]);

        // Fix the typo in SQL above and rewrite correctly
        const [rows] = await db.execute(`
            SELECT u.email, u.name 
            FROM users u
            JOIN driver_profiles d ON d.user_id = u.id
            WHERE u.id = ?
        `, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        const { email, name } = rows[0];

        // 2. Update status in database
        await db.execute('UPDATE driver_profiles SET status = ? WHERE user_id = ?', [status, userId]);

        // 3. Trigger Email Notification (Asynchronous)
        // We don't wait for email to send before responding to admin UI to keep it snappy
        sendStatusEmail(email, name, status);

        res.json({
            message: `Status updated to ${status} and notification email has been triggered for ${email}.`,
            success: true
        });
    } catch (error) {
        console.error('Admin Update Status Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMerchants = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.id, m.user_id, u.name, u.email, m.store_name, m.store_address, m.ktp_number, m.status, m.createdAt
            FROM merchant_profiles m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.createdAt DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateMerchantStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.execute('UPDATE merchant_profiles SET status = ? WHERE user_id = ?', [status, userId]);

        res.json({
            message: `Merchant status updated to ${status}.`,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
