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
active_users = 0
cold_users = 0
active_precisions = []
cold_precisions = []

for u in test_users:
    gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
    if not gt:
        continue
    
    # Collaborative Recs
    c_recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=5)
    c_ids = [int(r['placeId']) for r in c_recs]
    p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
    
    if matrix is not None and u in matrix.index:
        active_users += 1
        active_precisions.append(p)
    else:
        cold_users += 1
        cold_precisions.append(p)

print('Total Test Users with GT:', active_users + cold_users)
print('Active Train Users in Test:', active_users, f'| Avg Precision: {np.mean(active_precisions)*100:.2f}%' if active_precisions else '| Avg Precision: 0%')
print('Cold Start Users in Test:', cold_users, f'| Avg Precision: {np.mean(cold_precisions)*100:.2f}%' if cold_precisions else '| Avg Precision: 0%')

# Check raw item_corr matrix distribution
if item_corr is not None:
    non_one = item_corr.values[item_corr.values < 0.99]
    print('Item corr shape:', item_corr.shape)
    print('Max similarity (excluding self):', non_one.max() if len(non_one) > 0 else 'None')
    print('Min similarity:', item_corr.values.min())
    print('Mean similarity:', item_corr.values.mean())
    print('Percentage of 0.0 similarities:', (item_corr.values == 0).sum() / item_corr.size * 100, '%')
