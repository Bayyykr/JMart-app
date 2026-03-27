const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'jmart_db',
});

async function checkSchema() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', JSON.stringify(tables));
        for (let table of tables) {
            const tableName = Object.values(table)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`Columns in ${tableName}:`, JSON.stringify(columns));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
