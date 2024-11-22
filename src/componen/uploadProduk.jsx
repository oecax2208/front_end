import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
const getApiBaseUrl = () => {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
    return `${protocol}://${baseUrl}`;
  };
  

export const UploadProduk = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Silakan pilih file untuk diunggah.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const response = await axios.post(
        `${getApiBaseUrl()}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setLoading(false);
      setSelectedFile(null);
      setSuccessMessage(response.data.message || "File berhasil diunggah.");
    } catch (error) {
      setLoading(false);
      setErrorMessage(
        error.response?.data?.msg || "Terjadi kesalahan saat mengunggah file."
      );
    }
  };

  return (
  <>
      
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          style={{ marginBottom: "16px" }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Upload"}
        </Button>
        {successMessage && (
          <Snackbar
            open
            autoHideDuration={6000}
            onClose={() => setSuccessMessage("")}
          >
            <Alert severity="success">{successMessage}</Alert>
          </Snackbar>
        )}
        {errorMessage && (
          <Snackbar
            open
            autoHideDuration={6000}
            onClose={() => setErrorMessage("")}
          >
            <Alert severity="error">{errorMessage}</Alert>
          </Snackbar>
        )}
     </>
  );
};



