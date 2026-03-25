CREATE DATABASE IF NOT EXISTS jmart_db;
USE jmart_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'driver', 'admin', 'marketplace') DEFAULT 'user',
    profile_image_url VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mock Data Users
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('User Satu', 'user@jmart.com', 'password123', 'user'),
('Driver Satu', 'driver@jmart.com', 'password123', 'driver'),
('Admin Satu', 'admin@jmart.com', 'password123', 'admin'),
('Toko Berkah', 'berkah@jmart.com', 'password123', 'marketplace'),
('Lisa', 'lisa@jmart.com', 'password123', 'user'),
('Agus Mantap', 'agus@jmart.com', 'password123', 'driver');

-- Tabel Products (Marketplace)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    seller_id INT DEFAULT NULL,
    category ENUM('Makanan', 'Jasa', 'Barang') NOT NULL DEFAULT 'Makanan',
    description TEXT,
    rating FLOAT DEFAULT 0,
    sold INT DEFAULT 0,
    price INT NOT NULL,
    emoji VARCHAR(10),
    condition_status ENUM('Baru', 'Bekas') DEFAULT NULL,
    latitude DOUBLE DEFAULT NULL, -- Fixed store locations
    longitude DOUBLE DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed: Makanan
INSERT IGNORE INTO products (id, name, seller, category, description, rating, sold, price, emoji) VALUES
(1, 'Nasi Goreng Spesial', 'Warung Barokah', 'Makanan', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 4.8, 120, 18000, '🍛'),
(2, 'Es Kopi Susu', 'Kopi Nusantara', 'Makanan', 'Kopi susu dingin dengan gula aren asli', 4.9, 340, 15000, '☕'),
(3, 'Ayam Geprek', 'Geprek Mantul', 'Makanan', 'Ayam geprek sambal bawang level 1-5', 4.7, 89, 20000, '🍗'),
(4, 'Bakso Beranak', 'Bakso Pak Kumis', 'Makanan', 'Bakso jumbo isi bakso kecil, tahu, dan siomay', 4.8, 215, 22000, '🍜'),
(5, 'Sate Ayam Madura', 'Sate H. Mansur', 'Makanan', '10 tusuk sate ayam bumbu kacang khas Madura', 4.9, 178, 25000, '🍢'),
(6, 'Mie Ayam Bakso', 'Mie Ayam Cak To', 'Makanan', 'Mie ayam komplit dengan bakso dan pangsit goreng', 4.6, 156, 17000, '🍜'),
(7, 'Es Teh Manis', 'Warung Barokah', 'Makanan', 'Es teh manis segar dari teh pilihan', 4.5, 420, 5000, '🧊'),
(8, 'Pecel Lele', 'Lesehan Bu Dar', 'Makanan', 'Lele goreng crispy dengan sambal pecel dan lalapan', 4.7, 95, 16000, '🐟');

-- Seed: Jasa (Services)
INSERT IGNORE INTO products (id, name, seller, category, description, rating, sold, price, emoji) VALUES
(9, 'Laundry Kiloan', 'Clean Fresh Laundry', 'Jasa', 'Cuci + setrika, antar jemput gratis min 3kg. Selesai 2 hari.', 4.8, 310, 7000, '🧺'),
(10, 'Cuci Motor', 'Doorsmeer Bersih Jaya', 'Jasa', 'Cuci motor komplit body, mesin, dan velg. Bonus semir ban.', 4.6, 185, 15000, '🏍️'),
(11, 'Cuci Mobil', 'Doorsmeer Bersih Jaya', 'Jasa', 'Cuci mobil luar dalam, poles dashboard, vacuum interior.', 4.7, 120, 45000, '🚗'),
(12, 'Servis AC', 'Teknik Sejuk Jember', 'Jasa', 'Cuci AC + isi freon, garansi 1 bulan, semua merk.', 4.9, 78, 150000, '❄️'),
(13, 'Jasa Jahit', 'Taylor Berkah', 'Jasa', 'Permak celana/baju, jahit baru, obras. Bahan bisa sendiri.', 4.5, 92, 25000, '🧵'),
(14, 'Sedot WC', 'Sedot WC Jember Bersih', 'Jasa', 'Sedot WC mampet, jangkauan seluruh Jember. Alat modern.', 4.4, 45, 350000, '🚽'),
(15, 'Potong Rambut', 'Barbershop Keren', 'Jasa', 'Potong rambut pria, gaya kekinian, free styling pomade.', 4.7, 230, 25000, '💇'),
(16, 'Service HP', 'Phone Fix Jember', 'Jasa', 'Ganti LCD, baterai, konektor charging. Garansi 30 hari.', 4.6, 67, 50000, '📱');

