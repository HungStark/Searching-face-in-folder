import cv2
import os
import numpy as np
from ultralytics import YOLO

def process_image(image_path, output_folder):
    model = YOLO("./face_detection.pt")
    image = cv2.imread(image_path)
    if image is None:
        return
    
    image_name = os.path.splitext(os.path.basename(image_path))[0]
    face_folder = os.path.join(output_folder, f"{image_name}")
    
    if os.path.exists(face_folder):
        return
    
    results = model.predict(image_path, iou=0.8, conf=0.3, verbose=False)
    bounding_boxes = results[0].boxes.xyxy
    
    os.makedirs(face_folder, exist_ok=True)
    
    found_faces = []
    for idx, box in enumerate(bounding_boxes):
        x_min, y_min, x_max, y_max = map(int, box.tolist())
        face_crop = image[y_min:y_max, x_min:x_max]
        face_crop = cv2.resize(face_crop, (160, 160))
        found_faces.append(face_crop)
        face_path = os.path.join(face_folder, f"face_{len(found_faces)}.jpg")
        cv2.imwrite(face_path, face_crop)
        
def process_images_in_folder(input_folder):
    output_folder = (f"face_{input_folder}")
    os.makedirs(output_folder, exist_ok=True)
    
    for image_name in os.listdir(input_folder):
        image_path = os.path.join(input_folder, image_name)
        if image_name.lower().endswith((".jpg", ".jpeg", ".png")):
            process_image(image_path, output_folder)
            
    return 'Face detection completed!'