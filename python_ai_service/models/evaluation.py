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

def calculate_map(recommended, ground_truth):
    """Mean Average Precision@K"""
    if not ground_truth or not recommended:
        return 0.0
    score = 0.0
    num_hits = 0.0
    for i, p in enumerate(recommended):
        if p in ground_truth:
            num_hits += 1.0
            score += num_hits / (i + 1.0)
    max_possible_hits = min(len(recommended), len(ground_truth))
    return score / max_possible_hits if max_possible_hits > 0 else 0.0

def calculate_diversity(recommended, df_locations):
    """Intra-List Diversity (Category Coverage)"""
    if not recommended:
        return 0.0
    cats = []
    for item in recommended:
        rows = df_locations[df_locations['location_id'] == item]
        if not rows.empty:
            cats.append(rows['category_id'].values[0])
    if not cats:
        return 0.0
    return len(set(cats)) / len(recommended)

def calculate_novelty(recommended, item_popularities):
    """Novelty (Information Self-Content with Laplace Smoothing)"""
    if not recommended:
        return 0.0
    novelty_scores = []
    for item in recommended:
        pop = item_popularities.get(item, 1e-9)
        novelty_scores.append(-np.log2(pop))
    return np.mean(novelty_scores)

def evaluate_metrics():
    print("="*70)
    print(" AI ALGORITHM EVALUATION REPORT (REAL METRICS & VISUALIZATION)")
    print("="*70)
    
    output_dir = "evaluation_results"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        engine = create_engine(DB_URL)
        
        # 1. Load implicit/explicit interaction data
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

        # 2. Split train/test data (80/20)
        test = df_reviews.sample(frac=0.2, random_state=42)
        train = df_reviews.drop(test.index)
        
        # Compute Laplace-smoothed item popularities on training set for Novelty
        # P(i) = (count(i) + 1) / (total_interactions + N_items)
        item_counts = train['location_id'].value_counts()
        total_interactions = len(train)
        N_unique_items = len(df_locations)
        
        item_popularities = {}
        for lid in df_locations['location_id']:
            count = item_counts.get(lid, 0)
            item_popularities[lid] = (count + 1) / (total_interactions + N_unique_items)
        
        # 3. Evaluate MAE & RMSE for Collaborative Filtering
        print("\n[1] EVALUATING COLLABORATIVE FILTERING ERROR METRICS...")
        matrix, item_corr, pop_fallback = precompute_collaborative(train)
        
        errors = []
        for _, row in test.iterrows():
            u, i, actual = row['user_id'], row['location_id'], row['rating']
            pred = train['rating'].mean()
            if matrix is not None and u in matrix.index and i in item_corr.columns:
                user_ratings = matrix.loc[u]
                item_sims = item_corr[i]
                
                overall_sims = []
                for other_item in matrix.columns:
                    if other_item != i:
                        sim = item_sims[other_item]
                        if not np.isnan(sim) and sim > 0:
                            overall_sims.append((other_item, sim))
                
                # Match recommend Top K=5
                top_k_neighbors = sorted(overall_sims, key=lambda x: x[1], reverse=True)[:5]
                
                if top_k_neighbors:
                    sum_all_sims = sum(sim for _, sim in top_k_neighbors)
                    # For prediction error, we convert back to 1-5 explicit scale:
                    # pred = base_score * 4 + 1
                    liked_neighbors_count = sum(1 for r, _ in top_k_neighbors if user_ratings[r] == 1.0)
                    sum_liked_sims = sum(sim for r, sim in top_k_neighbors if user_ratings[r] == 1.0)
                    
                    if sum_all_sims > 0:
                        base_score = sum_liked_sims / sum_all_sims
                        pred = base_score * 4.0 + 1.0
                        pred = max(1.0, min(5.0, pred))
            errors.append(abs(pred - actual))
            
        mae = np.mean(errors) if errors else 0
        rmse = np.sqrt(np.mean(np.square(errors))) if errors else 0
        
        # 4. Evaluate Ranking, Diversity, and Novelty Metrics
        K = 5
        collab_precisions, collab_recalls, collab_f1s, collab_maps, collab_diversities, collab_novelties = [], [], [], [], [], []
        content_precisions, content_recalls, content_f1s, content_maps, content_diversities, content_novelties = [], [], [], [], [], []
        
        # Precompute Content similarity for evaluation
        cosine_sim = precompute_content_based(df_locations)

        test_users = test['user_id'].unique()
        count_users = 0
        for u in test_users:
            gt = test[(test['user_id'] == u) & (test['rating'] >= 4)]['location_id'].tolist()
            if not gt: continue
            
            count_users += 1
            
            # Collaborative recommendations
            c_recs = recommend_collaborative(train, matrix, item_corr, pop_fallback, u, top_n=K, df_locations=df_locations, df_profiles=df_profiles)
            c_ids = [int(r['placeId']) for r in c_recs]
            p, r, f1 = calculate_precision_recall_f1(c_ids, gt)
            collab_precisions.append(p)
            collab_recalls.append(r)
            collab_f1s.append(f1)
            collab_maps.append(calculate_map(c_ids, gt))
            collab_diversities.append(calculate_diversity(c_ids, df_locations))
            collab_novelties.append(calculate_novelty(c_ids, item_popularities))
            
            # Content-Based recommendations
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
                content_maps.append(calculate_map(cnt_ids, gt))
                content_diversities.append(calculate_diversity(cnt_ids, df_locations))
                content_novelties.append(calculate_novelty(cnt_ids, item_popularities))

        # Averages
        avg_collab_p = np.mean(collab_precisions) if collab_precisions else 0
        avg_collab_r = np.mean(collab_recalls) if collab_recalls else 0
        avg_collab_map = np.mean(collab_maps) if collab_maps else 0
        avg_collab_div = np.mean(collab_diversities) if collab_diversities else 0
        avg_collab_nov = np.mean(collab_novelties) if collab_novelties else 0

        avg_content_p = np.mean(content_precisions) if content_precisions else 0
        avg_content_r = np.mean(content_recalls) if content_recalls else 0
        avg_content_map = np.mean(content_maps) if content_maps else 0
        avg_content_div = np.mean(content_diversities) if content_diversities else 0
        avg_content_nov = np.mean(content_novelties) if content_novelties else 0

        print(f" -> Processed {count_users} users for evaluation.")
        print(f" -> Collaborative MAE         : {mae:.4f}")
        print(f" -> Collaborative RMSE        : {rmse:.4f}")
        print(f" -> Collaborative Precision@5 : {avg_collab_p*100:.2f}%")
        print(f" -> Collaborative Recall@5    : {avg_collab_r*100:.2f}%")
        print(f" -> Collaborative MAP@5       : {avg_collab_map*100:.2f}%")
        print(f" -> Collaborative Diversity@5 : {avg_collab_div*100:.2f}%")
        print(f" -> Collaborative Novelty     : {avg_collab_nov:.4f} bits")
        print("-"*50)
        print(f" -> Content-Based Precision@5 : {avg_content_p*100:.2f}%")
        print(f" -> Content-Based Recall@5    : {avg_content_r*100:.2f}%")
        print(f" -> Content-Based MAP@5       : {avg_content_map*100:.2f}%")
        print(f" -> Content-Based Diversity@5 : {avg_content_div*100:.2f}%")
        print(f" -> Content-Based Novelty     : {avg_content_nov:.4f} bits")

        # 5. Visualization of advanced metrics
        print("\n[3] GENERATING COMPREHENSIVE COMPARISON CHART...")
        sns.set_theme(style="whitegrid")
        
        metrics = ['Precision@5', 'Recall@5', 'MAP@5', 'Diversity@5']
        collab_values = [avg_collab_p, avg_collab_r, avg_collab_map, avg_collab_div]
        content_values = [avg_content_p, avg_content_r, avg_content_map, avg_content_div] 
        
        x = np.arange(len(metrics))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(10, 6))
        rects1 = ax.bar(x - width/2, collab_values, width, label='Collaborative', color='#06b6d4')
        rects2 = ax.bar(x + width/2, content_values, width, label='Content-Based', color='#8b5cf6')
        
        ax.set_ylabel('Scores')
        ax.set_title('AI Recommendation Models Evaluation')
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
                "f1": round(np.mean(collab_f1s) if collab_f1s else 0, 4),
                "map": round(avg_collab_map, 4),
                "diversity": round(avg_collab_div, 4),
                "novelty": round(avg_collab_nov, 4)
            },
            "content_based": {
                "precision": round(avg_content_p, 4),
                "recall": round(avg_content_r, 4),
                "f1": round(np.mean(content_f1s) if content_f1s else 0, 4),
                "map": round(avg_content_map, 4),
                "diversity": round(avg_content_div, 4),
                "novelty": round(avg_content_nov, 4)
            },
            "timestamp": pd.Timestamp.now().isoformat()
        }
        with open(os.path.join(output_dir, "metrics.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4)
        print(f"--- Saved JSON results at: {output_dir}/metrics.json ---")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"--- Error during execution: {e} ---")

if __name__ == "__main__":
    evaluate_metrics()
