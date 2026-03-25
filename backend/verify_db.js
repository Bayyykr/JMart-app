const pool = require('./src/config/db');

async function verify() {
    try {
        console.log('Verifying orders table...');
        const [orderCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'total_price'");
        if (orderCols.length > 0) {
            console.log('✅ orders.total_price exists');
        } else {
            console.error('❌ orders.total_price is MISSING');
        }

        console.log('Verifying driver_profiles table...');
        const [driverCols] = await pool.query("SHOW COLUMNS FROM driver_profiles LIKE 'revenue'");
        if (driverCols.length > 0) {
            console.log('✅ driver_profiles.revenue exists');
        } else {
            console.error('❌ driver_profiles.revenue is MISSING');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

verify();
