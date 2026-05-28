import os
import mysql.connector
from dotenv import load_dotenv
import random

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "root"),
    "database": os.getenv("DB_NAME", "travel_recommendation")
}

def deep_cleanup():
    print("="*60)
    print("  DEEP DATABASE CLEANUP & ENRICHMENT V3")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. DROP UNUSED COLUMNS
        print("[1] Dropping unused columns...")
        alter_queries = [
            "ALTER TABLE locations DROP COLUMN ward",
            "ALTER TABLE locations DROP COLUMN preview_experience",
            "ALTER TABLE categories DROP COLUMN slug",
            "ALTER TABLE reviews DROP COLUMN trip_type"
        ]
        for q in alter_queries:
            try:
                cursor.execute(q)
            except Exception as e:
                print(f"   [SKIP] {e}")

        # 2. DIVERSE TAGS ENRICHMENT
        print("[2] Adding diverse tags...")
        tags = [
            ("sang-trong", 1.5), ("gia-re", 0.8), ("view-bien", 1.3), 
            ("thoang-mat", 1.0), ("yen-tinh", 1.2), ("nong-nhiet", 1.1),
            ("phu-hop-gia-dinh", 1.4), ("check-in-dep", 1.5), ("am-thuc-vua-he", 1.2),
            ("lang-man", 1.3), ("co-kinh", 1.2), ("hien-dai", 1.1),
            ("vui-choi-tre-em", 1.4), ("gan-trung-tam", 1.0)
        ]
        for name, weight in tags:
            cursor.execute("INSERT IGNORE INTO tags (name, weight) VALUES (%s, %s)", (name, weight))
        
        # Mapping tags to locations based on keywords
        tag_mappings = {
            "sang-trong": ["Iris Hotel", "Buffet", "Faifo"],
            "gia-re": ["Bún", "Phở", "Cơm Sinh Viên", "20k"],
            "view-bien": ["Bãi biển", "Hải sản"],
            "yen-tinh": ["Chùa", "Nhà thờ", "Nhà trọ", "Phòng trọ"],
            "check-in-dep": ["Starlight", "CGV", "Chùa", "Hero Statue"],
            "am-thuc-vua-he": ["Bún Bò", "Bánh tráng", "Ốc"],
            "co-kinh": ["Lịch sử", "Chùa", "Di tích"],
            "hien-dai": ["Pizza", "Cinema", "Starlight"]
        }
        
        for tag_name, keywords in tag_mappings.items():
            cursor.execute("SELECT tag_id FROM tags WHERE name = %s", (tag_name,))
            res = cursor.fetchone()
            if res:
                tid = res[0]
                for kw in keywords:
                    cursor.execute("""
                        INSERT IGNORE INTO location_tags (location_id, tag_id, score)
                        SELECT location_id, %s, 1.0 FROM locations WHERE name LIKE %s OR description LIKE %s
                    """, (tid, f"%{kw}%", f"%{kw}%"))

        # 3. HYDRATE TRIPS & TRIP_LOCATIONS
        print("[3] Hydrating Trips & Trip Locations...")
        cursor.execute("SELECT user_id FROM users")
        user_ids = [r[0] for r in cursor.fetchall()]
        
        cursor.execute("SELECT location_id FROM locations")
        loc_ids = [r[0] for r in cursor.fetchall()]
        
        if user_ids and loc_ids:
            for uid in user_ids:
                # Create 1-2 trips for each user
                for i in range(random.randint(1, 2)):
                    title = f"Chuyến đi khám phá #{random.randint(100, 999)}"
                    desc = f"Lịch trình tham quan các địa điểm nổi bật tại Đà Nẵng cho {title}. Một hành trình đầy thú vị và trải nghiệm mới mẻ."
                    cursor.execute("""
                        INSERT INTO trips (user_id, title, description, created_at, updated_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                    """, (uid, title, desc))
                    
                    trip_id = cursor.lastrowid
                    
                    # Add 3-5 random locations to each trip
                    sample_locs = random.sample(loc_ids, min(len(loc_ids), random.randint(3, 5)))
                    for seq, lid in enumerate(sample_locs):
                        cursor.execute("""
                            INSERT IGNORE INTO trip_locations (trip_id, location_id, sort_order, day, created_at, updated_at)
                            VALUES (%s, %s, %s, 1, NOW(), NOW())
                        """, (trip_id, lid, seq))

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60)
        print("  DEEP CLEANUP & HYDRATION COMPLETED!")
        print("="*60)
    except Exception as e:
        print(f"[CRITICAL] {e}")

if __name__ == "__main__":
    deep_cleanup()
