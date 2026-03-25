const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jmart_db'
};

async function checkColumns() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SHOW COLUMNS FROM driver_profiles');
        console.log('COLUMNS_START:' + rows.map(r => r.Field).join(',') + ':COLUMNS_END');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkColumns();
