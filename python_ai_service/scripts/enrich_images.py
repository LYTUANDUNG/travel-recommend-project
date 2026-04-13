import os
import time
import requests
import mysql.connector
from duckduckgo_search import DDGS
import cloudinary
import cloudinary.uploader
import random
from dotenv import load_dotenv
import requests
import os

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "root"),
    "database": os.getenv("DB_NAME", "travel_recommendation")
}

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if CLOUDINARY_URL:
    try:
        cloudinary.config(
            cloud_name=CLOUDINARY_URL.split('@')[1],
            api_key=CLOUDINARY_URL.split('://')[1].split(':')[0],
            api_secret=CLOUDINARY_URL.split(':')[2].split('@')[0]
        )
    except: pass

def search_ddg(query):
    """Tìm ảnh qua DDG một lần duy nhất, lỗi là nghỉ"""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=3))
            if results:
                return [r["image"] for r in results]
            return []
    except Exception as e:
        print(f"[WARNING] DDG Error '{e}'. Bỏ qua vì bị chặn Rate-limit.")
        return []

def search_unsplash(query):
    """Fallback Unsplash API"""
    api_key = os.getenv("UNSPLASH_API_KEY") # Add to .env if you want this fallback active
    if not api_key:
        return []
    try:
        res = requests.get("https://api.unsplash.com/search/photos", params={
            "query": query + " vietnam interior",
            "per_page": 3,
            "client_id": api_key
        }, timeout=10)
        
        if res.status_code == 200:
            data = res.json()
            return [img["urls"]["regular"] for img in data.get("results", [])]
    except Exception as e:
        print(f"[WARNING] Unsplash Error: {e}")
    return []

def get_images_batch(query, count=3):
    """Tìm nhiều ảnh sử dụng architecture DDG + Unsplash Fallback"""
    images = search_ddg(query + " Vietnam travel")
    if images:
        return images[:count]
        
    print(f"[FALLBACK] DDG Failed/Rate Limited for '{query}', falling back to Unsplash API...")
    return search_unsplash(query)[:count]

def clean_query(name, province):
    # Lọc bỏ các từ rườm rà
    remove_words = ["Phường", "Quận", "Thành phố", "Xã", "Huyện", "Tỉnh"]
    clean_name = name
    for w in remove_words:
        clean_name = clean_name.replace(w, "").strip()
    return f"{clean_name} {province} Vietnam"

def process_location(loc):
    """Xử lý 1 địa điểm đơn lẻ"""
    loc_id = loc['location_id']
    name = loc['name']
    province = loc['province'] or ""
    thumb = loc['thumbnail_url'] or ""

    # Nếu đã có ảnh xịn rồi thì bỏ qua
    if thumb and "cloudinary" in thumb:
        return None

    search_query = clean_query(name, province)
    print(f"[SEARCH] Đang tìm ảnh cho: {name} ({province})")
    
    img_urls = get_images_batch(search_query, count=1)
    
    if img_urls:
        source_url = img_urls[0]
        try:
            res = cloudinary.uploader.upload(source_url, folder="travel_recommendation/auto_v3")
            new_url = res.get("secure_url")
            return (new_url, loc_id)
        except:
            return None
    return None

def enrich_fast():
    print("[START] Bắt đầu Parallel Enrichment (Address-Based)...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT l.location_id, l.name, l.address, l.province, l.thumbnail_url, c.name as category FROM locations l LEFT JOIN categories c ON l.category_id = c.category_id")
    locations = cursor.fetchall()
    
    # Lọc những nơi cần ảnh
    to_process = [l for l in locations if not l['thumbnail_url'] or "unsplash" in l['thumbnail_url']]
    print(f"[DATA] Cần xử lý {len(to_process)}/{len(locations)} địa điểm.")

    success = 0
    # Chạy tuần tự với delay để tránh bị chặn bởi DuckDuckGo
    for loc in to_process:
        res = process_location(loc)
        if res:
            new_url, loc_id = res
            cursor.execute("UPDATE locations SET thumbnail_url = %s WHERE location_id = %s", (new_url, loc_id))
            success += 1
            if success % 5 == 0:
                conn.commit()
                print(f"[SAVE] Đã lưu tiến độ: {success} ảnh.")
        time.sleep(random.uniform(1.5, 3.5)) # Delay chống block

    conn.commit()
    cursor.close()
    conn.close()
    print(f"[DONE] Hoàn tất! Đã cập nhật {success} địa điểm với độ chính xác cao.")

if __name__ == "__main__":
    enrich_fast()
