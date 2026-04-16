import pandas as pd
import numpy as np
import sys
import os

# Đảm bảo utils nằm trong path để import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.nlp_utils import NumpyTfidf, cosine_similarity_numpy

def precompute_content_based(df: pd.DataFrame):
    """
    Tiền toán lý thuyết Content-Based Filtering:
    Sử dụng TF-IDF (Term Frequency-Inverse Document Frequency) để chuyển đổi 
    đặc trưng văn bản của địa điểm thành vector không gian.
    
    Công thức TF-IDF áp dụng:
    1. TF(t,d) = Number of times t appears in d / Total words in d
    2. IDF(t,D) = log(Total documents / Documents with t)
    3. TF-IDF = TF * IDF
    """
    
    # Kết hợp các đặc trưng (Features) để tạo tập ngữ liệu (Corpus)
    df['combined_features'] = df['name'].fillna('').astype(str) + " " + \
                              df['description'].fillna('').astype(str) + " " + \
                              df['category_id'].fillna('').astype(str) + " " + \
                              df['tags'].fillna('').astype(str)
    
    corpus = df['combined_features'].fillna('').astype(str).tolist()
    
    # Bước 1: Khởi tạo vector hóa vector không gian từ vựng
    tfidf = NumpyTfidf()
    tfidf_matrix = tfidf.fit_transform(corpus)
    
    # Bước 2: Tính ma trận tương đồng Cosine (Cosine Similarity Matrix)
    # Công thức: Similarity(A, B) = cos(theta) = (A . B) / (||A|| * ||B||)
    # Kết quả score nằm trong khoảng [0, 1], càng gần 1 càng tương đồng.
    cosine_sim = cosine_similarity_numpy(tfidf_matrix)
    
    return cosine_sim

def recommend_content_based(df: pd.DataFrame, cosine_sim, location_id: int, top_n: int = 5):
    """
    Gợi ý dựa trên địa điểm cụ thể (Item-to-Item Content-Based):
    Tìm các địa điểm có vector TF-IDF gần nhất với địa điểm hiện tại.
    """
    if location_id not in df['location_id'].values:
        return []

    # Tìm index của địa điểm hiện tại
    idx = df.index[df['location_id'] == location_id].tolist()[0]
    
    # Lấy điểm tương đồng của tất cả các địa điểm với địa điểm này
    sim_scores = list(enumerate(cosine_sim[idx]))
    
    # Sắp xếp giảm dần theo score
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Loại bỏ chính nó và lấy top_n
    sim_scores = [score for score in sim_scores if score[0] != idx][:top_n]
    
    result = []
    for score in sim_scores:
        loc_index = score[0]
        # Chuyển đổi điểm đo (Similarity) sang phần trăm hiển thị
        adjusted_score = 0.55 + (float(score[1]) * 0.44)
        result.append({
            "placeId": int(df.iloc[loc_index]['location_id']),
            "score": round(adjusted_score, 2)
        })
    return result
