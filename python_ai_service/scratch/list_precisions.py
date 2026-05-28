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

test_users = test['user_id'].unique()
user_precs = []

for u in test_users:
    gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
    if not gt:
        continue
    
    recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=5)
    c_ids = [int(r['placeId']) for r in recs]
    p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
    user_precs.append((u, p, len(gt), len(c_ids), c_ids))

print("=== USER PRECISION REPORT ===")
for u, p, gt_len, c_len, c_ids in sorted(user_precs, key=lambda x: x[1]):
    gt_vals = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
    print(f"User {u:2d}: Precision={p*100:6.2f}% | GT count={gt_len:2d} | Rec count={c_len:2d} | Recs={c_ids} | GT={gt_vals}")
