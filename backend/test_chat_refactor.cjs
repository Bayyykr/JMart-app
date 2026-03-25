const axios = require('axios');

async function testAutomation() {
    const API_URL = 'http://localhost:5000/api';
    const TEST_USER = { email: 'user@jmart.com', password: 'password123' };
    
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;
        console.log('Logged in as user ID:', userId);

        // 2. Test send automated message
        console.log('Testing automated message...');
        const roomId = `driver-2-user-${userId}`;
        const sendRes = await axios.post(`${API_URL}/chat/send`, {
            room_id: roomId,
            receiver_id: 2,
            content: 'Test Automated Message from Script',
            message_type: 'text'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Message sent:', sendRes.data);

        // 3. Verify chat list
        console.log('Verifying chat list...');
        const listRes = await axios.get(`${API_URL}/chat/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const chat = listRes.data.find(c => c.room_id === roomId);
        if (chat) {
            console.log('SUCCESS: Chat found in list with content:', chat.content);
        } else {
            console.log('FAILED: Chat not found in list');
        }

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testAutomation();
