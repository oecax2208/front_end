import React, { useState } from "react";
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
  Modal,
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import { ListProdukPerCabang } from "./ListProdukPerCabang";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

export const SetProdukCabang = () => {
  const { data: branchProducts, mutate: mutateBranchProducts } = useSWR(
    `${getApiBaseUrl()}/barangcabangbyrole`,
    fetcher
  );
  const { data: branches } = useSWR(`${getApiBaseUrl()}/cabangbyrole`, fetcher);
  const { data: products } = useSWR(`${getApiBaseUrl()}/barang`, fetcher);
  const { data: userInfo } = useSWR(`${getApiBaseUrl()}/me`, fetcher);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = userInfo?.role === 'admin';

  // If user is admin, pre-select and lock their branch
  React.useEffect(() => {
    if (isAdmin && userInfo?.cabanguuid) {
      setSelectedBranch(userInfo.cabanguuid);
    }
  }, [isAdmin, userInfo]);

  const getAvailableProducts = () => {
    if (!branchProducts || !selectedBranch) return products || [];
    const existingProductIds = branchProducts
      .filter((item) => item.cabanguuid === selectedBranch)
      .map((item) => item.baranguuid);
    return products?.filter((product) => !existingProductIds.includes(product.uuid)) || [];
  };
  
  const handleAddProduct = async () => {
    try {
      await axios.post(`${getApiBaseUrl()}/createbarangcabang`, {
        baranguuid: selectedProduct,
        cabanguuid: selectedBranch,
      });
      setSuccess("Produk berhasil ditambahkan ke cabang!");
      mutateBranchProducts();
      setModalOpen(false);
      setSelectedProduct("");
      if (!isAdmin) setSelectedBranch(""); // Only reset branch selection for superadmin
    } catch (error) {
      setError(error.response?.data?.message || "Gagal menambah produk.");
    }
  };

  return (
    <Box padding={3}>
      <Typography variant="h6" marginBottom={2}>
        Kelola Produk Per Cabang
      </Typography>
      
      <Card>
        <Box padding={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setModalOpen(true)}
          >
            Tambah Produk ke Cabang
          </Button>
        </Box>
      </Card>

      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '250px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" marginBottom={2}>
            Tambah Produk ke Cabang
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Cabang</InputLabel>
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={isAdmin} // Disable for admin role
            >
              {branches?.map((branch) => (
                <MenuItem key={branch.uuid} value={branch.uuid}>
                  {branch.namacabang}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Barang</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {getAvailableProducts().map((product) => (
                <MenuItem key={product.uuid} value={product.uuid}>
                  {product.namabarang}
                </MenuItem>
              ))}
            </Select>

          </FormControl>

          

          <Box marginTop={3} display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => setModalOpen(false)}
              fullWidth
            >
              Batal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddProduct}
              disabled={!selectedProduct || !selectedBranch}
              fullWidth
            >
              Simpan
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      <ListProdukPerCabang />
    </Box>
  );
};