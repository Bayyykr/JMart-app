const pool = require('./backend/src/config/db');

async function fix() {
    try {
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', ['driver@jmart.com']);
        if (users.length === 0) {
            console.log('Driver user not found');
            return;
        }
        const driverId = users[0].id;

        const [profiles] = await pool.execute('SELECT id FROM driver_profiles WHERE user_id = ?', [driverId]);
        if (profiles.length === 0) {
            console.log('Creating missing profile for Driver Satu (ID: ' + driverId + ')');
            await pool.execute(
                'INSERT INTO driver_profiles (user_id, ktp_number, vehicle_type, vehicle_plate, status) VALUES (?, ?, ?, ?, ?)',
                [driverId, '3512345678901234', 'Motor', 'P 5678 CD', 'verified']
            );
            console.log('Profile created successfully');
        } else {
            console.log('Profile already exists for Driver Satu. Ensuring it is verified...');
            await pool.execute('UPDATE driver_profiles SET status = ? WHERE user_id = ?', ['verified', driverId]);
            console.log('Status updated to verified');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

fix();
