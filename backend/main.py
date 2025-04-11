from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import detect, embed, image_list, matching
from dotenv import load_dotenv
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()
load_dotenv()

frontend_url = os.getenv("FRONTEND_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory="images"), name="images")
app.mount("/face_images", StaticFiles(directory="face_images"), name="face_images")
app.mount("/upload", StaticFiles(directory="upload"), name="upload")
app.include_router(image_list.router, prefix="/api")
app.include_router(detect.router, prefix="/api")
app.include_router(embed.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
