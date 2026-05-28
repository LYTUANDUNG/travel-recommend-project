import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "root"),
    "database": os.getenv("DB_NAME", "travel_recommendation")
}

def fix_database():
    print("="*60)
    print("  DATABASE HARMONIZATION & CLEANUP")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. FIX CATEGORIES
        print("[1] Harmonizing Categories...")
        categories = [
            (11, "Nhà hàng"), (12, "Quán ăn"), (13, "Quán cà phê"),
            (14, "Quán nhậu / Bar"), (15, "Đồ ăn nhanh"), (16, "Ẩm thực địa phương"),
            (17, "Hải sản"), (18, "Ăn vặt"), (19, "Phòng trưng bày"),
            (20, "Văn hóa"), (21, "Lịch sử"), (22, "Giáo dục"),
            (23, "Chùa"), (24, "Bãi biển"), (25, "Nhà thờ"),
            (26, "Di tích lịch sử"), (27, "Thác nước"), (28, "Rạp chiếu phim")
        ]
        for cid, name in categories:
            cursor.execute("""
                INSERT INTO categories (category_id, name, slug, description) 
                VALUES (%s, %s, %s, '') 
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, (cid, name, name.lower().replace(" ", "-")))

        # 2. FIX LOCATION CATEGORIES (Gán lại dựa trên tên)
        print("[2] Fixing Location-Category mapping...")
        mapping = [
            ("Hotel", 11), ("Khách sạn", 11), ("Nhà trọ", 11), ("Phòng trọ", 11),
            ("Nhà hàng", 11), ("Restaurant", 11), ("Buffet", 11),
            ("Quán ăn", 12), ("Phở", 12), ("Bún", 12), ("Cơm", 12), ("Bánh tráng", 12), ("Ốc", 12),
            ("Cà phê", 13), ("Cafe", 13), ("Coffee", 13),
            ("Chùa", 23), ("Nhà Thờ", 25), ("Cinema", 28), ("Rạp", 28)
        ]
        for keyword, cid in mapping:
            cursor.execute("UPDATE locations SET category_id = %s WHERE name LIKE %s", (cid, f"%{keyword}%"))

        # 3. FIX TAGS & LOCATION_TAGS
        print("[3] Syncing Tags...")
        tags = [(2, "douong"), (3, "caphe"), (4, "coffee"), (5, "amthuc"), (6, "viewdep"), (7, "yenbinh")]
        for tid, name in tags:
            cursor.execute("INSERT INTO tags (tag_id, name, weight) VALUES (%s, %s, 1.0) ON DUPLICATE KEY UPDATE name=VALUES(name)", (tid, name))
        
        # Tự động gắn tag cho quán cafe
        cursor.execute("INSERT IGNORE INTO location_tags (location_id, tag_id, score) SELECT location_id, 3, 1.0 FROM locations WHERE name LIKE '%Cafe%' OR name LIKE '%Cà phê%'")
        # Tự động gắn tag amthuc cho quán ăn
        cursor.execute("INSERT IGNORE INTO location_tags (location_id, tag_id, score) SELECT location_id, 5, 1.0 FROM locations WHERE category_id IN (11, 12, 15, 16, 17, 18)")

        # 4. HYDRATE USER BEHAVIOR & INTEREST PROFILES (Để AI có dữ liệu chạy)
        print("[4] Hydrating AI Tables (Behavior & Profiles)...")
        # Giả lập hành vi cho các user hiện có dựa trên review của họ
        cursor.execute("""
            INSERT IGNORE INTO user_behavior_logs (user_id, location_id, action_type, created_at)
            SELECT user_id, location_id, 'VIEW_DETAILS', NOW() FROM reviews
        """)
        # Cập nhật profile sở thích dựa trên category của các nơi họ đã review
        cursor.execute("""
            INSERT IGNORE INTO user_interest_profiles (user_id, category_id, affinity_score)
            SELECT r.user_id, l.category_id, 5.0
            FROM reviews r 
            JOIN locations l ON r.location_id = l.location_id
            WHERE l.category_id IS NOT NULL
        """)

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60)
        print("  DATABASE FIXED & HYDRATED SUCCESSFULLY!")
        print("="*60)
    except Exception as e:
        print(f"[CRITICAL] {e}")

if __name__ == "__main__":
    fix_database()
