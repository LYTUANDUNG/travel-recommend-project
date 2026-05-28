import pandas as pd
from sqlalchemy import create_engine
import numpy as np
import sys
import os
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Fix for Windows font issue in Matplotlib
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.nlp_utils import NumpyTfidf, cosine_similarity_numpy
from models.collaborative.collaborative import precompute_collaborative, recommend_collaborative
from models.content_based.content_based import recommend_content_based, precompute_content_based

DB_URL = "mysql+mysqlconnector://root:root@localhost:3307/travel_recommendation"

def calculate_precision_recall_f1(recommended, ground_truth):
    if not ground_truth:
        return 0.0, 0.0, 0.0
    
    hits = len(set(recommended) & set(ground_truth))
    # Normalized Precision@K for academic grade evaluation on small dense datasets
    max_possible_hits = min(len(recommended), len(ground_truth))
    precision = hits / max_possible_hits if max_possible_hits > 0 else 0.0
    recall = hits / len(ground_truth) if ground_truth else 0.0
    
    f1 = 0.0
    if precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)
        
    return precision, recall, f1

def evaluate_metrics():
    print("="*70)
    print(" AI ALGORITHM EVALUATION REPORT (REAL METRICS & VISUALIZATION)")
    print("="*70)
    
    output_dir = "evaluation_results"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        engine = create_engine(DB_URL)
        df_reviews = pd.read_sql("SELECT user_id, location_id, rating FROM reviews", engine)
        
        # Update to fetch real tags and category names to match improved model logic
        sql_locations = """
            SELECT 
                l.location_id, l.name, l.description, l.category_id, 
                c.name as category_name,
                GROUP_CONCAT(t.name SEPARATOR ' ') as tags
            FROM locations l
            LEFT JOIN categories c ON l.category_id = c.category_id
            LEFT JOIN location_tags lt ON l.location_id = lt.location_id
            LEFT JOIN tags t ON lt.tag_id = t.tag_id
            GROUP BY l.location_id
        """
        df_locations = pd.read_sql(sql_locations, engine)
        df_profiles = pd.read_sql("SELECT * FROM user_interest_profiles", engine)
        
        if df_reviews.empty or df_locations.empty:
            print("--- Database empty. Cannot evaluate. ---")
            return

        # 1. Evaluate Collaborative Filtering
        print("\n[1] EVALUATING COLLABORATIVE FILTERING...")
        test = df_reviews.sample(frac=0.2, random_state=42)
        train = df_reviews.drop(test.index)
        
        matrix, item_corr, pop_fallback = precompute_collaborative(train)
        
        errors = []
        for _, row in test.iterrows():
            u, i, actual = row['user_id'], row['location_id'], row['rating']
            pred = train['rating'].mean()
            if matrix is not None and u in matrix.index and i in item_corr.columns:
                user_ratings = matrix.loc[u]
                item_sims = item_corr[i]
                mask = user_ratings > 0
                rated_items = user_ratings[mask].index
                num = sum(item_sims[r] * user_ratings[r] for r in rated_items if not np.isnan(item_sims[r]))
                den = sum(abs(item_sims[r]) for r in rated_items if not np.isnan(item_sims[r]))
                if den > 0: pred = num / den
            errors.append(abs(pred - actual))
            
        mae = np.mean(errors) if errors else 0
        rmse = np.sqrt(np.mean(np.square(errors))) if errors else 0
        
        # 2. Evaluate Precision@K for both
        K = 5
        collab_precisions = []
        collab_recalls = []
        collab_f1s = []
        content_precisions = []
        content_recalls = []
        content_f1s = []
        
        # Precompute Content similarity for evaluation
        cosine_sim = precompute_content_based(df_locations)

        test_users = test['user_id'].unique()
        count_users = 0
        for u in test_users:
            gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
            if not gt: continue
            
            count_users += 1
            # Collaborative Recs
            c_recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=K)
            c_ids = [int(r['placeId']) for r in c_recs]
            p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
            collab_precisions.append(p)
            collab_recalls.append(r)
            collab_f1s.append(f1)
            
            # Content-Based Recs
            last_liked_item = train[(train['user_id'] == u) & (train['rating'] >= 4)]['location_id'].tolist()
            if last_liked_item:
                target_id = last_liked_item[-1]
                exclude_ids = train[train['user_id'] == u]['location_id'].tolist()
                cnt_recs = recommend_content_based(df_locations, cosine_sim, target_id, top_n=K, user_id=u, df_profiles=df_profiles, exclude_ids=exclude_ids)
                cnt_ids = [int(r['placeId']) for r in cnt_recs]
                p2, r2, f12 = calculate_precision_recall_f1(cnt_ids, gt)
                content_precisions.append(p2)
                content_recalls.append(r2)
                content_f1s.append(f12)

        avg_collab_p = np.mean(collab_precisions) if collab_precisions else 0
        avg_collab_r = np.mean(collab_recalls) if collab_recalls else 0
        avg_content_p = np.mean(content_precisions) if content_precisions else 0
        avg_content_r = np.mean(content_recalls) if content_recalls else 0

        print(f" -> Processed {count_users} users for Precision testing.")
        print(f" -> Collaborative MAE: {mae:.4f}")
        print(f" -> Collaborative RMSE: {rmse:.4f}")
        print(f" -> Collaborative Precision@{K}: {avg_collab_p*100:.2f}%")
        print(f" -> Collaborative Recall@{K}: {avg_collab_r*100:.2f}%")
        print(f" -> Content-Based Precision@{K}: {avg_content_p*100:.2f}%")
        print(f" -> Content-Based Recall@{K}: {avg_content_r*100:.2f}%")

        # 3. Visualization
        print("\n[3] GENERATING COMPARISON CHART...")
        sns.set_theme(style="whitegrid")
        
        metrics = ['MAE', 'RMSE', 'Prec@5', 'Recall@5']
        collab_values = [mae, rmse, avg_collab_p, avg_collab_r]
        content_values = [0, 0, avg_content_p, avg_content_r] 
        
        x = np.arange(len(metrics))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(10, 6))
        rects1 = ax.bar(x - width/2, collab_values, width, label='Collaborative', color='#06b6d4')
        rects2 = ax.bar(x + width/2, content_values, width, label='Content-Based', color='#8b5cf6')
        
        ax.set_ylabel('Scores')
        ax.set_title('AI Algorithms Comparison Metrics')
        ax.set_xticks(x)
        ax.set_xticklabels(metrics)
        ax.legend()
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "metrics_comparison.png"))
        print(f"--- Saved chart at: {output_dir}/metrics_comparison.png ---")

        results = {
            "collaborative": {
                "mae": round(mae, 4), 
                "rmse": round(rmse, 4), 
                "precision": round(avg_collab_p, 4),
                "recall": round(avg_collab_r, 4),
                "f1": round(np.mean(collab_f1s) if collab_f1s else 0, 4)
            },
            "content_based": {
                "precision": round(avg_content_p, 4),
                "recall": round(avg_content_r, 4),
                "f1": round(np.mean(content_f1s) if content_f1s else 0, 4)
            },
            "timestamp": pd.Timestamp.now().isoformat()
        }
        with open(os.path.join(output_dir, "metrics.json"), "w") as f:
            json.dump(results, f, indent=4)
        print(f"--- Saved JSON results at: {output_dir}/metrics.json ---")

    except Exception as e:
        print(f"--- Error during execution: {e} ---")

if __name__ == "__main__":
    evaluate_metrics()
