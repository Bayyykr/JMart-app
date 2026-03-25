require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jmart_db',
    });

    const [offers] = await db.query('SELECT * FROM broadcast_offers');
    console.log("Broadcast Offers in DB:", JSON.stringify(offers, null, 2));

    const [messages] = await db.query('SELECT * FROM messages WHERE message_type = "broadcast_offer" ORDER BY id DESC LIMIT 5');
    console.log("Recent Broadcast Offer Messages:", JSON.stringify(messages, null, 2));

    process.exit(0);
}
main();
