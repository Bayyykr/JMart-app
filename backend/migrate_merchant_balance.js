const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'jmart_db',
});

async function migrate() {
    try {
        console.log('Adding balance column to merchant_profiles...');
        await pool.query('ALTER TABLE merchant_profiles ADD COLUMN balance INT DEFAULT 0');
        console.log('✅ merchant_profiles.balance added.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ merchant_profiles.balance already exists.');
        else console.error('Error:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