-- Seed: Barang Bekas (Used Items)
INSERT IGNORE INTO products (id, name, seller, category, description, rating, sold, price, emoji, condition_status) VALUES
(17, 'iPhone 12 64GB', 'Toko Gadget Jember', 'Barang Bekas', 'Kondisi 90%, baterai health 87%, fullset tanpa dus.', 4.5, 3, 5500000, '📱', 'Bekas'),
(18, 'Laptop ASUS VivoBook', 'Rizky Komputer', 'Barang Bekas', 'i5 Gen 10, RAM 8GB, SSD 512GB. Mulus, jarang pakai.', 4.7, 2, 4200000, '💻', 'Bekas'),
(19, 'Sepeda MTB Polygon', 'Komunitas Gowes Jember', 'Barang Bekas', 'Polygon Premier 4, ukuran M, ban baru, kondisi 85%.', 4.3, 1, 2800000, '🚲', 'Bekas'),
(20, 'Buku Paket Kuliah Teknik', 'Mahasiswa UNEJ', 'Barang Bekas', 'Paket 5 buku teknik informatika semester 1-2. Masih bersih.', 4.6, 8, 150000, '📚', 'Bekas'),
(21, 'PS4 Slim 1TB', 'Game Zone Jember', 'Barang Bekas', '2 stik ori, 5 kaset game, kondisi 95%. Normal semua.', 4.8, 2, 3200000, '🎮', 'Bekas'),
(22, 'Printer Canon G2010', 'Toko ATK Makmur', 'Barang Bekas', 'Printer infus bawaan, scan copy print. Head bersih.', 4.4, 4, 850000, '🖨️', 'Bekas'),
(23, 'Kulkas Sharp 2 Pintu', 'Elektronik Jaya', 'Barang Bekas', 'Kapasitas 170L, hemat listrik, kondisi 80%. Masih dingin normal.', 4.3, 1, 1500000, '🧊', 'Bekas'),
(24, 'Rak Buku Kayu Jati', 'Mebel Pak Tarno', 'Barang Bekas', 'Rak 5 tingkat, kokoh, finishing halus. Bisa custom ukuran.', 4.5, 5, 450000, '🪵', 'Baru');

