from fastapi import FastAPI, HTTPException
import pandas as pd
import platform
# Hack to fix SQLAlchemy WMI hang on Windows Python 3.12
platform.machine = lambda: 'AMD64'
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
from models.content_based import recommend_content_based, precompute_content_based
from models.collaborative import recommend_collaborative, precompute_collaborative
from models.osm_integration import recommend_by_context_and_osm
from scripts.enrich_images import enrich_fast
import threading

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Travel AI Recommendation Service")

# Setup CORS for Frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AI Service is running", "version": "1.0.0", "endpoints": ["/recommend/context", "/recommend/content", "/recommend/collaborative"]}

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3307")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")
DB_NAME = os.getenv("DB_NAME", "travel_recommendation")

DB_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

# Global memory caches
df_locations = None
cosine_sim = None
df_reviews = None
user_item_matrix = None
item_corr = None
pop_fallback = None

@app.on_event("startup")
def load_model_once():
    reload_models()

@app.post("/recommend/reload")
def reload_models():
    global df_locations, cosine_sim
    global df_reviews, user_item_matrix, item_corr, pop_fallback
    print("[INFO] Refreshing AI Models...")
    
    try:
        sql = """
            SELECT location_id, name, description, category_id, latitude, longitude, '' as tags
            FROM locations
        """
        df_locations = pd.read_sql(sql, engine)
        if not df_locations.empty:
            cosine_sim = precompute_content_based(df_locations)
            
        df_reviews = pd.read_sql("SELECT user_id, location_id, rating FROM reviews", engine)
        user_item_matrix, item_corr, pop_fallback = precompute_collaborative(df_reviews)
        print("[SUCCESS] Models reloaded successfully!")
        return {"success": True, "message": "Models reloaded"}
    except Exception as e:
        print(f"[ERROR] Error reloading models: {e}")
        return {"success": False, "message": str(e)}

enrichment_lock = threading.Lock()

@app.post("/recommend/enrich")
def background_enrich():
    """Trigger background image enrichment automatically after GIS Scanner"""
    if not enrichment_lock.acquire(blocking=False):
        return {"success": True, "message": "Enrichment is already running in background"}

    def run_enrich():
        try:
            enrich_fast()
        except Exception as e:
            print(f"Background enrichment failed: {e}")
        finally:
            enrichment_lock.release()
            
    t = threading.Thread(target=run_enrich)
    t.daemon = True
    t.start()
    return {"success": True, "message": "Enrichment started in background"}

@app.get("/recommend/context")
def get_context_recommendation(lat: float = 0, lng: float = 0, hour: int = 12, weather: str = "Clear", top_n: int = 10):
    """Gợi ý dựa trên ngữ cảnh (Thời gian, Thời tiết, Vị trí)"""
    if df_locations is None:
        return {"success": False, "message": "Models not loaded"}
    
    recs = recommend_by_context_and_osm(df_locations, lat, lng, hour, weather, top_n)
    
    # Map back to full location objects
    result_locations = []
    for r in recs:
        loc = df_locations[df_locations['location_id'] == r['placeId']].iloc[0].to_dict()
        loc['match_score'] = int(r['score'] * 100)
        result_locations.append(loc)
        
    return {"success": True, "data": result_locations}

@app.get("/recommend/collaborative")
def get_collaborative_recommendation(user_id: int = 0, top_n: int = 10):
    if df_reviews is None:
        return []
        
    recommendations = recommend_collaborative(df_reviews, user_item_matrix, item_corr, pop_fallback, user_id, top_n)
    return {"success": True, "data": recommendations, "message": "OK"}

@app.get("/recommend/content")
def get_content_based_recommendation(location_id: int, top_n: int = 5):
    if df_locations is None or df_locations.empty:
        return {"success": False, "data": [], "message": "Data not loaded"}
    
    if location_id not in df_locations['location_id'].values:
        return {"success": False, "data": [], "message": f"Location {location_id} not in cache. Try /reload"}
        
    recommendations = recommend_content_based(df_locations, cosine_sim, location_id, top_n)
    return {"success": True, "data": recommendations, "message": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
