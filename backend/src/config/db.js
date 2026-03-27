const mysql = require('mysql2/promise');
const path = require('path');

// In Vercel, env vars are injected directly. For local dev, we load .env.
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

// Enable SSL if using a cloud database like TiDB
const isCloudDB = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS, // Suport for Vercel's DB_PASSWORD or DB_PASS
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: isCloudDB ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
