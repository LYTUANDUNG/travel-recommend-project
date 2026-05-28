import sys
import os
sys.path.append('.')
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

engine = create_engine('mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation')

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
test = df_reviews.sample(frac=0.2, random_state=42)
train = df_reviews.drop(test.index)

# 1. Compute precompute_collaborative with shrinkage
def precompute_collaborative_shrunk(df_reviews, shrinkage_lambda=3.0):
    raw_matrix = df_reviews.pivot_table(index='user_id', columns='location_id', values='rating', aggfunc='mean')
    matrix = raw_matrix.fillna(0)
    
    X = matrix.values
    dot_product = np.dot(X.T, X)
    norms = np.linalg.norm(X, axis=0)
    norm_product = np.outer(norms, norms)
    norm_product[norm_product == 0] = 1e-9
    
    cosine_sim = dot_product / norm_product
    
    # Calculate common users overlap
    mask = (raw_matrix > 0).astype(int).values
    common_users = np.dot(mask.T, mask)
    
    # Apply shrinkage factor
    support_factor = common_users / (common_users + shrinkage_lambda)
    cosine_sim = cosine_sim * support_factor
    
    item_corr = pd.DataFrame(cosine_sim, index=matrix.columns, columns=matrix.columns)
    pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
    
    return matrix, item_corr, pop_fallback

def recommend_collaborative(df_reviews, user_item_matrix, item_corr, pop_fallback, user_id: int, top_n: int = 5):
    if user_item_matrix is None or user_id not in user_item_matrix.index:
        res = []
        for loc_id in pop_fallback.index:
            raw_rating = float(pop_fallback[loc_id])
            normalized_score = (max(1.0, min(5.0, raw_rating)) - 1.0) / 4.0
            res.append({"placeId": int(loc_id), "score": round(normalized_score, 3)})
            if len(res) >= top_n:
                break
        return res
        
    user_ratings = user_item_matrix.loc[user_id]
    scores = {}
    
    for item in user_item_matrix.columns:
        if user_item_matrix.loc[user_id, item] == 0: 
            item_sims = item_corr[item]
            
            numerator = sum(item_sims[rated_item] * user_ratings[rated_item] 
                           for rated_item in user_ratings[user_ratings > 0].index 
                           if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            denominator = sum(item_sims[rated_item] 
                              for rated_item in user_ratings[user_ratings > 0].index 
                              if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            if denominator > 0:
                scores[item] = numerator / denominator
                
    recommended_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"placeId": int(item_id), "score": round((max(1.0, min(5.0, float(score))) - 1.0) / 4.0, 3)} for item_id, score in recommended_items]

# Evaluate different lambda values
for lmb in [0.0, 1.0, 2.0, 3.0, 5.0]:
    matrix, item_corr, pop_fallback = precompute_collaborative_shrunk(train, shrinkage_lambda=lmb)
    
    test_users = test['user_id'].unique()
    precisions = []
    for u in test_users:
        gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
        if not gt: continue
        
        recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=5)
        c_ids = [int(r['placeId']) for r in recs]
        p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
        precisions.append(p)
        
    print(f"Shrinkage Lambda = {lmb:.1f} | Collaborative Precision@5: {np.mean(precisions)*100:.2f}%")
