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
        console.log('Starting migration v3...');

        // 1. Create chat_participants table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_participants (
                room_id VARCHAR(100) NOT NULL,
                user_id INT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (room_id, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('- Table chat_participants checked/created');

        // 2. Populate participants from existing messages
        // This is a bit tricky, but we'll try to extract from sender/receiver of every room
        const [rooms] = await connection.query('SELECT DISTINCT room_id FROM messages');
        console.log(`- Found ${rooms.length} rooms to migrate participants for`);

        for (const room of rooms) {
            const roomId = room.room_id;
            
            // Get all unique senders and receivers for this room
            const [senders] = await connection.query('SELECT DISTINCT sender_id FROM messages WHERE room_id = ?', [roomId]);
            const [receivers] = await connection.query('SELECT DISTINCT receiver_id FROM messages WHERE room_id = ?', [roomId]);
            
            const participants = new Set();
            senders.forEach(s => participants.add(s.sender_id));
            receivers.forEach(r => { if(r.receiver_id) participants.add(r.receiver_id); });

            // If it's a room ID like 'driver-6-user-5', also parse those IDs to be safe
            const match = roomId.match(/(\w+)-(\d+)-(\w+)-(\d+)/);
            if (match) {
                participants.add(parseInt(match[2], 10));
                participants.add(parseInt(match[4], 10));
            }

            for (const userId of participants) {
                await connection.query('INSERT IGNORE INTO chat_participants (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
            }
        }
        console.log('- Finished populating chat_participants');

        console.log('Migration v3 completed successfully!');
    } catch (error) {
        console.error('Migration v3 failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
