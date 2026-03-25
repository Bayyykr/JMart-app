const pool = require('./config/db');

async function updateSchema() {
    try {
        console.log('Updating user role types...');
        // Alter ENUM is tricky in MySQL, but let's try to add 'marketplace'
        // First check if it already exists or if we can just re-define it
        await pool.execute("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'driver', 'admin', 'marketplace') DEFAULT 'user'");
        
        console.log('Creating broadcast_requests table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS broadcast_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                pickup_location VARCHAR(255) NOT NULL,
                destination_location VARCHAR(255) NOT NULL,
                pickup_time TIME NOT NULL,
                notes TEXT,
                status ENUM('Mencari Driver', 'Diterima', 'Dibatalkan', 'Selesai') DEFAULT 'Mencari Driver',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Adding image_url to products table...');
        try {
            await pool.execute('ALTER TABLE products ADD COLUMN image_url VARCHAR(255) AFTER emoji');
        } catch (colErr) {
            // ignore if column exists
            if (colErr.code !== 'ER_DUP_FIELDNAME') throw colErr;
        }

        console.log('Adding merchant_profiles table...');
        await pool.execute('DROP TABLE IF EXISTS merchant_profiles');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS merchant_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                store_name VARCHAR(255) NOT NULL,
                store_address VARCHAR(255) NOT NULL,
                ktp_number VARCHAR(16) NOT NULL,
                product_description TEXT,
                ktp_image_url VARCHAR(255),
                selfie_image_url VARCHAR(255),
                status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Adding mock marketplace user...');
        await pool.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Toko Berkah', 'berkah@jmart.com', 'password123', 'marketplace']
        );

        console.log('Adding mock merchant profile...');
        // Need to get user_id of Toko Berkah
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', ['berkah@jmart.com']);
        if (users.length > 0) {
            await pool.execute(
                'INSERT IGNORE INTO merchant_profiles (user_id, store_name, store_address, ktp_number, product_description, ktp_image_url, selfie_image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [users[0].id, 'Toko Berkah', 'Jl. Kalimantan No. 1, Jember', '3512345678901235', 'Menjual barang sembako lengkap dan murah', null, null, 'verified']
            );
        }

        console.log('Removing total column from orders table...');
        try {
            await pool.execute('ALTER TABLE orders DROP COLUMN total');
        } catch (colErr) {
            if (colErr.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw colErr;
        }

        console.log('Adding notes column to orders table...');
        try {
            await pool.execute('ALTER TABLE orders ADD COLUMN notes TEXT');
        } catch (colErr) {
            if (colErr.code !== 'ER_DUP_FIELDNAME') throw colErr;
        }

        await pool.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Toko Berkah', 'berkah@jmart.com', 'password123', 'marketplace']
        );

        console.log('Recreating messages table for mock support...');
        await pool.execute('DROP TABLE IF EXISTS messages');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id VARCHAR(50) NOT NULL,
                sender_id VARCHAR(255) NOT NULL,
                sender_name VARCHAR(255),
                sender_image VARCHAR(255),
                receiver_id VARCHAR(255) NOT NULL,
                receiver_name VARCHAR(255),
                receiver_image VARCHAR(255),
                content TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('Update schema error:', err.message);
    } finally {
        process.exit(0);
    }
}

updateSchema();
