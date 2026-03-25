const db = require('./src/config/db');
const fs = require('fs');

async function checkSchema() {
    try {
        const [users] = await db.query('SHOW CREATE TABLE users');
        const [orders] = await db.query('SHOW CREATE TABLE orders');
        
        let output = '--- USERS TABLE ---\n' + users[0]['Create Table'] + '\n\n';
        output += '--- ORDERS TABLE ---\n' + orders[0]['Create Table'] + '\n';
        
        fs.writeFileSync('schema_info.txt', output);
        console.log('Schema info written to schema_info.txt');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
