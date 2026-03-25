const db = require('./src/config/db');

async function test() {
    try {
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const orderDate = new Date().toISOString().split('T')[0];
        console.log('Inserting order...');
        
        await db.execute(
            'INSERT INTO orders (id, user_id, type, status, orderDate, notes) VALUES (?, ?, ?, "Diproses", ?, ?)',
            [orderId, 17, 'Antar Jemput', orderDate, 'Dari: Test, Ke: Test']
        );
        console.log('Order created successfully!');
    } catch (e) {
        console.error('Error inserting order:', e.message);
    } finally {
        process.exit(0);
    }
}

test();
