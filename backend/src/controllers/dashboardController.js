const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query to get overall totals for the specific user
        const [totalOrdersResult] = await db.query('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]);
        const totalOrder = totalOrdersResult[0].count;

        // Query to get breakdown by type for the specific user
        const [typeStats] = await db.query('SELECT type, COUNT(*) as count FROM orders WHERE user_id = ? GROUP BY type', [userId]);

        // Default values
        let antarJemput = 0;
        let jasaTitip = 0;
        let marketplace = 0;

        typeStats.forEach(stat => {
            if (stat.type === 'Antar Jemput') antarJemput = stat.count;
            if (stat.type === 'Jasa Titip') jasaTitip = stat.count;
            if (stat.type === 'Marketplace') marketplace = stat.count;
        });

        res.json({
            totalOrder,
            antarJemput,
            jasaTitip,
            marketplace
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY createdAt DESC LIMIT 3', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
