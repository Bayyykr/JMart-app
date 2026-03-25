const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Starting chat database migration...');
        
        // Check if message_type column exists
        const [cols] = await db.query('SHOW COLUMNS FROM messages');
        const hasMessageType = cols.some(col => col.Field === 'message_type');
        const hasFileUrl = cols.some(col => col.Field === 'file_url');
        
        if (!hasMessageType) {
            console.log('Adding message_type column...');
            await db.query(`ALTER TABLE messages ADD COLUMN message_type ENUM('text', 'image', 'file', 'order') DEFAULT 'text'`);
        } else {
            console.log('message_type column already exists.');
        }
        
        if (!hasFileUrl) {
            console.log('Adding file_url column...');
            await db.query(`ALTER TABLE messages ADD COLUMN file_url VARCHAR(255) DEFAULT NULL`);
        } else {
            console.log('file_url column already exists.');
        }
        
        console.log('Chat database migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
