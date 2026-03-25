const mysql = require('mysql2/promise');

async function debug() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jmart_db'
    };

    let connection;
    try {
        console.log("--- START DEBUG ---");
        connection = await mysql.createConnection(config);

        // 1. Check User
        const [users] = await connection.execute('SELECT id, name, role FROM users WHERE name LIKE "%Agus%"');
        console.log("1. Users matching 'Agus':", JSON.stringify(users, null, 2));

        if (users.length > 0) {
            const userId = users[0].id;

            // 2. Check Driver Profile
            const [profiles] = await connection.execute('SELECT * FROM driver_profiles WHERE user_id = ?', [userId]);
            console.log("2. Driver Profile for User ID", userId, ":", JSON.stringify(profiles, null, 2));

            // 3. Check Drivers Info
            const [info] = await connection.execute('SELECT * FROM drivers_info WHERE name LIKE "%Agus%"');
            console.log("3. Mapping in drivers_info:", JSON.stringify(info, null, 2));
        } else {
            console.log("No user found with name Agus");
        }

        console.log("--- END DEBUG ---");
    } catch (err) {
        console.error("DEBUG ERROR:", err);
    } finally {
        if (connection) await connection.end();
    }
}

debug();
