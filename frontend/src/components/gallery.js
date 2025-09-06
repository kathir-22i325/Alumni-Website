import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardMedia, CardContent, Typography, Dialog, DialogContent,
  TextField, Tabs, Tab, Grid, CircularProgress, IconButton
} from "@mui/material";
import { PhotoCamera, Close, Delete, ArrowBack, ArrowForward } from "@mui/icons-material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const API_URL = "http://localhost:5000/api/gallery";

function Gallery() {

  let userRole = "Students";
  const token = localStorage.getItem("token");
  let userName = "Unknown";
  let userEmail = "";

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      userRole = decodedToken.role || "";
      userName = decodedToken.name || "";
      userEmail = decodedToken.email || "";

    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  const [tabIndex, setTabIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [allPhotosPopupOpen, setAllPhotosPopupOpen] = useState(false);
  const [allPhotosSliderIndex, setAllPhotosSliderIndex] = useState(0);
  const backendURL = "http://localhost:5000";

  useEffect(() => {
    fetchAllPhotos();
    fetchAlbums();
  }, []);

  const fetchAllPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const res = await axios.get(`${API_URL}/photos?validated=true`);
      setAllPhotos(res.data.photos);
    } catch (err) {
      console.error("Error fetching photos", err);
    }
    setLoadingPhotos(false);
  };

  const fetchAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const res = await axios.get(`${API_URL}/albums`);
      setAlbums(res.data.albums);
    } catch (err) {
      console.error("Error fetching albums", err);
    }
    setLoadingAlbums(false);
  };

  const validatedCountByAlbum = allPhotos.reduce((acc, p) => {
    if (p.album) {
      acc[p.album] = (acc[p.album] || 0) + 1;
    }
    return acc;
  }, {});

  // pick the first validated photo in each album as its cover
  const coverByAlbum = allPhotos.reduce((acc, p) => {
    if (p.album && !acc[p.album]) {
      acc[p.album] = p.src;
    }
    return acc;
  }, {});

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validImages = [];
    let errorMsg = "";

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errorMsg = "Only JPEG, JPG, PNG, or WEBP images are allowed.";
      } else if (file.size > maxSize) {
        errorMsg = "Each image must be less than 5MB.";
      } else {
        validImages.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });

    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    setSelectedImages((prevImages) => [...prevImages, ...validImages]);
  };

  const removeSelectedImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) return;
    setUploadError("");
    if (selectedImages.length > 3) {
      setUploadError("You can only upload up to 3 images per album at once.");
      return;
    }
    const formData = new FormData();
    if (userRole === "Admin") {
      formData.append("validated", "true");
    }

    try {
      if (selectedImages.length === 1) {
        formData.append("photo", selectedImages[0].file);
        formData.append("caption", caption);
        await axios.post(`${API_URL}/uploadSingle`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        if (!albumName) {
          alert("Enter Album Name for Multiple Images");
          return;
        }
        formData.append("album", albumName);
        selectedImages.forEach(({ file }) => formData.append("photos", file));
        await axios.post(`${API_URL}/uploadAlbum`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      // After successful upload, refresh gallery and albums
      setUploadDialogOpen(false);
      setSelectedImages([]);
      setAlbumName("");
      setCaption("");
      fetchAllPhotos();
      fetchAlbums();
      setUploadSuccess(true);
    } catch (err) {
      if (err.response?.status === 409) {
        alert("That album name is already in use. Please choose another.");
      } else {
        alert("Upload failed. Please try again.");
      }
      console.error("Upload error:", err);
    }

    try {
      // after both fetchAllPhotos() and fetchAlbums():
      setUploadSuccess(true);

      // notify via email
      if(userRole !== "Admin") {
        await axios.post(`${API_URL}/upload-notification`, {
          name: userName,
          email: userEmail,
          count: selectedImages.length,
          album: selectedImages.length > 1 ? albumName : undefined
        });
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }
  };

  const openAlbum = async (albumName) => {
    try {
      const res = await axios.get(`${API_URL}/album/${albumName}`);
      const onlyValidated = res.data.photos.filter((p) => p.validated);
      setAlbumPhotos(onlyValidated);
      setSelectedAlbum(albumName);
      setSliderIndex(0);
    }
    catch (err) {
      console.error("Error fetching album photos", err);
    }
  };

  // Album photo viewer navigation functions
  const nextAlbumPhoto = () =>
    setSliderIndex((prev) => (prev + 1) % albumPhotos.length);

  const prevAlbumPhoto = () =>
    setSliderIndex((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length);

  // All photos viewer navigation functions
  const nextAllPhoto = () =>
    setAllPhotosSliderIndex((prev) => (prev + 1) % allPhotos.length);
  
  const prevAllPhoto = () =>
    setAllPhotosSliderIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  return (
    <Box sx={{ textAlign: "center", p: 2 }}>
      {/* Show Upload Button only if userRole is "Alumni" */}
      {(userRole === "Alumni" || userRole === "Admin" || userRole === "Staff") && (
        <Button
          variant="contained"
          startIcon={<PhotoCamera />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            background: 'linear-gradient(90deg, #1e90ff 0%, #6a0dad 100%)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: 3,
            boxShadow: '0 2px 8px 0 rgba(30,144,255,0.10)',
            letterSpacing: 1,
            px: 2,
            py: 1,
            fontSize: 14,
            minWidth: 110,
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            '&:hover': {
              background: 'linear-gradient(90deg, #6a0dad 0%, #1e90ff 100%)',
              boxShadow: '0 4px 12px 0 rgba(106,13,173,0.15)',
              transform: 'scale(1.05)',
            },
            flex: 1,
          }}
        >
          Upload Photos
        </Button>
      )}

      {/* Tab Layout for Switching Views */}
      <Tabs
        value={tabIndex}
        onChange={(e, newIndex) => setTabIndex(newIndex)}
        centered
        sx={{ my: 2 }}
      >
        <Tab label="All Photos" />
        <Tab label="Albums" />
      </Tabs>

      {/* All Photos View */}
      {tabIndex === 0 &&
        (loadingPhotos ? (
          <CircularProgress />
        ) : allPhotos.length === 0 ? (
          <Typography color="text.secondary" sx={{ my: 4 }}>
            No photos available.
          </Typography>
        ) : (
          <Grid container spacing={2} justifyContent="center">
            {allPhotos.map((photo, index) => (
              <Grid item key={index} xs={12} sm={4} sx={{ position: "relative" }}>
                <Card sx={{ cursor: "pointer", height: 157, display: "flex", flexDirection: "column" }}>
                  <CardMedia
                    component="img"
                    image={`${backendURL}${photo.src}`}
                    alt="Uploaded Photo"
                    loading="lazy"
                    onClick={() => {
                      setAllPhotosSliderIndex(index);
                      setAllPhotosPopupOpen(true);
                    }}
                    sx={{
                      height: photo.caption ? 120 : 160,
                      objectFit: "cover",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      background: "#f5f5f5",
                      flexShrink: 0,
                    }}
                  />
                  {photo.caption && (
                    <CardContent
                      sx={{
                        height: 40, // slightly taller for padding
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                        borderBottomLeftRadius: 12,
                        borderBottomRightRadius: 12,
                        overflow: "hidden",
                        p: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          width: "100%",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.9rem"
                        }}
                      >
                        {photo.caption}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>

        ))}

      {/* Albums View */}
      {tabIndex === 1 &&
        (loadingAlbums ? (
          <CircularProgress />
        ) : Object.keys(validatedCountByAlbum).length === 0 ? (
          <Typography color="text.secondary" sx={{ my: 4 }}>
            No albums available.
          </Typography>
        ) : (
          <Grid container spacing={2} justifyContent="center">
            {albums
              .filter((alb) => validatedCountByAlbum[alb.albumName] > 0)
              .map((alb) => (
                <Grid item key={alb.albumName} xs={12} sm={4}>
                  <Card sx={{ cursor: "pointer" }} onClick={() => openAlbum(alb.albumName)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={`${backendURL}${coverByAlbum[alb.albumName]}`}
                      alt={alb.albumName}
                      loading="lazy"
                    />
                    <CardContent>
                      <Typography variant="h6">{alb.albumName}</Typography>
                      <Typography variant="body2">  {validatedCountByAlbum[alb.albumName]} photos</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        ))}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", position: "relative" }}>
          <IconButton
            sx={{ position: "absolute", right: 10, top: 10 }}
            onClick={() => setUploadDialogOpen(false)}
          >
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upload Photos
          </Typography>

          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}

          {selectedImages.length === 1 && (
            <TextField
              label="Caption"
              variant="outlined"
              fullWidth
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          {selectedImages.length > 1 && (
            <TextField
              label="Album Name"
              variant="outlined"
              fullWidth
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          {/* File Input */}
          <input
            accept="image/*"
            type="file"
            multiple
            hidden
            id="file-upload"
            onChange={handleFileSelection}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<PhotoCamera />}
              sx={{ mb: 2 }}
            >
              Select More Photos
            </Button>
          </label>


          <Grid container spacing={2} justifyContent="center">
            {selectedImages.map((img, index) => (
              <Grid item key={index} xs={4}>
                <Box sx={{ position: "relative" }}>
                  <IconButton
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: 2,
                      border: "2px solid #fff",
                      transition: "background 0.2s, color 0.2s",
                      "&:hover": {
                        background: "#d32f2f",
                        color: "#fff",
                      },
                    }}
                    size="small"
                    onClick={() => removeSelectedImage(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                  <Card>
                    <CardMedia component="img" height="100" image={img.preview} alt="Selected" />
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Upload Button */}
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleUpload}>
            Upload
          </Button>
        </DialogContent>
      </Dialog>

      {/* Album Photo Viewer (Popup) */}
      <Dialog open={!!selectedAlbum} onClose={() => setSelectedAlbum(null)} maxWidth="md">
        <DialogContent sx={{ position: "relative", p: 2, textAlign: "center" }}>
          <IconButton
            sx={{ position: "absolute", right: 10, top: 10 }}
            onClick={() => setSelectedAlbum(null)}
          >
            <Close />
          </IconButton>
          {albumPhotos.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 4,
              }}
            >
              <IconButton
                sx={{
                  backgroundColor: "rgba(173,216,230,0.5)",
                  "&:hover": { backgroundColor: "rgba(173,216,230,0.7)" },
                  mr: 2,
                }}
                onClick={prevAlbumPhoto}
              >
                <ArrowBack />
              </IconButton>
              <Box
                component="img"
                src={`${backendURL}${albumPhotos[sliderIndex].src}`}
                alt="Album Image"
                sx={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
              <IconButton
                sx={{
                  backgroundColor: "rgba(173,216,230,0.5)",
                  "&:hover": { backgroundColor: "rgba(173,216,230,0.7)" },
                  ml: 2,
                }}
                onClick={nextAlbumPhoto}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          )}
          {albumPhotos.length > 0 && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">{selectedAlbum}</Typography>
              <Typography variant="caption">
                {sliderIndex + 1} / {albumPhotos.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* All Photos Viewer (Popup) */}
      <Dialog open={allPhotosPopupOpen} onClose={() => setAllPhotosPopupOpen(false)} maxWidth="md">
        <DialogContent sx={{ position: "relative", p: 2, textAlign: "center" }}>
          <IconButton
            sx={{ position: "absolute", right: 10, top: 10 }}
            onClick={() => setAllPhotosPopupOpen(false)}
          >
            <Close />
          </IconButton>
          {allPhotos.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 4 }}>
              <IconButton
                sx={{
                  backgroundColor: "rgba(173,216,230,0.5)",
                  "&:hover": { backgroundColor: "rgba(173,216,230,0.7)" },
                  mr: 2,
                }}
                onClick={prevAllPhoto}
              >
                <ArrowBack />
              </IconButton>
              <Box
                component="img"
                src={`${backendURL}${allPhotos[allPhotosSliderIndex].src}`}
                alt="Photo Viewer"
                sx={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
              <IconButton
                sx={{
                  backgroundColor: "rgba(173,216,230,0.5)",
                  "&:hover": { backgroundColor: "rgba(173,216,230,0.7)" },
                  ml: 2,
                }}
                onClick={nextAllPhoto}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          )}
          {allPhotos.length > 0 && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                {allPhotos[allPhotosSliderIndex].caption}
              </Typography>
              <Typography variant="caption">
                {allPhotosSliderIndex + 1} / {allPhotos.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={5000}
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {userRole === "Admin"
            ? "Your upload is now live in the gallery!"
            : "Thanks for uploading! Your upload will be reviewed by the admin soon."
          }
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Gallery;