const db = require('./backend/src/config/db');
const marketplaceController = require('./backend/src/controllers/marketplaceController');

async function verify() {
    try {
        console.log('--- Verification: Marketplace Filtering ---');
        
        // 1. Setup: Create a verified merchant and an unverified one
        await db.execute('DELETE FROM products WHERE name LIKE "Test %"');
        
        const [m1] = await db.execute('INSERT INTO users (name, email, password, role) VALUES ("M1", "m1@test.com", "pw", "marketplace") ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
        const m1Id = m1.insertId;
        await db.execute('INSERT INTO merchant_profiles (user_id, store_name, store_address, ktp_number, status) VALUES (?, "Test Store Verified", "Addr", "123", "verified") ON DUPLICATE KEY UPDATE status="verified"', [m1Id]);
        
        const [m2] = await db.execute('INSERT INTO users (name, email, password, role) VALUES ("M2", "m2@test.com", "pw", "marketplace") ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
        const m2Id = m2.insertId;
        await db.execute('INSERT INTO merchant_profiles (user_id, store_name, store_address, ktp_number, status) VALUES (?, "Test Store Pending", "Addr", "124", "pending") ON DUPLICATE KEY UPDATE status="pending"', [m2Id]);

        // 2. Setup: Products
        // P1: Verified Merchant, Active -> Should show
        await db.execute('INSERT INTO products (name, seller_id, seller, category, price, is_active) VALUES ("Test P1 Active", ?, "M1", "Makanan", 1000, 1)', [m1Id]);
        // P2: Verified Merchant, Inactive -> Should NOT show
        await db.execute('INSERT INTO products (name, seller_id, seller, category, price, is_active) VALUES ("Test P2 Inactive", ?, "M1", "Makanan", 1000, 0)', [m1Id]);
        // P3: Pending Merchant, Active -> Should NOT show
        await db.execute('INSERT INTO products (name, seller_id, seller, category, price, is_active) VALUES ("Test P3 Pending Merchant", ?, "M2", "Makanan", 1000, 1)', [m2Id]);

        console.log('--- Running Marketplace Fetch ---');
        const req = { query: { category: 'Semua' } };
        const res = { json: (data) => {
            const names = data.map(p => p.name);
            console.log('Products found in marketplace:', names);
            
            const hasP1 = names.includes('Test P1 Active');
            const hasP2 = names.includes('Test P2 Inactive');
            const hasP3 = names.includes('Test P3 Pending Merchant');
            
            if (hasP1 && !hasP2 && !hasP3) {
                console.log('SUCCESS: Filtering is working correctly!');
            } else {
                console.error('FAILURE: Filtering logic is broken.');
                if (!hasP1) console.error('- Missing P1 (Expected)');
                if (hasP2) console.error('- Should not have P2 (Inactive)');
                if (hasP3) console.error('- Should not have P3 (Unverified Merchant)');
            }
        }};
        
        await marketplaceController.getProducts(req, res);
        
        // Cleanup
        await db.execute('DELETE FROM products WHERE name LIKE "Test %"');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verify();
