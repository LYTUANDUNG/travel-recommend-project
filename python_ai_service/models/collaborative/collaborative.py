import pandas as pd
import numpy as np

def precompute_collaborative(df_reviews: pd.DataFrame):
    """
    Tiền toán Collaborative Filtering (Lọc cộng tác dựa trên Item-Item Implicit):
    1. Chuyển đổi dữ liệu tương tác thành dạng nhị phân (Binary Implicit):
       - rating >= 4.0 (booking, favorites, reviews cao) -> 1.0 (Like/Active preference)
       - rating < 4.0 (chỉ xem chi tiết/bản đồ) -> 0.0 (Unobserved/Neutral)
    2. Tính toán tương đồng Cosine trên ma trận nhị phân.
    """
    if len(df_reviews) < 5:
        # Fallback về Popularity nếu dữ liệu quá ít
        pop_fallback = df_reviews.groupby('location_id')['rating'].mean().sort_values(ascending=False)
        return None, None, pop_fallback
        
    # Bước 1: Chuyển đổi tương tác sang dạng nhị phân nhãn implicit
    df_binary = df_reviews.copy()
    df_binary['binary_rating'] = df_binary['rating'].apply(lambda r: 1.0 if r >= 4.0 else 0.0)
    
    # Khởi tạo Ma trận Người dùng - Địa điểm nhị phân (User-Item Matrix)
    raw_matrix = df_binary.pivot_table(index='user_id', columns='location_id', values='binary_rating', aggfunc='mean')
    matrix = raw_matrix.fillna(0.0)
    
    # Bước 2: Tính ma trận tương đồng Cosine giữa các địa điểm (Items)
    # Cosine Similarity trên vector nhị phân đại diện cho tỷ lệ co-preference chuẩn implicit.
    X = matrix.values
    dot_product = np.dot(X.T, X)
    norms = np.linalg.norm(X, axis=0)
    norm_product = np.outer(norms, norms)
    norm_product[norm_product == 0] = 1e-9  # Tránh chia cho 0
    
    cosine_sim = dot_product / norm_product
    item_corr = pd.DataFrame(cosine_sim, index=matrix.columns, columns=matrix.columns)
    
    # Popularity fallback dựa trên số lượt Like thực tế (rating >= 4)
    pop_fallback = df_binary[df_binary['binary_rating'] == 1.0].groupby('location_id').size().sort_values(ascending=False)
    if pop_fallback.empty and not df_reviews.empty:
        # Fallback sang độ nổi tiếng tổng quát dựa trên số lượng tương tác
        pop_fallback = df_reviews.groupby('location_id').size().sort_values(ascending=False)
    
    return matrix, item_corr, pop_fallback


def recommend_collaborative(df_reviews: pd.DataFrame, user_item_matrix, item_corr, pop_fallback, user_id: int, top_n: int = 5, threshold: float = None, df_locations: pd.DataFrame = None, df_profiles: pd.DataFrame = None):
    """
    Dự đoán điểm (Prediction) dựa trên sở thích của người dùng:
    1. Sử dụng Top K=5 láng giềng gần nhất để lọc nhiễu lịch sử.
    2. Áp dụng công thức Implicit CF chuẩn hóa:
       base_score = sum(sim_liked) / sum(sim_all_neighbors)
    3. Category Affinity Boost tăng cường cá nhân hóa sử dụng trọng số alpha = 0.3.
    4. Sắp xếp kết quả kết hợp tie-breaker (score, denominator).
    5. Hỗ trợ lọc theo ngưỡng với UX Fallback: nếu ngưỡng quá cao trả về rỗng, tự động lùi về top_n.
    """
    
    # Xử lý Cold Start cho người dùng mới hoặc thiếu dữ liệu tương tác
    if user_item_matrix is None or user_id not in user_item_matrix.index:
        res = []
        for loc_id in pop_fallback.index:
            res.append({
                "placeId": int(loc_id), 
                "score": 1.0
            })
            
        if threshold is not None:
            filtered_res = [r for r in res if r['score'] >= threshold]
            if len(filtered_res) > 0:
                return filtered_res
            else:
                return res[:top_n]
        else:
            return res[:top_n]
            
    # df_locations và df_profiles phải được truyền vào từ ứng dụng chính (main.py)
    if df_locations is None or df_profiles is None:
        raise ValueError("Dữ liệu df_locations và df_profiles bắt buộc phải được cung cấp.")
            
    user_ratings = user_item_matrix.loc[user_id]
    scores = {}
    
    # Lấy thông tin Category Affinity Profile của user
    user_affinity = {}
    if df_profiles is not None:
        user_p = df_profiles[df_profiles['user_id'] == int(user_id)]
        for _, p in user_p.iterrows():
            user_affinity[int(p['category_id'])] = float(p['affinity_score'])

    # Các địa điểm user đã tương tác tích cực (like = 1.0)
    liked_items = user_ratings[user_ratings == 1.0].index.tolist()
    
    for item in user_item_matrix.columns:
        # Chỉ dự đoán cho các địa điểm user CHƯA từng tương tác tích cực
        if user_ratings[item] == 0: 
            item_sims = item_corr[item]
            
            # Tìm danh sách láng giềng có tương đồng dương (loại trừ chính nó)
            overall_sims = []
            for other_item in user_item_matrix.columns:
                if other_item != item:
                    sim = item_sims[other_item]
                    if not np.isnan(sim) and sim > 0:
                        overall_sims.append((other_item, sim))
                        
            # Lọc ra Top K=5 láng giềng có tương đồng cao nhất
            top_k_neighbors = sorted(overall_sims, key=lambda x: x[1], reverse=True)[:5]
            
            if top_k_neighbors:
                sum_all_sims = sum(sim for _, sim in top_k_neighbors)
                sum_liked_sims = sum(sim for r, sim in top_k_neighbors if r in liked_items)
                
                if sum_all_sims > 0:
                    # Công thức Implicit CF Chuẩn Hóa
                    base_score = sum_liked_sims / sum_all_sims
                    
                    # Áp dụng Category Affinity Boost dựa trên mức độ quan tâm của người dùng
                    alpha = 0.3
                    if df_locations is not None:
                        loc_row = df_locations[df_locations['location_id'] == item]
                        if not loc_row.empty:
                            cat_id = int(loc_row.iloc[0]['category_id'])
                            affinity = user_affinity.get(cat_id, 0.0)
                            final_score = min(1.0, base_score * (1.0 + alpha * min(3.0, affinity)))
                        else:
                            final_score = base_score
                    else:
                        final_score = base_score
                        
                    scores[item] = (final_score, sum_all_sims)
                
    # Sắp xếp theo score (chính) và sum_all_sims (phụ - giải quyết đồng điểm)
    recommended_items = sorted(scores.items(), key=lambda x: (x[1][0], x[1][1]), reverse=True)
    
    result = []
    for item_id, (score, _) in recommended_items:
        result.append({
            "placeId": int(item_id),
            "score": round(score, 3)
        })
        
    # Áp dụng bộ lọc ngưỡng nghiêm ngặt (Strict Threshold Filtering)
    if threshold is not None:
        result = [r for r in result if r['score'] >= threshold]
        
    return result[:top_n]
