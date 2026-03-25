const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'jmart_db'
    });

    try {
        console.log('=== CHAT DB REBUILD v4 ===\n');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Drop old tables
        console.log('[1/5] Dropping old chat_rooms and chat_participants...');
        await connection.query('DROP TABLE IF EXISTS chat_participants');
        await connection.query('DROP TABLE IF EXISTS chat_rooms');
        console.log('      Done.\n');

        // 2. Create new room_chats table
        console.log('[2/5] Creating new room_chats table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS room_chats (
                id VARCHAR(100) NOT NULL PRIMARY KEY,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                last_message TEXT DEFAULT NULL,
                last_message_type VARCHAR(20) DEFAULT 'text',
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                unread_user1 INT DEFAULT 0,
                unread_user2 INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_pair (user1_id, user2_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('      Done.\n');

        // 3. Ensure messages table has is_read column
        console.log('[3/5] Ensuring messages.is_read column exists...');
        try {
            await connection.query(`
                ALTER TABLE messages ADD COLUMN is_read TINYINT(1) DEFAULT 0
            `);
            console.log('      Added is_read column.\n');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('      is_read column already exists, skipping.\n');
            } else throw e;
        }

        // 4. Rebuild room_chats from existing messages
        console.log('[4/5] Rebuilding room_chats from existing messages...');
        const [rooms] = await connection.query('SELECT DISTINCT room_id FROM messages');
        console.log(`      Found ${rooms.length} existing room(s) to migrate.`);

        let migratedCount = 0;
        for (const { room_id } of rooms) {
            // Parse user IDs from room_id pattern: room_X_Y or driver-X-user-Y etc.
            let user1Id = null, user2Id = null;

            // Pattern: room_5_12
            const standardMatch = room_id.match(/^room_(\d+)_(\d+)$/);
            if (standardMatch) {
                user1Id = parseInt(standardMatch[1]);
                user2Id = parseInt(standardMatch[2]);
            }

            // Pattern: driver-6-user-5 or user-5-driver-6 etc.
            if (!user1Id) {
                const legacyMatch = room_id.match(/(?:driver|user|merchant)-(\d+)-(?:driver|user|merchant)-(\d+)/);
                if (legacyMatch) {
                    user1Id = parseInt(legacyMatch[1]);
                    user2Id = parseInt(legacyMatch[2]);
                }
            }

            // Fallback: derive from senders/receivers in messages
            if (!user1Id) {
                const [msgUsers] = await connection.query(
                    'SELECT DISTINCT sender_id FROM messages WHERE room_id = ? AND sender_id != 0 LIMIT 2',
                    [room_id]
                );
                if (msgUsers.length >= 2) {
                    user1Id = msgUsers[0].sender_id;
                    user2Id = msgUsers[1].sender_id;
                } else if (msgUsers.length === 1) {
                    const [recvUsers] = await connection.query(
                        'SELECT DISTINCT receiver_id FROM messages WHERE room_id = ? AND receiver_id != 0 LIMIT 1',
                        [room_id]
                    );
                    user1Id = msgUsers[0].sender_id;
                    user2Id = recvUsers.length > 0 ? recvUsers[0].receiver_id : null;
                }
            }

            if (!user1Id || !user2Id || user1Id === user2Id) {
                console.log(`      Skipping room ${room_id} — cannot determine 2 distinct users.`);
                continue;
            }

            // Verify users exist
            const [userCheck] = await connection.query(
                'SELECT id FROM users WHERE id IN (?, ?)',
                [user1Id, user2Id]
            );
            if (userCheck.length < 2) {
                console.log(`      Skipping room ${room_id} — user(s) not found.`);
                continue;
            }

            // Normalize: always store min_id as user1, max_id as user2
            const minId = Math.min(user1Id, user2Id);
            const maxId = Math.max(user1Id, user2Id);
            const newRoomId = `room_${minId}_${maxId}`;

            // Get last message
            const [lastMsgs] = await connection.query(
                'SELECT content, message_type, createdAt FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT 1',
                [room_id]
            );
            if (lastMsgs.length === 0) continue;
            const lastMsg = lastMsgs[0];

            // Count unread for each user
            const [unread1] = await connection.query(
                'SELECT COUNT(*) as cnt FROM messages WHERE room_id = ? AND receiver_id = ? AND is_read = 0',
                [room_id, minId]
            );
            const [unread2] = await connection.query(
                'SELECT COUNT(*) as cnt FROM messages WHERE room_id = ? AND receiver_id = ? AND is_read = 0',
                [room_id, maxId]
            );

            // Update room_id in messages to new normalized format
            if (room_id !== newRoomId) {
                await connection.query('UPDATE messages SET room_id = ? WHERE room_id = ?', [newRoomId, room_id]);
            }

            await connection.query(`
                INSERT INTO room_chats 
                    (id, user1_id, user2_id, last_message, last_message_type, last_message_at, unread_user1, unread_user2)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    last_message = VALUES(last_message),
                    last_message_type = VALUES(last_message_type),
                    last_message_at = VALUES(last_message_at),
                    unread_user1 = VALUES(unread_user1),
                    unread_user2 = VALUES(unread_user2)
            `, [
                newRoomId, minId, maxId,
                lastMsg.content, lastMsg.message_type || 'text', lastMsg.createdAt,
                unread1[0].cnt, unread2[0].cnt
            ]);

            migratedCount++;
            console.log(`      Migrated: ${room_id} → ${newRoomId} (user${minId} ↔ user${maxId})`);
        }
        console.log(`\n      Migrated ${migratedCount} room(s).\n`);

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('[5/5] Verifying...');
        const [result] = await connection.query('SELECT COUNT(*) as cnt FROM room_chats');
        console.log(`      room_chats table has ${result[0].cnt} row(s).`);

        console.log('\n=== Migration v4 COMPLETED successfully! ===\n');
    } catch (error) {
        console.error('\n[ERROR] Migration v4 failed:', error);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
        process.exit(1);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

migrate();
