const db = require('./src/config/db');

async function main() {
    try {
        await db.execute("ALTER TABLE merchant_profiles ADD COLUMN store_image_url VARCHAR(255) AFTER product_description");
        console.log('Successfully added store_image_url');
    } catch (e) {
        if (e.message.includes('Duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.error('ERROR:', e.message);
        }
    }
    process.exit(0);
}

main();
