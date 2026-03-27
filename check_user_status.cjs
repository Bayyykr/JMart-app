const db = require('./backend/src/config/db');
// The above works if running from root of repo.

async function check() {
    try {
        const [rows] = await db.query('SELECT id, name, email, is_active FROM users LIMIT 10');
        console.log('User Status List:');
        console.table(rows);
        
        const [deactivated] = await db.query('SELECT count(*) as count FROM users WHERE is_active = 0');
        console.log('Total Deactivated Users:', deactivated[0].count);
        
        const [active] = await db.query('SELECT count(*) as count FROM users WHERE is_active = 1');
        console.log('Total Active Users:', active[0].count);
        
        const [nullStatus] = await db.query('SELECT count(*) as count FROM users WHERE is_active IS NULL');
        console.log('Total Users with NULL status:', nullStatus[0].count);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
