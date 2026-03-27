const db = require('./src/config/db');

async function main() {
    try {
        const [profiles] = await db.query("SELECT user_id, city, latitude, longitude FROM merchant_profiles");
        console.log('Merchant Profiles:', JSON.stringify(profiles, null, 2));

        const [products] = await db.query("SELECT id, name, seller, seller_id FROM products");
        console.log('Products:', JSON.stringify(products, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}

main();
