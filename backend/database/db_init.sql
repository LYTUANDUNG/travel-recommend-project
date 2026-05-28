-- 1. Create Database
CREATE DATABASE IF NOT EXISTS travel_recommendation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_recommendation;

-- 2. Create Categories Table (Ensure structure matches Entity)
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 3. Create Users Table (Ensure structure matches Entity)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(255),
    gender VARCHAR(20),
    birth_year INT,
    city VARCHAR(100),
    interests TEXT,
    nationality VARCHAR(50) DEFAULT 'Việt Nam',
    role VARCHAR(20) DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    last_avatar_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Seed Categories (Reset and Insert to ensure ID 1 exists)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (category_id, name, slug, description) VALUES
(1, 'Nhà hàng', 'nha-hang', 'Các nhà hàng sang trọng và đa dạng món ăn'),
(2, 'Quán ăn', 'quan-an', 'Các quán ăn bình dân, đặc sản địa phương'),
(3, 'Quán cà phê', 'quan-ca-phe', 'Không gian thư giãn, thưởng thức cà phê và trà'),
(4, 'Quán nhậu / Bar', 'quan-nhau-bar', 'Địa điểm vui chơi, giải trí về đêm'),
(5, 'Đồ ăn nhanh', 'do-an-nhanh', 'Các cửa hàng thức ăn nhanh tiện lợi');

-- 5. Seed Admin User
INSERT IGNORE INTO users (username, email, password_hash, full_name, role, is_active)
VALUES ('admin', 'admin@example.com', 'admin123', 'System Administrator', 'ADMIN', 1);
