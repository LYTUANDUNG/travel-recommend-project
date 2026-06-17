import numpy as np
import math
from collections import Counter

class NumpyTfidf:
    """
    Bộ chuyển đổi đặc trưng văn bản TF-IDF sử dụng thư viện Numpy hiệu năng cao.
    Hỗ trợ xử lý văn bản tiếng Việt và biểu diễn địa điểm dưới dạng vector không gian.
    """
    def __init__(self):
        self.vocab = {}
        self.idf = []
        
    def fit_transform(self, corpus):
        # 1. Xây dựng từ điển (Vocabulary) và đếm tần suất tài liệu chứa từ (Document Frequency - DF)
        doc_words = []
        df_counts = Counter()
        
        for text in corpus:
            words = str(text).lower().split()
            doc_words.append(words)
            unique_words = set(words)
            for w in unique_words:
                if w not in self.vocab:
                    self.vocab[w] = len(self.vocab)
                df_counts[w] += 1
                
        # 2. Tính toán trọng số IDF (Inverse Document Frequency)
        N = len(corpus)
        self.idf = np.zeros(len(self.vocab))
        for w, idx in self.vocab.items():
            # Công thức IDF làm mượt: log((1+N)/(1+df)) + 1
            self.idf[idx] = math.log((1 + N) / (1 + df_counts[w])) + 1
            
        # 3. Tính toán ma trận trọng số TF-IDF
        matrix = np.zeros((N, len(self.vocab)), dtype=np.float32)
        for i, words in enumerate(doc_words):
            if not words: continue
            counts = Counter(words)
            for w, c in counts.items():
                if w in self.vocab:
                    # Tần suất xuất hiện TF thô
                    idx = self.vocab[w]
                    matrix[i, idx] = c * self.idf[idx]
                    
        # 4. Chuẩn hóa L2 vector (Chuẩn bị tính toán Cosine Similarity)
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1 # Tránh lỗi chia cho 0
        return matrix / norms

def cosine_similarity_numpy(matrix1, matrix2=None):
    """
    Tính toán ma trận tương đồng Cosine.
    Đầu vào giả định là các vector đã được chuẩn hóa L2.
    """
    if matrix2 is None:
        matrix2 = matrix1
    
    # Tích vô hướng của 2 vector chuẩn hóa L2 chính bằng Cosine Similarity
    return np.dot(matrix1, matrix2.T)
