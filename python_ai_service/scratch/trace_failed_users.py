import sys
import os
sys.path.append('.')
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine('mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation')

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

# Query location categories
sql_locations = "SELECT location_id, category_id FROM locations"
df_locations = pd.read_sql(sql_locations, engine)
loc_to_cat = {r['location_id']: r['category_id'] for _, r in df_locations.iterrows()}

failed_users = [27, 44, 2, 34]

for u in failed_users:
    print(f"\n=== ANALYZING USER {u} ===")
    user_train = train[train['user_id'] == u]
    user_test = test[test['user_id'] == u]
    
    train_items = user_train['location_id'].tolist()
    train_cats = [loc_to_cat.get(item) for item in train_items]
    
    test_items = user_test['location_id'].tolist()
    test_cats = [loc_to_cat.get(item) for item in test_items]
    
    print("Train Items:", train_items)
    print("Train Categories:", train_cats)
    print("Test Items:", test_items)
    print("Test Categories:", test_cats)
