const db = require('../config/db');
const { sendStatusEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');

exports.updateDriverStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

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

        await db.execute('UPDATE driver_profiles SET status = ? WHERE user_id = ?', [status, userId]);

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

exports.getDrivers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.id, d.user_id, u.name, u.email, d.ktp_number, d.vehicle_type, d.vehicle_plate, d.status, d.createdAt,
                   d.ktp_image_url as identity_url, d.selfie_image_url as selfie_url
            FROM driver_profiles d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.createdAt DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Admin Get Drivers Error:', error);
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

exports.getDashboardStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ totalDrivers }]] = await db.query('SELECT COUNT(*) as totalDrivers FROM driver_profiles WHERE status = "verified"');
        const [[{ totalMerchants }]] = await db.query('SELECT COUNT(*) as totalMerchants FROM merchant_profiles WHERE status = "verified"');
        const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
        // revenue is hidden until midtrans integration
        // const [[{ revenue }]] = await db.query('SELECT SUM(total_price) as revenue FROM orders WHERE status = "completed"');

        res.json({
            totalUsers,
            totalDrivers,
            totalMerchants,
            totalOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRecentActivity = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.id, u.name as userName, o.createdAt, 'order' as type
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.createdAt DESC
            LIMIT 5
        `);
        const [users] = await db.query(`
            SELECT id, name as userName, createdAt, 'user' as type
            FROM users
            ORDER BY createdAt DESC
            LIMIT 5
        `);

        const activity = [...orders, ...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { search = '', role = '' } = req.query;
        let query = 'SELECT id, name, email, role, is_active, createdAt FROM users WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ' ORDER BY createdAt DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!['user', 'driver', 'marketplace', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.json({ message: 'User role updated successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId, is_active } = req.body;
        await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active, userId]);
        res.json({ message: 'User status updated successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u1.name as reporterName, u2.name as reportedName
            FROM reports r
            JOIN users u1 ON r.reporter_id = u1.id
            JOIN users u2 ON r.reported_user_id = u2.id
            ORDER BY r.createdAt DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId, status } = req.body;
        if (!['pending', 'resolved', 'ignored'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.execute('UPDATE reports SET status = ? WHERE id = ?', [status, reportId]);
        res.json({ message: 'Report status updated successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.exportDataCSV = async (req, res) => {
    try {
        const { resource } = req.params;
        let query = '';
        if (resource === 'users') query = 'SELECT id, name, email, role, createdAt FROM users';
        else if (resource === 'orders') query = 'SELECT id, user_id, total_price, status, createdAt FROM orders';
        else return res.status(400).json({ message: 'Invalid resource' });

        const [rows] = await db.query(query);
        if (rows.length === 0) return res.send('');

        const headers = Object.keys(rows[0]).join(',');
        const csvRows = rows.map(row => Object.values(row).join(','));
        const csv = [headers, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${resource}_export.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.exportSystemReportPDF = async (req, res) => {
    try {
        // Fetch stats again for the report
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ totalDrivers }]] = await db.query('SELECT COUNT(*) as totalDrivers FROM driver_profiles WHERE status = "verified"');
        const [[{ totalMerchants }]] = await db.query('SELECT COUNT(*) as totalMerchants FROM merchant_profiles WHERE status = "verified"');
        const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=system_report.pdf');
        doc.pipe(res);

        doc.fontSize(25).text('JMart System Admin Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
        doc.moveDown();
        doc.text('--------------------------------------------------');
        doc.moveDown();

        doc.fontSize(16).text('System Summary Statistics');
        doc.fontSize(12).text(`Total Registered Users: ${totalUsers}`);
        doc.text(`Total Verified Drivers: ${totalDrivers}`);
        doc.text(`Total Verified Merchants: ${totalMerchants}`);
        doc.text(`Total Orders Placed: ${totalOrders}`);
        doc.moveDown();

        doc.fontSize(16).text('Recent Orders');
        const [recentOrders] = await db.query(`
            SELECT id, total_price, status, createdAt 
            FROM orders 
            ORDER BY createdAt DESC 
            LIMIT 10
        `);

        recentOrders.forEach((order, index) => {
            doc.fontSize(10).text(`${index + 1}. Order #${order.id} - Rp ${order.total_price.toLocaleString('id-ID')} [${order.status}] - ${order.createdAt.toLocaleString()}`);
        });

        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
