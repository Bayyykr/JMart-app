const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('--- Connecting to TiDB ---');
    const pool = mysql.createPool({
        host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        user: 'R2FhmF9Vw4TPJJg.root',
        password: 'kIg5cCunaAdmjIZ9',
        database: 'test',
        port: 4000,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        const sqlPath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);

        console.log(`--- Running ${statements.length} Schema statements ---`);
        for (let i = 0; i < statements.length; i++) {
            let statement = statements[i];
            try {
                if(statement.trim().startsWith('INSERT') || statement.trim().startsWith('CREATE') || statement.trim().startsWith('ALTER')) {
                    await pool.query(statement);
                    console.log(`[${i+1}/${statements.length}] SUCCESS`);
                }
            } catch (err) {
                if(!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
                   console.error(`[${i+1}/${statements.length}] ERROR:`, err.message);
                }
            }
        }
        console.log('--- Base SQL applied successfully ---');

        // Apply V3 logic incrementally
        try { await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1'); console.log('Added is_active to products'); } catch (e) {}
        try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1'); } catch (e) {}
        try { await pool.query('CREATE INDEX idx_user_active ON users(is_active)'); console.log('Added is_active index to users'); } catch (e) {}

        console.log('--- ALL DONE! ---');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

migrate();
