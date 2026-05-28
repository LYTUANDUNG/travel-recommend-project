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

def massive_hydrate():
    print("="*60)
    print("  MASSIVE DATA HYDRATION (ACADEMIC GRADE)")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. ADD MORE USERS (50 users)
        print("[1] Creating 50 synthetic users...")
        first_names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Phan", "Vu", "Dang", "Bui", "Do"]
        last_names = ["An", "Binh", "Chi", "Dung", "Em", "Giang", "Hoa", "Hung", "Kiet", "Linh", "Minh", "Nam", "Oanh", "Phuc", "Quy", "Son", "Tuan", "Viet", "Xuan", "Yen"]
        
        for i in range(50):
            username = f"user_test_{random.randint(1000, 9999)}"
            email = f"{username}@example.com"
            full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            cursor.execute("""
                INSERT IGNORE INTO users (username, email, password_hash, full_name, role, created_at, gender, birth_year)
                VALUES (%s, %s, 'password', %s, 'USER', NOW(), %s, %s)
            """, (username, email, full_name, random.choice(['MALE', 'FEMALE']), random.randint(1990, 2005)))

        # 2. FETCH ALL USERS AND LOCATIONS
        cursor.execute("SELECT user_id FROM users")
        user_ids = [r[0] for r in cursor.fetchall()]
        cursor.execute("SELECT location_id, category_id FROM locations")
        locations = cursor.fetchall() # list of (id, cat_id)
        
        # 3. GENERATE LOGICAL REVIEWS & BEHAVIOR (200 reviews)
        print("[2] Generating 200 logical reviews & 500 behavior logs...")
        actions = ['VIEW_DETAILS', 'CLICK_BOOKING', 'ADD_FAVORITE', 'VIEW_MAP']
        
        # Assign 2 favorite categories to each user to make it "logical"
        cursor.execute("SELECT category_id FROM categories")
        all_cats = [r[0] for r in cursor.fetchall()]
        
        for uid in user_ids:
            fav_cats = random.sample(all_cats, 2)
            
            # For each user, perform actions mainly on their fav categories
            target_locs = [l for l in locations if l[1] in fav_cats]
            if not target_locs: target_locs = locations
            
            # Perform 10-15 actions per user
            for _ in range(random.randint(10, 15)):
                loc = random.choice(target_locs)
                action = random.choice(actions)
                cursor.execute("""
                    INSERT INTO user_behavior_logs (user_id, location_id, action_type, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (uid, loc[0], action, datetime.now() - timedelta(days=random.randint(0, 30))))
                
                # Probability to leave a review if they "viewed"
                if random.random() < 0.3:
                    rating = random.randint(4, 5) if loc[1] in fav_cats else random.randint(3, 5)
                    cursor.execute("""
                        INSERT IGNORE INTO reviews (user_id, location_id, rating, comment, verify_status, created_at)
                        VALUES (%s, %s, %s, %s, 'APPROVED', NOW())
                    """, (uid, loc[0], rating, f"Trải nghiệm tuyệt vời tại {loc[0]}! Rất đáng để thử.", ))

        # 4. RE-CALCULATE USER INTEREST PROFILES
        print("[3] Re-calculating User Interest Profiles...")
        cursor.execute("DELETE FROM user_interest_profiles")
        cursor.execute("""
            INSERT INTO user_interest_profiles (user_id, category_id, affinity_score)
            SELECT 
                l.user_id, 
                loc.category_id, 
                COUNT(*) * 0.5 as score
            FROM user_behavior_logs l
            JOIN locations loc ON l.location_id = loc.location_id
            WHERE loc.category_id IS NOT NULL
            GROUP BY l.user_id, loc.category_id
        """)

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60)
        print("  MASSIVE HYDRATION COMPLETED!")
        print("="*60)
    except Exception as e:
        print(f"[CRITICAL] {e}")

if __name__ == "__main__":
    massive_hydrate()
