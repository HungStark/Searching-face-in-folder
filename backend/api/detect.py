from fastapi import APIRouter, UploadFile, File
import shutil, os, zipfile
from backend.core.faceDetection import process_images_in_folder
from pydantic import BaseModel

router = APIRouter()

class FolderRequest(BaseModel):
    folder: str 

@router.post("/detect-folder")
async def detect_from_existing_folder(request: FolderRequest):
    folder_name = request.folder
    input_path = os.path.join("images", folder_name)
    result = process_images_in_folder(input_path)
    return {"result": result}
