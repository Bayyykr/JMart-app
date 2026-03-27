const db = require('../config/db');
const driverStore = require('../utils/driverStore');

exports.getDriverStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT * FROM driver_profiles WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            return res.json({ hasProfile: false, status: 'none' });
        }

        res.json({ hasProfile: true, status: rows[0].status, profile: rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitOnboarding = async (req, res) => {
    try {
        const userId = req.user.id;
        const { ktp_number, vehicle_type, vehicle_plate, vehicle_model } = req.body;

        console.log('[BACKEND] Submit Onboarding Request:', { userId, body: req.body });

        // Handle uploaded files from multer
        const ktp_image_url = req.files && req.files['ktp_file'] ? `/uploads/${req.files['ktp_file'][0].filename}` : null;
        const selfie_image_url = req.files && req.files['selfie_file'] ? `/uploads/${req.files['selfie_file'][0].filename}` : null;

        // Normalize vehicle_type for ENUM matching (e.g. 'motor' -> 'Motor')
        const normalizedVehicleType = vehicle_type ? vehicle_type.charAt(0).toUpperCase() + vehicle_type.slice(1).toLowerCase() : 'Motor';

        const [existing] = await db.execute('SELECT id FROM driver_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            console.log('[BACKEND] Updating existing driver profile for user:', userId);
            await db.execute(
                'UPDATE driver_profiles SET ktp_number = ?, ktp_image_url = ?, selfie_image_url = ?, vehicle_type = ?, vehicle_plate = ?, vehicle_model = ?, status = "pending" WHERE user_id = ?',
                [ktp_number, ktp_image_url, selfie_image_url, normalizedVehicleType, vehicle_plate, vehicle_model, userId]
            );
        } else {
            console.log('[BACKEND] Inserting new driver profile for user:', userId);
            await db.execute(
                'INSERT INTO driver_profiles (user_id, ktp_number, ktp_image_url, selfie_image_url, vehicle_type, vehicle_plate, vehicle_model, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
                [userId, ktp_number, ktp_image_url, selfie_image_url, normalizedVehicleType, vehicle_plate, vehicle_model]
            );
        }

        res.status(200).json({ message: 'Onboarding data submitted successfully' });
    } catch (error) {
        console.error('[BACKEND] Submit Onboarding Error Details:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'no files'
        });
        res.status(500).json({ message: 'Server error during onboarding', error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { is_online, area, latitude, longitude } = req.body; 
        const onlineStatus = is_online ? 1 : 0;

        // Ensure we send null instead of undefined for SQL parameters
        const sqlArea = area !== undefined ? area : null;
        const sqlLat = latitude !== undefined ? latitude : null;
        const sqlLng = longitude !== undefined ? longitude : null;

        // 1. Update Profile Table with location if provided
        await db.execute(
            'UPDATE driver_profiles SET is_online = ?, area = IFNULL(?, area), latitude = IFNULL(?, latitude), longitude = IFNULL(?, longitude) WHERE user_id = ?',
            [onlineStatus, sqlArea, sqlLat, sqlLng, userId]
        );

        // 2. Update In-Memory Store
        if (is_online) {
            const [userRows] = await db.execute('SELECT name, profile_image_url FROM users WHERE id = ?', [userId]);
            const [profileRows] = await db.execute('SELECT * FROM driver_profiles WHERE user_id = ?', [userId]);

            if (userRows.length > 0 && profileRows.length > 0) {
                const user = userRows[0];
                const profile = profileRows[0];
                driverStore.setDriver(userId, {
                    id: `real-${userId}`,
                    userId,
                    name: user.name,
                    profile_image: user.profile_image_url,
                    vehicle_plate: profile.vehicle_plate,
                    vehicle_type: profile.vehicle_type,
                    vehicle_model: profile.vehicle_model,
                    rating: profile.rating,
                    trips: profile.total_trips,
                    status: 'Online',
                    area: area || profile.area // Prefer area from toggle if available
                });
            }
        } else {
            driverStore.removeDriver(userId);
        }

        res.json({ message: 'Status updated successfully', is_online });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, area } = req.body;

        // Ensure we send null instead of undefined for SQL parameters
        const sqlArea = area !== undefined ? area : null;

        // 1. Update In-Memory Store
        const current = driverStore.getDriver(userId);
        if (current) {
            driverStore.setDriver(userId, {
                lat: latitude,
                lng: longitude,
                area: area || current.area
            });
        }

        // 2. Update Database for persistence
        await db.execute(
            'UPDATE driver_profiles SET latitude = ?, longitude = ?, area = IFNULL(?, area) WHERE user_id = ?',
            [latitude, longitude, area, userId]
        );

        res.json({ message: 'Location updated (memory) successfully', latitude, longitude });
    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getDriverStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT total_trips, completed_orders, rating, revenue FROM driver_profiles WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            const [ordersRes] = await db.execute('SELECT COUNT(*) as total_orders FROM room_chats WHERE (user1_id = ? OR user2_id = ?) AND last_message LIKE "%PESANAN DISEPAKATI%"', [userId, userId]);
            const completed_orders = ordersRes[0].total_orders;
            return res.json({
                total_trips: 0,
                completed_orders: completed_orders,
                rating: 5.0,
                total_jasa_titip: 0,
                revenue: 0
            });
        }

        const profile = rows[0];
        const [ordersRes] = await db.execute('SELECT COUNT(*) as total_orders FROM room_chats WHERE (user1_id = ? OR user2_id = ?) AND last_message LIKE "%PESANAN DISEPAKATI%"', [userId, userId]);
        const completed_orders = ordersRes[0].total_orders;

        res.json({
            total_trips: profile.total_trips || completed_orders || 0,
            completed_orders: profile.completed_orders || completed_orders || 0,
            rating: profile.rating || 5.0,
            total_jasa_titip: 0,
            revenue: profile.revenue || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDriverOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT o.*, u.name AS customer_name 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.driver_id = ? 
            ORDER BY o.createdAt DESC
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Get Driver Orders Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
