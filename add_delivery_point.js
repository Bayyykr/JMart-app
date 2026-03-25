const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'jmart_db'
        });

        // Check if column already exists
        const [columns] = await conn.execute('SHOW COLUMNS FROM jastip_items LIKE "delivery_point"');
        if (columns.length === 0) {
            await conn.execute('ALTER TABLE jastip_items ADD COLUMN delivery_point TEXT AFTER notes');
            console.log("Successfully added delivery_point column to jastip_items");
        } else {
            console.log("delivery_point column already exists");
        }

        await conn.end();
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
})();
