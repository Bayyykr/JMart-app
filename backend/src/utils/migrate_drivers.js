const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jmart_db'
};

async function migrate() {
    let connection;
    try {
        console.log('Starting migration...');
        connection = await mysql.createConnection(dbConfig);

        // 1. Get all from drivers_info
        const [mockDrivers] = await connection.execute('SELECT * FROM drivers_info');
        console.log(`Found ${mockDrivers.length} drivers in drivers_info.`);

        for (const driver of mockDrivers) {
            try {
                // Check if user already exists
                const [existingUser] = await connection.execute('SELECT id FROM users WHERE name = ?', [driver.name]);
                
                let userId;
                if (existingUser.length > 0) {
                    userId = existingUser[0].id;
                } else {
                    const email = `${driver.name.toLowerCase().replace(/\s+/g, '')}_${Math.floor(Math.random() * 1000)}@jmart.com`;
                    const [userResult] = await connection.execute(
                        'INSERT INTO users (name, email, password, role, profile_image_url) VALUES (?, ?, ?, ?, ?)',
                        [driver.name, email, '$2b$10$SomethingRandomForMock', 'driver', driver.profile_image]
                    );
                    userId = userResult.insertId;
                }

                const [existingProfile] = await connection.execute('SELECT id FROM driver_profiles WHERE user_id = ?', [userId]);
                const formattedArea = (driver.area || '').replace(/\s*[/]\s*/g, ', ');
                
                let kabupaten = 'Jember';
                if (formattedArea.toLowerCase().includes('glenmore') || formattedArea.toLowerCase().includes('banyuwangi') || formattedArea.toLowerCase().includes('tegalharjo')) {
                    kabupaten = 'Banyuwangi';
                }

                if (existingProfile.length === 0) {
                    await connection.execute(
                        `INSERT INTO driver_profiles 
                         (user_id, vehicle_model, vehicle_plate, rating, total_trips, status, area, last_lat, last_lng, description) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            userId, 
                            driver.vehicle_model || driver.car || 'Motorcycle', 
                            driver.car ? driver.car.split(' - ')[1] || 'P 0000 XX' : 'P 0000 XX',
                            driver.rating || 5.0,
                            driver.trips || 0,
                            'verified',
                            formattedArea,
                            driver.lat,
                            driver.lng,
                            `Regency: ${kabupaten}`
                        ]
                    );
                } else {
                    await connection.execute(
                        `UPDATE driver_profiles SET 
                         area = ?, last_lat = ?, last_lng = ?, status = 'verified', description = ?
                         WHERE user_id = ?`,
                        [formattedArea, driver.lat, driver.lng, `Regency: ${kabupaten}`, userId]
                    );
                }
            } catch (driverError) {
                console.error(`Failed to migrate driver ${driver.name}:`, driverError.message);
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
