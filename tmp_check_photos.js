const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jmart_db'
        });
        const [rows] = await conn.execute('SELECT name, role, profile_image_url FROM users WHERE role = "driver" LIMIT 5');
        console.log("DRIVER PHOTOS CHECK:");
        console.log(JSON.stringify(rows, null, 2));
        
        const [jastips] = await conn.execute('SELECT id, store_name, close_order_time FROM jastips LIMIT 3');
        console.log("JASTIP DATA CHECK (Time format):");
        console.log(JSON.stringify(jastips, null, 2));

        await conn.end();
    } catch (err) {
        console.error(err);
    }
})();
