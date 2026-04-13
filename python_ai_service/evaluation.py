import pandas as pd
from sqlalchemy import create_engine
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from utils.nlp_utils import NumpyTfidf, cosine_similarity_numpy
from models.collaborative import precompute_collaborative, recommend_collaborative

DB_URL = "mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation"

def calculate_precision_recall_f1(recommended, ground_truth):
    if not ground_truth:
        return 0.0, 0.0, 0.0
    
    hits = len(set(recommended) & set(ground_truth))
    precision = hits / len(recommended) if recommended else 0.0
    recall = hits / len(ground_truth) if ground_truth else 0.0
    
    f1 = 0.0
    if precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)
        
    return precision, recall, f1

def evaluate_metrics():
    print("="*70)
    print(" BÁO CÁO ĐÁNH GIÁ THUẬT TOÁN AI BẰNG SỐ LIỆU THỰC TẾ (REAL METRICS)")
    print("="*70)
    
    try:
        engine = create_engine(DB_URL)
        df_reviews = pd.read_sql("SELECT user_id, location_id, rating FROM reviews", engine)
        df_locations = pd.read_sql("SELECT location_id, name, description, category_id, latitude, longitude FROM locations", engine)
        
        if df_reviews.empty or df_locations.empty:
            print("⚠️ CSDL trống hoặc thiếu dữ liệu Review/Location. Hãy đảm bảo đã Import ít nhất 1 Địa điểm và 1 Đánh giá.")
            return

        # 1. ĐÁNH GIÁ CONTENT-BASED FILTERING
        print("\n[1] ĐÁNH GIÁ CONTENT-BASED FILTERING")
        df_locations['combined'] = df_locations['name'].fillna('') + " " + df_locations['description'].fillna('')
        corpus = df_locations['combined'].tolist()
        
        tfidf = NumpyTfidf()
        tfidf_matrix = tfidf.fit_transform(corpus)
        cosine_sim = cosine_similarity_numpy(tfidf_matrix)

        demo_idx = 0
        demo_loc = df_locations.iloc[demo_idx]
        print(f" -> Bài toán: Gợi ý các địa điểm tương tự với [{demo_loc['name']}]")
        sim_scores = sorted(list(enumerate(cosine_sim[demo_idx])), key=lambda x: x[1], reverse=True)[1:6]
        print(f" -> Top 5 Gợi ý:")
        for rank, (idx, score) in enumerate(sim_scores):
            print(f"    {rank+1}. {df_locations.iloc[idx]['name']} (Độ đo tương đồng: {score:.4f})")
            
        # 2. ĐÁNH GIÁ COLLABORATIVE FILTERING (Real MAE/RMSE/Prec/Rec)
        print("\n[2] ĐÁNH GIÁ COLLABORATIVE FILTERING")
        print(f" -> Kích thước tập dữ liệu: {len(df_reviews)} đánh giá.")
        
        if len(df_reviews) < 5:
            print(" ⚠️ Dữ liệu Review quá ít để chia Train/Test. Hãy Rating thêm vài địa điểm.")
            return
            
        # Train/Test Split (80/20) - Pandas native
        test = df_reviews.sample(frac=0.2, random_state=42)
        train = df_reviews.drop(test.index)
        
        matrix, item_corr, pop_fallback = precompute_collaborative(train)
        
        # Calculate MAE & RMSE 
        errors = []
        for _, row in test.iterrows():
            u = row['user_id']
            i = row['location_id']
            actual = row['rating']
            
            # Predict
            pred = train['rating'].mean() # Default fallback
            if matrix is not None and u in matrix.index and i in item_corr.columns:
                user_ratings = matrix.loc[u]
                item_sims = item_corr[i]
                
                # Filter items rated by user
                mask = user_ratings > 0
                rated_items = user_ratings[mask].index
                
                numerator = sum(item_sims[r] * user_ratings[r] for r in rated_items if not np.isnan(item_sims[r]))
                denominator = sum(abs(item_sims[r]) for r in rated_items if not np.isnan(item_sims[r]))
                
                if denominator > 0:
                    pred = numerator / denominator
            
            errors.append(abs(pred - actual))
            
        if errors:
            mae = np.mean(errors)
            rmse = np.sqrt(np.mean(np.square(errors)))
            print(f" -> MAE (Sai số tuyệt đối): {mae:.4f}")
            print(f" -> RMSE (Sai số bình phương): {rmse:.4f}")
        
        # Precision @ K
        K = 5
        precisions = []
        recalls = []
        f1s = []
        
        test_users = test['user_id'].unique()
        for u in test_users:
            # Ground truth: Items user rated >= 3.5 in Test Set
            user_test_items = test[(test['user_id'] == u) & (test['rating'] >= 3.5)]['location_id'].tolist()
            if not user_test_items: continue
            
            # Recommend Top K
            recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=K)
            rec_ids = [int(r['placeId']) for r in recs]
            
            p, r, f = calculate_precision_recall_f1(rec_ids, user_test_items)
            precisions.append(p)
            recalls.append(r)
            f1s.append(f)
            
        if precisions:
            print(f" -> Precision@{K}: {np.mean(precisions)*100:.2f}%")
            print(f" -> Recall@{K}:    {np.mean(recalls)*100:.2f}%")
            print(f" -> F1-Score:     {np.mean(f1s)*100:.2f}%")
            
        # 3. ĐÁNH GIÁ CONTEXT-AWARE
        print("\n[3] ĐÁNH GIÁ CONTEXT-AWARE (Kết hợp Real-time Môi trường & Khoảng cách)")
        print(" -> Giả lập Context: 14h chiều (Nắng ấm), Tọa độ (10.762, 106.660) - TPHCM")
        from models.osm_integration import recommend_by_context_and_osm
        
        recs = recommend_by_context_and_osm(df_locations, lat=10.762, lng=106.660, hour=14, weather="Clear", top_n=5)
        print(" -> Top 5 Gợi ý Context-Aware:")
        for rank, r in enumerate(recs):
            loc_id = r['placeId']
            score = r['score']
            name = df_locations[df_locations['location_id'] == loc_id].iloc[0]['name']
            print(f"    {rank+1}. {name} (Context Score: {score:.4f})")
            
        print("\n" + "="*70)
        print(" ĐÁNH GIÁ THÀNH CÔNG! HỆ THỐNG ĐÃ SẴN SÀNG CHO BUỔI BẢO VỆ.")
        
    except Exception as e:
        print(f"Lỗi: {e}")

if __name__ == "__main__":
    evaluate_metrics()
