const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [users] = await connection.execute('SELECT id, email, role FROM users');
        console.log('--- USERS ---');
        console.table(users);

        const [profiles] = await connection.execute('SELECT * FROM driver_profiles');
        console.log('--- DRIVER PROFILES ---');
        console.table(profiles);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
