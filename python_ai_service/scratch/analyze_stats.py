import pandas as pd
from sqlalchemy import create_engine

DB_URL = "mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation"

def get_stats():
    try:
        engine = create_engine(DB_URL)
        df_users = pd.read_sql("SELECT COUNT(*) as count FROM users", engine)
        df_locations = pd.read_sql("SELECT COUNT(*) as count FROM locations", engine)
        df_reviews = pd.read_sql("SELECT COUNT(*) as count, MIN(rating) as min_rating, MAX(rating) as max_rating FROM reviews", engine)
        
        num_users = df_users.iloc[0]['count']
        num_locations = df_locations.iloc[0]['count']
        num_reviews = df_reviews.iloc[0]['count']
        min_r = df_reviews.iloc[0]['min_rating']
        max_r = df_reviews.iloc[0]['max_rating']
        
        density = (num_reviews / (num_users * num_locations)) * 100 if num_users * num_locations > 0 else 0
        
        print(f"Num Users: {num_users}")
        print(f"Num Locations: {num_locations}")
        print(f"Num Reviews: {num_reviews}")
        print(f"Rating Range: {min_r} to {max_r}")
        print(f"Density: {density:.2f}%")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_stats()
