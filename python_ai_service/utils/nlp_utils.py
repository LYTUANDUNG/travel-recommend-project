import numpy as np
import math
from collections import Counter

class NumpyTfidf:
    """
    Lightweight TF-IDF implementation using pure Numpy.
    Replaces heavy scikit-learn/scipy dependencies which crash on Python 3.12 Windows.
    """
    def __init__(self):
        self.vocab = {}
        self.idf = []
        
    def fit_transform(self, corpus):
        # 1. Build Vocabulary and Document Frequencies (DF)
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
                
        # 2. Compute Inverse Document Frequency (IDF)
        N = len(corpus)
        self.idf = np.zeros(len(self.vocab))
        for w, idx in self.vocab.items():
            # Smoothing same as scikit-learn: log((1+N)/(1+df)) + 1
            self.idf[idx] = math.log((1 + N) / (1 + df_counts[w])) + 1
            
        # 3. Compute TF-IDF Matrix
        matrix = np.zeros((N, len(self.vocab)), dtype=np.float32)
        for i, words in enumerate(doc_words):
            if not words: continue
            counts = Counter(words)
            for w, c in counts.items():
                if w in self.vocab:
                    # Raw count TF
                    idx = self.vocab[w]
                    matrix[i, idx] = c * self.idf[idx]
                    
        # 4. L2 Normalization (cosine similarity preparation)
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1 # Prevent divide by zero
        return matrix / norms

def cosine_similarity_numpy(matrix1, matrix2=None):
    """
    Computes cosine similarity matrix. 
    Assumes inputs are already L2-normalized!
    """
    if matrix2 is None:
        matrix2 = matrix1
    
    # Dot product of normalized vectors = Cosine Similarity
    return np.dot(matrix1, matrix2.T)
