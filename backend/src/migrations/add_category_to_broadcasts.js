const pool = require('../config/db');

async function runMigration() {
    try {
        console.log('Running migration: adding category and order_id to broadcasts table...');

        // 1. Add category column
        try {
            await pool.execute("ALTER TABLE broadcasts ADD COLUMN category ENUM('Antar Jemput', 'Makanan', 'Barang dan Jasa') DEFAULT 'Antar Jemput' AFTER notes");
            console.log('Added category column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Category column already exists.');
            } else {
                throw err;
            }
        }

        // 2. Add order_id column (optional link to orders table)
        try {
            await pool.execute("ALTER TABLE broadcasts ADD COLUMN order_id VARCHAR(50) AFTER category");
            console.log('Added order_id column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('order_id column already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}

runMigration();
