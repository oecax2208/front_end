import React from "react";
import useSWR from "swr";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Card,
  TableContainer,
  Paper,
} from "@mui/material";
import axios from "axios";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) =>
  axios.get(url).then((res) => res.data); // Ambil semua response data

export const StockCabang = () => {
  const { data: stockData, error } = useSWR(
    `${getApiBaseUrl()}/barangcabang`,
    fetcher
  );

  if (error) return <Typography color="error">Gagal memuat data</Typography>;
  if (!stockData) return <Typography>Loading...</Typography>;

  // Pastikan kita mengambil `data` dari response API
  const barangList = stockData.data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Stok Barang per Cabang
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nama Barang</strong></TableCell>
                <TableCell><strong>Kategori</strong></TableCell>
                <TableCell><strong>Harga</strong></TableCell>
                <TableCell><strong>Cabang</strong></TableCell>
                <TableCell><strong>Stok</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barangList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Tidak ada data barang
                  </TableCell>
                </TableRow>
              ) : (
                barangList.map((item) => (
                  <TableRow
                    key={`${item.baranguuid}-${item.cabanguuid}`}
                    sx={{
                      backgroundColor: item.stok < 5 ? "#ffebee" : "inherit",
                    }}
                  >
                    <TableCell>{item.Barang.namabarang}</TableCell>
                    <TableCell>{item.Barang.Kategori.namakategori}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.Barang.harga)}
                    </TableCell>
                    <TableCell>{item.Cabang.namacabang}</TableCell>
                    <TableCell>{item.stok}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default StockCabang;
