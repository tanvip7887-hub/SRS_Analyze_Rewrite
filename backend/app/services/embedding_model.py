from sentence_transformers import SentenceTransformer

print("Loading embedding model...")

MODEL = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

print("Model loaded successfully!")

def get_embeddings(texts):
    return MODEL.encode(texts, convert_to_tensor=True)