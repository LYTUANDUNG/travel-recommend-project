import pandas as pd
import numpy as np
import sys
import os

# Ensure utils is in path for relative import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.nlp_utils import NumpyTfidf, cosine_similarity_numpy

def precompute_content_based(df: pd.DataFrame):
    df['combined_features'] = df['name'].fillna('').astype(str) + " " + \
                              df['description'].fillna('').astype(str) + " " + \
                              df['category_id'].fillna('').astype(str) + " " + \
                              df['tags'].fillna('').astype(str)
    
    # Force convert to pure string list to completely avoid np.nan
    corpus = df['combined_features'].fillna('').astype(str).tolist()
    
    tfidf = NumpyTfidf()
    tfidf_matrix = tfidf.fit_transform(corpus)
    cosine_sim = cosine_similarity_numpy(tfidf_matrix)
    return cosine_sim

def recommend_content_based(df: pd.DataFrame, cosine_sim, location_id: int, top_n: int = 5):
    idx = df.index[df['location_id'] == location_id].tolist()[0]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = [score for score in sim_scores if score[0] != idx][:top_n]
    
    result = []
    for score in sim_scores:
        loc_index = score[0]
       
        adjusted_score = 0.55 + (float(score[1]) * 0.44)
        result.append({
            "placeId": int(df.iloc[loc_index]['location_id']),
            "score": round(adjusted_score, 2)
        })
    return result
