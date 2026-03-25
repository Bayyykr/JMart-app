const m = require('mysql2/promise');
require('dotenv').config();
m.createConnection({host:'127.0.0.1',user:'root',password:'',database:'jmart_db'}).then(async c => {
    const [r] = await c.query("SHOW COLUMNS FROM orders LIKE 'status'");
    console.log('orders.status type:', r[0] ? r[0].Type : 'not found');
    const [r2] = await c.query("SHOW COLUMNS FROM messages LIKE 'message_type'");
    console.log('messages.message_type type:', r2[0] ? r2[0].Type : 'not found');
    const [r3] = await c.query("SHOW COLUMNS FROM jastip_items LIKE 'delivery_point'");
    console.log('jastip_items.delivery_point type:', r3[0] ? r3[0].Type : 'not found');
    c.end();
});
