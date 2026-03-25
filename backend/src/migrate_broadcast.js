const pool = require('./config/db');

async function migrateBroadcast() {
    try {
        console.log('Creating broadcast-related tables...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS broadcasts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                pickup_location TEXT NOT NULL,
                destination_location TEXT NOT NULL,
                notes TEXT,
                status ENUM('pending', 'applied', 'cancelled') DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS broadcast_offers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                broadcast_id INT NOT NULL,
                driver_id INT NOT NULL,
                price INT NOT NULL,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
                FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Broadcast tables created successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}

migrateBroadcast();
