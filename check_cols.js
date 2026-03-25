const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'jmart_db'
        });

        const [cols] = await conn.execute('SHOW COLUMNS FROM driver_profiles');
        console.log("DRIVER_PROFILES COLUMNS:", JSON.stringify(cols, null, 2));

        const [users] = await conn.execute('SELECT name, profile_image_url FROM users WHERE name LIKE "%Agus Mantap%"');
        console.log("AGUS USER:", JSON.stringify(users, null, 2));

        await conn.end();
    } catch (err) {
        console.error(err);
    }
})();