-- Tabel Jastips
CREATE TABLE IF NOT EXISTS jastips (
    id VARCHAR(50) PRIMARY KEY,
    driverName VARCHAR(255) NOT NULL,
    driver_id INT DEFAULT NULL,
    storeName VARCHAR(255) NOT NULL,
    departureTime TIME NOT NULL,
    closeOrderTime TIME NOT NULL,
    fee INT NOT NULL,
    availableSlots INT DEFAULT 0,
    status ENUM('Open', 'Full', 'Closed') DEFAULT 'Open',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO jastips (id, driverName, storeName, departureTime, closeOrderTime, fee, availableSlots, status) VALUES
('JT-001', 'Budi Santoso', 'Mie Gacoan Sudirman', '09:00:00', '08:45:00', 5000, 5, 'Open'),
('JT-002', 'Ahmad Rizki', 'Kopi Kenangan Senayan', '10:30:00', '10:15:00', 3000, 2, 'Open');

-- Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('Antar Jemput', 'Jasa Titip', 'Marketplace') NOT NULL,
    status ENUM('Selesai', 'Dalam Perjalanan', 'Diproses', 'Dibatalkan') DEFAULT 'Diproses',
    orderDate DATE NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO orders (id, user_id, type, status, orderDate) VALUES
('ORD-001', 1, 'Antar Jemput', 'Selesai', '2026-03-09'),
('ORD-002', 1, 'Jasa Titip', 'Dalam Perjalanan', '2026-03-08'),
('ORD-003', 1, 'Marketplace', 'Diproses', '2026-03-07');

-- Tabel Drivers Info (Visibility/Mock)
CREATE TABLE IF NOT EXISTS drivers_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initial VARCHAR(5),
    rating FLOAT DEFAULT 0,
    trips INT DEFAULT 0,
(4, 'Dedi Kurniawan', 'D', 4.9, 450, 'Yamaha Aerox 155 - P 3456 GH', 20000, 'Online', 'bg-[#1e6f85]', 'Ajung, Jember', -8.2010, 113.6820),
(5, 'Rina Wati', 'R', 4.6, 98, 'Honda Scoopy - P 7890 IJ', 13000, 'Online', 'bg-brand-green', 'Ambulu, Jember', -8.3470, 113.6040),
(6, 'Fajar Hidayat', 'F', 4.8, 275, 'Yamaha Mio - P 2345 KL', 14000, 'Online', 'bg-[#1e6f85]', 'Arjasa, Jember', -8.1180, 113.7860),
(7, 'Dewi Lestari', 'D', 4.5, 60, 'Honda Vario 125 - P 6789 MN', 12000, 'Offline', 'bg-brand-green', 'Balung, Jember', -8.3110, 113.5650),
(8, 'Hendra Wijaya', 'H', 4.9, 510, 'Yamaha NMAX - P 1122 OP', 19000, 'Online', 'bg-[#1e6f85]', 'Bangsalsari, Jember', -8.2240, 113.5890),
(9, 'Putri Amelia', 'P', 4.7, 180, 'Honda Beat - P 3344 QR', 13000, 'Online', 'bg-brand-green', 'Gumukmas, Jember', -8.3040, 113.4640),
(10, 'Rudi Hartono', 'R', 4.6, 130, 'Suzuki Address - P 5566 ST', 11000, 'Offline', 'bg-[#1e6f85]', 'Jelbuk, Jember', -8.0800, 113.7560),
(11, 'Ani Suryani', 'A', 4.8, 290, 'Honda PCX - P 7788 UV', 22000, 'Online', 'bg-brand-green', 'Jenggawah, Jember', -8.2580, 113.6420),
(12, 'Bambang Prasetyo', 'B', 4.5, 75, 'Yamaha NMAX - P 9900 WX', 17000, 'Offline', 'bg-[#1e6f85]', 'Jombang, Jember', -8.2370, 113.7320),
(13, 'Citra Dewi', 'C', 4.9, 380, 'Honda Vario 160 - P 1357 YZ', 16000, 'Online', 'bg-brand-green', 'Kalisat, Jember', -8.1280, 113.8070),
(14, 'Dimas Saputra', 'D', 4.7, 200, 'Yamaha Aerox - P 2468 AB', 18000, 'Online', 'bg-[#1e6f85]', 'Kencong, Jember', -8.2860, 113.3720),
(15, 'Eka Nugraha', 'E', 4.6, 110, 'Honda Beat - P 1359 CD', 12000, 'Offline', 'bg-brand-green', 'Ledokombo, Jember', -8.0950, 113.8510),
(16, 'Fitria Sari', 'F', 4.8, 340, 'Suzuki Nex II - P 2460 EF', 10000, 'Online', 'bg-[#1e6f85]', 'Mayang, Jember', -8.1400, 113.7510),
(17, 'Gunawan Setiadi', 'G', 4.5, 55, 'Honda Scoopy - P 3570 GH', 13000, 'Offline', 'bg-brand-green', 'Mumbulsari, Jember', -8.2650, 113.7830),
(18, 'Habibah Nur', 'H', 4.9, 420, 'Yamaha NMAX - P 4681 IJ', 19000, 'Online', 'bg-[#1e6f85]', 'Pakusari, Jember', -8.1490, 113.7750),
(19, 'Irfan Maulana', 'I', 4.7, 165, 'Honda Vario 150 - P 5792 KL', 15000, 'Online', 'bg-brand-green', 'Panti, Jember', -8.0880, 113.8200),
(20, 'Joko Susanto', 'J', 4.6, 90, 'Yamaha Mio - P 6803 MN', 11000, 'Offline', 'bg-[#1e6f85]', 'Puger, Jember', -8.3610, 113.4660),
(21, 'Kartika Putri', 'K', 4.8, 310, 'Honda PCX - P 7914 OP', 21000, 'Online', 'bg-brand-green', 'Rambipuji, Jember', -8.2190, 113.6260),
(22, 'Lukman Hakim', 'L', 4.5, 70, 'Yamaha Aerox - P 8025 QR', 17000, 'Offline', 'bg-[#1e6f85]', 'Semboro, Jember', -8.2020, 113.4930),
(23, 'Mega Sari', 'M', 4.9, 490, 'Honda Beat - P 9136 ST', 13000, 'Online', 'bg-brand-green', 'Silo, Jember', -8.1660, 113.9030),
(24, 'Nanda Pratama', 'N', 4.7, 185, 'Suzuki Address - P 0247 UV', 12000, 'Online', 'bg-[#1e6f85]', 'Sukorambi, Jember', -8.1380, 113.6780),
(25, 'Oktavia Putri', 'O', 4.6, 120, 'Honda Scoopy - P 1358 WX', 14000, 'Offline', 'bg-brand-green', 'Sukowono, Jember', -8.1020, 113.8640),
(26, 'Prasetyo Adi', 'P', 4.8, 355, 'Yamaha NMAX - P 2469 YZ', 18000, 'Online', 'bg-[#1e6f85]', 'Tanggul, Jember', -8.1680, 113.4970),
(27, 'Qori Fadilah', 'Q', 4.5, 45, 'Honda Vario 125 - P 3570 AB', 13000, 'Offline', 'bg-brand-green', 'Tempurejo, Jember', -8.2950, 113.6880),
(28, 'Rizal Firmansyah', 'R', 4.9, 530, 'Yamaha Aerox 155 - P 4681 CD', 20000, 'Online', 'bg-[#1e6f85]', 'Umbulsari, Jember', -8.2800, 113.4060),
(29, 'Santi Rahmawati', 'S', 4.7, 175, 'Honda Beat - P 5792 EF', 12000, 'Online', 'bg-brand-green', 'Wuluhan, Jember', -8.2930, 113.5300),
(30, 'Teguh Prabowo', 'T', 4.6, 105, 'Suzuki Nex II - P 6803 GH', 10000, 'Offline', 'bg-[#1e6f85]', 'Sumberbaru, Jember', -8.2200, 113.4380),
(31, 'Umi Kulsum', 'U', 4.8, 265, 'Honda PCX - P 7914 IJ', 22000, 'Online', 'bg-brand-green', 'Patrang, Jember', -8.1570, 113.7080),
(32, 'Vina Aulia', 'V', 4.5, 50, 'Yamaha Mio - P 8025 KL', 11000, 'Offline', 'bg-[#1e6f85]', 'Sumbersari, Jember', -8.1750, 113.7180),
(33, 'Wahyu Nugroho', 'W', 4.9, 470, 'Honda Vario 160 - P 9136 MN', 16000, 'Online', 'bg-brand-green', 'Kaliwates, Jember', -8.1650, 113.6950),
(34, 'Xena Maharani', 'X', 4.7, 195, 'Yamaha NMAX - P 0247 OP', 18000, 'Online', 'bg-[#1e6f85]', 'Ajung, Jember', -8.2060, 113.6870),
(35, 'Yoga Permana', 'Y', 4.6, 88, 'Honda Scoopy - P 1358 QR', 14000, 'Offline', 'bg-brand-green', 'Ambulu, Jember', -8.3420, 113.6090),
(36, 'Zahra Nabilah', 'Z', 4.8, 330, 'Suzuki Address - P 2469 ST', 12000, 'Online', 'bg-[#1e6f85]', 'Arjasa, Jember', -8.1220, 113.7900),
(37, 'Arif Rahman', 'A', 4.9, 400, 'Yamaha Aerox - P 3570 UV', 19000, 'Online', 'bg-brand-green', 'Balung, Jember', -8.3060, 113.5700),
(38, 'Bella Safira', 'B', 4.5, 65, 'Honda Beat - P 4681 WX', 12000, 'Offline', 'bg-[#1e6f85]', 'Bangsalsari, Jember', -8.2290, 113.5940),
(39, 'Cahyo Wibowo', 'C', 4.7, 155, 'Honda Vario 150 - P 5792 YZ', 15000, 'Online', 'bg-brand-green', 'Gumukmas, Jember', -8.3090, 113.4690),
(40, 'Diana Putri', 'D', 4.6, 100, 'Yamaha Mio - P 6803 AB', 11000, 'Offline', 'bg-[#1e6f85]', 'Jelbuk, Jember', -8.0850, 113.7600),
(41, 'Eko Prasetyo', 'E', 4.8, 280, 'Honda PCX - P 7914 CD', 21000, 'Online', 'bg-brand-green', 'Jenggawah, Jember', -8.2530, 113.6470),
(42, 'Fara Dina', 'F', 4.5, 40, 'Suzuki Nex II - P 8025 EF', 10000, 'Offline', 'bg-[#1e6f85]', 'Jombang, Jember', -8.2420, 113.7370),
(43, 'Galih Aditya', 'G', 4.9, 505, 'Yamaha NMAX - P 9136 GH', 18000, 'Online', 'bg-brand-green', 'Kalisat, Jember', -8.1330, 113.8120),
(44, 'Hani Oktaviani', 'H', 4.7, 170, 'Honda Scoopy - P 0247 IJ', 13000, 'Online', 'bg-[#1e6f85]', 'Kencong, Jember', -8.2910, 113.3770),
(45, 'Indra Gunawan', 'I', 4.6, 115, 'Honda Vario 125 - P 1358 KL', 13000, 'Offline', 'bg-brand-green', 'Ledokombo, Jember', -8.1000, 113.8560),
(46, 'Julia Puspita', 'J', 4.8, 300, 'Yamaha Aerox 155 - P 2469 MN', 20000, 'Online', 'bg-[#1e6f85]', 'Mayang, Jember', -8.1450, 113.7560),
(47, 'Kevin Anggara', 'K', 4.5, 58, 'Honda Beat - P 3570 OP', 12000, 'Offline', 'bg-brand-green', 'Mumbulsari, Jember', -8.2700, 113.7880),
(48, 'Lia Anggraeni', 'L', 4.9, 440, 'Suzuki Address - P 4681 QR', 12000, 'Online', 'bg-[#1e6f85]', 'Pakusari, Jember', -8.1540, 113.7800),
(49, 'Muhamad Ilham', 'M', 4.7, 190, 'Honda Vario 160 - P 5792 ST', 16000, 'Online', 'bg-brand-green', 'Panti, Jember', -8.0930, 113.8250),
(50, 'Nisa Amalia', 'N', 4.6, 95, 'Yamaha Mio - P 6803 UV', 11000, 'Offline', 'bg-[#1e6f85]', 'Puger, Jember', -8.3560, 113.4710);

-- Tabel Driver Profiles (untuk Screening / Onboarding)
CREATE TABLE IF NOT EXISTS driver_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ktp_number VARCHAR(16),
    ktp_image_url VARCHAR(255),
    vehicle_type ENUM('motor', 'mobil') DEFAULT 'motor',
    vehicle_model VARCHAR(255) DEFAULT NULL,
    vehicle_plate VARCHAR(20),
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    is_online BOOLEAN DEFAULT FALSE,
    latitude DOUBLE DEFAULT NULL,
    longitude DOUBLE DEFAULT NULL,
    total_trips INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    rating FLOAT DEFAULT 5.0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mock Data Driver Profile (agar Driver Satu langsung terverifikasi)
INSERT IGNORE INTO driver_profiles (user_id, ktp_number, vehicle_type, vehicle_plate, status) VALUES
(2, '3512345678901234', 'Motor', 'P 5678 CD', 'verified');

-- Tabel Merchant Profiles (untuk Screening / Onboarding)
CREATE TABLE IF NOT EXISTS merchant_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_address VARCHAR(255) NOT NULL,
    ktp_number VARCHAR(16) NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mock Data Merchant Profile
INSERT IGNORE INTO merchant_profiles (user_id, store_name, store_address, ktp_number, status) VALUES
(4, 'Toko Berkah', 'Jl. Kalimantan No. 1, Jember', '3512345678901235', 'verified');

-- Tabel Messages (Chat Sistem)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

