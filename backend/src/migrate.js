const pool = require('./config/db');

async function ensureTable() {
    try {
        console.log('Resetting tables for clean state...');

        // Disable foreign key checks to drop tables
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        await pool.execute('DROP TABLE IF EXISTS driver_profiles');
        await pool.execute('DROP TABLE IF EXISTS orders');
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Recreating orders table...');
        await pool.execute(`
            CREATE TABLE orders (
                id VARCHAR(50) PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('Antar Jemput', 'Jasa Titip', 'Marketplace') NOT NULL,
                total INT NOT NULL,
                status ENUM('Selesai', 'Dalam Perjalanan', 'Diproses', 'Dibatalkan') DEFAULT 'Diproses',
                orderDate DATE NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Recreating driver_profiles table...');
        await pool.execute(`
            CREATE TABLE driver_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                ktp_number VARCHAR(16),
                ktp_image_url VARCHAR(255),
                vehicle_type ENUM('Motor', 'Mobil') DEFAULT 'Motor',
                vehicle_plate VARCHAR(20),
                status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                is_online BOOLEAN DEFAULT FALSE,
                latitude DOUBLE DEFAULT NULL,
                longitude DOUBLE DEFAULT NULL,
                total_trips INT DEFAULT 0,
                completed_orders INT DEFAULT 0,
                rating FLOAT DEFAULT 5.0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Seed Lisa (User)
        await pool.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Lisa', 'lisa@jmart.com', 'password123', 'user']
        );

        // Seed Agus Mantap (Driver) - Start with 0 (No profile, for assessment test)
        await pool.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Agus Mantap', 'agus@jmart.com', 'password123', 'driver']
        );

        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', ['driver@jmart.com']);
        if (users.length > 0) {
            const driverId = users[0].id;
            console.log('Seeding mock profile for Driver Satu...');
            await pool.execute(
                'INSERT INTO driver_profiles (user_id, ktp_number, vehicle_type, vehicle_plate, status, total_trips, completed_orders, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [driverId, '3512345678901234', 'Motor', 'P 5678 CD', 'verified', 124, 48, 4.9]
            );
            console.log('Mock profile seeded.');
        }

        console.log('Tables reset and seeded successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}

ensureTable();
