import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data.data);

export const ListProdukPerCabang = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: branchProducts, mutate: mutateBranchProducts } = useSWR(
    `${getApiBaseUrl()}/barangcabangbyrole`,
    fetcher
  );
  const { data: branches } = useSWR(`${getApiBaseUrl()}/cabangbyrole`, fetcher);

  useEffect(() => {
    if (user?.role === 'admin' && branches?.length === 1) {
      setSelectedBranch(branches[0].uuid);
    }
  }, [user, branches]);

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    
    try {
      await axios.delete(
        `${getApiBaseUrl()}/deletebarangcabang/${deleteProduct.baranguuid}`,
        {
          data: { baranguuid: deleteProduct.baranguuid },
          withCredentials: true
        }
      );
      setSuccess("Produk berhasil dihapus!");
      mutateBranchProducts();
    } catch (error) {
      setError(error.response?.data?.message || "Gagal menghapus produk.");
    } finally {
      setShowDeleteDialog(false);
      setDeleteProduct(null);
    }
  };

  // Improved filtering logic with useMemo
  const filteredProducts = React.useMemo(() => {
    if (!branchProducts) return [];
    if (!selectedBranch) return branchProducts;
    return branchProducts.filter(product => product.Cabang.uuid === selectedBranch);
  }, [branchProducts, selectedBranch]);

  if (!isAuthenticated) {
    return <Box padding={3}>Silakan login terlebih dahulu</Box>;
  }

  return (
    <Box padding={3}>
      <Typography variant="h6" marginBottom={2}>
        Produk Berdasarkan Cabang
      </Typography>
      
      {user?.role === 'superadmin' && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Pilih Cabang</InputLabel>
          <Select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            
            {branches?.map((branch) => (
              <MenuItem key={branch.uuid} value={branch.uuid}>
                {branch.namacabang}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
{selectedBranch && (
  <Card>
    <Box sx={{ overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nama Barang</TableCell>
            <TableCell>Kategori</TableCell>
            <TableCell>Harga</TableCell>
            <TableCell>Cabang</TableCell>
            <TableCell>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <TableRow key={product.baranguuid}>
                <TableCell>{product.Barang.namabarang}</TableCell>
                <TableCell>{product.Barang.Kategori.namakategori}</TableCell>
                <TableCell>{product.Barang.harga}</TableCell>
                <TableCell>{product.Cabang.namacabang}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setDeleteProduct(product);
                      setShowDeleteDialog(true);
                    }}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Tidak ada produk untuk cabang ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  </Card>
)}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Konfirmasi Hapus Produk</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus produk "{deleteProduct?.Barang.namabarang}" 
            dari cabang "{deleteProduct?.Cabang.namacabang}"?
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Batal</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

