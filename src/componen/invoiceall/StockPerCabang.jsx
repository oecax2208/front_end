import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import useSWR from 'swr';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSelector } from "react-redux";

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, '');
  return `${protocol}://${baseUrl}`;
};

export const StockPerCabang = () => {
const { user } = useSelector((state) => state.auth);
  const apiUrl = `${getApiBaseUrl()}/stok-per-cabang`;
  const { data, error } = useSWR(user ? apiUrl : null, fetcher);

  // Handle loading state
  if (!data) return <CircularProgress />;
  if (error) return <Typography color="error">Gagal mengambil data.</Typography>;

  const { data: stockData } = data;

  // Fungsi untuk export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Stok per Cabang", 10, 10);

    const tableColumn = ["Cabang", "Alamat", "Nama Barang", "Kategori", "Harga", "Stok"];
    const tableRows = stockData.map(({ cabang, alamatCabang, namaBarang, kategori, harga, stok }) => [
      cabang, alamatCabang, namaBarang, kategori, harga.toLocaleString(), stok
    ]);

    doc.autoTable({
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("stok_per_cabang.pdf");
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Laporan Stok per Cabang
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Button variant="contained" color="primary" onClick={exportToPDF}>
            Export PDF
          </Button>
        </Grid>
      </Grid>

      {/* Table Container untuk Scroll */}
      <TableContainer component={Paper} sx={{ mt: 3, p: 2, overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Cabang</b></TableCell>
              <TableCell><b>Alamat</b></TableCell>
              <TableCell><b>Nama Barang</b></TableCell>
              <TableCell><b>Kategori</b></TableCell>
              <TableCell><b>Harga</b></TableCell>
              <TableCell><b>Stok</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockData.length > 0 ? (
              stockData.map((row) => (
                <TableRow key={row.barangId}>
                  <TableCell>{row.cabang}</TableCell>
                  <TableCell>{row.alamatCabang}</TableCell>
                  <TableCell>{row.namaBarang}</TableCell>
                  <TableCell>{row.kategori}</TableCell>
                  <TableCell>Rp {row.harga.toLocaleString()}</TableCell>
                  <TableCell>{row.stok}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">Tidak ada data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
