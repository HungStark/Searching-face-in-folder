from fastapi import APIRouter,  HTTPException
from fastapi.responses import JSONResponse
import os
from pydantic import BaseModel

router = APIRouter()

@router.get("/images")
def get_images():
    base_dir = "images"
    folders = sorted([f for f in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, f))])
    result = {}

    for folder in folders:
        folder_path = os.path.join(base_dir, folder)
        image_files = sorted(os.listdir(folder_path))
        image_paths = [f"/{base_dir}/{folder}/{img}" for img in image_files]
        result[folder] = image_paths

    return JSONResponse(content={"folders": result})

class ImagePathRequest(BaseModel):
    image_path: str

@router.post("/faces")
def get_faces(request: ImagePathRequest):
    image_path = request.image_path
    folder_path = os.path.splitext(image_path)[0]
    folder_path = f'face_{folder_path}'
    
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    
    img_paths = [
        f'/{folder_path}/{img}' 
        for img in os.listdir(folder_path)
        if img.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]
    
    return JSONResponse(content={"faces": img_paths})