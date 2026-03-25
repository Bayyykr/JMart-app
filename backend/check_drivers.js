const db = require('./src/config/db');

async function test() {
    try {
        const [rows] = await db.query('SELECT user_id, revenue FROM driver_profiles');
        console.log('Driver Profiles:', rows);

        const [orderRows] = await db.query('SELECT user_id, COUNT(*) as c FROM orders GROUP BY user_id');
        console.log('Orders per user:', orderRows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
