import pandas as pd
import numpy as np

def precompute_collaborative(df_reviews: pd.DataFrame):
    """
    Tiền toán Collaborative Filtering (Lọc cộng tác dựa trên Item):
    Tìm mối quan hệ giữa các địa điểm dựa trên hành vi đánh giá của người dùng.
    
    Công thức Pearson Correlation:
    r = Cov(X, Y) / (std(X) * std(Y))
    Nó đo lường mức độ tương quan tuyến tính giữa hai tập điểm đánh giá.
    """
    if len(df_reviews) < 5:
        # Fallback về Popularity nếu dữ liệu quá ít
        pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
        return None, None, pop_fallback
        
    # Bước 1: Khởi tạo Ma trận Người dùng - Địa điểm (User-Item Matrix)
    # Các hàng là User, các cột là Location, giá trị là điểm Rating.
    # Sử dụng pivot_table để xử lý trường hợp một user có nhiều rating cho cùng 1 location (lấy trung bình).
    matrix = df_reviews.pivot_table(index='user_id', columns='location_id', values='rating', aggfunc='mean').fillna(0)
    
    # Bước 2: Tính hệ số tương quan Pearson giữa các địa điểm (Items)
    # Kết quả là một ma trận Square [N_locations x N_locations]
    item_corr = matrix.corr(method='pearson')
    
    # Popularity fallback (Điểm trung bình thực tế)
    pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
    
    return matrix, item_corr, pop_fallback

def recommend_collaborative(df_reviews: pd.DataFrame, user_item_matrix, item_corr, pop_fallback, user_id: int, top_n: int = 5):
    """
    Dự đoán điểm (Prediction) dựa trên sở thích của người dùng:
    Sử dụng trung bình có trọng số của các item tương đồng mà người dùng đã từng đánh giá.
    """
    
    # Trường hợp Cold Start (Người dùng mới hoặc không đủ dữ liệu)
    if user_item_matrix is None or user_id not in user_item_matrix.index:
        res = []
        for loc_id in pop_fallback.head(top_n).index:
            # Normalize rating (1-5) to 0-1 scale: (R-1)/4
            raw_rating = float(pop_fallback[loc_id])
            normalized_score = (max(1.0, min(5.0, raw_rating)) - 1.0) / 4.0
            res.append({
                "placeId": int(loc_id), 
                "score": round(normalized_score, 3)
            })
        return res
        
    user_ratings = user_item_matrix.loc[user_id]
    scores = {}
    
    # Dự đoán điểm cho các item mà người dùng CHƯA đánh giá
    for item in user_item_matrix.columns:
        if user_item_matrix.loc[user_id, item] == 0: 
            item_sims = item_corr[item]
            
            # Công thức Weighted Average:
            # Pred = Sigma(Similarity * Rating) / Sigma(|Similarity|)
            numerator = sum(item_sims[rated_item] * user_ratings[rated_item] 
                           for rated_item in user_ratings[user_ratings > 0].index 
                           if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            denominator = sum(item_sims[rated_item] 
                              for rated_item in user_ratings[user_ratings > 0].index 
                              if not np.isnan(item_sims[rated_item]) and item_sims[rated_item] > 0)
            
            if denominator > 0:
                scores[item] = numerator / denominator
                
    recommended_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    
    result = []
    for item_id, score in recommended_items:
        # Normalize rating (1-5) to 0-1 scale: (R-1)/4
        normalized_score = (max(1.0, min(5.0, float(score))) - 1.0) / 4.0
        result.append({
            "placeId": int(item_id),
            "score": round(normalized_score, 3)
        })
        
    return result
