async function testBooking() {
    try {
        const loginRes = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'customer@gmail.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        console.log('1. Calling /user/orders...');
        const orderRes = await fetch('http://localhost:5000/user/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: 'Antar Jemput', notes: 'Dari Test, Ke Test' })
        });
        console.log('Order status:', orderRes.status);
        console.log('Order resp:', await orderRes.text());

        console.log('2. Calling /chat/send...');
        const chatRes = await fetch('http://localhost:5000/chat/send', {
            method: 'POST',
            headers,
            body: JSON.stringify({ room_id: 'room_17_19', receiver_id: 19, content: 'Booking message', message_type: 'text' })
        });
        console.log('Chat status:', chatRes.status);
        console.log('Chat resp:', await chatRes.text());
    } catch(e) {
        console.error('Error:', e);
    }
}
testBooking();
