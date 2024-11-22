import React, { useState } from "react";
import useSWR from "swr";
import {
  Box,
  Card,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  Snackbar
} from "@mui/material";
import axios from "axios";
import { useSelector } from "react-redux";
const getApiBaseUrl = () => {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
    return `${protocol}://${baseUrl}`;
  };

  
const fetcher = (url) => axios.get(url,{withCredentials: true}).then((res) => res.data.data);
  

export const SendProduct = () => {
  const [formData, setFormData] = useState({
    baranguuid: "",
    cabanguuid: "",
    jumlah: ""
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Fetch products and branches data using SWR
  const { data: products } = useSWR(
    `${getApiBaseUrl()}/barang`,
    fetcher
  );
  const { data: branches } = useSWR(
    `${getApiBaseUrl()}/cabang`,
    fetcher
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/createdistribusistok`,
        formData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setAlert({
        open: true,
        message: "Distribusi stok berhasil dibuat",
        severity: "success"
      });

      // Reset form
      setFormData({
        baranguuid: "",
        cabanguuid: "",
        jumlah: ""
      });
    } catch (error) {
      setAlert({
        open: true,
        message: error.response?.data?.message || "Terjadi kesalahan pada server",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Distribusi Produk ke Cabang
        </Typography>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pilih Produk</InputLabel>
            <Select
  name="baranguuid"
  value={formData.baranguuid}
  onChange={handleChange}
  required
  label="Pilih Produk"
>
  {Array.isArray(products) ? products.map((product) => (
    <MenuItem key={product.uuid} value={product.uuid}>
      {product.namabarang}
    </MenuItem>
  )) : <MenuItem disabled>Data tidak tersedia</MenuItem>}
</Select>
  
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pilih Cabang</InputLabel>
            <Select
              name="cabanguuid"
              value={formData.cabanguuid}
              onChange={handleChange}
              required
              label="Pilih Cabang"
            >
              {branches?.map((branch) => (
                <MenuItem key={branch.uuid} value={branch.uuid}>
                  {branch.namacabang}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Jumlah"
            type="number"
            name="jumlah"
            value={formData.jumlah}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? "Memproses..." : "Kirim Distribusi"}
          </Button>
        </form>
      </Card>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};