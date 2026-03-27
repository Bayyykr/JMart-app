const db = require('./src/config/db');

async function main() {
    try {
        const [r] = await db.query('DESCRIBE merchant_profiles');
        console.log(JSON.stringify(r, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit(0);
}

main();
