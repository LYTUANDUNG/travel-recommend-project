-- Reset and Unify Categories based on Thesis Outline
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (category_id, name, slug, description) VALUES
(1, 'Nhà hàng', 'nha-hang', 'Các nhà hàng sang trọng và đa dạng món ăn'),
(2, 'Quán ăn', 'quan-an', 'Các quán ăn bình dân, đặc sản địa phương'),
(3, 'Quán cà phê', 'quan-ca-phe', 'Không gian thư giãn, thưởng thức cà phê và trà'),
(4, 'Quán nhậu / Bar', 'quan-nhau-bar', 'Địa điểm vui chơi, giải trí về đêm'),
(5, 'Đồ ăn nhanh', 'do-an-nhanh', 'Các cửa hàng thức ăn nhanh tiện lợi');

-- Update existing locations to a default category if they were orphaned
UPDATE locations SET category_id = 1 WHERE category_id IS NULL OR category_id NOT IN (1,2,3,4,5);
