const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Needs to be require() or use native if Node 18+

// Assuming Node 18+, fetch is global
async function test() {
    try {
        // Generate valid token for user 17 (customer@gmail.com)
        const token = jwt.sign({ id: 17, role: 'user' }, 'jmart_secret_key', { expiresIn: '1h' });
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        console.log('Sending /user/orders...');
        const res = await fetch('http://localhost:5000/user/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: 'Antar Jemput', notes: 'Dari A Ke B' })
        });
        
        console.log('Status:', res.status);
        console.log('Body:', await res.text());

        console.log('Sending /chat/send...');
        const chatRes = await fetch('http://localhost:5000/chat/send', {
            method: 'POST',
            headers,
            body: JSON.stringify({ room_id: 'room_17_19', receiver_id: 19, content: 'Test', message_type: 'text' })
        });
        console.log('Chat status:', chatRes.status);
        console.log('Chat Body:', await chatRes.text());

    } catch(e) {
        console.error('Test error:', e);
    }
}
test();
