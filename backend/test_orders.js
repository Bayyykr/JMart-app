const db = require('./src/config/db');

async function test() {
    try {
        const [rows] = await db.query(`
            SELECT o.*, d.name AS driver_name 
            FROM orders o 
            LEFT JOIN users d ON o.driver_id = d.id 
            ORDER BY o.createdAt DESC
        `);
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
