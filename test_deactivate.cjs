const db = require('./backend/src/config/db');

async function test() {
    try {
        const userId = 2; // User Jember
        console.log('--- Testing Deactivation (Status: false) ---');
        await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [false, userId]);
        
        let [rows] = await db.query('SELECT name, email, is_active FROM users WHERE id = ?', [userId]);
        console.log('Result for User ID 2:', rows[0]);
        
        console.log('--- Testing Activation (Status: true) ---');
        await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [true, userId]);
        
        [rows] = await db.query('SELECT name, email, is_active FROM users WHERE id = ?', [userId]);
        console.log('Result for User ID 2:', rows[0]);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
