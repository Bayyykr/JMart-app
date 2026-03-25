require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testAccept() {
    // 1. Generate token for user 5
    const token = jwt.sign({ id: 5 }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    
    // 2. We need an active broadcast offer. Let's insert a test one to DB first
    const mysql = require('mysql2/promise');
    const db = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jmart_db',
    });

    // Assume user 5 has broadcast 7 open, we'll insert a fake offer from driver 6
    const [offerRes] = await db.query('INSERT INTO broadcast_offers (broadcast_id, driver_id, price, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status="pending"', [7, 6, 25000, 'pending']);
    const offer_id = offerRes.insertId;

    try {
        console.log(`Sending accept-offer for offer_id: ${offer_id}`);
        const res = await axios.post('http://localhost:5000/api/user/broadcasts/accept-offer', {
            broadcast_id: 7,
            offer_id: offer_id,
            driver_id: 6
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error from API:");
        console.error(err.response?.data);
    }
    
    // Also try to read the accept_offer_error.json if created
    try {
        const errJson = require('fs').readFileSync('./accept_offer_error.json', 'utf8');
        console.log("File accept_offer_error.json:", JSON.parse(errJson));
    } catch(e) {
        console.log("No error file created.");
    }
    
    process.exit(0);
}

testAccept();
