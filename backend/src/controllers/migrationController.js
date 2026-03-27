const fs = require('fs');
const path = require('path');
const db = require('../config/db');

exports.migrate = async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '../../database.sql');
        if (!fs.existsSync(sqlPath)) {
            return res.status(404).json({ success: false, message: `SQL file not found at ${sqlPath}` });
        }

        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove USE and CREATE DATABASE statements as Railway handles these
        sql = sql.replace(/CREATE DATABASE IF NOT EXISTS.*;/gi, '-- skipped create db');
        sql = sql.replace(/USE .*;|USE .*\n/gi, '-- skipped use db');

        console.log(`[MIGRATION] Running full migration from ${sqlPath}...`);

        // Execute as one big block since we enabled multipleStatements: true
        const [result] = await db.query(sql);

        res.json({
            success: true,
            message: "Migration completed successfully",
            details: Array.isArray(result) ? `Executed ${result.length} statements` : "Executed script"
        });
    } catch (error) {
        console.error('[MIGRATION ERROR]', error);
        res.status(500).json({
            success: false,
            message: "Migration failed",
            error: error.message
        });
    }
};
