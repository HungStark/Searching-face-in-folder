from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import cv2
import os
import numpy as np
from ultralytics import YOLO
from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
import json
import uuid

app = FastAPI()

model = YOLO("face_detection.pt")
SIMILARITY_THRESHOLD = 0.7

def get_embedding_from_image(image_path):
    """Extract embedding from a new image."""
    result = DeepFace.represent(image_path, model_name="Facenet", enforce_detection=False)
    return np.array(result[0]["embedding"]) if result else None

def load_existing_embeddings(embedding_dir="face_images"):
    """Load all saved embeddings from a directory."""
    embeddings_db = {}
    origin_images = {}
    for root, _, files in os.walk(embedding_dir):
        for file in files:
            if file.endswith(".json"):
                json_path = os.path.join(root, file)
                with open(json_path, "r") as f:
                    data = json.load(f)
                    image = data["face_path"]
                    embeddings_db[image] = np.array(data["embedding"])
                    origin_images[image] = data["origin_image_path"]
    return embeddings_db, origin_images

def find_matches(query_embedding, embeddings_db):
    """Find matching images using cosine similarity."""
    matches = []
    for img_path, db_embedding in embeddings_db.items():
        similarity = cosine_similarity([query_embedding], [db_embedding])[0][0]
        if similarity > SIMILARITY_THRESHOLD:
            matches.append((img_path, similarity))
    return sorted(matches, key=lambda x: x[1], reverse=True)

def process_image(file_path, embeddings_db):
    """Process the uploaded image and find matches."""
    results = model.predict(file_path, iou=0.8, conf=0.3, verbose=False)
    if len(results[0].boxes) == 0:
        return {"warning": "No face detected!"}
    
    unique_id = str(uuid.uuid4())
    
    img = cv2.imread(file_path)
    matches_per_face = []
    for i, box in enumerate(results[0].boxes.xyxy):
        box = box.tolist()
        x1, y1, x2, y2 = map(int, box)
        face_img = img[y1:y2, x1:x2]
        
        face_crop = cv2.resize(face_img, (160, 160))
        temp_face_path = f"upload/temp_face_{unique_id}_{i}.jpg"
        cv2.imwrite(temp_face_path, face_crop)
        
        query_embedding = get_embedding_from_image(temp_face_path)
        if query_embedding is None:
            continue
        
        matches = find_matches(query_embedding, embeddings_db)
        matches_per_face.append({
            "face_path": temp_face_path,
            "matches": matches
        })
        
    return {"matches_per_face": matches_per_face}

def process_face(file_path, embeddings_db):
    """Process the uploaded face image and find matches."""
    parts = file_path.lstrip("/").split("/")
    image_path = os.path.join(*parts)
    filename_no_ext = os.path.splitext(parts[-1])[0]
    parts[-1] = filename_no_ext + ".json" 
    json_path =  os.path.join(*parts)
    with open(json_path, "r") as f:
        data = json.load(f)
        query_embedding = np.array(data["embedding"])
    if query_embedding is None:
        return {"error": "No face detected!"}
    
    matches = find_matches(query_embedding, embeddings_db)
    matches_per_face = []
    matches_per_face.append({
        "face_path": image_path,
        "matches": matches
    })
        
    return {"matches_per_face": matches_per_face}
        
 