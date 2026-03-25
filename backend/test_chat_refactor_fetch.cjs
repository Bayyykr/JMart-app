async function testAutomation() {
    const API_URL = 'http://localhost:5000/api';
    const TEST_USER = { email: 'user@jmart.com', password: 'password123' };
    
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
        
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('Logged in as user ID:', userId);

        // 2. Test send automated message
        console.log('Testing automated message...');
        const roomId = `driver-2-user-${userId}`;
        const sendRes = await fetch(`${API_URL}/chat/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                room_id: roomId,
                receiver_id: 2,
                content: 'Test Automated Message from Script (Fetch v2)',
                message_type: 'text'
            })
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok) throw new Error(sendData.message || 'Send message failed');
        
        console.log('Message sent successfully');

        // 3. Verify chat list
        console.log('Verifying chat list...');
        const listRes = await fetch(`${API_URL}/chat/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listRes.json();
        
        if (!Array.isArray(listData)) {
            console.error('FAILED: listData is not an array:', listData);
            return;
        }

        const chat = listData.find(c => c.room_id === roomId);
        if (chat) {
            console.log('SUCCESS: Chat found in list with content:', chat.content);
        } else {
            console.log('FAILED: Chat not found in list. Available rooms:', listData.map(c => c.room_id));
        }

    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testAutomation();
