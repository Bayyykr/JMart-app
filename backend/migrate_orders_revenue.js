const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding total_price to orders...');
        await pool.query('ALTER TABLE orders ADD COLUMN total_price INT DEFAULT 0');
        console.log('✅ orders.total_price added.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ orders.total_price already exists.');
        else console.error('Error on orders:', e);
    }

    try {
        console.log('Adding revenue to driver_profiles...');
        await pool.query('ALTER TABLE driver_profiles ADD COLUMN revenue INT DEFAULT 0');
        console.log('✅ driver_profiles.revenue added.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ driver_profiles.revenue already exists.');
        else console.error('Error on driver_profiles:', e);
    }

    process.exit(0);
}

migrate();
