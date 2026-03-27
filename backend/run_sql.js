const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSQL() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'jmart_db',
        multipleStatements: true
    });

    const sql = fs.readFileSync('database.sql', 'utf8');
    console.log('Running database.sql...');
    await connection.query(sql);
    console.log('Done!');
    connection.end();
}

runSQL().catch(console.error);
