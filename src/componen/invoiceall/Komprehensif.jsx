import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
  Button,
  Grid,
  Paper
} from '@mui/material';
import useSWR from 'swr';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useSelector } from "react-redux";
import 'jspdf-autotable';

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, '');
  return `${protocol}://${baseUrl}`;
};

export const Komprehensif = () => {
  const { user } = useSelector((state) => state.auth);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-02-28');

  const apiUrl = `${getApiBaseUrl()}/komprehensif?startDate=${startDate}&endDate=${endDate}`;
  const { data, error } = useSWR(user ? apiUrl : null, fetcher);

  if (!user) {
    return <Typography color="error">Silakan login untuk melihat data.</Typography>;
  }

  if (error) return <Typography color="error">Gagal memuat data.</Typography>;
  if (!data) return <CircularProgress />;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Laporan Rekap Komprehensif', 14, 10);
    
    doc.autoTable({
      startY: 20,
      head: [['Nama Produk', 'Kategori', 'Jumlah Terjual', 'Total Penjualan']],
      body: data.summary.topSellingProducts.map((item) => [
        item.name, item.category, item.salesQuantity, item.salesAmount
      ]),
    });

    doc.save('rekap_komprehensif.pdf');
  };

  return (
    <Box p={3}>
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h5">Rekap Komprehensif</Typography>

        {/* Input Tanggal */}
        <Grid container spacing={2} my={2}>
          <Grid item>
            <TextField
              label="Tanggal Mulai"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <TextField
              label="Tanggal Akhir"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Ringkasan */}
        <Typography variant="h6">Ringkasan</Typography>
        <Box my={2}>
          <Typography>Total Produk: {data.summary.totalProducts}</Typography>
          <Typography>Total Kategori: {data.summary.totalCategories}</Typography>
          <Typography>Total Stok: {data.summary.totalStock}</Typography>
          <Typography>Total Penjualan: Rp {data.summary.totalSalesAmount.toLocaleString()}</Typography>
        </Box>

        {/* Produk Terlaris */}
        {user.role === "superadmin" && (
          <>
            <Typography variant="h6">Produk Terlaris</Typography>
            <TableContainer sx={{ mt: 2, maxHeight: 400, overflowY: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama Produk</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Jumlah Terjual</TableCell>
                    <TableCell>Total Penjualan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.summary.topSellingProducts.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.salesQuantity}</TableCell>
                      <TableCell>Rp {item.salesAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Tombol Ekspor PDF */}
        <Button variant="contained" color="primary" onClick={handleExportPDF} sx={{ mt: 3 }}>
          Ekspor ke PDF
        </Button>
      </Paper>
    </Box>
  );
};
