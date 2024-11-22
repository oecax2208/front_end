import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import dayjs from 'dayjs';
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

export const PenjualanPerkategori = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const { user } = useSelector((state) => state.auth);
  
  const startDate = `${selectedMonth}-01`;
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
  
  const apiUrl = `${getApiBaseUrl()}/penjualan-per-kategori?startDate=${startDate}&endDate=${endDate}`;
  const { data, error } = useSWR(user ? apiUrl : null, fetcher);

  // Handle loading state
  if (!data) return <CircularProgress />;
  if (error) return <Typography color="error">Gagal mengambil data.</Typography>;

  const { period, data: salesData } = data;

  // Fungsi untuk export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Penjualan per Kategori", 10, 10);
    doc.text(`Periode: ${period.startDate} - ${period.endDate}`, 10, 20);

    const tableColumn = ["Kategori", "Total Terjual", "Total Penjualan"];
    const tableRows = salesData.map(({ namaKategori, totalQuantity, totalPenjualan }) => [
      namaKategori, totalQuantity, totalPenjualan.toLocaleString()
    ]);

    doc.autoTable({
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("penjualan_per_kategori.pdf");
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Laporan Penjualan per Kategori
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <TextField
            label="Pilih Bulan"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={exportToPDF}>
            Export PDF
          </Button>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" mt={2}>
        Periode: {period.startDate} - {period.endDate}
      </Typography>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Kategori</b></TableCell>
              <TableCell><b>Total Terjual</b></TableCell>
              <TableCell><b>Total Penjualan</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesData.length > 0 ? (
              salesData.map((row) => (
                <TableRow key={row.kategoriId}>
                  <TableCell>{row.namaKategori}</TableCell>
                  <TableCell>{row.totalQuantity}</TableCell>
                  <TableCell>Rp {row.totalPenjualan.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">Tidak ada data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
