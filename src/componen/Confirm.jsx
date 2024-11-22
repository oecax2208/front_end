import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Card,
  Button,
  TableContainer,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Select
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from "axios";

const getApiBaseUrl = () => {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
    return `${protocol}://${baseUrl}`;
};

export const Confirm = () => {
  const [distributions, setDistributions] = useState([]); // Semua data
  const [filteredDistributions, setFilteredDistributions] = useState([]); // Data yang ditampilkan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // Filter status

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getApiBaseUrl()}/getdistribusistok`);
      setDistributions(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat data distribusi stok");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();
  }, []);

  // Filter data berdasarkan status yang dipilih
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredDistributions(distributions);
    } else {
      setFilteredDistributions(distributions.filter((dist) => dist.status === statusFilter));
    }
  }, [statusFilter, distributions]);

  const handleStatusUpdate = async (uuid, status) => {
    setUpdating(true);
    try {
      await axios.put(`${getApiBaseUrl()}/updatedistribusistok/${uuid}`, {
        status: status
      });
      fetchDistributions();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengupdate status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      "pending": { color: "warning", label: "Menunggu Konfirmasi" },
      "diterima": { color: "success", label: "Diterima" },
      "cancel": { color: "error", label: "Dibatalkan" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InventoryIcon /> Konfirmasi Distribusi Stok
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Konfirmasi penerimaan barang untuk cabang Anda
              </Typography>
            </Grid>
            <Grid item sx={{ display: "flex", gap: 2 }}>
              {/* Filter Status */}
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="pending">Menunggu Konfirmasi</MenuItem>
                <MenuItem value="diterima">Diterima</MenuItem>
                <MenuItem value="cancel">Dibatalkan</MenuItem>
              </Select>

              {/* Tombol Refresh */}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDistributions}
                disabled={loading || updating}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card>
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Barang</TableCell>
                  <TableCell>Jumlah</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tanggal Kirim</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredDistributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      Tidak ada distribusi stok dengan status {statusFilter}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDistributions.map((item, index) => (
                    <TableRow key={item.uuid}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.Barang?.namabarang}</TableCell>
                      <TableCell>{item.jumlah}</TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell align="center">
                        {item.status === "pending" && (
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleStatusUpdate(item.uuid, "diterima")}
                              disabled={updating}
                            >
                              Terima
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleStatusUpdate(item.uuid, "cancel")}
                              disabled={updating}
                            >
                              Tolak
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    </Box>
  );
};
