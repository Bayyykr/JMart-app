const m = require('mysql2/promise');
require('dotenv').config();
m.createConnection({host:'127.0.0.1',user:'root',password:'',database:'jmart_db'}).then(async c => {
    const [r] = await c.query("SHOW COLUMNS FROM orders LIKE 'status'");
    const type = r[0] ? r[0].Type : '';
    console.log('orders.status:', type);

    if (!type.includes('Menunggu')) {
        console.log('Adding Menunggu to orders.status ENUM...');
        await c.query("ALTER TABLE orders MODIFY COLUMN status ENUM('Selesai','Dalam Perjalanan','Diproses','Dibatalkan','Menunggu') DEFAULT 'Diproses'");
        console.log('Done!');
    } else {
        console.log('Menunggu already exists in orders.status');
    }
    c.end();
});
