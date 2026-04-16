import mysql.connector
import random
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "root"),
    "database": os.getenv("DB_NAME", "travel_recommendation")
}

def seed_academic_data():
    print("--- Bat dau tao du lieu thuc nghiem (Academic Seeding) ---")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # 1. Tao Users mau
        users = [
            ("culture_lover", "Ha Noi", "Viet Nam", "Van hoa, Lich su, Bao tang"),
            ("nature_fan", "Da Lat", "Viet Nam", "Thien nhien, Leo nui, Rung"),
            ("foodie_pro", "TP.HCM", "Viet Nam", "Am thuc, Duong pho, Ca phe"),
            ("nightlife_king", "Da Nang", "Viet Nam", "Bar, Pub, Soi dong"),
            ("luxury_traveler", "Phu Quoc", "Viet Nam", "Resort, Nghi duong, Sang trong")
        ]

        user_ids = []
        for username, city, nationality, interests in users:
            cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
            res = cursor.fetchone()
            if not res:
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash, full_name, role, city, nationality, interests) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (username, f"{username}@test.com", "user123", f"User {username.capitalize()}", "USER", city, nationality, interests)
                )
                user_ids.append(cursor.lastrowid)
            else:
                user_ids.append(res[0])

        # 2. Lay danh sach dia diem
        cursor.execute("SELECT location_id, category_id, name FROM locations")
        locations = cursor.fetchall()

        if not locations:
            print("--- Canh bao: Khong tim thay dia diem nao trong DB ---")
            return

        # 3. Tao Ratings
        print("--- Dang tao ban ghi danh gia tuong quan ---")
        
        rating_count = 0
        for uid in user_ids:
            cursor.execute("SELECT interests FROM users WHERE user_id = %s", (uid,))
            interest_str = cursor.fetchone()[0]

            for loc_id, cat_id, loc_name in locations:
                if random.random() > 0.4: continue 

                score = random.randint(3, 4)
                if "Van hoa" in interest_str and cat_id == 1: score = random.randint(4, 5)
                elif "Van hoa" in interest_str and cat_id == 4: score = random.randint(1, 2)
                if "Thien nhien" in interest_str and cat_id == 2: score = random.randint(4, 5)
                
                cursor.execute("SELECT review_id FROM reviews WHERE user_id = %s AND location_id = %s", (uid, loc_id))
                if not cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO reviews (user_id, location_id, rating, comment, created_at) VALUES (%s, %s, %s, %s, NOW())",
                        (uid, loc_id, score, f"Trai nghiem tuyet voi tai {loc_name}!")
                    )
                    rating_count += 1

        conn.commit()
        print(f"--- Da them {len(user_ids)} nguoi dung mau va {rating_count} danh gia tuong quan ---")
        print("--- He thong da san sang de chay Evaluation ---")

    except Exception as e:
        print(f"--- Loi khi seeding: {e} ---")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    seed_academic_data()
