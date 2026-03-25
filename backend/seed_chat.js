const db = require('./src/config/db');
async function seed() {
    try {
        const [users] = await db.query('SELECT id, name, email FROM users WHERE email="john@email.com" OR role="driver" LIMIT 5');
        console.log('Found users:', JSON.stringify(users));
        
        const john = users.find(u => u.email === 'john@email.com');
        const driver = users.find(u => u.id !== (john ? john.id : null));
        
        if (!john || !driver) {
            console.error('Could not find john or driver');
            process.exit(1);
        }
        
        console.log(`Seeding message between ${john.id} (John) and ${driver.id} (Driver)`);
        
        const roomId = `driver-${driver.id}`;
        
        await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, room_id, content) VALUES (?, ?, ?, ?)',
            [john.id, driver.id, roomId, 'Hello driver, I need a ride']
        );
        
        await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, room_id, content) VALUES (?, ?, ?, ?)',
            [driver.id, john.id, roomId, 'Sure, I am on my way!']
        );
        
        console.log('Seeding completed successfully');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
seed();
