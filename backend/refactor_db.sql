-- Database Refactoring Script
USE jmart_db;

-- 1. Remove redundant real-time coordinate columns (Now in memory store)
ALTER TABLE driver_profiles DROP COLUMN latitude;
ALTER TABLE driver_profiles DROP COLUMN longitude;

ALTER TABLE drivers_info DROP COLUMN latitude;
ALTER TABLE drivers_info DROP COLUMN longitude;

-- 2. Establish Relational Integrity

-- A. Connect Products to Users (Seller)
-- First, add seller_id column
ALTER TABLE products ADD COLUMN seller_id INT DEFAULT NULL;

-- Map existing sellers by name if possible (best effort for mock data)
UPDATE products p JOIN users u ON p.seller = u.name SET p.seller_id = u.id;

-- Add Foreign Key
ALTER TABLE products ADD FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;

-- B. Connect Jastips to Users (Driver)
-- Add driver_id column
ALTER TABLE jastips ADD COLUMN driver_id INT DEFAULT NULL;

-- Map existing drivers by name
UPDATE jastips j JOIN users u ON j.driverName = u.name SET j.driver_id = u.id;

-- Add Foreign Key
ALTER TABLE jastips ADD FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;

-- C. Connect Drivers Info to Users (Mock-to-Real link if applicable)
-- Actually, drivers_info is mostly dummy data. 
-- We'll keep it as is but ensure id consistency if we ever merge.

-- D. Ensure Orders are fully related (already has user_id)
-- We could add product_id/jastip_id if we wanted to be more granular.

-- Cleanup: Remove old string-based seller/driver name columns after verification if desired.
-- For now, keep them for compatibility.
