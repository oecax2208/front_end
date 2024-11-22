import React from "react";
import useSWR from "swr";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Typography,
  Card,
  Paper
} from "@mui/material";
import axios from "axios";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) =>
  axios
    .get(url)
    .then((res) => res.data.data)
    .catch((err) => {
      console.error("Error fetching data:", err);
      return []; 
    });

export const StockAllBranch = () => {
  const { data: stockData, error } = useSWR(
    `${getApiBaseUrl()}/barangcabangsuperadmin`,
    fetcher
  );

  console.log("Stock Data:", stockData); 

  if (error) return <Typography color="error">Error memuat data</Typography>;
  if (!stockData) return <Typography>Loading...</Typography>;
  const formattedData = Array.isArray(stockData) ? stockData : [];
  if (formattedData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Stok Semua Cabang</Typography>
        <Typography color="text.secondary" align="center" sx={{ mt: 3 }}>
          Tidak ada data stok tersedia.
        </Typography>
      </Box>
    );
  }

  // Group data by cabang
  const groupedByBranch = formattedData.reduce((acc, item) => {
    const branchId = item.Cabang?.uuid;
    if (!branchId) return acc;

    if (!acc[branchId]) {
      acc[branchId] = {
        branchName: item.Cabang.namacabang,
        items: [],
      };
    }
    acc[branchId].items.push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Stok Semua Cabang
      </Typography>

      {Object.entries(groupedByBranch).map(([branchId, branchData]) => (
        <Card key={branchId} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Cabang: {branchData.branchName}
          </Typography>

          {/* Scrollable Table */}
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produk</TableCell>
                  <TableCell>Informasi Produk</TableCell>
                  <TableCell align="center">Stok</TableCell>
                  <TableCell align="right">Harga</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchData.items.map((item) => (
                  <TableRow
                    key={item.baranguuid}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          component="img"
                          src={`${getApiBaseUrl()}/uploads/${item.Barang?.foto}`}
                          alt={item.Barang?.namabarang}
                          sx={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                        <Typography>{item.Barang?.namabarang}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Kategori: {item.Barang?.Kategori?.namakategori || "Tidak Ada"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dibuat:{" "}
                        {item.Barang?.createdAt
                          ? new Date(item.Barang.createdAt).toLocaleDateString("id-ID")
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          color:
                            item.stok === 0
                              ? "error.main"
                              : item.stok < 5
                              ? "warning.main"
                              : "success.main",
                          fontWeight: "bold",
                        }}
                      >
                        {item.stok}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.Barang?.harga
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(item.Barang.harga)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {branchData.items.length === 0 && (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary">
                Tidak ada data stok untuk cabang ini
              </Typography>
            </Box>
          )}
        </Card>
      ))}

      {Object.keys(groupedByBranch).length === 0 && (
        <Card sx={{ p: 3 }}>
          <Typography color="text.secondary" align="center">
            Tidak ada data stok tersedia untuk semua cabang
          </Typography>
        </Card>
      )}
    </Box>
  );
};