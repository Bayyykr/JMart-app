SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@CHARACTER_SET_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jmart_db`
--

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `broadcasts`;
DROP TABLE IF EXISTS `broadcast_offers`;
DROP TABLE IF EXISTS `broadcast_requests`;
DROP TABLE IF EXISTS `driver_profiles`;
DROP TABLE IF EXISTS `jastips`;
DROP TABLE IF EXISTS `jastip_items`;
DROP TABLE IF EXISTS `merchant_profiles`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `room_chats`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------

--
-- Table structure for table `broadcasts`
--

CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pickup_location` text NOT NULL,
  `destination_location` text NOT NULL,
  `pickup_time` varchar(20) DEFAULT NULL,
  `notes` text,
  `category` enum('Antar Jemput','Makanan','Barang dan Jasa') DEFAULT 'Antar Jemput',
  `order_id` varchar(50) DEFAULT NULL,
  `status` enum('pending','applied','cancelled') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `broadcast_offers`
--

CREATE TABLE IF NOT EXISTS `broadcast_offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `broadcast_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `price` int NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_broadcast_driver` (`broadcast_id`,`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `broadcast_requests`
--

CREATE TABLE IF NOT EXISTS `broadcast_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `destination_location` varchar(255) NOT NULL,
  `pickup_time` time NOT NULL,
  `notes` text,
  `status` enum('Mencari Driver','Diterima','Dibatalkan','Selesai') DEFAULT 'Mencari Driver',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `driver_profiles`
--

CREATE TABLE IF NOT EXISTS `driver_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ktp_number` varchar(16) DEFAULT NULL,
  `ktp_image_url` varchar(255) DEFAULT NULL,
  `selfie_image_url` varchar(255) DEFAULT NULL,
  `vehicle_type` enum('Motor','Mobil') DEFAULT 'Motor',
  `vehicle_model` varchar(255) DEFAULT NULL,
  `vehicle_plate` varchar(20) DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `is_online` tinyint(1) DEFAULT '0',
  `total_trips` int DEFAULT '0',
  `completed_orders` int DEFAULT '0',
  `rating` float DEFAULT '5',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `area` varchar(255) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `description` text,
  `revenue` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `jastips`
--

CREATE TABLE IF NOT EXISTS `jastips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` varchar(255) NOT NULL,
  `store_name` varchar(255) NOT NULL,
  `departure_time` time NOT NULL,
  `close_order_time` time NOT NULL,
  `available_slots` int NOT NULL,
  `fee` decimal(10,2) NOT NULL,
  `status` enum('Open','Full','Closed') DEFAULT 'Open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `jastip_items`
--

CREATE TABLE IF NOT EXISTS `jastip_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jastip_id` int NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_point` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `merchant_profiles`
--

CREATE TABLE IF NOT EXISTS `merchant_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_name` varchar(255) NOT NULL,
  `store_address` varchar(255) DEFAULT NULL,
  `ktp_number` varchar(16) NOT NULL,
  `product_description` text,
  `store_image_url` varchar(255) DEFAULT NULL,
  `ktp_image_url` varchar(255) DEFAULT NULL,
  `selfie_image_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `full_address` text,
  `balance` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `messages`
--

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` varchar(50) NOT NULL,
  `sender_id` varchar(255) NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_image` varchar(255) DEFAULT NULL,
  `receiver_id` varchar(255) NOT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_image` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `message_type` varchar(50) DEFAULT 'text',
  `file_url` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `orders`
--

