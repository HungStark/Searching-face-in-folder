from fastapi import APIRouter, UploadFile, File
import shutil, os, zipfile
from backend.core.calculateEmbedding import process_images_in_folder
from pydantic import BaseModel

router = APIRouter()

class FolderRequest(BaseModel):
    folder: str 

@router.post("/calculate-embedding")
async def calculate_embedding(request: FolderRequest):
    folder_name = request.folder
    input_path = os.path.join("face_images", folder_name)
    result = process_images_in_folder(input_path)
    return {"result": result}
