
import mysql.connector
import random
import datetime
import requests
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

def deep_enrichment_v4():
    print("============================================================")
    print("   DEEP DATA ENRICHMENT & CONSISTENCY SYSTEM V4")
    print("============================================================")
    
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", "root"),
            database=os.getenv("DB_NAME", "travel_recommendation"),
            port=int(os.getenv("DB_PORT", 3307))
        )
        cursor = conn.cursor(dictionary=True)
        
        # 1. Lấy thông tin người dùng và địa điểm từ cơ sở dữ liệu
        cursor.execute("SELECT user_id, interests FROM users")
        users = cursor.fetchall()
        
        cursor.execute("SELECT location_id, category_id, name FROM locations")
        locations = cursor.fetchall()
        
        cursor.execute("SELECT category_id, name FROM categories")
        categories = cursor.fetchall()
        cat_map = {c['name']: c['category_id'] for c in categories}
        cat_id_to_name = {c['category_id']: c['name'] for c in categories}
        
        # Ánh xạ chuỗi hành vi logic dựa trên tâm lý du khách
        # Ví dụ: Sau khi ghé nhà hàng, du khách thường đi cà phê hoặc quán ăn vặt
        logic_chains = {
            'Nhà hàng': ['Quán cà phê', 'Quán ăn', 'Hải sản'],
            'Chùa': ['Văn hóa', 'Di tích lịch sử', 'Nhà hàng'], # Thường đi ăn uống sau khi đi lễ chùa
            'Bãi biển': ['Hải sản', 'Quán ăn', 'Quán cà phê'],
            'Quán ăn': ['Quán cà phê', 'Ăn vặt']
        }
        
        print(f"[DATA] Found {len(users)} users and {len(locations)} locations.")
        
        # 2. Tạo nhật ký hành vi mang tính logic
        print("[STEP 1] Generating logical behavior chains...")
        new_logs = 0
        for u in users:
            if not u['interests']: continue
            user_interests = [i.strip() for i in u['interests'].split(',')]
            
            for interest in user_interests:
                main_cat_id = cat_map.get(interest)
                if not main_cat_id: continue
                
                # Địa điểm thuộc danh mục chính
                main_locs = [l for l in locations if l['category_id'] == main_cat_id]
                if not main_locs: continue
                
                # Lựa chọn ngẫu nhiên một vài địa điểm chính
                picked_main = random.sample(main_locs, min(len(main_locs), 3))
                for m_loc in picked_main:
                    # Ghi nhận lượt xem chi tiết địa điểm chính
                    cursor.execute("INSERT IGNORE INTO user_behavior_logs (user_id, location_id, action_type, session_id, device_type, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                                 (u['user_id'], m_loc['location_id'], 'VIEW_DETAILS', 'logic_session', 'Mobile', datetime.datetime.now()))
                    new_logs += 1
                    
                    # Chuỗi hành vi tiếp theo: Tìm các danh mục liên quan
                    related_cats = logic_chains.get(interest, [])
                    for r_cat_name in related_cats:
                        if random.random() > 0.5: # 50% cơ hội thực hiện hành vi liên quan tiếp theo
                            r_cat_id = cat_map.get(r_cat_name)
                            if not r_cat_id: continue
                            
                            related_locs = [l for l in locations if l['category_id'] == r_cat_id]
                            if related_locs:
                                r_loc = random.choice(related_locs)
                                cursor.execute("INSERT IGNORE INTO user_behavior_logs (user_id, location_id, action_type, session_id, device_type, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                                             (u['user_id'], r_loc['location_id'], 'VIEW_DETAILS', 'logic_session', 'Mobile', datetime.datetime.now()))
                                new_logs += 1
        
        conn.commit()
        print(f"[SUCCESS] Added {new_logs} logical behavior entries.")
        
        # 3. Đồng bộ hóa bộ đếm số lượt xem và đánh giá của các địa điểm
        print("[STEP 2] Synchronizing total_reviews, view_count, and average_rating...")
        
        # Cập nhật số lượt xem (view_count)
        cursor.execute("""
            UPDATE locations l
            SET view_count = (SELECT COUNT(*) FROM user_behavior_logs ubl WHERE ubl.location_id = l.location_id)
        """)
        
        # Cập nhật số lượng review và điểm đánh giá trung bình
        cursor.execute("""
            UPDATE locations l
            SET total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.location_id = l.location_id),
                average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.location_id = l.location_id)
        """)
        
        conn.commit()
        print("[SUCCESS] Database counters synchronized.")
 
        # 4. Tải lại mô hình gợi ý mới
        print("[STEP 3] Triggering AI Model Reload...")
        try:
            requests.get("http://localhost:8000/recommend/reload", timeout=10)
        except:
            pass
 
        # 5. Khởi chạy tiến trình đánh giá thuật toán
        print("[STEP 4] Running Evaluation...")
        eval_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "evaluation.py")
        subprocess.run(["python", eval_path], check=True)
        
        print("============================================================")
        print("   OPTIMIZATION COMPLETE: DATA IS LOGICAL AND CONSISTENT")
        print("============================================================")
 
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Optimization failed: {e}")rint(f"[ERROR] Optimization failed: {e}")

if __name__ == "__main__":
    deep_enrichment_v4()
