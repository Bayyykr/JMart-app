const db = require('./src/config/db');

async function main() {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.name, mp.city, mp.latitude, mp.longitude, p.name as product_name
            FROM users u
            LEFT JOIN merchant_profiles mp ON u.id = mp.user_id
            LEFT JOIN products p ON u.id = p.seller_id
            WHERE u.name LIKE '%Berkah%'
        `);
        console.log('Result:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}

main();
