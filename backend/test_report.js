const axios = require('axios');

async function testReport() {
    const baseURL = 'http://localhost:5000/api';
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Token acquired');

        // 2. Submit report
        console.log('Submitting report...');
        try {
            const reportRes = await axios.post(`${baseURL}/reports`, {
                reported_user_id: 74, // Berkah Abadi
                order_id: null,
                reason: 'Test Reason',
                description: 'Test Description'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Report Success:', reportRes.data);
        } catch (err) {
            console.error('Report Failure:', err.response?.data || err.message);
        }
    } catch (err) {
        console.error('Login Failure:', err.response?.data || err.message);
    }
}

testReport();
