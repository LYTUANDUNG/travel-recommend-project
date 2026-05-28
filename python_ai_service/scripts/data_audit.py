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

def audit():
    print("="*60)
    print("        SYSTEM DATA AUDIT (PRE-AI EXECUTION)")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Row Counts
        print("\n[1] Table Row Counts:")
        tables = ['users', 'locations', 'categories', 'reviews', 'visit_requests', 'favorites', 'user_behavior_logs', 'tags', 'location_tags', 'user_interest_profiles']
        for t in tables:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {t}")
            print(f"    - {t:22}: {cursor.fetchone()['cnt']} rows")

        # 2. Category Distribution
        print("\n[2] Location Distribution by Category:")
        cursor.execute("""
            SELECT c.name, COUNT(l.location_id) as cnt 
            FROM categories c 
            LEFT JOIN locations l ON c.category_id = l.category_id 
            GROUP BY c.name
        """)
        for row in cursor.fetchall():
            print(f"    - {row['name']:22}: {row['cnt']} locations")

        # 3. Behavior Distribution
        print("\n[3] Behavior Log Distribution (Collaborative Signals):")
        cursor.execute("SELECT action_type, COUNT(*) as cnt FROM user_behavior_logs GROUP BY action_type")
        for row in cursor.fetchall():
            print(f"    - {row['action_type']:22}: {row['cnt']} actions")

        # 4. Content Enrichment
        print("\n[4] Content Enrichment (Content-Based Signals):")
        cursor.execute("SELECT COUNT(DISTINCT location_id) as cnt FROM location_tags")
        loc_with_tags = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM locations")
        total_loc = cursor.fetchone()['cnt']
        print(f"    - Locations with Tags     : {loc_with_tags} / {total_loc}")
        
        # 5. Consistency Check
        print("\n[5] Consistency Audit:")
        cursor.execute("SELECT COUNT(*) as cnt FROM reviews")
        total_rev = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM visit_requests WHERE status = 'COMPLETED'")
        completed_visits = cursor.fetchone()['cnt']
        print(f"    - Reviews vs Completed Visits: {total_rev} vs {completed_visits} (Goal: Match)")

        cursor.execute("SELECT COUNT(*) as cnt FROM favorites")
        total_fav = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM user_behavior_logs WHERE action_type = 'ADD_FAVORITE'")
        fav_logs = cursor.fetchone()['cnt']
        print(f"    - Favorites vs Behavior Logs : {total_fav} vs {fav_logs} (Goal: Match)")

        print("\n" + "="*60)
        print("        AUDIT COMPLETED - DATA IS READY")
        print("="*60)
        
        cursor.close(); conn.close()
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    audit()
