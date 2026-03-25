const db = require('./backend/src/config/db');

async function checkSchema() {
    try {
        const [users] = await db.query('SHOW CREATE TABLE users');
        console.log('--- USERS TABLE ---');
        console.log(users[0]['Create Table']);
        
        const [orders] = await db.query('SHOW CREATE TABLE orders');
        console.log('\n--- ORDERS TABLE ---');
        console.log(orders[0]['Create Table']);
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
