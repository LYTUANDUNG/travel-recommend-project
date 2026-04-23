import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import os
import sys

# Mocking the imports to be able to run this standalone for debugging
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.collaborative.collaborative import precompute_collaborative
from models.content_based.content_based import precompute_content_based

DB_URL = "mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation"

def debug_evaluation():
    engine = create_engine(DB_URL)
    df_reviews = pd.read_sql("SELECT user_id, location_id, rating FROM reviews", engine)
    
    print(f"Total reviews: {len(df_reviews)}")
    print(f"Sample reviews:\n{df_reviews.head()}")
    
    test = df_reviews.sample(frac=0.2, random_state=42)
    train = df_reviews.drop(test.index)
    
    matrix, item_corr, pop_fallback = precompute_collaborative(train)
    
    errors = []
    print("\nIndividual Prediction Debug:")
    for _, row in test.iterrows():
        u, i, actual = row['user_id'], row['location_id'], row['rating']
        default_pred = train['rating'].mean()
        pred = default_pred
        
        if matrix is not None and u in matrix.index and i in item_corr.columns:
            user_ratings = matrix.loc[u]
            item_sims = item_corr[i]
            mask = user_ratings > 0
            rated_items = user_ratings[mask].index
            
            num = sum(item_sims[r] * user_ratings[r] for r in rated_items if not np.isnan(item_sims[r]))
            den = sum(abs(item_sims[r]) for r in rated_items if not np.isnan(item_sims[r]))
            
            if den > 0: 
                pred = num / den
        
        err = abs(pred - actual)
        errors.append(err)
        print(f"User: {u}, Item: {i}, Actual: {actual}, Pred: {pred:.4f}, Error: {err:.4f}")

    mae = np.mean(errors) if errors else 0
    print(f"\nCalculated MAE: {mae:.4f}")

if __name__ == "__main__":
    debug_evaluation()
