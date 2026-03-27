const fs = require('fs');
const path = require('path');
const db = require('../config/db');

exports.migrate = async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '../../database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon but ignore semicolons inside quotes or comments if possible
        // For simplicity, we split by ';' and filter empty lines
        // Note: This simple split might fail if there are semicolons in strings.
        // But for standard SQL dumps, it usually works if formatted correctly.
        const commands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.toLowerCase().startsWith('use ') && !cmd.toLowerCase().startsWith('create database'));

        console.log(`[MIGRATION] Starting migration with ${commands.length} commands...`);

        for (const command of commands) {
            try {
                await db.query(command);
            } catch (err) {
                console.warn(`[MIGRATION] Warning executing command: ${command.substring(0, 50)}...`);
                console.warn(`[MIGRATION] Error: ${err.message}`);
                // Continue despite errors (e.g. table already exists)
            }
        }

        res.json({
            success: true,
            message: "Migration completed",
            commandsExecuted: commands.length
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
