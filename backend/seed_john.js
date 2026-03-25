const db = require('./src/config/db');
async function seed() {
    try {
        console.log('Seeding john@email.com user and messages...');
        
        // 1. Create john@email.com
        const [johnRows] = await db.query('SELECT id FROM users WHERE email = "john@email.com"');
        let johnId;
        if (johnRows.length === 0) {
            const [result] = await db.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['John Doe', 'john@email.com', '123456', 'user']
            );
            johnId = result.insertId;
            console.log(`Created John Doe with ID: ${johnId}`);
        } else {
            johnId = johnRows[0].id;
            console.log(`John Doe already exists with ID: ${johnId}`);
        }
        
        // 2. Find a driver (e.g. ID 2 or 15)
        const [driverRows] = await db.query('SELECT id FROM users WHERE role = "driver" LIMIT 1');
        if (driverRows.length === 0) {
            console.error('No driver found in database!');
            process.exit(1);
        }
        const driverId = driverRows[0].id;
        console.log(`Using driver ID: ${driverId}`);
        
        // 3. Seed messages
        const roomId = `driver-${driverId}`;
        
        // Clear old messages for this test
        await db.execute('DELETE FROM messages WHERE room_id = ?', [roomId]);
        
        await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, room_id, content) VALUES (?, ?, ?, ?)',
            [johnId, driverId, roomId, 'Halo, apakah bisa antar saya ke terminal?']
        );
        
        await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, room_id, content) VALUES (?, ?, ?, ?)',
            [driverId, johnId, roomId, 'Halo! Bisa, saya sedang menuju ke lokasi Anda.']
        );
        
        console.log('Seed successful!');
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        process.exit();
    }
}
seed();
