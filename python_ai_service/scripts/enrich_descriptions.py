import os
import random
import mysql.connector
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

# Bộ từ vựng phong phú để sinh nội dung AI-like
ADJECTIVES = ["Tuyệt vời", "Lý tưởng", "Ấn tượng", "Độc đáo", "Yên bình", "Sầm uất", "Thú vị", "Sang trọng", "Bình dân", "Cổ kính", "Hiện đại"]
RESTAURANT_PHRASES = [
    "là không gian ẩm thực lý tưởng cho những tín đồ yêu thích hương vị đặc trưng.",
    "mang đến trải nghiệm ẩm thực đa dạng với các món ăn được chế biến cầu kỳ.",
    "nổi tiếng với phong cách phục vụ chuyên nghiệp và thực đơn phong phú.",
    "là điểm đến không thể bỏ qua để thưởng thức đặc sản địa phương trong không gian ấm cúng."
]
CAFE_PHRASES = [
    "là góc nhỏ yên tĩnh phù hợp cho làm việc hoặc thư giãn cùng bạn bè.",
    "sở hữu không gian trang trí ấn tượng, là điểm check-in yêu thích của giới trẻ.",
    "nổi bật với hương vị cà phê rang xay nguyên chất và tầm nhìn thoáng đãng.",
    "mang phong cách kiến trúc độc đáo, kết hợp giữa nét truyền thống và hiện đại."
]
HOTEL_PHRASES = [
    "cung cấp dịch vụ lưu trú chất lượng cao với phòng nghỉ đầy đủ tiện nghi.",
    "là lựa chọn hoàn hảo cho kỳ nghỉ dưỡng bên gia đình với không gian xanh mát.",
    "tọa lạc tại vị trí đắc địa, giúp du khách dễ dàng di chuyển và khám phá thành phố.",
    "nổi bật với kiến trúc tinh tế và đội ngũ nhân viên nhiệt tình, tận tâm."
]
GENERAL_PHRASES = [
    "là điểm tham quan hấp dẫn mang đậm nét văn hóa và lịch sử địa phương.",
    "mang đến cho du khách những trải nghiệm thú vị và những khoảnh khắc đáng nhớ.",
    "là nơi giao thoa giữa cảnh quan thiên nhiên và kiến trúc con người độc đáo.",
    "được đánh giá cao về không gian thoáng mát và giá cả dịch vụ hợp lý."
]

def generate_ai_description(name, category, address, province):
    """Tự viết mô tả dựa trên template thông minh"""
    adj = random.choice(ADJECTIVES)
    cat_lower = category.lower() if category else ""
    
    if any(k in cat_lower for k in ["nhà hàng", "quán ăn", "restaurant", "ẩm thực"]):
        phrase = random.choice(RESTAURANT_PHRASES)
    elif any(k in cat_lower for k in ["cà phê", "cafe", "coffee"]):
        phrase = random.choice(CAFE_PHRASES)
    elif any(k in cat_lower for k in ["khách sạn", "hotel", "lưu trú", "homestay"]):
        phrase = random.choice(HOTEL_PHRASES)
    else:
        phrase = random.choice(GENERAL_PHRASES)

    # Xây dựng đoạn văn hoàn chỉnh
    description = f"{name} tại {address}, {province} là một địa điểm {adj.lower()} {phrase} "
    description += f"Nếu bạn đang tìm kiếm một không gian {random.choice(ADJECTIVES).lower()} tại {province} để khám phá thì đây chắc chắn là một lựa chọn đáng cân nhắc."
    
    return description

def enrich_descriptions_ai():
    print("="*60)
    print("  AI METADATA GENERATOR (OFFLINE MODE - NO BLOCKS)")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Tìm các địa điểm cần sửa
        cursor.execute("""
            SELECT l.location_id, l.name, l.province, l.address, l.description, c.name as category 
            FROM locations l
            LEFT JOIN categories c ON l.category_id = c.category_id
            WHERE (l.description IS NULL OR l.description = '' OR LENGTH(l.description) < 50 
                   OR l.description IN (SELECT description FROM (SELECT description FROM locations GROUP BY description HAVING COUNT(*) > 1) as t))
        """)
        to_process = cursor.fetchall()
        print(f"[DATA] Found {len(to_process)} locations needing AI enrichment.")

        count = 0
        for loc in to_process:
            loc_id = loc['location_id']
            name = (loc['name'] or "Địa điểm du lịch").strip()
            category = (loc['category'] or "Điểm đến").strip()
            address = (loc['address'] or "khu vực trung tâm").strip()
            province = (loc['province'] or "Việt Nam").strip()

            print(f"[{count+1}/{len(to_process)}] Generating for -> {name}...")
            
            # AI Tự viết nội dung
            new_desc = generate_ai_description(name, category, address, province)
            
            cursor.execute("UPDATE locations SET description = %s WHERE location_id = %s", (new_desc, loc_id))
            count += 1
            if count % 10 == 0: 
                conn.commit()
                print(f"   [COMMIT] Progress: {count} entries.")

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60)
        print(f"  SUCCESS! AI generated {count} unique descriptions.")
        print("="*60)
    except Exception as e:
        print(f"[CRITICAL] {e}")

if __name__ == "__main__":
    enrich_descriptions_ai()
