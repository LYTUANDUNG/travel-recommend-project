import sys
import os
sys.path.append('.')
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

engine = create_engine('mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation')

from models.collaborative.collaborative import precompute_collaborative, recommend_collaborative
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

matrix, item_corr, pop_fallback = precompute_collaborative(train)

# Select a single user with active ground truth
test_users = test['user_id'].unique()
target_user = None
for u in test_users:
    gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
    if len(gt) >= 2:
        target_user = u
        break

if target_user is None:
    target_user = test_users[0]

gt = test[(test['user_id'] == target_user) & (test['rating'] >= 4)]['location_id'].tolist()
print(f"=== TRACING USER {target_user} ===")
print("Ground Truth (Liked items in test set):", gt)

user_ratings = matrix.loc[target_user]
rated_in_train = user_ratings[user_ratings > 0].index.tolist()
print("Rated in Train (History):", rated_in_train)

# Recommending
c_recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, target_user, top_n=5)
print("Recommendations:", c_recs)

# Check why each ground truth item was or was not recommended
for gt_item in gt:
    print(f"\nAnalyzing Ground Truth Item {gt_item}:")
    is_rated_train = gt_item in rated_in_train
    print(f"  Is in Train? {is_rated_train}")
    
    if not is_rated_train:
        item_sims = item_corr[gt_item]
        # Look at similarities with rated train items
        sims = {r: item_sims[r] for r in rated_in_train if not np.isnan(item_sims[r])}
        print("  Similarities with rated items in train:", sims)
        
        # Calculate numerator and denominator
        numerator = sum(item_sims[r] * user_ratings[r] for r in rated_in_train if not np.isnan(item_sims[r]) and item_sims[r] > 0)
        denominator = sum(item_sims[r] for r in rated_in_train if not np.isnan(item_sims[r]) and item_sims[r] > 0)
        
        print(f"  Numerator: {numerator}, Denominator: {denominator}")
        if denominator > 0:
            pred_score = numerator / denominator
            norm_score = (pred_score - 1.0) / 4.0
            print(f"  Predicted Rating: {pred_score:.4f} | Normalized Score: {norm_score:.4f}")
        else:
            print("  Denominator is 0! No prediction can be made.")
