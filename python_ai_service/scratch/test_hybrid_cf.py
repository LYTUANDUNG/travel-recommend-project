import sys
import os
sys.path.append('.')
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

engine = create_engine('mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation')

from models.collaborative.collaborative import precompute_collaborative
from models.evaluation import calculate_precision_recall_f1

sql_interactions = """
    SELECT user_id, location_id, MAX(rating) as rating
    FROM (
        SELECT user_id, location_id, rating FROM reviews
        UNION ALL
        SELECT user_id, location_id, 5 as rating FROM favorites
        UNION ALL
        SELECT user_id, location_id, 5 as rating FROM user_behavior_logs 
        WHERE action_type = 'CLICK_BOOKING'
        UNION ALL
        SELECT user_id, location_id, 3 as rating FROM user_behavior_logs 
        WHERE action_type IN ('VIEW_DETAILS', 'VIEW_MAP')
    ) as combined
    GROUP BY user_id, location_id
"""

df_reviews = pd.read_sql(sql_interactions, engine)
sql_locations = """
    SELECT l.location_id, l.category_id
    FROM locations l
"""
df_locations = pd.read_sql(sql_locations, engine)
df_profiles = pd.read_sql("SELECT * FROM user_interest_profiles", engine)

test = df_reviews.sample(frac=0.2, random_state=42)
train = df_reviews.drop(test.index)

matrix, item_corr, pop_fallback = precompute_collaborative(train)

def recommend_collaborative_hybrid(user_id, top_n=5):
    if matrix is None or user_id not in matrix.index:
        # Fallback to popularity
        res = []
        for loc_id in pop_fallback.index:
            raw_rating = float(pop_fallback[loc_id])
            normalized_score = (max(1.0, min(5.0, raw_rating)) - 1.0) / 4.0
            res.append({"placeId": int(loc_id), "score": round(normalized_score, 3)})
            if len(res) >= top_n:
                break
        return res
        
    user_ratings = matrix.loc[user_id]
    scores = {}
    
    # Get user profiles for category boost
    user_affinity = {}
    user_p = df_profiles[df_profiles['user_id'] == int(user_id)]
    for _, p in user_p.iterrows():
        user_affinity[int(p['category_id'])] = float(p['affinity_score'])

    for item in matrix.columns:
        if matrix.loc[user_id, item] == 0: 
            item_sims = item_corr[item]
            
            numerator = sum(item_sims[rated_item] * user_ratings[rated_item] 
                           for rated_item in user_ratings[user_ratings > 0].index 
                           if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            denominator = sum(item_sims[rated_item] 
                              for rated_item in user_ratings[user_ratings > 0].index 
                              if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            if denominator > 0:
                pred_rating = numerator / denominator
                normalized_score = (max(1.0, min(5.0, float(pred_rating))) - 1.0) / 4.0
                
                # Apply Category Affinity Boost
                loc_row = df_locations[df_locations['location_id'] == item]
                if not loc_row.empty:
                    cat_id = int(loc_row.iloc[0]['category_id'])
                    affinity = user_affinity.get(cat_id, 1.0)
                    # Boost score just like Content-Based
                    final_score = min(1.0, normalized_score * min(2.0, max(1.0, affinity)))
                else:
                    final_score = normalized_score
                    
                scores[item] = final_score
                
    recommended_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"placeId": int(item_id), "score": round(score, 3)} for item_id, score in recommended_items]

test_users = test['user_id'].unique()
precisions = []
for u in test_users:
    gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
    if not gt: continue
    
    recs = recommend_collaborative_hybrid(u, top_n=5)
    c_ids = [int(r['placeId']) for r in recs]
    p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
    precisions.append(p)

print(f"Hybrid Collaborative Filtering Precision@5: {np.mean(precisions)*100:.2f}%")
