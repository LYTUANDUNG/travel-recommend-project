import os
import mysql.connector
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "root"),
    "database": os.getenv("DB_NAME", "travel_recommendation")
}

def db_rebuild_v2():
    print("="*60)
    print("  MASSIVE DATA ENRICHMENT V2 (PERSONA & TAG FOCUS)")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # 1. ENSURE TAGS EXIST
        print("[1] Seeding diverse Tags...")
        tags = [
            ('Sang trọng', 1.5), ('Bình dân', 1.0), ('View đẹp', 1.3), ('Yên tĩnh', 1.2),
            ('Trung tâm', 1.1), ('Hải sản', 1.4), ('Lãng mạn', 1.5), ('Gia đình', 1.1),
            ('Sống ảo', 1.3), ('Đặc sản', 1.2), ('Món Việt', 1.0), ('Món Âu', 1.4),
            ('Wifi mạnh', 1.1), ('Làm việc', 1.2), ('Gần biển', 1.3)
        ]
        for name, weight in tags:
            cursor.execute("INSERT IGNORE INTO tags (name, weight) VALUES (%s, %s)", (name, weight))
        conn.commit()

        # Get tag IDs
        cursor.execute("SELECT tag_id, name FROM tags")
        tag_lookup = {r['name']: r['tag_id'] for r in cursor.fetchall()}

        # 2. ASSIGN TAGS TO LOCATIONS (Content-Based Focus)
        print("[2] Assigning Tags to locations...")
        cursor.execute("SELECT location_id, name, description FROM locations")
        locs = cursor.fetchall()
        
        for loc in locs:
            # Delete old tags for this location
            cursor.execute("DELETE FROM location_tags WHERE location_id = %s", (loc['location_id'],))
            
            assigned_tags = []
            name_desc = (loc['name'] + " " + (loc['description'] or "")).lower()
            
            if any(k in name_desc for k in ['sang trọng', 'resort', 'hotel', 'villa']): assigned_tags.append('Sang trọng')
            if any(k in name_desc for k in ['quán ăn', 'vỉa hè', 'bình dân']): assigned_tags.append('Bình dân')
            if any(k in name_desc for k in ['view', 'cảnh', 'đẹp']): assigned_tags.append('View đẹp')
            if any(k in name_desc for k in ['cafe', 'cà phê', 'trà']): assigned_tags.append('Sống ảo')
            if any(k in name_desc for k in ['biển', 'beach', 'sông']): assigned_tags.append('Gần biển')
            if any(k in name_desc for k in ['nhậu', 'bar', 'bia']): assigned_tags.append('Trung tâm')
            
            # Always add 1-2 random tags to ensure diversity
            random_tags = random.sample(list(tag_lookup.keys()), 2)
            assigned_tags.extend(random_tags)
            
            for tname in set(assigned_tags):
                tid = tag_lookup.get(tname)
                if tid:
                    cursor.execute("INSERT IGNORE INTO location_tags (location_id, tag_id, score) VALUES (%s, %s, %s)", 
                                 (loc['location_id'], tid, 1.0))

        # 3. PERSONA-BASED BEHAVIOR (Collaborative Focus)
        print("[3] Creating Persona-based interactions...")
        cursor.execute("SELECT user_id FROM users WHERE role = 'USER'")
        user_ids = [r['user_id'] for r in cursor.fetchall()]
        cursor.execute("SELECT location_id, category_id FROM locations")
        locations = cursor.fetchall()
        
        # Personas: list of (fav_category_ids, weight)
        personas = [
            ([1, 2], 0.8), # Foodie
            ([3], 0.9),    # Coffee Lover
            ([4], 0.7),    # Nightlife
            ([5, 2], 0.8), # Fast/Street Food
            ([1, 3], 0.6)  # Luxury/Cafe
        ]

        actions = ['VIEW_DETAILS', 'ADD_FAVORITE', 'CLICK_BOOKING']
        
        for uid in user_ids:
            persona_cats, bias = random.choice(personas)
            
            # Perform 20-30 actions per user
            for _ in range(random.randint(20, 30)):
                # 80% chance to pick from favored categories, 20% random
                if random.random() < bias:
                    target_locs = [l for l in locations if l['category_id'] in persona_cats]
                    if not target_locs: target_locs = locations
                else:
                    target_locs = locations
                
                loc = random.choice(target_locs)
                action = random.choice(actions)
                created_at = datetime.now() - timedelta(days=random.randint(0, 60))
                
                cursor.execute("""
                    INSERT INTO user_behavior_logs (user_id, location_id, action_type, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (uid, loc['location_id'], action, created_at))

                # Probability to leave a review (Higher for favored categories)
                if random.random() < (0.3 if loc['category_id'] in persona_cats else 0.1):
                    rating = random.randint(4, 5) if loc['category_id'] in persona_cats else random.randint(2, 4)
                    cursor.execute("""
                        INSERT IGNORE INTO reviews (user_id, location_id, rating, comment, verify_status, created_at)
                        VALUES (%s, %s, %s, 'Trải nghiệm rất tuyệt!', 'APPROVED', %s)
                    """, (uid, loc['location_id'], rating, created_at))

        # 4. SYNC VISIT REQUESTS (Consistency Focus)
        print("[4] Syncing Visit Requests with Reviews...")
        cursor.execute("DELETE FROM visit_requests")
        
        # Create COMPLETED requests for every existing review
        cursor.execute("SELECT user_id, location_id, created_at FROM reviews")
        existing_reviews = cursor.fetchall()
        for rev in existing_reviews:
            cursor.execute("""
                INSERT INTO visit_requests (user_id, location_id, status, visit_date, created_at)
                VALUES (%s, %s, 'COMPLETED', %s, %s)
            """, (rev['user_id'], rev['location_id'], rev['created_at'], rev['created_at'] - timedelta(days=1)))

        # Add some PENDING and APPROVED requests for variety
        print("    -> Adding variety to Visit Requests...")
        for _ in range(50):
            uid = random.choice(user_ids)
            loc = random.choice(locations)
            status = random.choice(['PENDING', 'APPROVED', 'REJECTED'])
            created_at = datetime.now() - timedelta(days=random.randint(0, 7))
            cursor.execute("""
                INSERT INTO visit_requests (user_id, location_id, status, visit_date, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (uid, loc['location_id'], status, created_at + timedelta(days=2), created_at))

        # 5. SYNC FAVORITES (UI/UX Focus)
        print("[5] Syncing Favorites table...")
        cursor.execute("DELETE FROM favorites")
        cursor.execute("""
            INSERT IGNORE INTO favorites (user_id, location_id, created_at)
            SELECT user_id, location_id, created_at 
            FROM user_behavior_logs 
            WHERE action_type = 'ADD_FAVORITE'
        """)

        # 6. FINAL SYNC
        print("[6] Finalizing synchronization...")
        # Recalculate Profiles
        cursor.execute("DELETE FROM user_interest_profiles")
        cursor.execute("""
            INSERT INTO user_interest_profiles (user_id, category_id, affinity_score)
            SELECT 
                l.user_id, 
                loc.category_id, 
                COUNT(*) * 0.3 as score
            FROM user_behavior_logs l
            JOIN locations loc ON l.location_id = loc.location_id
            WHERE loc.category_id IS NOT NULL
            GROUP BY l.user_id, loc.category_id
        """)

        # Sync Stats
        cursor.execute("""
            UPDATE locations l
            SET 
                total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.location_id = l.location_id AND r.verify_status = 'APPROVED'),
                average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.location_id = l.location_id AND r.verify_status = 'APPROVED')
        """)

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60)
        print("  DIVERSE DATA REBUILT SUCCESSFULLY!")
        print("="*60)
    except Exception as e:
        print(f"[CRITICAL] {e}")

if __name__ == "__main__":
    db_rebuild_v2()
