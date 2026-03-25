const db = require('./src/config/db');
async function check() {
    try {
        const [rows] = await db.query('SELECT id, name, email, role FROM users ORDER BY id ASC LIMIT 20');
        console.log('--- USERS ---');
        rows.forEach(u => console.log(`${u.id} | ${u.role} | ${u.email} | ${u.name}`));
        console.log('--- END ---');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
