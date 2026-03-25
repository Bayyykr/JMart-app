const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'jmart_db'
    });

    try {
        console.log('Starting DB fixes...');

        // 1. Fix messages table message_type
        console.log('- Altering messages table: changing message_type to VARCHAR(50)');
        await connection.query("ALTER TABLE messages MODIFY COLUMN message_type VARCHAR(50) DEFAULT 'text'");

        // 2. Fix jastip_items table delivery_point
        console.log('- Altering jastip_items table: adding delivery_point if not exists');
        const [columns] = await connection.query("SHOW COLUMNS FROM jastip_items");
        const hasDeliveryPoint = columns.find(c => c.Field === 'delivery_point');
        if (!hasDeliveryPoint) {
            await connection.query("ALTER TABLE jastip_items ADD COLUMN delivery_point VARCHAR(255) DEFAULT NULL");
        }

        console.log('DB fixes completed successfully!');
    } catch (error) {
        console.error('DB fix failed:', error);
    } finally {
        await connection.end();
    }
}

fixDb();
