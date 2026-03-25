const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jmart_db'
};

const firstNames = ['Budi', 'Siti', 'Agus', 'Dewi', 'Rully', 'Andi', 'Eka', 'Hendra', 'Maya', 'Roni', 'Vina', 'Dedi', 'Lusi', 'Wawan', 'Yuli', 'Asep', 'Diana', 'Zaki', 'Putri', 'Fajar'];
const lastNames = ['Santoso', 'Lestari', 'Saputra', 'Wijaya', 'Kurniawan', 'Pratama', 'Hidayat', 'Putri', 'Sari', 'Ramadhan', 'Utami', 'Nugroho', 'Fauzi', 'Basuki', 'Setiawan'];
const bikes = ['Honda Beat', 'Yamaha NMAX', 'Honda Vario', 'Honda Scoopy', 'Yamaha Mio', 'Suzuki Nex II'];
const platePrefix = ['P', 'P', 'P', 'P']; // Mostly P for Jember/Banyuwangi

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCoordinate(base, range) {
    return base + (Math.random() * range - range / 2);
}

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Seeding 55 drivers...');

        const timestampToken = Date.now();

        for (let i = 0; i < 55; i++) {
            const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)} ${i}`;
            const email = `driver_${timestampToken}_${i}@jmart.com`;
            const bike = getRandomItem(bikes);
            const plate = `${getRandomItem(platePrefix)} ${Math.floor(Math.random() * 8999) + 1000} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
            
            const isBanyuwangi = Math.random() > 0.5;
            const baseLat = isBanyuwangi ? -8.2192 : -8.1724; 
            const baseLng = isBanyuwangi ? 114.3692 : 113.7003;
            
            const lat = getRandomCoordinate(baseLat, 0.4); 
            const lng = getRandomCoordinate(baseLng, 0.4);

            const [userResult] = await connection.execute(
                'INSERT INTO users (name, email, password, role, profile_image_url) VALUES (?, ?, ?, ?, ?)',
                [name, email, '$2b$10$SomethingRandom', 'driver', `https://i.pravatar.cc/150?u=${email}`]
            );
            const userId = userResult.insertId;

            const area = isBanyuwangi ? 'Tegalharjo, Glenmore' : 'Kaliwates, Jember';
            await connection.execute(
                `INSERT INTO driver_profiles 
                 (user_id, vehicle_model, vehicle_plate, rating, total_trips, status, area, latitude, longitude, description) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, bike, plate, 
                    (Math.random() * 1.5 + 3.5).toFixed(1), 
                    Math.floor(Math.random() * 500), 
                    'verified', 
                    area, lat, lng, 
                    isBanyuwangi ? 'Kabupaten Banyuwangi' : 'Kabupaten Jember'
                ]
            );
        }

        console.log('Seeding completed.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