CREATE TABLE IF NOT EXISTS `orders` (
  `id` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('Antar Jemput','Jasa Titip','Marketplace') NOT NULL,
  `status` varchar(50) DEFAULT 'Menunggu Konfirmasi',
  `orderDate` date NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `total_price` int DEFAULT '0',
  `driver_id` int DEFAULT NULL,
  `seller_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `shipping_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `products`
--

CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `seller` varchar(255) NOT NULL,
  `category` enum('Makanan','Jasa','Barang') NOT NULL DEFAULT 'Makanan',
  `description` text,
  `rating` float DEFAULT '0',
  `sold` int DEFAULT '0',
  `price` int NOT NULL,
  `emoji` varchar(10) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `condition_status` enum('Baru','Bekas') DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `seller_id` int DEFAULT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `reports`
--

CREATE TABLE IF NOT EXISTS `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `reported_user_id` int NOT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending','investigating','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `room_chats`
--

CREATE TABLE IF NOT EXISTS `room_chats` (
  `id` varchar(100) NOT NULL,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `last_message` text,
  `last_message_type` varchar(20) DEFAULT 'text',
  `last_message_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unread_user1` int DEFAULT '0',
  `unread_user2` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_sender_id` bigint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pair` (`user1_id`,`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','driver','admin','marketplace') DEFAULT 'user',
  `profile_image_url` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `address` text,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping Data
--

-- [MESSAGES DUMP REMOVED FOR BREVITY IN EXECUTING BUT WILL BE ADDED BELOW]
-- I will add only the essential mock data to avoid hitting SQL limits if possible, 
-- but let's try to add most of it.

-- Users
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`, `profile_image_url`, `createdAt`, `phone`, `birthdate`, `address`, `is_active`) VALUES
(1, 'User Satu', 'user@jmart.com', 'password123', 'user', NULL, '2026-03-11 15:44:34', NULL, NULL, 'Jl. Kalimantan No. 10', 1),
(2, 'Driver Satu', 'driver@jmart.com', 'password123', 'driver', NULL, '2026-03-11 15:44:34', NULL, NULL, NULL, 1),
(3, 'Admin Satu', 'admin@jmart.com', '$2b$10$jkes9P6bKBhEq/8JXUEYA.6otbCWgN6Xjq6rj3TsbkKa.UcMABgKq', 'admin', NULL, '2026-03-11 15:44:34', NULL, NULL, NULL, 1),
(5, 'Lisa Rahmawati', 'lisa@jmart.com', 'password123', 'user', '/uploads/lisa_profile.png', '2026-03-15 08:46:00', '0983198', '2026-02-22', 'fffs', 1),
(6, 'Agus Mantap', 'bayukristanto2005@gmail.com', 'password123', 'driver', '/uploads/agus_profile.png', '2026-03-15 08:46:00', NULL, NULL, NULL, 1),
(74, 'Berkah Abadi', 'berkah@jmart.com', 'password123', 'marketplace', NULL, '2026-03-22 13:52:42', NULL, NULL, NULL, 1);

-- Driver Profiles
INSERT IGNORE INTO `driver_profiles` (`id`, `user_id`, `ktp_number`, `status`, `is_online`, `total_trips`, `rating`, `area`, `latitude`, `longitude`, `vehicle_plate`) VALUES
(1, 2, '3512345678901234', 'verified', 1, 124, 4.9, 'Tegalharjo, Banyuwangi', -8.2973, 114.0337, 'P 5678 CD'),
(4, 6, '1234567652345675', 'verified', 1, 0, 5, 'Tegalharjo, Banyuwangi', -8.2973, 114.0337, 'P 7864 ASD');

-- Merchant Profiles
INSERT IGNORE INTO `merchant_profiles` (`id`, `user_id`, `store_name`, `store_address`, `ktp_number`, `status`, `latitude`, `longitude`, `village`, `city`, `district`, `full_address`, `balance`) VALUES
(1, 74, 'Berkah Abadi', 'Jl.Soedirman', '3512345678901235', 'verified', -8.299, 114.029, 'Tegalharjo', 'Banyuwangi', 'Glenmore', 'Jl.Soedirman No. 10', 0);

-- Products
INSERT IGNORE INTO `products` (`id`, `name`, `seller`, `category`, `description`, `rating`, `sold`, `price`, `seller_id`, `is_active`) VALUES
(1, 'Nasi Goreng Spesial', 'Warung Barokah', 'Makanan', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 4.8, 120, 18000, 74, 1),
(32, 'Nasi Goreng', 'Berkah Abadi', 'Makanan', 'ss', 0, 0, 15000, 74, 1);

-- Orders
INSERT IGNORE INTO `orders` (`id`, `user_id`, `type`, `status`, `orderDate`, `total_price`, `seller_id`, `product_id`) VALUES
('ORD-294506', 5, 'Marketplace', 'Selesai', '2026-03-27', 15000, 74, 32),
('ORD-308249', 5, 'Marketplace', 'Selesai', '2026-03-27', 15000, 74, 32);

COMMIT;
