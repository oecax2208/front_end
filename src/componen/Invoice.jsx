import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  TextField,
  Typography,
  Button,
  Grid,
  Paper 
} from '@mui/material';
import dayjs from 'dayjs';
import useSWR from 'swr';
import axios from 'axios';
import * as XLSX from 'xlsx';

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, '');
  return `${protocol}://${baseUrl}`;
};

export const Invoice = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));

  const apiUrl = `${getApiBaseUrl()}/laporan?month=${selectedMonth}`;
  const { data, error } = useSWR(apiUrl, fetcher);

  if (error) return <div>Error loading data.</div>;
  if (!data) return <CircularProgress />;

  const detailPenjualan = data?.data?.detailPenjualan || {};
  const totalPenjualanKeseluruhan = data?.data?.totalPenjualanKeseluruhan || 0;
  const totalPembayaranQRIS = data?.data?.totalPembayaranQRIS || 0;
  const totalPembayaranCash = data?.data?.totalPembayaranCash || 0;

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };


    const exportToExcel = () => {
    const rows = [];
    let prevCabang = null;

    // Add report header
    rows.push({
      Cabang: `LAPORAN PENJUALAN BULAN ${selectedMonth}`,
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": '',
      "Total Penjualan": '',
      "QRIS": '',
      "Cash": ''
    });

    // Add empty row after header
    rows.push({
      Cabang: '',
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": '',
      "Total Penjualan": '',
      "QRIS": '',
      "Cash": ''
    });

    Object.entries(detailPenjualan).forEach(([cabang, dataCabang]) => {
      // Add empty row between branches (except for first branch)
      if (prevCabang !== null) {
        rows.push({
          Cabang: '',
          Barang: '',
          Kategori: '',
          "Harga Satuan": '',
          "Total Terjual": '',
          "Total Penjualan": '',
          "QRIS": '',
          "Cash": ''
        });
      }

      // Add branch header
      rows.push({
        Cabang: `Cabang: ${cabang}`,
        Barang: '',
        Kategori: '',
        "Harga Satuan": '',
        "Total Terjual": '',
        "Total Penjualan": '',
        "QRIS": '',
        "Cash": ''
      });

      // Add payment method summary for branch
      rows.push({
        Cabang: 'Metode Pembayaran:',
        Barang: '',
        Kategori: '',
        "Harga Satuan": '',
        "Total Terjual": '',
        "Total Penjualan": '',
        "QRIS": `${dataCabang.metodePembayaran.qris.count} transaksi`,
        "Cash": `${dataCabang.metodePembayaran.cash.count} transaksi`
      });
      rows.push({
        Cabang: 'Total per Metode:',
        Barang: '',
        Kategori: '',
        "Harga Satuan": '',
        "Total Terjual": '',
        "Total Penjualan": '',
        "QRIS": dataCabang.metodePembayaran.qris.total,
        "Cash": dataCabang.metodePembayaran.cash.total
      });

      // Add empty row after payment summary
      rows.push({
        Cabang: '',
        Barang: '',
        Kategori: '',
        "Harga Satuan": '',
        "Total Terjual": '',
        "Total Penjualan": '',
        "QRIS": '',
        "Cash": ''
      });

      // Add header row for items
      rows.push({
        Cabang: 'Cabang',
        Barang: 'Nama Barang',
        Kategori: 'Kategori',
        "Harga Satuan": 'Harga Satuan',
        "Total Terjual": 'Total Terjual',
        "Total Penjualan": 'Total Penjualan',
        "QRIS": '',
        "Cash": ''
      });

      // Add items for current branch
      Object.entries(dataCabang.barang).forEach(([namaBarang, barangData]) => {
        rows.push({
          Cabang: cabang,
          Barang: namaBarang,
          Kategori: barangData.kategori,
          "Harga Satuan": barangData.hargaSatuan,
          "Total Terjual": barangData.totalTerjual,
          "Total Penjualan": barangData.totalPenjualan,
          "QRIS": '',
          "Cash": ''
        });
      });

      // Add branch total
      rows.push({
        Cabang: `Total ${cabang}`,
        Barang: '',
        Kategori: '',
        "Harga Satuan": '',
        "Total Terjual": getTotalTerjual(dataCabang),
        "Total Penjualan": getTotalPenjualan(dataCabang),
        "QRIS": '',
        "Cash": ''
      });

      prevCabang = cabang;
    });

    // Add empty row before grand totals
    rows.push({
      Cabang: '',
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": '',
      "Total Penjualan": '',
      "QRIS": '',
      "Cash": ''
    });

    // Add grand totals section
    rows.push({
      Cabang: 'GRAND TOTAL',
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": getGrandTotalTerjual(detailPenjualan),
      "Total Penjualan": getGrandTotalPenjualan(detailPenjualan),
      "QRIS": '',
      "Cash": ''
    });

    // Add payment method grand totals
    rows.push({
      Cabang: 'Total QRIS',
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": '',
      "Total Penjualan": '',
      "QRIS": data.data.totalPembayaranQRIS,
      "Cash": ''
    });

    rows.push({
      Cabang: 'Total Cash',
      Barang: '',
      Kategori: '',
      "Harga Satuan": '',
      "Total Terjual": '',
      "Total Penjualan": '',
      "QRIS": '',
      "Cash": data.data.totalPembayaranCash
    });

    // Helper functions for calculating totals
    function getTotalTerjual(dataCabang) {
      return Object.values(dataCabang.barang).reduce((total, barang) => total + barang.totalTerjual, 0);
    }

    function getTotalPenjualan(dataCabang) {
      return Object.values(dataCabang.barang).reduce((total, barang) => total + barang.totalPenjualan, 0);
    }

    function getGrandTotalTerjual(data) {
      return Object.values(data).reduce((total, cabang) => total + getTotalTerjual(cabang), 0);
    }

    function getGrandTotalPenjualan(data) {
      return Object.values(data).reduce((total, cabang) => total + getTotalPenjualan(cabang), 0);
    }

    // Create and style the worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Add some style to the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style configuration
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } }
    };
    
    // Apply styles
    for (let C = range.s.c; C <= range.e.c; C++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) worksheet[address] = {};
      worksheet[address].s = headerStyle;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
    XLSX.writeFile(workbook, `Laporan_Penjualan_${selectedMonth}.xlsx`);
  };

  const exportCabangToExcel = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/export-laporan?month=${selectedMonth}`, {
        withCredentials: true,
        responseType: 'blob'
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Penjualan_${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };
  return (
    <Box>
      <Card>
        <CardHeader title="Laporan Penjualan per Cabang" />
        <Box p={2}>
          <TextField
            label="Pilih Bulan"
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            fullWidth
          />
        </Box>
        <Box p={2} display="flex" justifyContent="flex-end">
          <Button variant="contained" color="primary" onClick={exportToExcel}>
            Export to Excel
          </Button>
        </Box>

        {/* Summary Cards */}
        <Box p={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  Total Penjualan
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(totalPenjualanKeseluruhan)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
                <Typography variant="h6" gutterBottom>
                  Total QRIS
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(totalPembayaranQRIS)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, backgroundColor: '#fce4ec' }}>
                <Typography variant="h6" gutterBottom>
                  Total Cash
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(totalPembayaranCash)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Data Table dengan Scroll untuk Mobile */}
        {Object.keys(detailPenjualan).length > 0 ? (
          Object.entries(detailPenjualan).map(([cabang, dataCabang]) => (
            <Box key={cabang} mb={4}>
              <Typography variant="h6" sx={{ p: 2 }}>
                Cabang: {cabang}
              </Typography>

              {/* Scroll Table */}
              <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama Barang</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell>Harga Satuan</TableCell>
                      <TableCell>Total Terjual</TableCell>
                      <TableCell>Total Penjualan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(dataCabang.barang || {}).map(([namaBarang, barangData]) => (
                      <TableRow key={namaBarang}>
                        <TableCell>{namaBarang}</TableCell>
                        <TableCell>{barangData.kategori}</TableCell>
                        <TableCell>{barangData.hargaSatuan}</TableCell>
                        <TableCell>{barangData.totalTerjual}</TableCell>
                        <TableCell>{barangData.totalPenjualan}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
        ) : (
          <Box p={2} textAlign="center">
            <p>Data tidak ditemukan untuk bulan yang dipilih.</p>
          </Box>
        )}
      </Card>
    </Box>
  );
};
