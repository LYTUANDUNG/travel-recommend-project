import pandas as pd
import numpy as np

def precompute_collaborative(df_reviews: pd.DataFrame):
    if len(df_reviews) < 10:
        pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
        return None, None, pop_fallback
        
    matrix = df_reviews.pivot(index='user_id', columns='location_id', values='rating').fillna(0)
    item_corr = matrix.corr()
    pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
    
    return matrix, item_corr, pop_fallback

def recommend_collaborative(df_reviews: pd.DataFrame, user_item_matrix, item_corr, pop_fallback, user_id: int, top_n: int = 5):
    # Cold start fallback
    if user_item_matrix is None or user_id not in df_reviews['user_id'].values:
        res = []
        for loc_id in pop_fallback.head(top_n).index:
            adjusted_score = 0.60 + (float(pop_fallback[loc_id]) / 5.0) * 0.35
            res.append({
                "placeId": int(loc_id), 
                "score": round(adjusted_score, 2)
            })
        return res
        
    user_ratings = user_item_matrix.loc[user_id]
    scores = {}
    
    for item in user_item_matrix.columns:
        if user_item_matrix.loc[user_id, item] == 0: 
            item_sims = item_corr[item]
            numerator = sum(item_sims[rated_item] * user_ratings[rated_item] for rated_item in user_ratings[user_ratings > 0].index if not np.isnan(item_sims[rated_item]))
            denominator = sum(abs(item_sims[rated_item]) for rated_item in user_ratings[user_ratings > 0].index if not np.isnan(item_sims[rated_item]))
            if denominator > 0:
                scores[item] = numerator / denominator
                
    recommended_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    
    result = []
    for item_id, score in recommended_items:
        # predicted rank 1-5 scaled to 60-95%
        adjusted_score = 0.60 + (float(score) / 5.0) * 0.35
        result.append({
            "placeId": int(item_id),
            "score": round(adjusted_score, 2)
        })
        
    return result
