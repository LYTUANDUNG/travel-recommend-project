import os
import time
import random
import requests
import mysql.connector
from duckduckgo_search import DDGS
import cloudinary
import cloudinary.uploader
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

# Cloudinary configuration
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if CLOUDINARY_URL:
    try:
        cloudinary.config(
            cloud_name=CLOUDINARY_URL.split('@')[1],
            api_key=CLOUDINARY_URL.split('://')[1].split(':')[0],
            api_secret=CLOUDINARY_URL.split(':')[2].split('@')[0]
        )
    except Exception as e:
        print(f"[ERROR] Cloudinary config failed: {e}", flush=True)

# PHẦN SERPER.DEV - (Giải pháp Production)
# SERPER_API_KEY = os.getenv("SERPER_API_KEY")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Edge/123.0.2420.81",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
]

def search_ddg_optimized(query):
    """
    Tìm ảnh qua DuckDuckGo với:
    - Cách 4: Rotate User-Agent
    - Cách 2: Retry + Backoff
    """
    for attempt in range(3):
        ua = random.choice(USER_AGENTS)
        try:
            with DDGS(headers={"User-Agent": ua}, timeout=10) as ddgs:
                results = list(ddgs.images(query, max_results=3))
                if results:
                    return [r["image"] for r in results]
                return []
        except Exception as e:
            if "403" in str(e):
                # Backoff: Nghỉ lâu dần (2s, 4s, 8s)
                wait_time = 2 ** (attempt + 1)
                print(f"   [RETRY] DDG Blocked, attempt {attempt+1}/3. Waiting {wait_time}s...", flush=True)
                time.sleep(wait_time)
                continue
            return []
    return "BLOCK"

def generate_smart_query(loc):
    """Làm giàu câu lệnh (Standard Logic)"""
    name = (loc.get('name') or "").strip()
    category = (loc.get('category') or "").lower()
    province = (loc.get('province') or "").strip()
    address = (loc.get('address') or "").strip()

    search_target = name if (name and name.lower() != "unnamed location") else f"{category} tại {address}"
    enrichment = "interior exterior real photo travel"
    if any(k in search_target.lower() or k in category for k in ["cinema", "rạp"]):
        enrichment = "cinema interior screen hall theater lobby"
    elif any(k in category for k in ["restaurant", "ăn uống", "cafe"]):
        enrichment = "interior decor table food"
    
    return f"{search_target} {province} Vietnam {enrichment} real photo"

def process_location(loc):
    loc_id = loc['location_id']
    name = (loc['name'] or "").strip()
    thumb = loc['thumbnail_url'] or ""

    if thumb and "cloudinary" in thumb: return None

    query = generate_smart_query(loc)
    print(f"\n[SCAN] -> {name if name.lower() != 'unnamed location' else 'Unnamed Location'}...", flush=True)
    
    img_urls = search_ddg_optimized(query)
    
    if img_urls == "BLOCK":
        return "WAIT"

    if img_urls and isinstance(img_urls, list):
        source_url = img_urls[0]
        try:
            res = cloudinary.uploader.upload(source_url, folder="travel_recommendation/optimized_v5", timeout=20)
            new_url = res.get("secure_url")
            print(f"   [SUCCESS] -> {new_url}", flush=True)
            return (new_url, loc_id)
        except Exception as e:
            print(f"   [ERROR] Cloudinary fetch failed: {e}", flush=True)
            return None
            
    print(f"   [FAILED] No images found.", flush=True)
    return None

def enrich_fast():
    print("="*60, flush=True)
    print("  IMAGE ENRICHMENT SYSTEM (FULL BEST PRACTICES)")
    print("="*60, flush=True)
    
    # Cách 3: BATCH_SIZE (Giảm tốc độ queue)
    BATCH_SIZE = 5
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT l.location_id, l.name, l.province, l.address, l.thumbnail_url, c.name as category 
            FROM locations l
            LEFT JOIN categories c ON l.category_id = c.category_id
            WHERE (l.thumbnail_url IS NULL OR l.thumbnail_url = '' OR l.thumbnail_url LIKE '%unsplash.com%')
        """
        cursor.execute(query)
        to_process = cursor.fetchall()
        print(f"[DATA] Total: {len(to_process)} location(s). Batch Size: {BATCH_SIZE}", flush=True)

        count = 0
        for loc in to_process:
            res = process_location(loc)
            
            if res == "WAIT":
                # Nếu bị block nặng, nghỉ hẳn 30s trước khi sang cái tiếp theo
                print("   [!] Severe Block detected. Resting 30s...", flush=True)
                time.sleep(30)
                continue

            if isinstance(res, tuple):
                cursor.execute("UPDATE locations SET thumbnail_url = %s WHERE location_id = %s", (res[0], res[1]))
                count += 1
                
                # Cách 3: Commit theo Batch
                if count % BATCH_SIZE == 0:
                    conn.commit()
                    print(f"   [BATCH] Commited progress: {count} images.", flush=True)
            
            # Cách 1: Thêm delay ngẫu nhiên (An toàn hơn yêu cầu)
            delay = random.uniform(5.0, 10.0)
            print(f"   [IDLE] {delay:.1f}s...", flush=True)
            time.sleep(delay)

        conn.commit()
        cursor.close(); conn.close()
        print("\n" + "="*60, flush=True)
        print("  ALL TASKS COMPLETED!", flush=True)
        print("="*60, flush=True)
    except Exception as e:
        print(f"[CRITICAL] {e}", flush=True)

if __name__ == "__main__":
    enrich_fast()
