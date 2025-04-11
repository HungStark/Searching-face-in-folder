"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNew from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { useDropzone } from "react-dropzone";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const BATCH_SIZE = 50;

type FolderImageMap = {
  [folderName: string]: string[];
};

type ResultPerFace = {
  face_path?: string;
  matches: MatchResult[];
}

type MatchResult = {
  matched_face?: string;
  similarity: number;
  origin_image?: string;
};

export default function GalleryPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [imagesByFolder, setImagesByFolder] = useState<FolderImageMap>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [visibleImages, setVisibleImages] = useState<string[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<ResultPerFace[] | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageList, setCurrentImageList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFaces, setCurrentFaces] = useState<string[]>([]);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      const res = await fetch(`${backendUrl}/api/images`);
      const data = await res.json();
      setFolders(Object.keys(data.folders));
      setImagesByFolder(data.folders);
    };
    fetchImages();
  }, []);

  useEffect(() => {
    const fetchFaces = async () => {
      if (!selectedImage) return;
  
      const cleanPath = selectedImage.replace(`${backendUrl}/`, "");
  
      try {
        const res = await fetch(`${backendUrl}/api/faces`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_path: cleanPath }),
        });
  
        if (!res.ok) {
          console.error("Failed to fetch faces:", res.statusText);
          return;
        }
  
        const data = await res.json();
        setCurrentFaces(data.faces);
      } catch (err) {
        console.error("Error fetching faces:", err);
      }
    };
    fetchFaces();
  }, [selectedImage]);  

  useEffect(() => {
    if (selectedFace) {
      setImageDialogOpen(false);
      handleFaceClick();
    }
  }, [selectedFace]);

  useEffect(() => {
    if (selectedFolder) {
      setVisibleImages([]);
      setCurrentFaces([]);
      if (!searchDialogOpen) {
        setSearchResults(null);
      }
      setNextIndex(0);

      const allImages = imagesByFolder[selectedFolder] || [];

      setTimeout(() => {
        setVisibleImages(allImages.slice(0, BATCH_SIZE));
        setNextIndex(BATCH_SIZE);
      }, 0);
    }
  }, [selectedFolder, imagesByFolder]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && selectedFolder) {
        const allImages = imagesByFolder[selectedFolder] || [];
        if (nextIndex < allImages.length) {
          const nextBatch = allImages.slice(nextIndex, nextIndex + BATCH_SIZE);
          setVisibleImages((prev) => {
            const uniqueImages = [...prev, ...nextBatch].filter(
              (image, index, self) => self.indexOf(image) === index
            );
            return uniqueImages;
          });
          setNextIndex((prev) => prev + BATCH_SIZE);
        }
      }
    },
    [nextIndex, selectedFolder, imagesByFolder]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    });

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setUploadedFileName(file.name);
  }, []);

  const handleSearchClick = async () => {
    if (!selectedFolder || !uploadedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("folder", selectedFolder);

    try {
      const res = await fetch(`${backendUrl}/api/search-face/`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        if (result.matches_per_face?.length > 0) {
          setSearchResults(result.matches_per_face);
          setResultsDialogOpen(true);
        } else {
          alert("No matches found.");
        }
      } else {
        alert(result.error || "Failed to search face.");
      }
    } catch (error) {
      console.error("Error searching face:", error);
      alert("An error occurred while searching for the face.");
    } finally {
      setLoading(false);
    }
  };

  const handleFaceClick = async () => {
    if (!selectedFolder || !selectedFace) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image_path", selectedFace);
    formData.append("folder", selectedFolder);

    try {
      const res = await fetch(`${backendUrl}/api/search-from-existed-face/`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        if (result.matches_per_face?.length > 0) {
          setSearchResults(result.matches_per_face);
          setResultsDialogOpen(true);
        } else {
          alert("No matches found.");
        }
      } else {
        alert(result.error || "Failed to search face.");
      }
    } catch (error) {
      console.error("Error searching face:", error);
      alert("An error occurred while searching for the face.");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <Paper elevation={3} className="p-4">
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ color: "#fff", fontSize: "1.5rem" }}>Loading...</div>
        </div>
      )}
      <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
        📁 Select Folder
      </Button>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{ width: "200px" }} role="presentation">
          <h2 className="text-xl font-semibold p-4 text-center">📁 Folders</h2>
          <List>
            {folders.map((folder) => (
              <ListItem key={folder} disablePadding>
                <ListItemButton
                  selected={selectedFolder === folder}
                  onClick={() => {
                    setSelectedFolder(folder);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemText primary={folder} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>

      {selectedFolder && (
        <Paper elevation={4} className="p-4 m-4">

          {/* Detect + Calculate + Search */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch(`${backendUrl}/api/detect-folder`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: selectedFolder }),
                  });

                  const data = await res.json();
                  window.alert(data.result);
                } catch (error) {
                  console.error("Error detecting faces:", error);
                  window.alert("Failed to detect faces.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              🕵️ Detect Faces
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch(`${backendUrl}/api/calculate-embedding`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: selectedFolder }),
                  });

                  const data = await res.json();
                  window.alert(data.result);
                } catch (error) {
                  console.error("Error calculating embedding:", error);
                  window.alert("Failded to calculate embedding.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              📊 Calculate Embedding
            </Button>

            <label className="cursor-pointer text-sm">
              <Button
                variant="contained"
                color="warning"
                onClick={() => setSearchDialogOpen(true)}
              >
                🔍 Search My Face
              </Button>
            </label>
          </div>

          {/* Image grid */}
          <>
            <h2 className="text-lg font-medium mt-8 mb-4">
              📂 {selectedFolder} ({imagesByFolder[selectedFolder]?.length} images)
            </h2>
            <div className="flex flex-wrap gap-4 justify-start">
              {visibleImages.map((src, index) => (
                <div
                  key={index}
                  style={{
                    width: "18%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    height: "180px",
                    overflow: "hidden",
                  }}
                  onClick={() => {
                    setCurrentImageList(null);
                    setSelectedImage(`${backendUrl}${src}`);
                    setCurrentImageList(visibleImages.map(path => `${backendUrl}${path}`));
                    setImageDialogOpen(true);
                  }}
                >
                  <img
                    src={`${backendUrl}${src}`}
                    alt={`Image ${index}`}
                    className="object-cover cursor-pointer"
                    style={{ maxHeight: "100%", maxWidth: "100%", objectPosition: "center bottom" }}
                  />
                </div>

              ))}
            </div>
            <div ref={loaderRef} className="mt-10 text-center text-gray-400">
              {nextIndex < (imagesByFolder[selectedFolder]?.length || 0)
                ? "🔄 Loading more..."
                : "✅ All images loaded"}
            </div>
          </>
        </Paper>
      )}

      {/* Dialog để tải ảnh lên */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)}>
        <DialogTitle>🔍 Upload Image to Search</DialogTitle>
        <DialogContent>
          <div
            {...getRootProps()}
            className="dropzone relative flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
          >
            <input {...getInputProps()} className="hidden" />
            <div className="text-center">
              <div className="border border-gray-500 p-2 rounded-md max-w-min mx-auto">
                <p>📂 {uploadedFileName ?? ''}</p>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop an image here, or click to select one
              </p>
              <p className="text-xs text-gray-500">
                Only image files are allowed (e.g., .jpg, .png)
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSearchClick} disabled={!uploadedFile}>Search</Button>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog để hiển thị kết quả */}
      <Dialog open={resultsDialogOpen} onClose={() => setResultsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>🔎 Search Results</DialogTitle>
        <DialogContent>
          {searchResults && searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {searchResults.map((match_per_face, faceIdx) => (
                <div key={faceIdx} className="border rounded p-2 w-full">
                  <p className="text-sm mt-2">Face {faceIdx}</p>

                  {match_per_face.face_path && (
                    <div className="mt-2">
                      <img
                        src={`${backendUrl}/${match_per_face.face_path}`}
                        alt={`Face Image ${faceIdx}`}
                        className="w-32 h-auto object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {match_per_face.matches.map((match, matchIdx) => (
                      <div key={`${faceIdx}-${matchIdx}`} className="border rounded p-2 mt-2">
                        <p className="text-sm mb-2 text-center">
                          Similarity: {(match.similarity * 100).toFixed(2)}%
                        </p>

                        <div className="flex space-x-2">
                          {/* Matched Face */}
                          {match.matched_face && (
                            <div className="w-1/2">
                              <img
                                src={`${backendUrl}/${match.matched_face}`}
                                alt={`Matched Face ${faceIdx}-${matchIdx}`}
                                className="w-full h-auto object-cover rounded"
                                onError={(e) => {
                                  const currentSrc = e.currentTarget.src;
                                  if (currentSrc.endsWith(".jpg")) {
                                    e.currentTarget.src = currentSrc.replace(".jpg", ".JPG");
                                  } else if (currentSrc.endsWith(".JPG")) {
                                    e.currentTarget.src = currentSrc.replace(".JPG", ".jpg");
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Origin Image */}
                          {match.origin_image && (
                            <div
                              className="w-1/2 cursor-pointer"
                              onClick={() => {
                                setCurrentImageList(null);
                                setSelectedImage(`${backendUrl}/${match.origin_image}`);
                                setCurrentImageList(match_per_face.matches.map(r => `${backendUrl}/${r.origin_image}`));
                                setImageDialogOpen(true);
                              }}
                            >
                              <img
                                src={`${backendUrl}/${match.origin_image}`}
                                alt={`Origin Image ${faceIdx}-${matchIdx}`}
                                className="w-full h-auto object-cover rounded"
                                onError={(e) => {
                                  const currentSrc = e.currentTarget.src;
                                  if (currentSrc.endsWith(".jpg")) {
                                    e.currentTarget.src = currentSrc.replace(".jpg", ".JPG");
                                  } else if (currentSrc.endsWith(".JPG")) {
                                    e.currentTarget.src = currentSrc.replace(".JPG", ".jpg");
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No results found.</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResultsDialogOpen(false);
            setSearchResults(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hiển thị ảnh */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            boxShadow: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        {/* Box chứa sidebar + ảnh to */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "90%",
            maxHeight: "90%",
            position: "relative",
          }}
        >

          <Box
            sx={{
              width: 100,
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              marginRight: 2,
              backgroundColor: "rgba(255, 252, 252, 0.3)",
              padding: 1,
              borderRadius: 2,
            }}
          >
            {selectedImage && currentFaces.map((imgPath, index) => (
              <img
                key={index}
                src={`${backendUrl}${imgPath}`}
                alt={`face-${index}`}
                onClick={() => {
                  setSelectedFace(`${imgPath}`);
                }}
                style={{
                  width: "100%",
                  height: "auto",
                  cursor: "pointer",
                  border: imgPath === selectedImage ? "2px solid #00f" : "2px solid transparent",
                  borderRadius: 4,
                }}
              />
            ))}
          </Box>

          {selectedImage && (
            <img
              src={selectedImage}
              alt="Selected"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          )}
        </Box>

        {/* Nút chuyển trái */}
        <IconButton
          onClick={() => {
            const currentIndex = currentImageList.indexOf(selectedImage || "");
            if (currentIndex > 0) {
              setSelectedImage(currentImageList[currentIndex - 1]);
            }
          }}
          sx={{
            position: "absolute",
            top: "50%",
            left: 16,
            transform: "translateY(-50%)",
            color: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            '&:hover': {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          <ArrowBackIosNew />
        </IconButton>

        {/* Nút chuyển phải */}
        <IconButton
          onClick={() => {
            const currentIndex = currentImageList.indexOf(selectedImage || "");
            if (currentIndex < currentImageList.length - 1) {
              setSelectedImage(currentImageList[currentIndex + 1]);
            }
          }}
          sx={{
            position: "absolute",
            top: "50%",
            right: 16,
            transform: "translateY(-50%)",
            color: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            '&:hover': {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          <ArrowForwardIos />
        </IconButton>

        {/* Nút Close */}
        <IconButton
          onClick={() => setImageDialogOpen(false)}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            '&:hover': {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

      </Dialog>

    </Paper>
  );
}