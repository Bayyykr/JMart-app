const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jmart_db'
    });

    try {
        console.log('Starting migration...');

        // 1. Create chat_rooms table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id VARCHAR(100) PRIMARY KEY,
                last_message_id INT DEFAULT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('- Table chat_rooms checked/created.');

        // 2. Add missing columns to messages table
        const [columns] = await connection.query('SHOW COLUMNS FROM messages');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('message_type')) {
            await connection.query("ALTER TABLE messages ADD COLUMN message_type ENUM('text', 'image', 'file') DEFAULT 'text' AFTER content");
            console.log('- Column message_type added to messages.');
        }

        if (!columnNames.includes('file_url')) {
            await connection.query("ALTER TABLE messages ADD COLUMN file_url VARCHAR(255) DEFAULT NULL AFTER message_type");
            console.log('- Column file_url added to messages.');
        }

        if (!columnNames.includes('is_read')) {
            await connection.query("ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER file_url");
            console.log('- Column is_read added to messages.');
        }

        // 3. Populate chat_rooms from existing messages
        await connection.query(`
            INSERT IGNORE INTO chat_rooms (id, updated_at)
            SELECT DISTINCT room_id, MAX(createdAt)
            FROM messages
            GROUP BY room_id
        `);
        console.log('- Initialized chat_rooms from existing messages.');

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
