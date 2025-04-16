# Searching-Face-in-Folder

## Requirements

- **Python**: Version 3.11  
- **Node.js**: Required for running the frontend and managing dependencies

---

## Installation

Follow these steps to install all required packages:

```bash
# Install root dependencies
npm install .

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install .
```

## Folder Structure

All images should be stored in the images folder following this structure:

```markdown
Searching-face-in-folder/
└── images/
    ├── folder1/
    │   ├── image1.jpg
    │   └── image2.jpg
    └── folder2/
        ├── image1.jpg
        └── image2.jpg
```

Model face_detection.pt should be restored in root folder:

```markdown
Searching-face-in-folder/
└── face_detection.pt
```

## How to run

From the Searching-face-in-folder, start the full application (backend + frontend) with:

```bash
npm run dev
```

## How to use

1. Open the website interface.

2. Select a folder containing images.

3. Click **Detect Faces** to detect all faces in the selected folder.

4. Click **Calculate Embedding** to extract face embeddings.
  ⚠️ These two steps may take time depending on the number of images, but each folder only needs to go through them once.

5. Upload a photo using **Search my Face** that contains the face(s) you want to find.

6. Click **Search** to find similar faces across all images in the selected folder.  
   Alternatively, you can click on a face in the sidebar of any image to perform a search for similar faces across the folder.