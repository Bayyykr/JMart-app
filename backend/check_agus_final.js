const db = require('./src/config/db');

async function check() {
    try {
        const [rows] = await db.query("SELECT id, name, profile_image_url FROM users WHERE name LIKE '%Agus%'");
        console.log("AGUS ROWS:", JSON.stringify(rows, null, 2));
        
        const [all] = await db.query("SELECT id, name FROM users LIMIT 10");
        console.log("FIRST 10 USERS:", JSON.stringify(all, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
