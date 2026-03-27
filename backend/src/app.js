const express = require('express');
const cors = require('cors');
const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const merchantRoutes = require('./routes/merchantRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/merchant', merchantRoutes);

app.get('/api', (req, res) => {
    res.json({ message: "JMart API is Live", version: "1.0.0" });
});

// Temporary migration endpoint for TiDB setup
app.get('/api/migrate', async (req, res) => {
    try {
        const pool = require('./config/db');
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(path.join(__dirname, '../../backend/database.sql'), 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        let logs = [];
        for (let statement of statements) {
            try {
                if(statement.trim().startsWith('INSERT') || statement.trim().startsWith('CREATE') || statement.trim().startsWith('ALTER')) {
                    await pool.query(statement);
                    logs.push('SUCCESS: ' + statement.substring(0, 30).trim() + '...');
                }
            } catch (err) {
                if(!err.message.includes('already exists')) logs.push('ERROR: ' + err.message);
            }
        }
        
        // V3 updates
        try { await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1'); } catch(e){}
        try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1'); } catch(e){}
        try { await pool.query('CREATE INDEX idx_user_active ON users(is_active)'); } catch(e){}

        res.json({ message: "Migration Completed", logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = app;
