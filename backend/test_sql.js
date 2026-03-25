const db = require('./src/config/db');

async function test() {
    try {
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];
        
        console.log('Inserting order...');
        await db.execute(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes, total_price) VALUES (?, ?, ?, "Diproses", ?, ?, ?)',
            [orderId, 17, 'Antar Jemput', orderDate, 'Dari: A, Ke: B', 15000]
        );
        console.log('Order inserted successfully');
    } catch (e) {
        console.error('Insert error:', e.message);
    } finally {
        process.exit(0);
    }
}
test();
