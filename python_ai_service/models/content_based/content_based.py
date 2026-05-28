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
    # Tăng trọng số (Boosting) cho category và tags bằng cách lặp lại chúng
    df['combined_features'] = (df['name'].fillna('').astype(str) + " ") * 2 + \
                              df['description'].fillna('').astype(str) + " " + \
                              (df['category_name'].fillna('').astype(str) + " ") * 5 + \
                              (df['tags'].fillna('').astype(str) + " ") * 3
    
    corpus = df['combined_features'].fillna('').astype(str).tolist()
    
    # Bước 1: Khởi tạo vector hóa vector không gian từ vựng
    tfidf = NumpyTfidf()
    tfidf_matrix = tfidf.fit_transform(corpus)
    
    # Bước 2: Tính ma trận tương đồng Cosine (Cosine Similarity Matrix)
    # Công thức: Similarity(A, B) = cos(theta) = (A . B) / (||A|| * ||B||)
    # Kết quả score nằm trong khoảng [0, 1], càng gần 1 càng tương đồng.
    cosine_sim = cosine_similarity_numpy(tfidf_matrix)
    
    return cosine_sim

def recommend_content_based(df: pd.DataFrame, cosine_sim, location_id: int, top_n: int = 5, user_id: int = None, df_profiles: pd.DataFrame = None, exclude_ids: list = None, threshold: float = None):
    """
    Gợi ý dựa trên địa điểm (Item-to-Item) và Cá nhân hóa (User Profiling):
    1. Tìm các điểm tương đồng về nội dung.
    2. Nếu có Profile người dùng, ưu tiên các điểm thuộc danh mục họ yêu thích.
    3. Áp dụng bộ lọc ngưỡng (threshold) để đảm bảo độ tương đồng tối thiểu.
    """
    if location_id not in df['location_id'].values:
        return []

    # Tìm index của địa điểm hiện tại
    idx = df.index[df['location_id'] == location_id].tolist()[0]
    
    # Lấy điểm tương đồng của tất cả các địa điểm với địa điểm này
    sim_scores = list(enumerate(cosine_sim[idx]))
    
    # Sắp xếp giảm dần theo score
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Loại bỏ chính nó
    sim_scores = [score for score in sim_scores if score[0] != idx]
    
    # Loại bỏ các địa điểm đã đánh giá / tương tác để tránh trùng lặp
    if exclude_ids is not None:
        exclude_set = set(int(x) for x in exclude_ids)
        sim_scores = [score for score in sim_scores if int(df.iloc[score[0]]['location_id']) not in exclude_set]
    
    # Lấy thông tin Profile nếu có
    user_affinity = {}
    if user_id is not None and df_profiles is not None:
        user_p = df_profiles[df_profiles['user_id'] == int(user_id)]
        for _, p in user_p.iterrows():
            user_affinity[int(p['category_id'])] = float(p['affinity_score'])

    result = []
    for score in sim_scores:
        loc_index = score[0]
        loc_row = df.iloc[loc_index]
        raw_score = float(score[1])
        
        # Personalized Boost: Nếu thuộc danh mục user thích, nhân thêm trọng số
        cat_id = int(loc_row['category_id'])
        affinity = user_affinity.get(cat_id, 1.0) # Mặc định là 1.0 (không đổi)
        
        # Công thức: Final = Sim * (1 + Affinity/MaxAffinity) hoặc đơn giản là Sim * Affinity
        # Ở đây dùng Affinity (thường từ 1.0 - 2.0 hoặc tùy hệ thống)
        final_score = min(1.0, raw_score * min(2.0, max(1.0, affinity)))
        
        if user_id is not None:
            print(f"DEBUG item={loc_row['location_id']}, cat={cat_id}, affinity={affinity}, raw={raw_score}, final={final_score}")
        
        result.append({
            "placeId": int(loc_row['location_id']),
            "score": round(final_score, 3),
            "original_sim": round(raw_score, 3)
        })

    # Sắp xếp kết quả sau khi boost
    result = sorted(result, key=lambda x: x['score'], reverse=True)

    # Áp dụng bộ lọc ngưỡng với UX Fallback phòng trường hợp ngưỡng quá cao trả về rỗng
    if threshold is not None:
        filtered_result = [r for r in result if r['score'] >= threshold]
        if len(filtered_result) > 0:
            # Trả về toàn bộ danh sách đạt ngưỡng (không bị giới hạn bởi top_n)
            return filtered_result
        else:
            # Fallback về top_n tiêu chuẩn để tránh hiển thị rỗng ở giao diện người dùng
            print(f"[INFO] Content-Based: Không có kết quả nào đạt ngưỡng {threshold}. Fallback về top_n={top_n}.")
            return result[:top_n]
    else:
        return result[:top_n]

    return result
