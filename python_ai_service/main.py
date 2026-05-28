from fastapi import FastAPI, HTTPException
import pandas as pd
import platform
# Hack to fix SQLAlchemy WMI hang on Windows Python 3.12
platform.machine = lambda: 'AMD64'
from sqlalchemy import create_engine
import os
import json
from dotenv import load_dotenv

load_dotenv()
from models.content_based.content_based import recommend_content_based, precompute_content_based
from models.collaborative.collaborative import recommend_collaborative, precompute_collaborative

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
    return {"status": "AI Service is running", "version": "1.0.0", "endpoints": ["/recommend/content", "/recommend/collaborative"]}

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
item_corr = None
pop_fallback = None
df_profiles = None

@app.on_event("startup")
def load_model_once():
    reload_models()

@app.get("/recommend/reload")
def reload_models():
    global df_locations, cosine_sim
    global df_reviews, user_item_matrix, item_corr, pop_fallback, df_profiles
    print("[INFO] Refreshing AI Models...")
    
    try:
        sql = """
            SELECT 
                l.location_id, l.name, l.description, l.category_id, 
                l.latitude, l.longitude,
                c.name as category_name,
                GROUP_CONCAT(t.name SEPARATOR ' ') as tags
            FROM locations l
            LEFT JOIN categories c ON l.category_id = c.category_id
            LEFT JOIN location_tags lt ON l.location_id = lt.location_id
            LEFT JOIN tags t ON lt.tag_id = t.tag_id
            GROUP BY l.location_id
        """
        df_locations = pd.read_sql(sql, engine)
        if not df_locations.empty:
            cosine_sim = precompute_content_based(df_locations)
            
        # 2. COLLABORATIVE DATA: Merging explicit (reviews) and implicit (favorites, logs) feedback
        # Use MAX(rating) to handle cases where a user has multiple interaction types for the same location
        sql_interactions = """
            SELECT user_id, location_id, MAX(rating) as rating
            FROM (
                SELECT user_id, location_id, rating FROM reviews
                UNION ALL
                SELECT user_id, location_id, 5 as rating FROM favorites
                UNION ALL
                SELECT user_id, location_id, 3 as rating FROM user_behavior_logs 
                WHERE action_type IN ('CLICK_BOOKING', 'VIEW_DETAILS')
            ) as combined
            GROUP BY user_id, location_id
        """
        df_reviews = pd.read_sql(sql_interactions, engine)
        
        # Lấy thêm User Interest Profiles để hỗ trợ Content-Based cá nhân hóa
        df_profiles = pd.read_sql("SELECT user_id, category_id, affinity_score FROM user_interest_profiles", engine)
        
        user_item_matrix, item_corr, pop_fallback = precompute_collaborative(df_reviews)
        
        # Store profiles in global for use in recommendations
        app.state.df_profiles = df_profiles
        
        print("[SUCCESS] Models reloaded successfully with Implicit Feedback & Profiles!")
        return {"success": True, "message": "Models reloaded with enhanced data"}
    except Exception as e:
        print(f"[ERROR] Error reloading models: {e}")
        return {"success": False, "message": str(e)}

enrichment_lock = threading.Lock()

@app.get("/recommend/enrich")
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


@app.get("/recommend/collaborative")
def get_collaborative_recommendation(user_id: int = None, top_n: int = 10):
    try:
        if user_id is None:
            return {"success": True, "data": [], "message": "Fallback"}

        if df_reviews is None or df_reviews.empty:
            return {"success": True, "data": [], "message": "Fallback"}
            
        recommendations = recommend_collaborative(df_reviews, user_item_matrix, item_corr, pop_fallback, user_id, top_n)
        return {"success": True, "data": recommendations, "message": "OK"}
    except Exception as e:
        import traceback
        print(f"[ERROR] /recommend/collaborative crash: {e}")
        traceback.print_exc()
        return {"success": True, "data": [], "message": f"Fallback: {str(e)}"}

@app.get("/recommend/content")
def get_content_based_recommendation(location_id: int = None, user_id: int = None, top_n: int = 5):
    try:
        if location_id is None:
            return {"success": True, "data": [], "message": "Fallback"}

        if df_locations is None or df_locations.empty:
            return {"success": True, "data": [], "message": "Fallback"}
        
        if location_id not in df_locations['location_id'].values:
            return {"success": True, "data": [], "message": "Fallback"}
            
        exclude_ids = []
        if user_id is not None and df_reviews is not None and not df_reviews.empty:
            exclude_ids = df_reviews[df_reviews['user_id'] == int(user_id)]['location_id'].tolist()

        recommendations = recommend_content_based(
            df_locations, 
            cosine_sim, 
            location_id, 
            top_n, 
            user_id, 
            df_profiles,
            exclude_ids=exclude_ids
        )
        return {"success": True, "data": recommendations, "message": "OK"}
    except Exception as e:
        import traceback
        print(f"[ERROR] /recommend/content crash: {e}")
        traceback.print_exc()
        return {"success": True, "data": [], "message": "Fallback"}

@app.get("/recommend/metrics")
def get_ai_metrics():
    """Lấy kết quả đánh giá thực nghiệm (RMSE, MAE, Precision)"""
    metrics_path = "evaluation_results/metrics.json"
    if not os.path.exists(metrics_path):
        return {"success": False, "message": "Metrics not generated. Run evaluation first."}
    
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"success": True, "data": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
