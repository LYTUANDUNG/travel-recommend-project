import requests
import pandas as pd
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.nlp_utils import NumpyTfidf, cosine_similarity_numpy

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

def get_contextual_pois(lat: float, lng: float, hour: int, weather: str, radius: int = 5000):
    """
    Sử dụng Overpass API để lấy bối cảnh khu vực (Area Vibe) xung quanh người dùng.
    """
    if lat is None or lng is None or (lat == 0 and lng == 0):
        return ""
        
    categories = []
    
    if 5 <= hour < 11:
        categories.append('node["amenity"~"cafe"]')
    elif 11 <= hour < 14:
        categories.append('node["amenity"~"restaurant|food_court"]')
    elif 14 <= hour < 18:
        categories.append('node["leisure"~"park"]')
        categories.append('node["shop"~"mall"]')
    else:
        categories.append('node["amenity"~"bar|pub|nightclub"]')
        
    weather_lower = (weather or "Clear").lower()
    if 'rain' in weather_lower or 'storm' in weather_lower:
        categories = ['node["amenity"~"cafe|cinema"]', 'node["shop"~"mall"]']
        
    query_body = ""
    for cat in categories:
        query_body += f"  {cat}(around:{radius},{lat},{lng});\n"
        
    overpass_query = f"[out:json][timeout:15];({query_body});out body 50;"
    
    for url in OVERPASS_URLS:
        try:
            res = requests.post(url, data={'data': overpass_query}, timeout=10)
            if res.status_code == 200 and res.text.strip():
                data = res.json()
                results = [el.get('tags', {}).get('name', '') + " " + el.get('tags', {}).get('amenity', '') for el in data.get('elements', [])]
                return " ".join(results)
        except Exception as e:
            print(f"⚠️ OSM Error on {url}: {e}")
            continue
            
    return ""

def recommend_by_context_and_osm(df_locations, lat: float, lng: float, hour: int, weather: str, top_n: int = 5):
    """
    Kết hợp Dữ liệu OSM (Ambient POIs) + TF-IDF Cosine để Score Local Database Locations.
    """
    # 1. Fetch Real-time Vibe from OSM
    osm_vibe_text = get_contextual_pois(lat, lng, hour, weather)
    
    # 2. Add Base Context Keywords
    context_keywords = osm_vibe_text
    h = hour if hour is not None else 12
    w = (weather or "Clear").lower()

    if 5 <= h < 11: context_keywords += " cafe morning breakfast museum"
    elif 11 <= h < 14: context_keywords += " restaurant lunch food"
    elif 14 <= h < 18: context_keywords += " park mall afternoon shopping"
    else: context_keywords += " bar pub night dinner"
    
    if 'rain' in w or 'storm' in w:
        context_keywords += " indoor mall cinema museum"
    
    # 3. Handle Distance Filter (Haversine)
    if df_locations is None or df_locations.empty:
        return []

    df = df_locations.copy()
    try:
        if 'latitude' in df.columns and 'longitude' in df.columns and lat is not None and lng is not None and lat != 0 and lng != 0:
            R = 6371.0 # Earth radius km
            lat1, lon1 = np.radians(lat), np.radians(lng)
            lat2, lon2 = np.radians(df['latitude'].fillna(0.0)), np.radians(df['longitude'].fillna(0.0))
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = np.sin(dlat / 2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2)**2
            a = np.clip(a, 0.0, 1.0)
            c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
            df['distance'] = R * c
            df['dist_score'] = np.maximum(0.2, 1 - (df['distance'] / 2000.0))
        else:
            df['dist_score'] = 1.0

        # 4. TF-IDF Cosine Similarity
        descriptions = df['description'].fillna('') + " " + df['name'].fillna('')
        all_texts = descriptions.tolist() + [context_keywords]
        
        tfidf = NumpyTfidf()
        tfidf_matrix = tfidf.fit_transform(all_texts)
        
        if tfidf_matrix.shape[0] < 2:
            sim_scores = np.zeros(len(df))
        else:
            context_vector = tfidf_matrix[-1:] 
            location_vectors = tfidf_matrix[:-1]
            sim_scores = cosine_similarity_numpy(context_vector, location_vectors).flatten()
            
    except Exception as e:
        print(f"Error in osm integration math context: {e}")
        df['dist_score'] = 1.0
        sim_scores = np.zeros(len(df))
    
    # 5. Final Score Calculation
    df['sim_score'] = sim_scores
    df['final_score'] = (df['sim_score'] * 0.7) + (df['dist_score'] * 0.3)
    df['display_score'] = 0.50 + (df['final_score'].fillna(0) * 0.48)
    
    # 6. Get Top N
    top_indices = df['final_score'].fillna(0).argsort()[::-1][:top_n]
    
    results = []
    for idx in top_indices:
        if idx < len(df) and df.iloc[idx]['display_score'] > 0:
            try:
                results.append({
                    "placeId": int(df.iloc[idx]['location_id']),
                    "score": float(df.iloc[idx]['display_score'])
                })
            except:
                continue
            
    return results

