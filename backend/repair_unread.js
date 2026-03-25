const mysql = require('mysql2/promise');
require('dotenv').config();

async function repair() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jmart'
    });

    try {
        console.log('=== REPAIRING UNREAD COUNTS ===');
        const [rooms] = await connection.execute('SELECT * FROM room_chats');

        for (const room of rooms) {
            console.log(`Processing room: ${room.id}`);
            
            // Calculate unread for user1
            const [u1] = await connection.execute(
                'SELECT COUNT(*) as count FROM messages WHERE room_id = ? AND receiver_id = ? AND is_read = 0',
                [room.id, room.user1_id]
            );
            const count1 = u1[0].count;

            // Calculate unread for user2
            const [u2] = await connection.execute(
                'SELECT COUNT(*) as count FROM messages WHERE room_id = ? AND receiver_id = ? AND is_read = 0',
                [room.id, room.user2_id]
            );
            const count2 = u2[0].count;

            // Update room_chats
            await connection.execute(
                'UPDATE room_chats SET unread_user1 = ?, unread_user2 = ? WHERE id = ?',
                [count1, count2, room.id]
            );
            console.log(`Room ${room.id}: unread_user1=${count1}, unread_user2=${count2} updated.`);
        }

        console.log('\n=== REPAIR COMPLETE ===');

    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

repair();
