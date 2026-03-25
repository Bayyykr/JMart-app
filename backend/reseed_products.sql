-- Reseed Products with Coordinates (Jember Area)
USE jmart_db;

-- Clear existing products to ensure clean seed
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed: Makanan
INSERT INTO products (name, seller, category, description, rating, sold, price, emoji, latitude, longitude) VALUES
('Nasi Goreng Spesial', 'Warung Barokah', 'Makanan', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 4.8, 120, 18000, '🍛', -8.1575, 113.7224),
('Es Kopi Susu', 'Kopi Nusantara', 'Makanan', 'Kopi susu dingin dengan gula aren asli', 4.9, 340, 15000, '☕', -8.1610, 113.7180),
('Ayam Geprek', 'Geprek Mantul', 'Makanan', 'Ayam geprek sambal bawang level 1-5', 4.7, 89, 20000, '🍗', -8.1650, 113.7100),
('Bakso Beranak', 'Bakso Pak Kumis', 'Makanan', 'Bakso jumbo isi bakso kecil, tahu, dan siomay', 4.8, 215, 22000, '🍜', -8.1530, 113.7250),
('Sate Ayam Madura', 'Sate H. Mansur', 'Makanan', '10 tusuk sate ayam bumbu kacang khas Madura', 4.9, 178, 25000, '🍢', -8.1590, 113.7300),
('Mie Ayam Bakso', 'Mie Ayam Cak To', 'Makanan', 'Mie ayam komplit dengan bakso dan pangsit goreng', 4.6, 156, 17000, '🍜', -8.1720, 113.7140),
('Es Teh Manis', 'Warung Barokah', 'Makanan', 'Es teh manis segar dari teh pilihan', 4.5, 420, 5000, '🧊', -8.1575, 113.7224),
('Pecel Lele', 'Lesehan Bu Dar', 'Makanan', 'Lele goreng crispy dengan sambal pecel dan lalapan', 4.7, 95, 16000, '🐟', -8.1680, 113.7050);

-- Seed: Jasa
INSERT INTO products (name, seller, category, description, rating, sold, price, emoji, latitude, longitude) VALUES
('Laundry Kiloan', 'Clean Fresh Laundry', 'Jasa', 'Cuci + setrika, antar jemput gratis min 3kg. Selesai 2 hari.', 4.8, 310, 7000, '🧺', -8.1520, 113.7150),
('Cuci Motor', 'Doorsmeer Bersih Jaya', 'Jasa', 'Cuci motor komplit body, mesin, dan velg. Bonus semir ban.', 4.6, 185, 15000, '🏍️', -8.1600, 113.7000),
('Cuci Mobil', 'Doorsmeer Bersih Jaya', 'Jasa', 'Cuci mobil luar dalam, poles dashboard, vacuum interior.', 4.7, 120, 45000, '🚗', -8.1600, 113.7000),
('Servis AC', 'Teknik Sejuk Jember', 'Jasa', 'Cuci AC + isi freon, garansi 1 bulan, semua merk.', 4.9, 78, 150000, '❄️', -8.1750, 113.7300),
('Jasa Jahit', 'Taylor Berkah', 'Jasa', 'Permak celana/baju, jahit baru, obras. Bahan bisa sendiri.', 4.5, 92, 25000, '🧵', -8.1400, 113.7200),
('Sedot WC', 'Sedot WC Jember Bersih', 'Jasa', 'Sedot WC mampet, jangkauan seluruh Jember. Alat modern.', 4.4, 45, 350000, '🚽', -8.1800, 113.7100),
('Potong Rambut', 'Barbershop Keren', 'Jasa', 'Potong rambut pria, gaya kekinian, free styling pomade.', 4.7, 230, 25000, '💇', -8.1550, 113.7180),
('Service HP', 'Phone Fix Jember', 'Jasa', 'Ganti LCD, baterai, konektor charging. Garansi 30 hari.', 4.6, 67, 50000, '📱', -8.1630, 113.7250);

-- Seed: Barang
INSERT INTO products (name, seller, category, description, rating, sold, price, emoji, condition_status, latitude, longitude) VALUES
('iPhone 12 64GB', 'Toko Gadget Jember', 'Barang', 'Kondisi 90%, baterai health 87%, fullset tanpa dus.', 4.5, 3, 5500000, '📱', 'Bekas', -8.1620, 113.7200),
('Laptop ASUS VivoBook', 'Rizky Komputer', 'Barang', 'i5 Gen 10, RAM 8GB, SSD 512GB. Mulus, jarang pakai.', 4.7, 2, 4200000, '💻', 'Bekas', -8.1580, 113.7350),
('Sepeda MTB Polygon', 'Komunitas Gowes Jember', 'Barang', 'Polygon Premier 4, ukuran M, ban baru, kondisi 85%.', 4.3, 1, 2800000, '🚲', 'Bekas', -8.1700, 113.7000),
('Buku Paket Kuliah Teknik', 'Mahasiswa UNEJ', 'Barang', 'Paket 5 buku teknik informatika semester 1-2. Masih bersih.', 4.6, 8, 150000, '📚', 'Bekas', -8.1670, 113.7180),
('PS4 Slim 1TB', 'Game Zone Jember', 'Barang', '2 stik ori, 5 kaset game, kondisi 95%. Normal semua.', 4.8, 2, 3200000, '🎮', 'Bekas', -8.1550, 113.7400),
('Printer Canon G2010', 'Toko ATK Makmur', 'Barang', 'Printer infus bawaan, scan copy print. Head bersih.', 4.4, 4, 850000, '🖨️', 'Bekas', -8.1600, 113.7150),
('Kulkas Sharp 2 Pintu', 'Elektronik Jaya', 'Barang', 'Kapasitas 170L, hemat listrik, kondisi 80%. Masih dingin normal.', 4.3, 1, 1500000, '🧊', 'Bekas', -8.1800, 113.7250),
('Rak Buku Kayu Jati', 'Mebel Pak Tarno', 'Barang', 'Rak 5 tingkat, kokoh, finishing halus. Bisa custom ukuran.', 4.5, 5, 450000, '🪵', 'Baru', -8.1500, 113.7100);
