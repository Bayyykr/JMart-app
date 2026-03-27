const pool = require('./config/db');

async function update() {
    try {
        console.log('--- Applying Update V3 (Deactivation & Product Hiding) ---');

        // 1. Add is_active to products table
        console.log('Adding is_active to products...');
        try {
            await pool.execute('ALTER TABLE products ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER close_time');
            console.log('Added is_active to products.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column is_active already exists in products.');
            } else {
                throw err;
            }
        }

        // 2. Ensure is_active in users is properly indexed (for performance on login/auth)
        console.log('Adding index to users(is_active)...');
        try {
            await pool.execute('CREATE INDEX idx_user_active ON users(is_active)');
        } catch (err) {
            console.log('Index idx_user_active might already exist, skipping.');
        }

        console.log('--- Update V3 Applied Successfully ---');
    } catch (err) {
        console.error('Update V3 failed:', err.message);
    } finally {
        process.exit(0);
    }
}

update();
