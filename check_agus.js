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

        // 1. Check user "Agus Mantap"
        const [users] = await conn.execute('SELECT id, name, profile_image_url FROM users WHERE name LIKE "%Agus Mantap%"');
        console.log("USER DATA:", JSON.stringify(users, null, 2));

        if (users.length > 0) {
            const userId = users[0].id;
            // 2. Check Jastip for this user
            const [jastips] = await conn.execute('SELECT * FROM jastips WHERE driver_id = ?', [userId]);
            console.log("JASTIP DATA:", JSON.stringify(jastips, null, 2));
        }

        await conn.end();
    } catch (err) {
        console.error(err);
    }
})();
