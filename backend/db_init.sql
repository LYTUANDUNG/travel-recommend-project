-- 1. Create the database
CREATE DATABASE IF NOT EXISTS travel_recommendation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Use the database
USE travel_recommendation;

-- Note: 
-- Do not run Step 3 until AFTER you have started the Spring Boot application at least once.
-- Spring Boot's ddl-auto: update will automatically create the `users` table and other tables for you.
-- After the Spring Boot console shows it has started successfully, run the following command to create the Admin account:

-- 3. Seed Categories
INSERT INTO categories (name, slug) VALUES 
('Di tích lịch sử', 'di-tich-lich-su'),
('Ẩm thực', 'am-thuc'),
('Du lịch sinh thái', 'du-lich-sinh-thai'),
('Khách sạn', 'khach-san'),
('Giải trí', 'giai-tri'),
('Mua sắm', 'mua-sam');

-- 4. Insert Admin User account
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES 
('admin', 'admin@example.com', 'admin123', 'System Administrator', 'ADMIN', 1, NOW(), NOW());
