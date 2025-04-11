import os
import json
from deepface import DeepFace

def process_images_in_folder(root_folder):
    for subdir, _, files in os.walk(root_folder):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                image_path = os.path.join(subdir, file)
                # folder_path = os.path.basename(subdir)
                json_path = os.path.splitext(image_path)[0] + ".json"
                
                if os.path.exists(json_path):
                    print(f"JSON file {json_path} already exists. Skipping embedding calculation.")
                    continue 
                
                try:
                    result = DeepFace.represent(image_path, model_name="Facenet", enforce_detection=False)
                    embedding = result[0]["embedding"] if result else None
                    if embedding:
                        data = {
                            "face_path": image_path,
                            "origin_image_path": subdir.replace("face_", "") + ".jpg",
                            "embedding": embedding
                        }
                        with open(json_path, "w") as f:
                            json.dump(data, f)
                    else:
                        print(f"No embedding found for {image_path}")
                except Exception as e:
                    print(f"Error processing {image_path}: {e}")
                    
    return 'Embedding calculation completed!'
