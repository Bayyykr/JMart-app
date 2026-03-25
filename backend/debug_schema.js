const mysql = require('mysql2/promise');

async function debugSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jmart_db'
    });

    try {
        const [drivers] = await connection.execute('SHOW CREATE TABLE drivers_info');
        console.log('--- DRIVERS_INFO SCHEMA ---');
        console.log(drivers[0]['Create Table']);

        const [products] = await connection.execute('SHOW CREATE TABLE products');
        console.log('\n--- PRODUCTS SCHEMA ---');
        console.log(products[0]['Create Table']);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

debugSchema();
