from fastapi import APIRouter, UploadFile, File, Form
import shutil, os, zipfile
from backend.core.findMatchingFace import process_image, load_existing_embeddings, process_face
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid

router = APIRouter()

class FolderRequest(BaseModel):
    folder: str 

@router.post("/search-face/")
async def search_face(
    folder: str = Form(...),
    file: UploadFile = File(...)
):
    folder_path = os.path.join("face_images", folder)
    embeddings_db, origin_images = load_existing_embeddings(folder_path)
    
    unique_id = str(uuid.uuid4())

    temp_path = f"upload/temp_upload_{unique_id}.jpg"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    result = process_image(temp_path, embeddings_db)
    
    if "error" in result:
        return JSONResponse(content={"error": result["error"]}, status_code=400)
    if "warning" in result:
        return JSONResponse(content={"warning": result["warning"]}, status_code=200)
    
    matches_per_face = result["matches_per_face"]
    response = []
    for face_info in matches_per_face:
        face_path = face_info["face_path"]
        matches = face_info["matches"]

        face_matches = []
        for img_path, similarity in matches:
            origin_image_path = origin_images.get(img_path, None)
            face_matches.append({
                "matched_face": img_path,
                "similarity": similarity,
                "origin_image": origin_image_path
            })

        response.append({
            "face_path": face_path,
            "matches": face_matches
        })

    return {"matches_per_face": response}


@router.post("/search-from-existed-face/")
async def search_from_existed_face(
    folder: str = Form(...),
    image_path: str = Form(...),
):
    folder_path = os.path.join("face_images", folder)
    embeddings_db, origin_images = load_existing_embeddings(folder_path)
    
    result = process_face(image_path, embeddings_db)
    
    if "error" in result:
        return JSONResponse(content={"error": result["error"]}, status_code=400)
    if "warning" in result:
        return JSONResponse(content={"warning": result["warning"]}, status_code=200)
    
    matches_per_face = result["matches_per_face"]
    response = []
    for face_info in matches_per_face:
        face_path = face_info["face_path"]
        matches = face_info["matches"]

        face_matches = []
        for img_path, similarity in matches:
            origin_image_path = origin_images.get(img_path, None)
            face_matches.append({
                "matched_face": img_path,
                "similarity": similarity,
                "origin_image": origin_image_path
            })

        response.append({
            "face_path": face_path,
            "matches": face_matches
        })

    return {"matches_per_face": response}